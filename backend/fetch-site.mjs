import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(address, prefix, 'ipv4');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
for (const [address, prefix] of [['2001::', 23], ['2001:db8::', 32],
  ['2002::', 16], ['3fff::', 20]]) blocked.addSubnet(address, prefix, 'ipv6');

export function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, 'ipv4');
  if (family === 6) return globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6');
  return false;
}

export function normalizeWebsite(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) {
    throw new Error('invalid_url');
  }
  let url;
  try { url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`); }
  catch { throw new Error('invalid_url'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
    url.port || !url.hostname || url.hostname.endsWith('.')) throw new Error('invalid_url');
  url.hash = '';
  return url;
}

function beforeDeadline(promise, milliseconds) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), milliseconds);
  })]).finally(() => clearTimeout(timer));
}

// Dependency injection is for transport tests, never configured by API input.
export function createSiteFetcher({ resolve = lookup, request = (url, options, callback) =>
  (url.protocol === 'https:' ? https : http).request(url, options, callback),
  timeoutMs = 15000, maxBytes = 1_000_000, maxRedirects = 4 } = {}) {
  return async function fetchSite(value) {
    const started = Date.now();
    const deadline = started + timeoutMs;
    let url = normalizeWebsite(value);
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('timeout');
      const hostname = url.hostname.replace(/^\[|\]$/g, '');
      const literalFamily = isIP(hostname);
      const addresses = literalFamily ? [{ address: hostname, family: literalFamily }] :
        await beforeDeadline(resolve(hostname, { all: true, verbatim: true }), remaining);
      // Reject mixed public/private DNS answers; pin the validated address below.
      if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) {
        throw new Error('blocked_address');
      }
      const pinned = addresses[0];
      const result = await new Promise((resolveResponse, reject) => {
        let req;
        const timer = setTimeout(() => req?.destroy(new Error('timeout')), Math.max(1, deadline - Date.now()));
        const fail = error => { clearTimeout(timer); reject(error); };
        try {
          req = request(url, {
            method: 'GET', agent: false,
            // Keep original hostname for Host and TLS certificate verification.
            lookup: (_host, options, callback) => options?.all ?
              callback(null, [pinned]) : callback(null, pinned.address, pinned.family),
            headers: { 'User-Agent': 'KALDER-WebsiteCheck/1.0',
              Accept: 'text/html', 'Accept-Encoding': 'identity' },
          }, response => {
            const statusCode = response.statusCode;
            const location = response.headers.location;
            if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
              clearTimeout(timer);
              resolveResponse({ redirect: location });
              response.destroy();
              return;
            }
            const contentType = String(response.headers['content-type'] ?? '');
            const encoding = response.headers['content-encoding'];
            if (encoding && encoding.toLowerCase() !== 'identity') {
              fail(new Error('unsupported_encoding')); response.destroy(); return;
            }
            if (Number(response.headers['content-length']) > maxBytes) {
              fail(new Error('response_too_large')); response.destroy(); return;
            }
            const chunks = [];
            let bytes = 0;
            response.on('data', chunk => {
              bytes += chunk.length;
              if (bytes > maxBytes) {
                fail(new Error('response_too_large')); response.destroy(); return;
              }
              chunks.push(chunk);
            });
            response.on('error', fail);
            response.on('aborted', () => fail(new Error('response_aborted')));
            response.on('end', () => {
              clearTimeout(timer);
              // Do not produce a misleading report from a legacy encoded page.
              const charset = contentType.match(/charset\s*=\s*["']?([^\s;"']+)/i)?.[1];
              if (charset && !/^(utf-8|utf8|us-ascii)$/i.test(charset)) {
                reject(new Error('unsupported_charset')); return;
              }
              resolveResponse({ url: url.href, statusCode, contentType,
                html: Buffer.concat(chunks).toString('utf8'), responseTimeMs: Date.now() - started });
            });
          });
          req.on('error', fail);
          req.end();
        } catch (error) { fail(error); }
      });
      if (!result.redirect) return result;
      if (hop === maxRedirects) throw new Error('too_many_redirects');
      const next = normalizeWebsite(new URL(result.redirect, url).href);
      if (url.protocol === 'https:' && next.protocol === 'http:') throw new Error('https_downgrade');
      url = next;
    }
  };
}

export const fetchSite = createSiteFetcher();
