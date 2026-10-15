import { mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export function createMailer({ mode = 'file', directory = resolve('.runtime/backend/outbox'),
  apiKey, from, fetch = globalThis.fetch } = {}) {
  if (!['file', 'resend'].includes(mode)) throw new Error('invalid_mail_mode');
  if (mode === 'resend' && (!apiKey || !from || /[\r\n]/.test(from))) {
    throw new Error('missing_mail_configuration');
  }
  return async function deliver({ id, to, subject, html, text }) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('invalid_message_id');
    if (mode === 'file') {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const path = join(directory, `${id}.json`);
      const temp = `${path}.${randomUUID()}.tmp`;
      try {
        await writeFile(temp, JSON.stringify({ id, to, subject, text, html }, null, 2), { mode: 0o600, flag: 'wx' });
        // Retrying the same job replaces the same atomic local artifact.
        await rename(temp, path);
      } finally { await unlink(temp).catch(() => {}); }
      return { state: 'stored', providerId: id };
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `kalder-audit-${id}` },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    if (!response.ok) throw new Error('mail_provider_error');
    const result = await response.json();
    if (typeof result.id !== 'string' || !result.id) throw new Error('invalid_mail_response');
    // Provider acceptance is not proof of inbox delivery.
    return { state: 'accepted', providerId: result.id };
  };
}
