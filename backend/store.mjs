import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class JobStore {
  constructor(filename, { now = Date.now, maxPending = 100, perIp = 5, perEmail = 3 } = {}) {
    if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
    this.now = now;
    this.limits = { maxPending, perIp, perEmail };
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY, website TEXT NOT NULL, email TEXT NOT NULL,
        client_key TEXT NOT NULL, state TEXT NOT NULL, created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
        lease_until INTEGER, report TEXT, error TEXT
      );
      CREATE INDEX IF NOT EXISTS jobs_queue ON jobs(state, created_at);
      CREATE INDEX IF NOT EXISTS jobs_ip ON jobs(client_key, created_at);
      CREATE INDEX IF NOT EXISTS jobs_email ON jobs(email, created_at);`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS deliveries (
      job_id TEXT PRIMARY KEY, state TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0, lease_until INTEGER,
      next_at INTEGER NOT NULL DEFAULT 0, provider_id TEXT, error TEXT
    );`);
  }

  enqueue({ website, email, clientKey }) {
    const now = this.now();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`DELETE FROM jobs WHERE state IN ('report_ready','failed') AND updated_at < ?
        AND id NOT IN (SELECT job_id FROM deliveries WHERE state IN ('pending','sending'))`)
        .run(now - 7 * 86400000);
      this.db.exec('DELETE FROM deliveries WHERE job_id NOT IN (SELECT id FROM jobs)');
      const count = (where, ...params) => this.db.prepare(`SELECT count(*) AS n FROM jobs WHERE ${where}`).get(...params).n;
      if (count('client_key = ? AND created_at > ?', clientKey, now - 3600000) >= this.limits.perIp ||
        count('email = ? AND created_at > ?', email, now - 86400000) >= this.limits.perEmail) {
        throw new Error('rate_limited');
      }
      if (count("state IN ('queued','processing')") >= this.limits.maxPending) throw new Error('queue_full');
      const id = randomBytes(32).toString('hex');
      this.db.prepare(`INSERT INTO jobs (id, website, email, client_key, state, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'queued', ?, ?)`).run(id, website, email, clientKey, now, now);
      this.db.exec('COMMIT');
      return { id, state: 'queued' };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  claim() {
    const now = this.now();
    // Crash recovery uses expiring leases, not a blanket reset of other workers.
    this.db.prepare(`UPDATE jobs SET state='failed', error='worker_interrupted', updated_at=?
      WHERE state='processing' AND lease_until <= ? AND attempts >= 3`).run(now, now);
    return this.db.prepare(`UPDATE jobs SET state='processing', attempts=attempts+1,
      updated_at=?, lease_until=? WHERE id=(SELECT id FROM jobs WHERE
      state='queued' OR (state='processing' AND lease_until <= ? AND attempts < 3)
      ORDER BY created_at LIMIT 1) RETURNING *`).get(now, now + 60000, now);
  }

  finish(job, report, error = null) {
    // A stale worker cannot overwrite a later attempt.
    this.db.prepare(`UPDATE jobs SET state=?, report=?, error=?, lease_until=NULL, updated_at=?
      WHERE id=? AND state='processing' AND attempts=?`).run(
      error ? 'failed' : 'report_ready', report ? JSON.stringify(report) : null,
      error, this.now(), job.id, job.attempts);
  }

  getStatus(id) {
    const row = this.db.prepare('SELECT id, state, error FROM jobs WHERE id=?').get(id);
    if (!row) return null;
    const delivery = this.db.prepare('SELECT state, error FROM deliveries WHERE job_id=?').get(id);
    return { ...row, ...(delivery ? { delivery: { ...delivery } } : {}) };
  }

  claimDelivery() {
    const now = this.now();
    this.db.exec(`INSERT OR IGNORE INTO deliveries (job_id)
      SELECT id FROM jobs WHERE state='report_ready';`);
    this.db.prepare(`UPDATE deliveries SET state='failed', error='delivery_interrupted'
      WHERE state='sending' AND lease_until <= ? AND attempts >= 3`).run(now);
    const delivery = this.db.prepare(`UPDATE deliveries SET state='sending', attempts=attempts+1,
      lease_until=? WHERE job_id=(SELECT job_id FROM deliveries WHERE
      (state='pending' AND next_at <= ?) OR (state='sending' AND lease_until <= ? AND attempts < 3)
      ORDER BY next_at LIMIT 1) RETURNING *`).get(now + 60000, now, now);
    if (!delivery) return undefined;
    const job = this.db.prepare('SELECT id, email, report FROM jobs WHERE id=?').get(delivery.job_id);
    return { ...job, deliveryAttempt: delivery.attempts };
  }

  finishDelivery(job, result, error = null) {
    const now = this.now();
    if (!error && !['stored', 'accepted'].includes(result?.state)) throw new Error('invalid_delivery_result');
    const state = error ? (job.deliveryAttempt >= 3 ? 'failed' : 'pending') : result.state;
    this.db.prepare(`UPDATE deliveries SET state=?, provider_id=?, error=?, lease_until=NULL, next_at=?
      WHERE job_id=? AND state='sending' AND attempts=?`).run(state, result?.providerId ?? null,
      error, now + 30000 * job.deliveryAttempt, job.id, job.deliveryAttempt);
  }

  close() { this.db.close(); }
}
