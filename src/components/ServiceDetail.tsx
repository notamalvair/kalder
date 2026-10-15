import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ServiceDetail() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-ivory border-t border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16"
        >
          <div className="lg:col-span-5">
            <p className="label text-accent mb-6">ANSATZ / METHODE</p>
            <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
              Kein Template-Fließband.
            </h2>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 space-y-8">
            <div className="border-t border-border pt-6">
              <p className="label text-graphite-muted mb-3">01 — PROBLEM VERSTEHEN</p>
              <p className="text-sm text-graphite-muted leading-relaxed">
                Wir beginnen nicht mit Design oder Technologie. Wir beginnen mit der Frage: Wo verliert Ihre Website Gäste, Anfragen oder Vertrauen?
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <p className="label text-graphite-muted mb-3">02 — PRIORISIEREN</p>
              <p className="text-sm text-graphite-muted leading-relaxed">
                Nicht alles muss gleichzeitig geändert werden. Wir identifizieren, was den größten Unterschied macht und was zuerst angegangen werden sollte.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <p className="label text-graphite-muted mb-3">03 — UMSETZEN</p>
              <p className="text-sm text-graphite-muted leading-relaxed">
                Design und Entwicklung mit Fokus auf Geschwindigkeit, Klarheit und Conversion. Keine überflüssigen Features, keine Buzzwords.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <p className="label text-graphite-muted mb-3">04 — BETREUEN</p>
              <p className="text-sm text-graphite-muted leading-relaxed">
                Nach dem Launch endet die Arbeit nicht. Auf Wunsch kümmern wir uns um technische Betreuung und Weiterentwicklung.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
