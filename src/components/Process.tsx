import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    number: 'P/01',
    title: 'Analyse',
    description: 'Wir prüfen den bestehenden Auftritt und identifizieren relevante Schwachstellen.',
  },
  {
    number: 'P/02',
    title: 'Konzept',
    description: 'Wir priorisieren, was tatsächlich verbessert werden sollte.',
  },
  {
    number: 'P/03',
    title: 'Umsetzung',
    description: 'Design und Entwicklung mit Fokus auf Geschwindigkeit, Klarheit und Conversion.',
  },
  {
    number: 'P/04',
    title: 'Betrieb',
    description: 'Nach dem Launch kümmern wir uns auf Wunsch um technische Betreuung und Weiterentwicklung.',
  },
];

export default function Process() {
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
          className="mb-20 max-w-3xl"
        >
          <p className="label text-accent mb-6">PROZESS / PRÄZISE STATT KOMPLIZIERT</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
            Präzise statt kompliziert.
          </h2>
        </motion.div>

        {/* Horizontal process steps */}
        <div className="border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="border-r border-border last:border-r-0 py-8 px-4 md:px-6"
              >
                <p className="label text-accent mb-4">{step.number}</p>
                <h3 className="display text-xl md:text-2xl text-graphite mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-graphite-muted leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
