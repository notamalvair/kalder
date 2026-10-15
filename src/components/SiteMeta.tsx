import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const metaByPath: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'KALDER — Digital Studio für Websites, Performance & Conversion',
    description:
      'KALDER analysiert, gestaltet und entwickelt schnelle Websites für Gastronomie und lokale Unternehmen in DACH.',
  },
  '/analyse': {
    title: 'Website Analyse — KALDER Digital Studio',
    description:
      'KALDER prüft technische, mobile und conversion-relevante Schwachstellen, bevor über einen Relaunch gesprochen wird.',
  },
  '/leistungen': {
    title: 'Webdesign, Performance & Conversion — KALDER',
    description:
      'Websites, Relaunch, Reservierung, lokale Sichtbarkeit, Performance und technische Betreuung für lokale Unternehmen.',
  },
  '/projekte': {
    title: 'Konzepte & Projekte — KALDER Digital Studio',
    description:
      'Ausgewählte digitale Konzepte für Gastronomie, Hospitality und lokale Unternehmen.',
  },
  '/kontakt': {
    title: 'Kontakt — KALDER Digital Studio',
    description:
      'Website prüfen lassen oder ein digitales Projekt mit KALDER besprechen.',
  },
  '/impressum': {
    title: 'Impressum — KALDER Digital Studio',
    description: 'Rechtliche Angaben zu KALDER Digital Studio.',
  },
  '/datenschutz': {
    title: 'Datenschutz — KALDER Digital Studio',
    description: 'Datenschutzhinweise von KALDER Digital Studio.',
  },
};

export default function SiteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = metaByPath[pathname] ?? metaByPath['/'];
    document.title = meta.title;
    document.body.dataset.variant = 'B';

    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = meta.description;
  }, [pathname]);

  return null;
}
