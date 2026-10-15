import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

export default function ProjectPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-ivory border-t border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="label text-accent mb-6">PROJEKT / KONZEPT</p>
              <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
                Konzeptarbeit.
              </h2>
            </div>
            <Link
              to="/projekte"
              className="hidden md:inline-flex items-center text-sm text-graphite-muted hover:text-graphite transition-colors duration-300"
            >
              Alle Konzepte →
            </Link>
          </div>

          {/* Featured Project */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <div className="aspect-[16/10] bg-ivory-deep overflow-hidden border border-border">
                <img
                  src="/images/restaurant.webp"
                  alt="Independent Restaurant concept"
                  className="w-full h-full object-cover saturate-[0.8] contrast-[1.03] hover:scale-[1.01] transition-transform duration-700"
                />
              </div>
            </div>

            <div className="lg:col-span-4 pb-4">
              <p className="label text-accent mb-4">C/01</p>
              <h3 className="display text-2xl md:text-3xl text-graphite mb-4">
                Independent Restaurant
              </h3>
              <p className="text-sm text-graphite-muted leading-relaxed mb-6">
                Digitale Präsenz, die Atmosphäre und Küche übersetzt.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="label text-graphite-muted border border-border px-3 py-1">Brand</span>
                <span className="label text-graphite-muted border border-border px-3 py-1">Web</span>
                <span className="label text-graphite-muted border border-border px-3 py-1">Reservierung</span>
              </div>
              <Link
                to="/projekte"
                className="inline-flex items-center text-sm text-accent hover:text-accent-deep transition-colors duration-300"
              >
                Konzept ansehen →
              </Link>
            </div>
          </div>

          <div className="mt-8 md:hidden">
            <Link
              to="/projekte"
              className="inline-flex items-center text-sm text-graphite-muted hover:text-graphite transition-colors duration-300"
            >
              Alle Konzepte →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
