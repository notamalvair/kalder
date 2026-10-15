import test from 'node:test';
import assert from 'node:assert/strict';
import { analysePage } from './audit.mjs';

const input = { url: 'https://example.com/', statusCode: 200,
  contentType: 'text/html; charset=utf-8', responseTimeMs: 100 };
const healthyHtml = `<title>Restaurant Example</title>
  <meta content='width=device-width' NAME='viewport'>
  <meta content='/photo.jpg' property='og:image'>
  <a href='/impressum'>Legal</a><a href='/datenschutz'>Privacy</a>`;

test('recognizes metadata regardless of attribute order and case', () => {
  const report = analysePage({ ...input, html: healthyHtml });
  assert.equal(report.status, 'analysed');
  assert.equal(report.score, 100);
  assert.equal(report.checks.viewport, true);
  assert.equal(report.checks.impressumLink, true);
});

test('failed fetches have unknown checks and no quality score', () => {
  for (const failure of [{ statusCode: 503 }, { error: 'ETIMEDOUT' }]) {
    const report = analysePage({ ...input, html: healthyHtml, ...failure });
    assert.equal(report.status, 'unavailable');
    assert.equal(report.score, null);
    assert.equal(report.checks.viewport, 'unknown');
    assert.deepEqual(report.findings, []);
  }
});

test('does not analyse PDF or empty responses as broken websites', () => {
  for (const overrides of [{ contentType: 'application/pdf', html: '%PDF' }, { html: '' }]) {
    assert.equal(analysePage({ ...input, ...overrides }).status, 'unsupported');
  }
});

test('ignores legal keywords and metadata inside comments and scripts', () => {
  const report = analysePage({ ...input, html: `<title>Home</title>
    <!-- ${healthyHtml} --><script>const text = '${healthyHtml}'</script>
    <p>impressum privacy</p>` });
  assert.equal(report.checks.title, false);
  assert.equal(report.checks.viewport, false);
  assert.equal(report.checks.impressumLink, false);
  assert.equal(report.checks.privacyLink, false);
});

test('PDF menu does not imply that the website only has a PDF menu', () => {
  const report = analysePage({ ...input, html: healthyHtml +
    `<a href='/speisekarte.pdf?v=2'>PDF</a><a href='/menu'>HTML menu</a>` });
  assert.equal(report.checks.pdfMenuLink, true);
  assert.ok(report.findings.some(f => f.code === 'pdf_menu_link'));
  assert.equal('pdf_menu_only' in report.checks, false);
});

test('transport and response timing are reported without claiming TLS or mobile audits', () => {
  const report = analysePage({ ...input, url: 'http://example.com/',
    responseTimeMs: 3000, html: healthyHtml });
  assert.equal(report.response.transport, 'http');
  assert.deepEqual(report.findings.map(f => f.code), ['http_transport', 'slow_response']);
});
