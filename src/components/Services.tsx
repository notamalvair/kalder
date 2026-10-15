import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const services = [
  {
    number: 'S/01',
    title: 'Websites & Relaunch',
    what: 'Digitale Auftritte, die Marke, Geschwindigkeit und Conversion zusammenbringen.',
    why: 'Eine Website ist der zentrale Punkt, an dem Vertrauen entsteht oder verloren geht.',
    when: 'Wenn der aktuelle Auftritt veraltet ist, nicht zur Marke passt oder keine Anfragen bringt.',
  },
  {
    number: 'S/02',
    title: 'Conversion & Reservierung',
    what: 'Weniger Reibung zwischen Interesse und Anfrage, Buchung oder Bestellung.',
    why: 'Jeder unnötige Schritt kostet Gäste. Conversion-Optimierung beginnt bei der UX.',
    when: 'Wenn Besucher die Website nutzen, aber nicht buchen, anrufen oder bestellen.',
  },
  {
    number: 'S/03',
    title: 'Lokale Sichtbarkeit',
    what: 'Technische Basis und lokale Sichtbarkeit für Google und relevante Suchanfragen.',
    why: 'Lokale Unternehmen werden lokal gesucht. Ohne Sichtbarkeit keine Anfragen.',
    when: 'Wenn die Website in lokalen Suchanfragen nicht gefunden wird.',
  },
  {
    number: 'S/04',
    title: 'Performance',
    what: 'Schnelle Ladezeiten, optimierte Assets und technische Stabilität.',
    why: 'Performance ist kein Feature, sondern Grundvoraussetzung. Jede Sekunde zählt.',
    when: 'Wenn die Website langsam ist, Fehler verursacht oder auf Mobile Probleme macht.',
  },
  {
    number: 'S/05',
    title: 'Technische Betreuung',
    what: 'Laufende Weiterentwicklung, Fehlerbehebung und Performance-Monitoring.',
    why: 'Eine Website ist nie fertig. Technik entwickelt sich, Anforderungen ändern sich.',
    when: 'Nach dem Launch, wenn die Website gepflegt und weiterentwickelt werden soll.',
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="leistungen" className="py-24 md:py-32 lg:py-40 bg-graphite text-ivory">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 max-w-3xl"
        >
          <p className="label text-accent-faint mb-6">LEISTUNGEN / WAS WIR VERBESSERN</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-ivory">
            Was wir verbessern.
          </h2>
        </motion.div>

        <div className="space-y-0">
          {services.map((service, index) => (
            <ServiceCard key={service.number} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="group border-t border-ivory/10 py-10 md:py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Number & Title */}
        <div className="lg:col-span-4">
          <p className="label text-accent-faint mb-3">{service.number}</p>
          <h3 className="display text-2xl md:text-3xl text-ivory group-hover:text-accent-faint transition-colors duration-300">
            {service.title}
          </h3>
        </div>

        {/* Details */}
        <div className="lg:col-span-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="label text-ivory/50 mb-2">WAS</p>
              <p className="text-sm text-ivory/80 leading-relaxed">{service.what}</p>
            </div>
            <div>
              <p className="label text-ivory/50 mb-2">WARUM</p>
              <p className="text-sm text-ivory/80 leading-relaxed">{service.why}</p>
            </div>
            <div>
              <p className="label text-ivory/50 mb-2">WANN</p>
              <p className="text-sm text-ivory/80 leading-relaxed">{service.when}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
