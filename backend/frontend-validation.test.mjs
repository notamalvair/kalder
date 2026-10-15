import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWebsite, isValidEmail } from '../src/lib/validation.ts';

test('frontend accepts and normalizes domains, IDNs and ordinary website paths', () => {
  assert.equal(normalizeWebsite(' restaurant.de '), 'https://restaurant.de/');
  assert.equal(normalizeWebsite('https://münchen.de/menu#top'), 'https://xn--mnchen-3ya.de/menu');
  assert.equal(normalizeWebsite('http://example.com/menu?q=1'), 'http://example.com/menu?q=1');
});

test('frontend rejects malformed domains, IPs, credentials and custom ports', () => {
  for (const input of ['', 'localhost', 'https://foo..de', 'https://-foo.de',
    'ftp://example.com', 'https://user:pass@example.com', 'example.com:8443',
    '127.0.0.1', 'http://2130706433', 'https://[::1]', 'example.local',
    'example.com.', 'hello world.de', `${'a'.repeat(64)}.de`]) {
    assert.equal(normalizeWebsite(input), null, input);
  }
});

test('frontend email validation rejects malformed local parts and header injection', () => {
  assert.equal(isValidEmail(' visitor+check@example.org '), true);
  for (const input of ['name', '.name@example.com', 'name.@example.com',
    'na..me@example.com', 'name@-example.com', 'name@localhost',
    'name@example.com\r\nBcc: test@example.org']) assert.equal(isValidEmail(input), false, input);
});
