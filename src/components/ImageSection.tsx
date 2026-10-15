import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ImageSection() {
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
          className="relative"
        >
          <div className="aspect-[16/9] md:aspect-[21/9] bg-ivory-deep overflow-hidden border border-border">
            <img
              src="/images/dining.webp"
              alt="Restaurant interior with warm natural light"
              className="w-full h-full object-cover saturate-[0.78] contrast-[1.04] brightness-[0.92] hover:scale-[1.01] transition-transform duration-700"
            />
          </div>
          
          {/* Overlay text */}
          <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
            <p className="label text-ivory mb-2">K/06 — DIGITALE PRÄSENZ</p>
            <p className="display text-2xl md:text-3xl text-ivory max-w-md">
              Websites, die Atmosphäre übersetzen.
            </p>
          </div>

          {/* Corner accents */}
          <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-ivory/40" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-ivory/40" />
        </motion.div>
      </div>
    </section>
  );
}
