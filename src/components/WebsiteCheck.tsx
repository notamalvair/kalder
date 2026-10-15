import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { normalizeWebsite } from '../lib/validation';

type CheckState = 'default' | 'validating' | 'ready' | 'success';

export default function WebsiteCheck() {
  const ref = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [state, setState] = useState<CheckState>('default');
  const [error, setError] = useState('');

  const handleCheck = () => {
    trackEvent('website_check_started');
    setError('');
    setState('validating');

    window.setTimeout(() => {
      if (!normalizeWebsite(url)) {
        setError('Bitte geben Sie eine öffentliche Domain wie restaurant.de ein, ohne Zugangsdaten oder eigenen Port.');
        setState('default');
        inputRef.current?.focus();
        return;
      }
      setState('ready');
      trackEvent('website_check_ready');
    }, 260);
  };

  const continueToContact = () => {
    const normalized = normalizeWebsite(url);
    if (!normalized) { setState('default'); return; }
    setState('success');
    trackEvent('website_check_continue');
    window.setTimeout(() => {
      navigate(`/kontakt?website=${encodeURIComponent(normalized)}&source=website-check`);
    }, 180);
  };

  return (
    <section id="analyse" className="py-24 md:py-32 lg:py-40 bg-ivory-warm border-y border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-start">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <p className="label text-accent mb-6">K/02 — WEBSITE CHECK</p>
            <h2 className="display text-4xl md:text-5xl lg:text-[4rem] text-graphite mb-8 max-w-3xl">
              Keine Empfehlung ohne Diagnose.
            </h2>
            <p className="text-base text-graphite-muted leading-relaxed max-w-xl">
              Wir prüfen zuerst, wo Technik, Sichtbarkeit oder der Anfrageweg tatsächlich Reibung erzeugen. Erst danach sprechen wir über Umfang und Budget.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-px bg-border border border-border max-w-lg">
              <div className="bg-ivory-warm p-5">
                <p className="meta mb-2">CHECK</p>
                <p className="text-sm text-graphite">Technik · Mobile · Search</p>
              </div>
              <div className="bg-ivory-warm p-5">
                <p className="meta mb-2">OUTPUT</p>
                <p className="text-sm text-graphite">Konkreter nächster Schritt</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="lg:col-span-6 lg:col-start-7"
          >
            <div className="bg-bone border border-border p-7 md:p-9 relative">
              <div className="flex items-start justify-between gap-6 mb-10">
                <div>
                  <p className="label text-graphite-muted mb-2">ANALYSE ANFRAGEN</p>
                  <p className="text-sm text-graphite-muted">Starten Sie mit Ihrer Website.</p>
                </div>
                <span className="meta text-accent">KALDER / 01</span>
              </div>

              <label htmlFor="website-check" className="block text-sm font-medium text-graphite mb-3">
                Ihre Website
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <input
                  id="website-check"
                  ref={inputRef}
                  type="text"
                  inputMode="url"
                  maxLength={2048}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                    if (state !== 'default') setState('default');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheck();
                  }}
                  placeholder="restaurant.de"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'website-check-error' : 'website-check-note'}
                  className="min-w-0 px-4 py-3.5 border border-border text-sm text-graphite placeholder:text-graphite-muted/50 focus:outline-none focus:border-accent bg-ivory transition-colors"
                />
                {state === 'ready' ? (
                  <button
                    type="button"
                    onClick={continueToContact}
                    className="px-6 py-3.5 bg-accent text-ivory text-sm font-medium hover:bg-accent-deep transition-colors whitespace-nowrap"
                  >
                    Kontaktdaten ergänzen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={state === 'validating'}
                    className="px-6 py-3.5 bg-graphite text-ivory text-sm font-medium hover:bg-charcoal disabled:opacity-60 transition-colors whitespace-nowrap"
                  >
                    {state === 'validating' ? 'Prüfen…' : 'Analyse anfragen'}
                  </button>
                )}
              </div>

              {error ? (
                <p id="website-check-error" role="alert" className="mt-4 text-xs text-red-700">
                  {error}
                </p>
              ) : state === 'ready' ? (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="label text-accent mb-2">ANALYSE VORBEREITET</p>
                  <p className="text-sm text-graphite-muted">
                    Ergänzen Sie Ihre E-Mail-Adresse, um den technischen Website-Bericht anzufordern. Die Analyse startet nach dem Absenden.
                  </p>
                </div>
              ) : (
                <p id="website-check-note" className="mt-5 text-xs text-graphite-muted">
                  Unverbindlich. Keine fertige Verkaufsschablone. Keine automatische Relaunch-Empfehlung.
                </p>
              )}

              <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-accent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
