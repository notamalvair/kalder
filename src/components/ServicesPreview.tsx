import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

const services = [
  { number: 'S/01', title: 'Websites & Relaunch' },
  { number: 'S/02', title: 'Conversion & Reservierung' },
  { number: 'S/03', title: 'Lokale Sichtbarkeit' },
  { number: 'S/04', title: 'Performance' },
  { number: 'S/05', title: 'Technische Betreuung' },
];

export default function ServicesPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-ivory-warm border-t border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <p className="label text-accent mb-6">LEISTUNGEN / AUSZUG</p>
            <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
              Was wir verbessern.
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
              className="inline-flex items-center text-sm text-graphite-muted hover:text-graphite transition-colors duration-300"
            >
              Alle Leistungen →
            </Link>
          </motion.div>
        </div>

        <div className="space-y-0">
          {services.map((service, index) => (
            <motion.div
              key={service.number}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group border-t border-border py-6 md:py-7 grid grid-cols-12 gap-4 md:gap-8 items-center hover:bg-ivory transition-colors duration-300 px-4 -mx-4"
            >
              <div className="col-span-2 md:col-span-1">
                <span className="label text-graphite-faint">{service.number}</span>
              </div>
              <div className="col-span-8 md:col-span-9">
                <h3 className="display text-xl md:text-2xl text-graphite group-hover:text-accent transition-colors duration-300">
                  {service.title}
                </h3>
              </div>
              <div className="col-span-2 md:col-span-2 md:text-right">
                <div className="w-6 h-px bg-border group-hover:bg-accent group-hover:w-10 transition-all duration-300 inline-block" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
