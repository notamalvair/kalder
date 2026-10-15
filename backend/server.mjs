import http from 'node:http';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JobStore } from './store.mjs';
import { normalizeWebsite, isPublicAddress } from './fetch-site.mjs';
import { startWorker } from './worker.mjs';
import { createMailer } from './mail.mjs';
import { startDeliveryWorker } from './delivery-worker.mjs';

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_request');
  const url = normalizeWebsite(body.website);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if ((isIP(host) && !isPublicAddress(host)) || (!isIP(host) &&
    (!host.includes('.') || /\.(local|localhost|internal|test|invalid)$/i.test(host)))) {
    throw new Error('invalid_website');
  }
  if (typeof body.email !== 'string') throw new Error('invalid_email');
  const email = body.email.trim();
  if (email.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(email) ||
    email.startsWith('.') || email.split('@')[0].endsWith('.') || email.includes('..')) throw new Error('invalid_email');
  // Conservatively treat case variants as one recipient for abuse limits.
  return { website: url.href, email: email.toLowerCase() };
}

async function readJson(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) throw new Error('unsupported_media_type');
  if (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity') throw new Error('unsupported_media_type');
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 4096) throw new Error('body_too_large');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('invalid_json'); }
}

export function createApi(store, { mailMode = 'disabled' } = {}) {
  const server = http.createServer(async (req, res) => {
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
      res.end(JSON.stringify(body));
    };
    try {
      const path = new URL(req.url, 'http://backend').pathname;
      if (req.method === 'GET' && path === '/api/healthz') return send(200, { status: 'ok' });
      if (req.method === 'GET' && path === '/api/config') return send(200, { mailMode });
      if (req.method === 'POST' && path === '/api/audits') {
        const input = validate(await readJson(req));
        const clientKey = createHash('sha256').update(req.socket.remoteAddress ?? 'unknown').digest('hex');
        const job = store.enqueue({ ...input, clientKey });
        const message = mailMode === 'resend' ? 'Request accepted. The report will be submitted for email delivery after analysis.' :
          mailMode === 'file' ? 'Request accepted. Local test mode: the report will be saved, not emailed.' :
            'Request accepted for website analysis. Email delivery is not yet connected.';
        return send(202, { ...job, mailMode, message },
          { Location: `/api/audits/${job.id}` });
      }
      if (req.method === 'GET' && /^\/api\/audits\/[a-f0-9]{64}$/.test(path)) {
        const status = store.getStatus(path.split('/').at(-1));
        return status ? send(200, status) : send(404, { error: 'not_found' });
      }
      send(404, { error: 'not_found' });
    } catch (error) {
      const code = error.message;
      const statuses = { invalid_url: 400, invalid_request: 400, invalid_website: 400,
        invalid_email: 400, invalid_json: 400, unsupported_media_type: 415,
        body_too_large: 413, rate_limited: 429, queue_full: 503 };
      send(statuses[code] ?? 500, { error: statuses[code] ? code : 'internal_error' },
        code === 'rate_limited' ? { 'Retry-After': '3600' } : {});
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.timeout = 10000;
  server.maxRequestsPerSocket = 100;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolvePath(process.argv[1])).href) {
  const mailMode = process.env.KALDER_MAIL_MODE || 'file';
  const deliver = createMailer({ mode: mailMode, directory: process.env.KALDER_OUTBOX_PATH,
    apiKey: process.env.KALDER_MAIL_API_KEY, from: process.env.KALDER_MAIL_FROM });
  const store = new JobStore(process.env.KALDER_DB_PATH || resolvePath('.runtime/backend/jobs.sqlite'));
  const server = createApi(store, { mailMode });
  const stopWorker = startWorker(store);
  const stopDelivery = startDeliveryWorker(store, deliver);
  const port = Number(process.env.KALDER_API_PORT || 3001);
  server.listen(port, process.env.KALDER_API_HOST || '127.0.0.1', () => {
    console.log(`KALDER API listening on port ${port}; mail mode: ${mailMode}.`);
  });
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    server.close();
    server.closeIdleConnections();
    await stopWorker();
    await stopDelivery();
    store.close();
  }
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}
