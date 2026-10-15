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
                    # Local functional checks do not depend on remote fonts or photographs.
                    page.route('https://**/*', lambda route: route.abort())
                    errors = []
                    font_requests = []
                    image_requests = []
                    page.on('request', lambda request: image_requests.append(request.url)
                            if request.resource_type == 'image' else None)
                    page.on('request', lambda request: font_requests.append(request.url)
                            if request.resource_type == 'font' else None)
                    submissions = []
                    page.on('request', lambda request: submissions.append(request.url)
                            if request.method == 'POST' and request.url.endswith('/api/audits') else None)
                    page.emulate_media(reduced_motion='reduce')
                    page.set_viewport_size({'width': 390, 'height': 844})
                    page.goto('http://127.0.0.1:3100/', wait_until='domcontentloaded')
                    for family in ['Inter', 'Space Grotesk', 'JetBrains Mono']:
                        assert page.evaluate('''async family => {
                            const fonts = await document.fonts.load(`400 16px "${family}"`, 'Grüße');
                            return fonts.length > 0 && fonts.every(font => font.status === 'loaded');
                        }''', family), family
                    assert len(font_requests) >= 3
                    assert all(url.startswith('http://127.0.0.1:3100/fonts/') for url in font_requests)
                    assert page.locator('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').count() == 0
                    print('PASS: all three local fonts load with external requests blocked')
                    page.keyboard.press('Tab')
                    assert page.get_by_role('link', name='Zum Inhalt springen', exact=True).evaluate('(element) => element === document.activeElement')
                    page.keyboard.press('Enter')
                    assert page.locator('#main-content').evaluate('(element) => element === document.activeElement')
                    menu = page.get_by_role('button', name='Menü', exact=True)
                    menu.focus()
                    page.keyboard.press('Enter')
                    navigation = page.get_by_role('navigation', name='Mobile Navigation', exact=True)
                    navigation.wait_for()
                    assert menu.get_attribute('aria-expanded') == 'true'
                    page.keyboard.press('Tab')
                    first = navigation.get_by_role('link', name='Leistungen', exact=True)
                    assert first.evaluate('(element) => element === document.activeElement')
                    page.keyboard.press('Escape')
                    assert menu.evaluate('(element) => element === document.activeElement')
                    assert menu.get_attribute('aria-expanded') == 'false'
                    assert navigation.count() == 0
                    menu.click()
                    first.focus()
                    page.keyboard.press('Enter')
                    page.wait_for_url('**/leistungen')
                    page.wait_for_function("document.activeElement?.id === 'main-content'")
                    assert navigation.count() == 0
                    menu.click()
                    first.focus()
                    page.set_viewport_size({'width': 1280, 'height': 800})
                    desktop = page.get_by_role('navigation', name='Hauptnavigation', exact=True)
                    desktop.get_by_role('link', name='Leistungen', exact=True).wait_for()
                    page.wait_for_function("document.activeElement?.closest('nav')?.getAttribute('aria-label') === 'Hauptnavigation'")
                    assert desktop.get_by_role('link', name='Leistungen', exact=True).get_attribute('aria-current') == 'page'
                    page.set_viewport_size({'width': 390, 'height': 844})
                    assert menu.get_attribute('aria-expanded') == 'false'
                    menu.click()
                    navigation.get_by_role('link', name='Website prüfen', exact=True).focus()
                    page.keyboard.press('Tab')
                    assert navigation.count() == 0
                    for width in [320, 390, 768, 1024, 1440]:
                        page.set_viewport_size({'width': width, 'height': 844})
                        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
                    print('PASS: skip link, mobile keyboard navigation, Escape/focus, route change, resize, tab exit, widths 320–1440')
                    for path in ['/missing-page', '/missing/nested?from=test']:
                        page.goto('http://127.0.0.1:3100' + path, wait_until='domcontentloaded')
                        page.get_by_role('heading', name='Seite nicht gefunden', exact=True).wait_for()
                        page.wait_for_function("document.title === 'Seite nicht gefunden (404) — KALDER'")
                        assert 'nicht gefunden' in page.locator('meta[name="description"]').get_attribute('content')
                    page.get_by_role('link', name='Zur Startseite', exact=True).click()
                    page.wait_for_url('http://127.0.0.1:3100/')
                    assert page.get_by_role('heading', name='Seite nicht gefunden', exact=True).count() == 0
                    for path in ['/', '/leistungen', '/analyse', '/projekte', '/kontakt', '/impressum', '/datenschutz', '/KONTAKT/']:
                        page.goto('http://127.0.0.1:3100' + path, wait_until='domcontentloaded')
                        page.locator('h1').wait_for()
                        assert page.get_by_role('heading', name='Seite nicht gefunden', exact=True).count() == 0
                        page.wait_for_function("!document.title.includes('(404)')")
                    print('PASS: unknown routes show 404 metadata and working home link; existing routes still render')
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
                    for path in ['/', '/projekte']:
                        page.goto('http://127.0.0.1:3100' + path, wait_until='domcontentloaded')
                        images = page.evaluate('''async () => {
                            const images = [...document.images];
                            await Promise.all(images.map(async image => {
                                image.loading = 'eager'; await image.decode();
                            }));
                            return images.map(image => ({src:image.currentSrc, width:image.naturalWidth}));
                        }''')
                        assert images, path
                        assert all(image['width'] > 0 and '/images/' in image['src'] for image in images), images
                    assert image_requests and all(url.startswith('http://127.0.0.1:3100/images/') for url in image_requests)
                    print('PASS: all home/project photographs decode locally with external HTTPS blocked')
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
