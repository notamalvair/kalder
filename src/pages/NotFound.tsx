import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader
        number="404"
        title="Seite nicht gefunden"
        subtitle="Diese Adresse existiert nicht oder die Seite wurde verschoben. Hier geht es weiter."
      />
      <section aria-label="Weiterführende Links" className="py-12 md:py-20 bg-ivory">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16 flex flex-wrap gap-4">
          <Link to="/" className="px-7 py-3.5 bg-graphite text-ivory text-sm hover:bg-charcoal transition-colors">
            Zur Startseite
          </Link>
          <Link to="/analyse" className="px-7 py-3.5 border border-border text-graphite text-sm hover:border-accent transition-colors">
            Website analysieren lassen
          </Link>
        </div>
      </section>
    </>
  );
}
