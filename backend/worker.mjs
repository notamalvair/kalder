import { fetchSite } from './fetch-site.mjs';
import { analysePage } from './audit.mjs';

export function startWorker(store, { fetch = fetchSite, pollMs = 250, retryMs = 2000 } = {}) {
  let stopping = false;
  let timer;
  let active = Promise.resolve();
  // One quick retry for failures that are usually temporary (DNS hiccup, reset, slow answer).
  const transient = error => ['timeout', 'response_aborted'].includes(error?.message) ||
    ['EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT'].includes(error?.code);
  async function load(website) {
    try { return await fetch(website); }
    catch (error) {
      if (!transient(error) || stopping) throw error;
      await new Promise(resolve => setTimeout(resolve, retryMs));
      return fetch(website);
    }
  }
  async function tick() {
    try {
      const job = store.claim();
      if (job) {
        try {
          const report = analysePage(await load(job.website));
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
