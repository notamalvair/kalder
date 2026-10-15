import { FormEvent, useEffect, useRef, useState } from 'react';

type MailMode = 'file' | 'resend' | 'disabled';
type Job = { id: string; state: string; error?: string; delivery?: { state: string } };

const errors: Record<string, string> = {
  invalid_url: 'Bitte geben Sie eine gültige Website ein.',
  invalid_website: 'Bitte geben Sie eine öffentlich erreichbare Website ein.',
  invalid_email: 'Bitte prüfen Sie Ihre E-Mail-Adresse.',
  rate_limited: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
  queue_full: 'Die Analyse ist derzeit ausgelastet. Bitte versuchen Sie es später erneut.',
};

export default function ReportRequest({ initialWebsite = '' }: { initialWebsite?: string }) {
  const [website, setWebsite] = useState(initialWebsite);
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<MailMode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [pollNotice, setPollNotice] = useState('');
  const submittingRef = useRef(false);
  const submitAbort = useRef<AbortController | null>(null);

  useEffect(() => { setWebsite(initialWebsite); }, [initialWebsite]);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setError('Die Analyse ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut.');
      controller.abort();
    }, 10000);
    fetch('/api/config', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!['file', 'resend', 'disabled'].includes(data.mailMode)) throw new Error();
        setMode(data.mailMode);
      }).catch(() => {
        if (!controller.signal.aborted) setError('Die Analyse ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut.');
      }).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); submitAbort.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!job?.id) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    let active: AbortController | null = null;
    async function poll() {
      active = new AbortController();
      const timeout = setTimeout(() => active?.abort(), 10000);
      try {
        const response = await fetch(`/api/audits/${job!.id}`, { signal: active.signal });
        if (!response.ok) throw new Error();
        const next: Job = await response.json();
        if (stopped) return;
        setJob(next);
        const terminal = next.state === 'failed' || ['stored', 'accepted', 'failed'].includes(next.delivery?.state ?? '');
        if (terminal) return;
      } catch {
        if (stopped) return;
      } finally { clearTimeout(timeout); }
      if (++attempts < 60) timer = setTimeout(poll, 2000);
      else setPollNotice('Die Anfrage bleibt gespeichert. Die Statusprüfung wurde beendet; bitte senden Sie keine doppelte Anfrage.');
    }
    void poll();
    return () => { stopped = true; clearTimeout(timer); active?.abort(); };
  }, [job?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current || job || !mode || mode === 'disabled') return;
    setError('');
    if (!website.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Bitte ergänzen Sie Website und eine gültige E-Mail-Adresse.'); return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    const controller = new AbortController();
    submitAbort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/audits', { method: 'POST',
        signal: controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: website.trim(), email: email.trim() }) });
      const data = await response.json();
      if (!response.ok) { setError(errors[data.error] ?? 'Die Anfrage konnte nicht angenommen werden. Bitte versuchen Sie es später erneut.'); return; }
      if (response.status !== 202 || !/^[a-f0-9]{64}$/.test(data.id)) throw new Error();
      if (['file', 'resend', 'disabled'].includes(data.mailMode)) setMode(data.mailMode);
      setJob({ id: data.id, state: data.state });
    } catch {
      if (submitAbort.current === controller) setError('Die Bestätigung konnte nicht geladen werden. Die Anfrage könnte bereits gespeichert sein; bitte nicht sofort erneut senden.');
    } finally { clearTimeout(timeout); submittingRef.current = false; setSubmitting(false); }
  }

  const inputClass = 'w-full px-4 py-3 border border-border text-sm text-graphite focus:outline-none focus:border-accent bg-ivory';
  let progress = 'Ihre Anfrage wurde gespeichert. Die Website wird geprüft.';
  if (job?.state === 'failed') progress = 'Die Website konnte nicht geprüft werden. Es wurde kein Bericht versendet.';
  else if (job?.delivery?.state === 'failed') progress = 'Der Bericht ist erstellt, konnte aber nicht übermittelt werden.';
  else if (job?.delivery?.state === 'stored') progress = 'Der Testbericht wurde erstellt und lokal gespeichert. Es wurde keine E-Mail versendet.';
  else if (job?.delivery?.state === 'accepted') progress = 'Der Bericht wurde vom E-Mail-Dienst angenommen. Bitte prüfen Sie auch Ihren Spam-Ordner.';
  else if (job?.state === 'report_ready') progress = mode === 'file' ? 'Der Testbericht ist erstellt und wird lokal gespeichert.' : 'Der Bericht ist erstellt und wird zur E-Mail-Übermittlung vorbereitet.';

  return (
    <form onSubmit={submit} noValidate className="bg-bone border border-border p-8 md:p-10">
      <h2 className="display text-2xl text-graphite mb-4">Website-Bericht anfordern</h2>
      <p className="text-sm text-graphite-muted mb-6">
        {mode === 'file' ? 'Testmodus: Berichte werden lokal gespeichert. Es erfolgt kein E-Mail-Versand.' :
          mode === 'resend' ? 'Geben Sie Website und E-Mail an. Nach der Analyse wird Ihr Bericht an diese Adresse übermittelt.' :
            mode === 'disabled' ? 'Der Berichtsversand ist momentan nicht verfügbar.' : 'Verfügbarkeit wird geprüft…'}
      </p>
      {job ? <div role="status" aria-live="polite" className="space-y-4">
        <h3 className="display text-xl text-graphite">Anfrage angenommen</h3>
        <p className="text-sm text-graphite-muted">{progress}</p>
        {pollNotice && <p className="text-sm text-graphite-muted">{pollNotice}</p>}
      </div> : <fieldset disabled={submitting} className="space-y-6">
        <div><label htmlFor="website" className="block text-sm mb-2">Website *</label>
          <input id="website" name="website" type="text" inputMode="url" autoComplete="url" required maxLength={2048}
            value={website} onChange={e => setWebsite(e.target.value)} className={inputClass} placeholder="restaurant.de" /></div>
        <div><label htmlFor="email" className="block text-sm mb-2">E-Mail *</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
            value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="ihre@email.de" /></div>
        <button type="submit" disabled={!mode || mode === 'disabled' || submitting}
          className="w-full px-7 py-3.5 bg-graphite text-ivory text-sm disabled:opacity-60">
          {submitting ? 'Wird angefragt…' : 'Bericht anfordern'}
        </button>
        <p className="text-xs text-graphite-muted">Ihre E-Mail wird für den angeforderten Bericht verwendet. Keine Anmeldung zu einem Newsletter. Allgemeine Projektanfragen bitte direkt per E-Mail.</p>
      </fieldset>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </form>
  );
}
