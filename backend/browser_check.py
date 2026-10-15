"""E2E: build to .runtime/build, then python backend/browser_check.py (Playwright + Chromium)."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = r"""
import http from 'node:http';
import { join } from 'node:path';
import { JobStore } from './backend/store.mjs';
import { createApi } from './backend/server.mjs';
import { createSiteFetcher } from './backend/fetch-site.mjs';
import { startWorker } from './backend/worker.mjs';
import { startDeliveryWorker } from './backend/delivery-worker.mjs';
import { createMailer } from './backend/mail.mjs';
const directory = process.argv[1];
const site = http.createServer((_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end('<title>Fixture Restaurant</title><meta name="viewport" content="width=device-width">');
});
await new Promise(resolve => site.listen(0, '127.0.0.1', resolve));
// Only this test transport routes a validated public address to a local fixture.
const fetch = createSiteFetcher({
  resolve: async () => [{ address: '93.184.215.14', family: 4 }],
  request: (url, options, callback) => {
    options.lookup(url.hostname, {}, (error, address) => {
      if (error || address !== '93.184.215.14') throw new Error('pinning_failed');
    });
    return http.request({ ...options, hostname: '127.0.0.1',
      port: site.address().port, path: url.pathname, lookup: undefined }, callback);
  },
});
const store = new JobStore(join(directory, 'jobs.sqlite'), { perIp: 2 });
const stopScan = startWorker(store, { fetch, pollMs: 10 });
const stopMail = startDeliveryWorker(store, createMailer({ directory: join(directory, 'outbox') }), { pollMs: 10 });
const api = createApi(store, { mailMode: 'file' });
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
console.log(JSON.stringify({ port: api.address().port }));
process.on('SIGTERM', async () => {
  api.close(); site.close(); await stopScan(); await stopMail(); store.close();
});
"""


def run():
    with tempfile.TemporaryDirectory(prefix='kalder-browser-') as directory:
        fixture = subprocess.Popen(['node', '--input-type=module', '-e', FIXTURE, directory],
                                   cwd=ROOT, stdout=subprocess.PIPE, text=True)
        vite = None
        try:
            port = json.loads(fixture.stdout.readline())['port']
            env = dict(os.environ, KALDER_API_PROXY_TARGET=f'http://127.0.0.1:{port}')
            vite = subprocess.Popen(['node', 'node_modules/vite/bin/vite.js', 'preview',
                                     '--outDir', '.runtime/build', '--host',
                                     '127.0.0.1', '--port', '3100', '--strictPort'], cwd=ROOT, env=env,
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            for _ in range(100):
                try:
                    with urlopen('http://127.0.0.1:3100/api/config', timeout=1) as response:
                        assert json.load(response)['mailMode'] == 'file'
                    break
                except OSError:
                    time.sleep(.05)
            else:
                raise AssertionError('Vite/API did not start')
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path='/usr/bin/chromium',
                                            args=['--no-sandbox'])
                try:
                    page = browser.new_page()
                    errors = []
                    submissions = []
                    page.on('request', lambda request: submissions.append(request.url)
                            if request.method == 'POST' and request.url.endswith('/api/audits') else None)
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto('http://127.0.0.1:3100/analyse')
                    page.locator('#website-check').fill('example.com')
                    page.get_by_role('button', name='Analyse anfragen', exact=True).click()
                    page.get_by_role('button', name='Kontaktdaten ergänzen', exact=True).click()
                    page.wait_for_url('**/kontakt?**')
                    assert page.locator('#website').input_value() == 'https://example.com/' or page.locator('#website').input_value() == 'https://example.com'
                    submit = page.get_by_role('button', name='Bericht anfordern', exact=True)
                    submit.click()
                    page.locator('#email-error').wait_for()
                    assert page.locator('#email').get_attribute('aria-invalid') == 'true'
                    assert page.locator('#email').evaluate('(element) => element === document.activeElement')
                    page.locator('#email').fill('visitor@example.org')
                    submit.click()
                    page.get_by_text('Der Testbericht wurde erstellt und lokal gespeichert. Es wurde keine E-Mail versendet.', exact=True).wait_for(timeout=15000)
                    files = list((Path(directory) / 'outbox').glob('*.json'))
                    assert len(files) == 1
                    message = json.loads(files[0].read_text())
                    assert message['to'] == 'visitor@example.org'
                    assert 'Fixture Restaurant' in message['html']
                    assert 'Fixture Restaurant' in message['text']
                    saved = page.evaluate("JSON.parse(sessionStorage.getItem('kalder.report-request.v1'))")
                    assert sorted(saved) == ['id', 'savedAt']
                    page.reload()
                    page.get_by_text('Der Testbericht wurde erstellt und lokal gespeichert. Es wurde keine E-Mail versendet.', exact=True).wait_for()
                    assert len(submissions) == 1, 'reload must not create another job'
                    page.get_by_role('button', name='Neue Analyse anfordern', exact=True).click()
                    assert page.evaluate("sessionStorage.getItem('kalder.report-request.v1')") is None
                    print('PASS: reload restores status without another POST; explicit reset clears saved id')
                    print('PASS: browser → Vite proxy → API → SQLite → safe fetch fixture → report → local mail')
                    # Private addresses are rejected at the form before submission.
                    page.goto('http://127.0.0.1:3100/kontakt')
                    page.locator('#website').fill('http://127.0.0.1')
                    page.locator('#email').fill('visitor@example.org')
                    page.get_by_role('button', name='Bericht anfordern', exact=True).click()
                    page.locator('#website-error').wait_for()
                    assert page.locator('#website').evaluate('(element) => element === document.activeElement')
                    page.evaluate("sessionStorage.setItem('kalder.report-request.v1', JSON.stringify({id:'b'.repeat(64), savedAt:Date.now()}))")
                    page.reload()
                    page.get_by_role('alert').filter(has_text='nicht gefunden').wait_for()
                    assert page.evaluate("sessionStorage.getItem('kalder.report-request.v1')") is None
                    # Provider-acceptance copy is checked separately without sending real email.
                    page.route('**/api/config', lambda route: route.fulfill(json={'mailMode': 'resend'}))
                    page.route('**/api/audits', lambda route: route.fulfill(status=202, json={'id': 'a'*64, 'state': 'queued'}))
                    page.route('**/api/audits/' + 'a'*64, lambda route: route.fulfill(json={'id': 'a'*64, 'state': 'report_ready', 'delivery': {'state': 'accepted'}}))
                    page.goto('http://127.0.0.1:3100/kontakt')
                    page.locator('#website').fill('example.com')
                    page.locator('#email').fill('visitor@example.org')
                    page.get_by_role('button', name='Bericht anfordern', exact=True).click()
                    page.get_by_text('Der Bericht wurde vom E-Mail-Dienst angenommen. Bitte prüfen Sie auch Ihren Spam-Ordner.', exact=True).wait_for()
                    assert not errors, errors
                    print('PASS: field errors/focus, private-address rejection, distinct test/real-mode copy; no JS exceptions')
                finally:
                    browser.close()
        finally:
            for process in [vite, fixture]:
                if process is not None:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()


if __name__ == '__main__':
    run()
