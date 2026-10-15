import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-graphite text-ivory">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="label text-accent-faint mb-6">K/07 — NÄCHSTER SCHRITT</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-ivory mb-8">
            Lassen Sie uns zuerst Ihre Website ansehen.
          </h2>
          <p className="text-base text-ivory/60 leading-relaxed max-w-xl mb-10">
            Wenn es nichts Wesentliches zu verbessern gibt, sagen wir das auch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/analyse"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-ivory text-graphite text-sm font-medium tracking-wide hover:bg-ivory/90 transition-colors duration-300"
            >
              Website prüfen lassen
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-ivory/20 text-ivory text-sm font-medium tracking-wide hover:border-ivory/40 transition-colors duration-300"
            >
              Kontakt
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
