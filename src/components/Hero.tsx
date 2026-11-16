import { motion } from 'framer-motion';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { normalizeWebsite } from '../lib/validation';

// The demo findings belong to the example target only. Once a visitor types a domain the
// panel shows that domain as queued, never invented results for a real website.
function DiagnosticUI({ target }: { target: string | null }) {
  const [checksComplete, setChecksComplete] = useState(0);
  const totalChecks = 7;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        setChecksComplete((prev) => {
          if (prev >= totalChecks) {
            window.clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 220);
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  const checks = [
    { id: '01', label: 'HTTPS', status: 'PASS', tone: 'text-accent' },
    { id: '02', label: 'INDEXIERUNG', status: 'CHECK', tone: 'text-warn' },
    { id: '03', label: 'RESERVIERUNG', status: 'ISSUE', tone: 'text-signal' },
    { id: '04', label: 'SPEISEKARTE', status: '404', tone: 'text-signal' },
    { id: '05', label: 'MOBILE', status: 'PASS', tone: 'text-accent' },
    { id: '06', label: 'PERFORMANCE', status: 'CHECK', tone: 'text-warn' },
    { id: '07', label: 'KONTAKT', status: 'PASS', tone: 'text-accent' },
  ];

  const findings = checks.filter((item) => item.status === 'ISSUE' || item.status === '404').length;
  const warnings = checks.filter((item) => item.status === 'CHECK').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.22 }}
      className="relative lg:translate-y-10"
    >
      <div className="scan bg-panel border border-border p-6 md:p-8 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-6 pb-7 mb-7 border-b border-border">
          <div>
            <p className="label text-cream-muted mb-2">KALDER / SITE ANALYSIS</p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full" />
              <span className="meta text-accent">{target ? 'BEREIT ZUR ANALYSE' : 'DEMO / BEISPIELANALYSE'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="meta mb-1">SCAN ID</p>
            <p className="text-xs text-cream-muted font-mono">KD-2609-017</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="meta mb-2">TARGET</p>
          <p className="font-display text-xl md:text-2xl tracking-tight text-cream break-all">{target ?? 'restaurant-example.de'}</p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border border border-border mb-8">
          <div className="bg-panel p-4 md:p-5">
            <p className="meta mb-2">CHECKS</p>
            <p className="font-display text-2xl md:text-3xl tracking-tight text-cream">
              {target ? '00' : String(checksComplete).padStart(2, '0')}
              <span className="text-base text-cream-faint"> / {String(totalChecks).padStart(2, '0')}</span>
            </p>
          </div>
          <div className="bg-panel p-4 md:p-5">
            <p className="meta mb-2">FINDINGS</p>
            <p className="font-display text-2xl md:text-3xl tracking-tight text-accent">
              {target ? '—' : String(findings).padStart(2, '0')}
              {!target && <span className="text-xs text-cream-faint font-body ml-2">+{warnings} WARN</span>}
            </p>
          </div>
        </div>

        <div className="mb-7">
          {checks.map((check, index) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0.16 }}
              animate={target ? { opacity: 0.55 } : index < checksComplete ? { opacity: 1 } : { opacity: 0.16 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[2rem_1fr_auto] gap-3 py-3 border-b border-border-light last:border-0 items-center"
            >
              <span className="meta text-cream-faint">{check.id}</span>
              <span className="text-sm text-cream">{check.label}</span>
              <span className={`font-mono text-[11px] font-medium ${target ? 'text-cream-faint' : check.tone}`}>{target ? 'WARTET' : check.status}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
          <div>
            <p className="meta mb-1">MODE</p>
            <p className="text-[11px] text-cream-muted">WEB AUDIT</p>
          </div>
          <div>
            <p className="meta mb-1">STATUS</p>
            <p className="text-[11px] text-accent font-medium">{target ? 'QUEUE' : 'REVIEW'}</p>
          </div>
          <div className="text-right">
            <p className="meta mb-1">K / 01</p>
            <p className="text-[11px] text-cream-muted">SYSTEM</p>
          </div>
        </div>
      </div>
      <div className="absolute -top-2 -right-2 w-5 h-5 border-t border-r border-accent" />
      <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b border-l border-accent" />
    </motion.div>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const normalized = normalizeWebsite(website);
  const target = normalized ? new URL(normalized).hostname.replace(/^www\./, '') : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!normalized) {
      setError('Bitte geben Sie eine öffentliche Domain wie restaurant.de ein.');
      inputRef.current?.focus();
      return;
    }
    trackEvent('hero_cta');
    navigate(`/kontakt?website=${encodeURIComponent(normalized)}&source=hero`);
  }

  return (
    <section className="hero-glow min-h-[94vh] flex items-center pt-28 md:pt-32 pb-20 md:pb-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-start">
          <div className="lg:col-span-7 xl:col-span-7 pt-4 lg:pt-10">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="flex items-center gap-4 mb-8">
                <p className="label text-accent">K/01 — ANALYSE VOR ANGEBOT</p>
                <span className="hidden sm:block h-px w-16 bg-border" />
                <span className="meta hidden sm:inline">GASTRONOMIE · LOCAL BUSINESS · DACH</span>
              </div>

              <h1 className="display text-[clamp(3.3rem,7.2vw,6.6rem)] text-cream max-w-[900px]">
                Ihre Website sollte
                <br />
                Gäste bringen.
                <br />
                <span className="text-accent">Nicht verlieren.</span>
              </h1>

              <div className="mt-10 md:mt-12 max-w-2xl">
                <p className="text-base md:text-lg text-cream-muted leading-relaxed">
                  Wir analysieren zuerst, wo Technik, Sichtbarkeit oder der Anfrageweg wirklich Reibung erzeugen — und empfehlen erst dann, was sinnvoll ist.
                </p>
              </div>

              <form onSubmit={submit} noValidate className="mt-10 max-w-2xl">
                <label htmlFor="hero-website" className="label text-cream-muted block mb-3">Ihre Website prüfen</label>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] border border-border-dark bg-night-raised focus-within:border-accent transition-colors">
                  <input
                    id="hero-website"
                    ref={inputRef}
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    maxLength={2048}
                    value={website}
                    onChange={(event) => { setWebsite(event.target.value); setError(''); }}
                    placeholder="restaurant.de"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'hero-website-error' : 'hero-website-note'}
                    className="min-w-0 px-5 py-4 bg-transparent font-mono text-sm text-cream focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-7 py-4 bg-cream text-night text-sm font-medium tracking-wide hover:bg-cream-bright transition-colors whitespace-nowrap"
                  >
                    Analyse starten →
                  </button>
                </div>
                {error ? (
                  <p id="hero-website-error" role="alert" className="mt-3 text-xs text-signal">{error}</p>
                ) : (
                  <p id="hero-website-note" className="mt-3 text-xs text-cream-faint">
                    Unverbindlich. Auf Wunsch im Vergleich mit einem Wettbewerber.
                  </p>
                )}
              </form>

              <div className="mt-12 pt-6 border-t border-border max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-6">
                {['Analyse', 'Webdesign', 'Performance', 'Betreuung'].map((item, index) => (
                  <div key={item}>
                    <p className="meta mb-1">0{index + 1}</p>
                    <p className="text-sm text-cream">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 xl:col-span-5 lg:pl-4">
            <DiagnosticUI target={target} />
          </div>
        </div>
      </div>
    </section>
  );
}
