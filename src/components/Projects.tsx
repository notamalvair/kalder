import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const concepts = [
  {
    number: 'C/01',
    title: 'Independent Restaurant',
    tags: ['Brand', 'Web', 'Reservierung'],
    description: 'Digitale Präsenz, die Atmosphäre und Küche übersetzt.',
    image: '/images/restaurant.webp',
    layout: 'wide',
  },
  {
    number: 'C/02',
    title: 'Modern Café',
    tags: ['Digitale Präsenz', 'Lokale Sichtbarkeit'],
    description: 'Lokale Sichtbarkeit und klare Informationsarchitektur.',
    image: '/images/cafe.webp',
    layout: 'split',
  },
  {
    number: 'C/03',
    title: 'Local Service Business',
    tags: ['Web', 'Anfrage-Conversion'],
    description: 'Vertrauen und einfache Kontaktaufnahme im Fokus.',
    image: '/images/office.webp',
    layout: 'editorial',
  },
];

export default function Projects() {
  return (
    <section id="projekte" className="py-24 md:py-32 lg:py-40 bg-ivory border-t border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="mb-20 max-w-3xl">
          <p className="label text-accent mb-6">PROJEKTE / KONZEPTARBEITEN</p>
          <h2 className="display text-3xl md:text-4xl lg:text-5xl text-graphite">
            Ausgewählte Konzepte.
          </h2>
          <p className="mt-6 text-base text-graphite-muted leading-relaxed">
            Digitale Konzepte für Gastronomie, Hospitality und lokale Unternehmen.
          </p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {concepts.map((concept, index) => (
            <ConceptCard key={concept.number} concept={concept} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ConceptCard({ concept, index }: { concept: typeof concepts[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  // Three distinct layouts for variety
  if (concept.layout === 'wide') {
    return (
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end"
      >
        <div className="lg:col-span-8">
          <div className="aspect-[16/10] bg-ivory-deep overflow-hidden border border-border">
            <img
              src={concept.image}
              alt={concept.title}
              className="w-full h-full object-cover saturate-[0.8] contrast-[1.03] hover:scale-[1.01] transition-transform duration-700"
            />
          </div>
        </div>
        <div className="lg:col-span-4 pb-4">
          <p className="label text-accent mb-4">{concept.number}</p>
          <h3 className="display text-2xl md:text-3xl text-graphite mb-4">
            {concept.title}
          </h3>
          <p className="text-sm text-graphite-muted leading-relaxed mb-6">
            {concept.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {concept.tags.map((tag) => (
              <span key={tag} className="label text-graphite-muted border border-border px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.article>
    );
  }

  if (concept.layout === 'split') {
    return (
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
      >
        <div className="order-2 lg:order-1">
          <p className="label text-accent mb-4">{concept.number}</p>
          <h3 className="display text-2xl md:text-3xl text-graphite mb-4">
            {concept.title}
          </h3>
          <p className="text-sm text-graphite-muted leading-relaxed mb-6 max-w-sm">
            {concept.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {concept.tags.map((tag) => (
              <span key={tag} className="label text-graphite-muted border border-border px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="aspect-[4/5] bg-ivory-deep overflow-hidden border border-border">
            <img
              src={concept.image}
              alt={concept.title}
              className="w-full h-full object-cover saturate-[0.8] contrast-[1.03] hover:scale-[1.01] transition-transform duration-700"
            />
          </div>
        </div>
      </motion.article>
    );
  }

  // Editorial layout — narrow text column with large image
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
    >
      <div className="lg:col-span-4 lg:col-start-2 lg:pt-16">
        <p className="label text-accent mb-4">{concept.number}</p>
        <h3 className="display text-2xl md:text-3xl text-graphite mb-4">
          {concept.title}
        </h3>
        <p className="text-sm text-graphite-muted leading-relaxed mb-6">
          {concept.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {concept.tags.map((tag) => (
            <span key={tag} className="label text-graphite-muted border border-border px-3 py-1">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <div className="aspect-[3/4] bg-ivory-deep overflow-hidden border border-border">
          <img
            src={concept.image}
            alt={concept.title}
            className="w-full h-full object-cover saturate-[0.8] contrast-[1.03] hover:scale-[1.01] transition-transform duration-700"
          />
        </div>
      </div>
    </motion.article>
  );
}
