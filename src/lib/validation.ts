// Browser-side feedback only. DNS/IP checks remain mandatory on the server.
export function normalizeWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048 || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    const labels = url.hostname.split('.');
    if (url.hostname.length > 253 || labels.length < 2 ||
      labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) ||
      !/^[a-z][a-z0-9-]*[a-z0-9]$/i.test(labels[labels.length - 1] ?? '') ||
      /\.(local|localhost|internal|test|invalid)$/i.test(url.hostname)) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(email)) return false;
  const [local, domain] = email.split('@');
  return !local.startsWith('.') && !local.endsWith('.') && !email.includes('..') &&
    domain.split('.').every(label => label.length <= 63);
}
