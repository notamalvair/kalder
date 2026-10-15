import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JobStore } from './store.mjs';
import { createApi } from './server.mjs';
import { startWorker } from './worker.mjs';

const input = { website: 'example.com', email: 'visitor@example.org' };
const stored = { ...input, website: 'https://example.com/', clientKey: 'client-a' };

async function api(t, limits) {
  const store = new JobStore(':memory:', limits);
  const server = createApi(store);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    store.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { store, base, post: (body, headers = { 'Content-Type': 'application/json' }) =>
    fetch(`${base}/api/audits`, { method: 'POST', headers,
      body: typeof body === 'string' ? body : JSON.stringify(body) }) };
}

test('accepts a job, persists normalized input and returns only opaque public status', async t => {
  const { base, post, store } = await api(t);
  const response = await post(input);
  assert.equal(response.status, 202);
  const job = await response.json();
  assert.match(job.id, /^[a-f0-9]{64}$/);
  const status = await (await fetch(base + response.headers.get('location'))).json();
  assert.deepEqual(status, { id: job.id, state: 'queued', error: null });
  assert.equal('email' in status, false);
  assert.equal(store.claim().website, 'https://example.com/');
  assert.equal((await fetch(`${base}/api/audits/${'a'.repeat(64)}`)).status, 404);
});

test('rejects invalid email, local targets, malformed JSON and oversized bodies', async t => {
  const { post, store } = await api(t);
  for (const body of [{ ...input, email: 'invalid' }, { ...input, email: 'x\r\nBcc: y@z.com' },
    { ...input, website: 'http://127.0.0.1' }, { ...input, website: 'localhost' },
    { ...input, website: 'ftp://example.com' }, [], null, '{']) {
    assert.equal((await post(body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await post(input, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post(' '.repeat(5000))).status, 413);
  assert.equal(store.claim(), undefined);
});

test('enforces persisted client and recipient quotas and bounded pending queue', async t => {
  const { post } = await api(t, { perIp: 1 });
  assert.equal((await post(input)).status, 202);
  const limited = await post({ ...input, email: 'different@example.org' },
    { 'Content-Type': 'application/json', 'X-Forwarded-For': '8.8.8.8' });
  assert.equal(limited.status, 429); // Spoofed forwarding headers do not bypass limits.
  const store = new JobStore(':memory:', { perEmail: 1, maxPending: 1 });
  t.after(() => store.close());
  store.enqueue(stored);
  assert.throws(() => store.enqueue({ ...stored, clientKey: 'other' }), /rate_limited/);
  assert.throws(() => store.enqueue({ ...stored, email: 'other@example.org' }), /queue_full/);
});

test('jobs and quotas survive reopening the SQLite database', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kalder-store-'));
  let store;
  try {
    const filename = join(dir, 'jobs.sqlite');
    store = new JobStore(filename, { perIp: 1 });
    const job = store.enqueue(stored);
    store.close();
    store = new JobStore(filename, { perIp: 1 });
    assert.equal(store.getStatus(job.id).state, 'queued');
    assert.throws(() => store.enqueue(stored), /rate_limited/);
    assert.equal(store.claim().id, job.id);
  } finally { store?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('leases recover interrupted work and stale workers cannot overwrite a new attempt', () => {
  let now = 100000;
  const store = new JobStore(':memory:', { now: () => now });
  try {
    const { id } = store.enqueue(stored);
    const first = store.claim();
    assert.equal(store.claim(), undefined);
    now += 60001;
    const second = store.claim();
    assert.equal(second.id, id);
    assert.equal(second.attempts, 2);
    store.finish(first, { stale: true });
    assert.equal(store.getStatus(id).state, 'processing');
    now += 60001;
    assert.equal(store.claim().attempts, 3);
    now += 60001;
    assert.equal(store.claim(), undefined);
    assert.equal(store.getStatus(id).state, 'failed');
  } finally { store.close(); }
});

test('worker generates a stored report and records fetch failures without exposing internals', async t => {
  const store = new JobStore(':memory:');
  const good = store.enqueue(stored);
  const bad = store.enqueue({ ...stored, website: 'https://failure.example.com/', email: 'other@example.org' });
  const stop = startWorker(store, { pollMs: 5, fetch: async website => {
    if (website.includes('failure')) throw new Error('private diagnostic');
    return { url: website, statusCode: 200, contentType: 'text/html', html: '<title>Example</title>' };
  } });
  t.after(async () => { await stop(); store.close(); });
  const deadline = Date.now() + 2000;
  while (store.getStatus(bad.id).state !== 'failed' && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(store.getStatus(good.id).state, 'report_ready');
  const report = JSON.parse(store.db.prepare('SELECT report FROM jobs WHERE id=?').get(good.id).report);
  assert.equal(report.pageTitle, 'Example');
  assert.equal(store.getStatus(bad.id).error, 'site_unavailable');
});
