import { motion, useInView } from 'framer-motion';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StudioInfo from '../components/StudioInfo';
import { siteConfig } from '../config/site';
import { trackEvent } from '../lib/analytics';

type FormState = 'default' | 'invalid' | 'ready' | 'submitting' | 'success';

export default function Kontakt() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = useState<FormState>('default');
  const [formData, setFormData] = useState({ website: '', name: '', email: '', message: '' });

  useEffect(() => {
    const website = searchParams.get('website');
    if (website) setFormData((current) => ({ ...current, website }));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formState !== 'default') setFormState('default');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    trackEvent('contact_submit_attempt');
    if (!formData.name.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setFormState('invalid');
      return;
    }
    setFormState('submitting');
    trackEvent('contact_valid', { hasWebsite: Boolean(formData.website.trim()) });
    window.setTimeout(() => setFormState('success'), 450);
  };

  return (
    <>
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 bg-ivory border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <p className="label text-accent mb-6">K/11 — KONTAKT / STUDIO</p>
            <h1 className="display text-4xl md:text-5xl lg:text-[4rem] text-graphite mb-6">
              Erst die Website. Dann das Gespräch.
            </h1>
            <p className="text-base md:text-lg text-graphite-muted leading-relaxed max-w-2xl">
              Schicken Sie uns den bestehenden Webauftritt oder beschreiben Sie kurz das Projekt. Sie erhalten eine persönliche Rückmeldung statt einer automatischen Verkaufsschablone.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 lg:py-32 bg-ivory">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4"
            >
              <p className="label text-graphite-muted mb-3">DIREKT ERREICHEN</p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-lg text-graphite hover:text-accent transition-colors duration-300"
              >
                {siteConfig.email}
              </a>
              <p className="text-sm text-graphite-muted mt-3 max-w-xs">
                Direkter Kontakt, ohne Account-Management-Schicht.
              </p>

              <div className="border-t border-border mt-8 pt-8">
                <p className="label text-graphite-muted mb-4">NOCH KEIN PROJEKTBRIEFING?</p>
                <Link to="/analyse" className="text-sm text-accent hover:text-accent-deep transition-colors">
                  Mit Website-Analyse starten →
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="lg:col-span-7 lg:col-start-6"
            >
              <form onSubmit={handleSubmit} noValidate className="bg-bone border border-border p-8 md:p-10">
                <div className="flex items-start justify-between gap-6 mb-8">
                  <p className="label text-graphite-muted">ANFRAGE</p>
                  <span className="meta text-accent">KALDER / CONTACT</span>
                </div>

                {formState === 'success' ? (
                  <div className="py-14 border-y border-border">
                    <p className="label text-accent mb-4">ANFRAGE VORBEREITET</p>
                    <h2 className="display text-3xl text-graphite mb-4">Die Eingaben sind vollständig.</h2>
                    <p className="text-sm text-graphite-muted max-w-xl">
                      Die technische Übermittlung wird vor dem Live-Launch an den finalen Mail-/CRM-Endpunkt angeschlossen. Im aktuellen Prototyp wird nichts stillschweigend versendet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-graphite mb-2">Website</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-border text-sm text-graphite placeholder:text-graphite-muted/50 focus:outline-none focus:border-accent bg-ivory"
                        placeholder="https://ihre-website.de"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-graphite mb-2">Name *</label>
                        <input
                          required
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          aria-invalid={formState === 'invalid' && !formData.name.trim()}
                          className="w-full px-4 py-3 border border-border text-sm text-graphite placeholder:text-graphite-muted/50 focus:outline-none focus:border-accent bg-ivory"
                          placeholder="Ihr Name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-graphite mb-2">E-Mail *</label>
                        <input
                          required
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          aria-invalid={formState === 'invalid' && !/^\S+@\S+\.\S+$/.test(formData.email)}
                          className="w-full px-4 py-3 border border-border text-sm text-graphite placeholder:text-graphite-muted/50 focus:outline-none focus:border-accent bg-ivory"
                          placeholder="ihre@email.de"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-graphite mb-2">Nachricht <span className="text-graphite-faint">(optional)</span></label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-4 py-3 border border-border text-sm text-graphite placeholder:text-graphite-muted/50 focus:outline-none focus:border-accent bg-ivory resize-none"
                        placeholder="Worum geht es?"
                      />
                    </div>

                    {formState === 'invalid' && (
                      <p role="alert" className="text-xs text-red-700">
                        Bitte ergänzen Sie mindestens Name und eine gültige E-Mail-Adresse.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={formState === 'submitting'}
                      className="w-full px-7 py-3.5 bg-graphite text-ivory text-sm font-medium tracking-wide hover:bg-charcoal disabled:opacity-60 transition-colors duration-300"
                    >
                      {formState === 'submitting' ? 'Wird vorbereitet…' : 'Anfrage vorbereiten'}
                    </button>
                    <p className="text-xs text-graphite-muted text-center">
                      Demo: Es werden keine Daten gesendet.
                    </p>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <StudioInfo />
    </>
  );
}
