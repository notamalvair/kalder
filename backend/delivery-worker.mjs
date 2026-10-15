import { renderReport } from './report.mjs';

export function startDeliveryWorker(store, deliver, { pollMs = 500 } = {}) {
  let stopping = false;
  let timer;
  let active = Promise.resolve();
  async function tick() {
    try {
      const job = store.claimDelivery();
      if (job) {
        try {
          const message = renderReport(JSON.parse(job.report));
          const result = await deliver({ id: job.id, to: job.email, ...message });
          store.finishDelivery(job, result);
        } catch { store.finishDelivery(job, null, 'mail_failed'); }
      }
    } catch { console.error('Delivery worker storage error; retrying after poll interval.'); }
    finally { if (!stopping) timer = setTimeout(run, pollMs); }
  }
  function run() { active = tick(); }
  run();
  return async () => { stopping = true; clearTimeout(timer); await active; };
}
