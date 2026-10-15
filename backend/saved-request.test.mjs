import test from 'node:test';
import assert from 'node:assert/strict';
import { readSavedRequest, saveRequest, clearSavedRequest } from '../src/lib/savedRequest.ts';

const id = 'a'.repeat(64);
function memory() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key), values };
}

test('saved request stores only id and timestamp and restores them', () => {
  const storage = memory();
  assert.equal(saveRequest(id, storage, 100), true);
  assert.deepEqual(JSON.parse([...storage.values.values()][0]), { id, savedAt: 100 });
  assert.equal(readSavedRequest(storage, 101), id);
  clearSavedRequest(storage);
  assert.equal(readSavedRequest(storage, 101), null);
});

test('expired, invalid and future-dated records are removed', () => {
  const storage = memory();
  saveRequest(id, storage, 100);
  assert.equal(readSavedRequest(storage, 100 + 7 * 86400000), null);
  assert.equal(storage.values.size, 0);
  for (const raw of ['{', 'null', JSON.stringify({ id: '../bad', savedAt: 100 }),
    JSON.stringify({ id, savedAt: 9999 })]) {
    storage.setItem('kalder.report-request.v1', raw);
    assert.equal(readSavedRequest(storage, 200), null);
    assert.equal(storage.values.size, 0);
  }
});

test('browser storage failures do not crash the form', () => {
  const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  assert.equal(readSavedRequest(blocked), null);
  assert.equal(saveRequest(id, blocked), false);
  assert.doesNotThrow(() => clearSavedRequest(blocked));
  assert.equal(readSavedRequest(null), null);
  assert.equal(saveRequest(id, null), false);
});

test('invalid ids are never persisted', () => {
  const storage = memory();
  assert.equal(saveRequest('<script>', storage), false);
  assert.equal(storage.values.size, 0);
});
