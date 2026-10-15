import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const principles = [
  {
    number: 'W/01',
    title: 'Analyse vor Angebot',
    description: 'Wir empfehlen nicht automatisch einen Relaunch.',
  },
  {
    number: 'W/02',
    title: 'Performance ist Standard',
    description: 'Schnelle Websites sind kein Extra.',
  },
  {
    number: 'W/03',
    title: 'Ein Ansprechpartner',
    description: 'Direkte Kommunikation ohne unnötige Agentur-Ebenen.',
  },
  {
    number: 'W/04',
    title: 'Kein Template-Fließband',
    description: 'Jedes Projekt beginnt mit dem tatsächlichen Problem.',
  },
];

export default function WhyKalder() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="studio" className="py-24 md:py-32 lg:py-40 bg-ivory-warm border-t border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 max-w-3xl"
        >
          <p className="label text-accent mb-6">STUDIO / WARUM KALDER</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
            Weniger Show. Mehr Substanz.
          </h2>
        </motion.div>

        {/* Editorial list layout */}
        <div className="space-y-0">
          {principles.map((principle, index) => (
            <PrincipleRow key={principle.number} principle={principle} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PrincipleRow({ principle, index }: { principle: typeof principles[0]; index: number }) {
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
          {principle.number}
        </span>
      </div>
      <div className="md:col-span-4">
        <h3 className="display text-2xl md:text-3xl text-graphite group-hover:text-accent transition-colors duration-300">
          {principle.title}
        </h3>
      </div>
      <div className="md:col-span-6 md:col-start-7">
        <p className="text-sm text-graphite-muted leading-relaxed">
          {principle.description}
        </p>
      </div>
      <div className="md:col-span-1 md:text-right">
        <div className="w-6 h-px bg-border group-hover:bg-accent group-hover:w-10 transition-all duration-300 inline-block" />
      </div>
    </motion.div>
  );
}
