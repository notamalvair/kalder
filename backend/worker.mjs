import { fetchSite } from './fetch-site.mjs';
import { analysePage } from './audit.mjs';

export function startWorker(store, { fetch = fetchSite, pollMs = 250 } = {}) {
  let stopping = false;
  let timer;
  let active = Promise.resolve();
  async function tick() {
    try {
      const job = store.claim();
      if (job) {
        try {
          const report = analysePage(await fetch(job.website));
          if (report.status !== 'analysed') store.finish(job, null, 'site_unavailable');
          else store.finish(job, report);
        } catch {
          store.finish(job, null, 'site_unavailable');
        }
      }
    } catch {
      // Storage errors must not produce an unhandled rejection or lose queued work.
      console.error('Audit worker storage error; retrying after poll interval.');
    } finally {
      if (!stopping) timer = setTimeout(run, pollMs);
    }
  }
  function run() { active = tick(); }
  run();
  return async function stop() { stopping = true; clearTimeout(timer); await active; };
}
