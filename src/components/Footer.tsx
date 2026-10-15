import { Link } from 'react-router-dom';
import { siteConfig } from '../config/site';

export default function Footer() {
  const links = [
    { label: 'Leistungen', href: '/leistungen' },
    { label: 'Analyse', href: '/analyse' },
    { label: 'Projekte', href: '/projekte' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  return (
    <footer className="py-16 md:py-20 border-t border-border bg-ivory">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-14">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-baseline gap-3">
              <span className="font-display text-xl font-medium tracking-tight text-graphite">{siteConfig.brandName}</span>
              <span className="label text-graphite-muted">{siteConfig.descriptor}</span>
            </Link>
            <p className="text-sm text-graphite-muted mt-5 max-w-xs leading-relaxed">
              Analyse, Design und technische Umsetzung für Gastronomie und lokale Unternehmen.
            </p>
          </div>

          <div className="md:col-span-4">
            <nav className="grid grid-cols-2 gap-x-6 gap-y-3">
              {links.map((link) => (
                <Link key={link.label} to={link.href} className="text-[13px] text-graphite-muted hover:text-graphite transition-colors">
                  {link.label}
                </Link>
              ))}
              <Link to="/impressum" className="text-[13px] text-graphite-muted hover:text-graphite transition-colors">Impressum</Link>
              <Link to="/datenschutz" className="text-[13px] text-graphite-muted hover:text-graphite transition-colors">Datenschutz</Link>
            </nav>
          </div>

          <div className="md:col-span-4 md:text-right">
            <p className="label text-graphite-faint mb-3">DIREKT</p>
            <a href={`mailto:${siteConfig.email}`} className="text-[13px] text-graphite-muted hover:text-graphite transition-colors">
              {siteConfig.email}
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col lg:flex-row justify-between gap-4">
          <p className="text-xs text-graphite-faint">© {new Date().getFullYear()} {siteConfig.brandName} {siteConfig.descriptor}.</p>
          <p className="text-xs text-graphite-faint italic">Gebaut mit Kaffee, Code und einer gesunden Abneigung gegen langsame Websites.</p>
        </div>
      </div>
    </footer>
  );
}
