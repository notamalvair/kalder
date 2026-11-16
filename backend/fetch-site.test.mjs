import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createSiteFetcher, isPublicAddress, normalizeWebsite } from './fetch-site.mjs';
import { analysePage } from './audit.mjs';

test('rejects local, reserved, mapped, transition and metadata addresses', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.1.1', '192.168.1.1',
    '169.254.169.254', '100.100.100.200', '0.0.0.0', '224.0.0.1', '192.0.2.1',
    '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '2002:7f00:1::',
    '2001:db8::1', '2001::1', '64:ff9b::7f00:1', 'not-an-ip']) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  assert.equal(isPublicAddress('93.184.215.14'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});

test('normalizes domain and rejects unsupported schemes, ports and credentials', () => {
  assert.equal(normalizeWebsite(' example.com ').href, 'https://example.com/');
  for (const value of ['', 'ftp://example.com', 'https://user:pass@example.com',
    'https://example.com:8443', 'https://example.com.']) {
    assert.throws(() => normalizeWebsite(value), /invalid_url/);
  }
});

// Real local HTTP sockets exercise streaming, redirects, limits and deadlines.
// This test-only adapter asserts the pinned public lookup, then routes to a fixture.
async function fixture(t, handler, overrides = {}) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const seen = [];
  const fetch = createSiteFetcher({
    resolve: async () => [{ address: '93.184.215.14', family: 4 }],
    request: (url, options, callback) => {
      seen.push(url.href);
      options.lookup(url.hostname, {}, (error, address, family) => {
        assert.equal(error, null); assert.equal(address, '93.184.215.14'); assert.equal(family, 4);
      });
      return http.request({ ...options, hostname: '127.0.0.1',
        port: server.address().port, path: url.pathname, lookup: undefined }, callback);
    },
    ...overrides,
  });
  return { fetch, seen };
}

test('fetches HTML and passes the result to the audit module', async t => {
  const { fetch } = await fixture(t, (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<title>Example restaurant</title>');
  });
  const report = analysePage(await fetch('http://example.com'));
  assert.equal(report.status, 'analysed');
  assert.equal(report.pageTitle, 'Example restaurant');
});

test('rejects mixed DNS answers before opening any socket', async () => {
  const fetch = createSiteFetcher({ resolve: async () => [
    { address: '93.184.215.14', family: 4 }, { address: '127.0.0.1', family: 4 }],
  request: () => { throw new Error('must_not_connect'); } });
  await assert.rejects(fetch('example.com'), /blocked_address/);
  await assert.rejects(fetch('http://2130706433'), /blocked_address/);
});

test('validates every redirect and prevents private target access', async t => {
  const { fetch, seen } = await fixture(t, (_req, res) => {
    res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data' }); res.end();
  });
  await assert.rejects(fetch('http://example.com'), /blocked_address/);
  assert.equal(seen.length, 1);
});

test('follows relative redirects but bounds loops', async t => {
  const { fetch } = await fixture(t, (req, res) => {
    if (req.url === '/done') { res.setHeader('Content-Type', 'text/html'); res.end('OK'); }
    else { res.writeHead(302, { Location: req.url === '/loop' ? '/loop' : '/done' }); res.end(); }
  }, { maxRedirects: 2 });
  assert.equal((await fetch('http://example.com')).url, 'http://example.com/done');
  await assert.rejects(fetch('http://example.com/loop'), /too_many_redirects/);
});

test('blocks HTTPS downgrade', async t => {
  const { fetch } = await fixture(t, (_req, res) => {
    res.writeHead(302, { Location: 'http://example.com/done' }); res.end();
  });
  await assert.rejects(fetch('https://example.com'), /https_downgrade/);
});

test('enforces streaming size limit without Content-Length', async t => {
  const { fetch } = await fixture(t, (_req, res) => {
    res.write('123456'); res.end('789012');
  }, { maxBytes: 10 });
  await assert.rejects(fetch('http://example.com'), /response_too_large/);
});

test('deadlines cover stalled responses and DNS', async t => {
  const { fetch } = await fixture(t, () => {}, { timeoutMs: 40 });
  await assert.rejects(fetch('http://example.com'), /timeout/);
  const stalledDns = createSiteFetcher({ resolve: () => new Promise(() => {}), timeoutMs: 20 });
  await assert.rejects(stalledDns('example.com'), /timeout/);
});

test('decodes gzip and brotli bodies and bounds the decoded size', async t => {
  const { gzipSync, brotliCompressSync } = await import('node:zlib');
  const page = '<title>Komprimiert</title>';
  const { fetch } = await fixture(t, (req, res) => {
    assert.match(req.headers['accept-encoding'], /gzip/);
    const br = req.url === '/br';
    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Encoding': br ? 'br' : 'gzip' });
    res.end(req.url === '/bomb' ? gzipSync(Buffer.alloc(200_000)) :
      br ? brotliCompressSync(page) : gzipSync(page));
  }, { maxBytes: 50_000 });
  assert.equal((await fetch('http://example.com')).html, page);
  assert.equal((await fetch('http://example.com/br')).html, page);
  await assert.rejects(fetch('http://example.com/bomb'), /response_too_large/);
});

test('rejects unknown and corrupt content encodings', async t => {
  const { fetch } = await fixture(t, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Encoding': req.url === '/bad' ? 'gzip' : 'zstd' });
    res.end('not compressed');
  });
  await assert.rejects(fetch('http://example.com'), /unsupported_encoding/);
  await assert.rejects(fetch('http://example.com/bad'), /invalid_encoding/);
});

test('decodes legacy charsets from the header or an early meta tag', async t => {
  const { fetch } = await fixture(t, (req, res) => {
    const header = req.url === '/header';
    res.setHeader('Content-Type', header ? 'text/html; charset=ISO-8859-1' :
      req.url === '/unknown' ? 'text/html; charset=x-nope' : 'text/html');
    res.end(Buffer.from(`${header ? '' : '<meta charset="windows-1252">'}<title>Gaststätte Müller</title>`, 'latin1'));
  });
  for (const path of ['/header', '/meta']) {
    assert.equal(analysePage(await fetch(`http://example.com${path}`)).pageTitle, 'Gaststätte Müller');
  }
  await assert.rejects(fetch('http://example.com/unknown'), /unsupported_charset/);
});

test('prefers IPv4 and falls back to the next validated address when unreachable', async t => {
  const server = http.createServer((_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('OK'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const tried = [];
  const fetch = createSiteFetcher({
    resolve: async () => [{ address: '2606:4700:4700::1111', family: 6 },
      { address: '93.184.215.14', family: 4 }, { address: '93.184.215.15', family: 4 }],
    request: (url, options, callback) => {
      let pinned;
      options.lookup(url.hostname, {}, (_error, address) => { pinned = address; });
      tried.push(pinned);
      if (pinned === '93.184.215.14') throw Object.assign(new Error('unreachable'), { code: 'EHOSTUNREACH' });
      return http.request({ ...options, hostname: '127.0.0.1', port: server.address().port,
        path: url.pathname, lookup: undefined }, callback);
    },
  });
  assert.equal((await fetch('http://example.com')).html, 'OK');
  assert.deepEqual(tried, ['93.184.215.14', '93.184.215.15']);
});
