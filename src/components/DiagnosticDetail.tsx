import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const findings = [
  {
    category: 'INDEXIERUNG',
    issue: 'Eine wichtige Seite ist durch die Robots-Anweisung von der Indexierung ausgeschlossen.',
    severity: 'HOCH',
  },
  {
    category: 'RESERVIERUNG',
    issue: 'Der Reservierungsweg enthält unnötige Schritte und verursacht Reibung.',
    severity: 'MITTEL',
  },
  {
    category: 'MOBILE',
    issue: 'Die Navigation überlagert Inhalte auf schmalen mobilen Ansichten.',
    severity: 'MITTEL',
  },
  {
    category: 'PERFORMANCE',
    issue: 'Zu große Bilddateien verzögern die erste sinnvolle Interaktion.',
    severity: 'HOCH',
  },
  {
    category: 'KONTAKT',
    issue: 'Die Telefonnummer ist auf Mobilgeräten nicht direkt anwählbar.',
    severity: 'NIEDRIG',
  },
];

export default function DiagnosticDetail() {
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
          className="mb-16 max-w-3xl"
        >
          <p className="label text-accent mb-6">BEISPIEL / DIAGNOSE</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
            Typische Befunde.
          </h2>
          <p className="mt-6 text-base text-graphite-muted leading-relaxed">
            Illustrative Beispiele für Schwachstellen, die wir häufig identifizieren.
          </p>
        </motion.div>

        <div className="space-y-0">
          {findings.map((finding, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="border-t border-border py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start"
            >
              <div className="md:col-span-3">
                <p className="label text-graphite">{finding.category}</p>
              </div>
              <div className="md:col-span-7">
                <p className="text-sm text-graphite-muted leading-relaxed">{finding.issue}</p>
              </div>
              <div className="md:col-span-2 md:text-right">
                <span className={`label ${
                  finding.severity === 'HOCH' ? 'text-red-600' :
                  finding.severity === 'MITTEL' ? 'text-amber-600' :
                  'text-graphite-faint'
                }`}>
                  {finding.severity}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
