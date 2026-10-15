import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

const steps = [
  { number: 'P/01', title: 'Analyse' },
  { number: 'P/02', title: 'Konzept' },
  { number: 'P/03', title: 'Umsetzung' },
  { number: 'P/04', title: 'Betrieb' },
];

export default function ProcessPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-graphite text-ivory">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <p className="label text-accent-faint mb-6">PROZESS / PRÄZISE STATT KOMPLIZIERT</p>
            <h2 className="display text-3xl md:text-4xl lg:text-5xl text-ivory">
              Präzise statt kompliziert.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-4 lg:col-start-9 flex items-end"
          >
            <Link
              to="/leistungen"
              className="inline-flex items-center text-sm text-ivory/60 hover:text-ivory transition-colors duration-300"
            >
              Mehr erfahren →
            </Link>
          </motion.div>
        </div>

        {/* Horizontal process steps */}
        <div className="border-t border-ivory/10">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="border-r border-ivory/10 last:border-r-0 py-8 px-4 md:px-6"
              >
                <p className="label text-accent-faint mb-4">{step.number}</p>
                <h3 className="display text-xl md:text-2xl text-ivory">
                  {step.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
