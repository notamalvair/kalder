import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { analysePage } from './audit.mjs';
import { renderReport } from './report.mjs';
import { createMailer } from './mail.mjs';
import { JobStore } from './store.mjs';
import { startDeliveryWorker } from './delivery-worker.mjs';

const report = () => analysePage({ url: 'https://example.com/', statusCode: 200,
  contentType: 'text/html', html: '<title>Example restaurant</title>', responseTimeMs: 50 });
const id = 'a'.repeat(64);

test('HTML report escapes untrusted fields and text includes the limitations', () => {
  const data = report();
  data.pageTitle = '<img src=x onerror="alert(1)">';
  data.url = 'https://example.com/?q=<script>alert(1)</script>';
  const message = renderReport(data);
  assert.ok(message.html.includes('&lt;img'));
  assert.ok(!message.html.includes('<script>'));
  assert.ok(message.text.includes('kein vollständiger'));
  assert.ok(message.text.includes('keiner Marketingliste'));
  assert.throws(() => renderReport({ status: 'unavailable' }), /report_not_analysed/);
});

test('local delivery writes one private, complete artifact on repeated attempts', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'kalder-mail-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const deliver = createMailer({ directory });
  const message = { id, to: 'visitor@example.org', ...renderReport(report()) };
  assert.equal((await deliver(message)).state, 'stored');
  await deliver(message);
  assert.deepEqual(await readdir(directory), [`${id}.json`]);
  const path = join(directory, `${id}.json`);
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), message);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
});

test('provider adapter uses a fixed HTTPS destination and stable idempotency key', async () => {
  const deliver = createMailer({ mode: 'resend', apiKey: 'test-only', from: 'reports@example.org',
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers['Idempotency-Key'], `kalder-audit-${id}`);
      assert.deepEqual(JSON.parse(options.body).to, ['visitor@example.org']);
      return { ok: true, json: async () => ({ id: 'provider-test-id' }) };
    } });
  assert.deepEqual(await deliver({ id, to: 'visitor@example.org', ...renderReport(report()) }),
    { state: 'accepted', providerId: 'provider-test-id' });
  assert.throws(() => createMailer({ mode: 'resend' }), /missing_mail_configuration/);
});

test('provider errors never become successful delivery', async () => {
  const deliver = createMailer({ mode: 'resend', apiKey: 'test-only', from: 'reports@example.org',
    fetch: async () => ({ ok: false }) });
  await assert.rejects(deliver({ id, to: 'visitor@example.org', ...renderReport(report()) }), /mail_provider_error/);
});

function readyJob(store) {
  const job = store.enqueue({ website: 'https://example.com/', email: 'visitor@example.org', clientKey: 'test' });
  store.finish(store.claim(), report());
  return job;
}

test('delivery failures back off, survive reopening and stop after three attempts', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'kalder-retry-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filename = join(directory, 'jobs.sqlite');
  let now = 100000;
  let store = new JobStore(filename, { now: () => now });
  try {
    const job = readyJob(store);
    store.finishDelivery(store.claimDelivery(), null, 'mail_failed');
    assert.equal(store.claimDelivery(), undefined);
    store.close();
    store = new JobStore(filename, { now: () => now });
    now += 30001;
    const second = store.claimDelivery();
    assert.equal(second.deliveryAttempt, 2);
    store.finishDelivery(second, null, 'mail_failed');
    now += 60001;
    store.finishDelivery(store.claimDelivery(), null, 'mail_failed');
    assert.equal(store.getStatus(job.id).delivery.state, 'failed');
    now += 999999;
    assert.equal(store.claimDelivery(), undefined);
  } finally { store.close(); }
});

test('delivery worker uses the visitor email and records local storage honestly', async t => {
  const store = new JobStore(':memory:');
  const job = readyJob(store);
  const stop = startDeliveryWorker(store, async message => {
    assert.equal(message.to, 'visitor@example.org');
    assert.ok(message.html.includes('KALDER Website-Check'));
    return { state: 'stored', providerId: message.id };
  }, { pollMs: 5 });
  t.after(async () => { await stop(); store.close(); });
  const deadline = Date.now() + 1000;
  while (store.getStatus(job.id).delivery?.state !== 'stored' && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(store.getStatus(job.id).delivery.state, 'stored');
  assert.equal(store.claimDelivery(), undefined);
});
