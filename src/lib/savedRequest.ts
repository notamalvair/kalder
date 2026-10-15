const KEY = 'kalder.report-request.v1';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserStorage(): StorageLike | null {
  try { return window.sessionStorage; } catch { return null; }
}

export function readSavedRequest(storage = browserStorage(), now = Date.now()): string | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || !/^[a-f0-9]{64}$/.test(value.id) || !Number.isFinite(value.savedAt) ||
      value.savedAt > now || now - value.savedAt >= MAX_AGE) {
      storage?.removeItem(KEY); return null;
    }
    return value.id;
  } catch {
    try { storage?.removeItem(KEY); } catch { /* Storage can be blocked by browser policy. */ }
    return null;
  }
}

export function saveRequest(id: string, storage = browserStorage(), now = Date.now()): boolean {
  if (!/^[a-f0-9]{64}$/.test(id) || !storage) return false;
  try { storage.setItem(KEY, JSON.stringify({ id, savedAt: now })); return true; }
  catch { return false; }
}

export function clearSavedRequest(storage = browserStorage()): void {
  try { storage?.removeItem(KEY); } catch { /* The current UI can still be reset. */ }
}
