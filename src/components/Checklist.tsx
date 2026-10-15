import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const checklist = [
  { number: '01', title: 'Website', description: 'Struktur, Navigation, Informationsarchitektur' },
  { number: '02', title: 'Technik', description: 'Ladezeit, Performance, technische Fehler' },
  { number: '03', title: 'Indexierung', description: 'Sichtbarkeit für Google und Suchmaschinen' },
  { number: '04', title: 'Conversion', description: 'Reservierung, Kontakt, Anfrage-Pfade' },
  { number: '05', title: 'Mobile', description: 'Nutzung auf Smartphones und Tablets' },
  { number: '06', title: 'Kontakt / Reservierung', description: 'Erreichbarkeit und Buchungswege' },
];

export default function Checklist() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-ivory-warm border-t border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-3xl"
        >
          <p className="label text-accent mb-6">CHECKLISTE / WAS WIR PRÜFEN</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
            Sechs Dimensionen.
          </h2>
          <p className="mt-6 text-base text-graphite-muted leading-relaxed">
            Wir analysieren Ihren digitalen Auftritt in sechs zentralen Bereichen.
          </p>
        </motion.div>

        {/* Editorial list layout */}
        <div className="space-y-0">
          {checklist.map((item, index) => (
            <motion.div
              key={item.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group border-t border-border py-6 md:py-7 grid grid-cols-12 gap-4 md:gap-8 items-center"
            >
              <div className="col-span-2 md:col-span-1">
                <span className="label text-accent">{item.number}</span>
              </div>
              <div className="col-span-4 md:col-span-3">
                <h3 className="display text-lg md:text-xl text-graphite">{item.title}</h3>
              </div>
              <div className="col-span-6 md:col-span-7">
                <p className="text-sm text-graphite-muted leading-relaxed">{item.description}</p>
              </div>
              <div className="col-span-12 md:col-span-1 md:text-right">
                <div className="w-6 h-px bg-border inline-block" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
