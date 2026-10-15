import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const problems = [
  {
    number: 'K/02',
    title: 'Nicht gefunden',
    description: 'Wichtige Seiten können falsch indexiert oder für Suchmaschinen unsichtbar sein.',
  },
  {
    number: 'K/03',
    title: 'Nicht gebucht',
    description: 'Reservierung, Kontakt oder Anfrage erzeugen unnötige Reibung.',
  },
  {
    number: 'K/04',
    title: 'Nicht genutzt',
    description: 'Mobile Probleme machen aus Interesse einen Abbruch.',
  },
  {
    number: 'K/05',
    title: 'Nicht vertraut',
    description: 'Langsame, veraltete oder fehlerhafte Seiten kosten Vertrauen.',
  },
];

export default function ProblemSection() {
  const headingRef = useRef(null);
  const isHeadingInView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 border-t border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isHeadingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-20"
        >
          <p className="label text-accent mb-6">PROBLEM / DIAGNOSE</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
            Ein guter Betrieb kann online trotzdem Gäste verlieren.
          </h2>
          <p className="mt-8 text-base text-graphite-muted leading-relaxed max-w-2xl">
            Viele digitale Probleme bleiben unbemerkt, weil die Website auf den ersten Blick funktioniert.
          </p>
        </motion.div>

        {/* Editorial list layout instead of cards */}
        <div className="space-y-0">
          {problems.map((problem, index) => (
            <ProblemRow key={problem.number} problem={problem} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemRow({ problem, index }: { problem: typeof problems[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="group border-t border-border py-8 md:py-10 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline"
    >
      <div className="md:col-span-1">
        <span className="label text-accent">
          {problem.number}
        </span>
      </div>
      <div className="md:col-span-4">
        <h3 className="display text-2xl md:text-3xl text-graphite group-hover:text-accent transition-colors duration-300">
          {problem.title}
        </h3>
      </div>
      <div className="md:col-span-6 md:col-start-7">
        <p className="text-sm text-graphite-muted leading-relaxed">
          {problem.description}
        </p>
      </div>
      <div className="md:col-span-1 md:text-right">
        <div className="w-6 h-px bg-border group-hover:bg-accent group-hover:w-10 transition-all duration-300 inline-block" />
      </div>
    </motion.div>
  );
}
