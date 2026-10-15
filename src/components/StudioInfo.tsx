import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function StudioInfo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-graphite text-ivory">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16"
        >
          <div className="lg:col-span-5">
            <p className="label text-accent-faint mb-6">STUDIO / PHILOSOPHIE</p>
            <h2 className="display text-3xl md:text-4xl lg:text-5xl text-ivory">
              Kleine Struktur. Direkte Verantwortung.
            </h2>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 space-y-8">
            <div className="border-t border-ivory/10 pt-6">
              <p className="label text-ivory/50 mb-3">DIREKTE KOMMUNIKATION</p>
              <p className="text-sm text-ivory/80 leading-relaxed">
                Sie arbeiten direkt mit uns, nicht mit Account Managern oder Projekt Koordinatoren. Keine unnötigen Agentur-Ebenen.
              </p>
            </div>

            <div className="border-t border-ivory/10 pt-6">
              <p className="label text-ivory/50 mb-3">TECHNISCHE VERANTWORTUNG</p>
              <p className="text-sm text-ivory/80 leading-relaxed">
                Wir übernehmen Verantwortung für Design und Entwicklung. Analyse, Konzept und Umsetzung aus einer Hand.
              </p>
            </div>

            <div className="border-t border-ivory/10 pt-6">
              <p className="label text-ivory/50 mb-3">ANALYSE VOR EMPFEHLUNG</p>
              <p className="text-sm text-ivory/80 leading-relaxed">
                Wir empfehlen nicht automatisch einen Relaunch. Zuerst analysieren wir, was wirklich verbessert werden sollte.
              </p>
            </div>

            <div className="border-t border-ivory/10 pt-6">
              <p className="label text-ivory/50 mb-3">DESIGN UND ENTWICKLUNG ZUSAMMEN</p>
              <p className="text-sm text-ivory/80 leading-relaxed">
                Design und technische Umsetzung gehören zusammen. Wir trennen nicht künstlich, was zusammengehört.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
