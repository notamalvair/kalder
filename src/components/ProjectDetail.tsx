import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ProjectDetail() {
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
          className="max-w-3xl"
        >
          <p className="label text-accent mb-6">K/10 — KONZEPTARBEITEN</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite mb-8">
            Jedes Projekt beginnt mit der Analyse.
          </h2>
          <div className="space-y-6">
            <p className="text-base text-graphite-muted leading-relaxed">
              Die gezeigten Konzepte demonstrieren unseren Ansatz für Gastronomie, Hospitality und lokale Unternehmen.
            </p>
            <p className="text-base text-graphite-muted leading-relaxed">
              Wir empfehlen nicht automatisch einen Relaunch. Wenn es nichts Wesentliches zu verbessern gibt, sagen wir das auch.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
