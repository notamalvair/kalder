import { Link } from 'react-router-dom';

interface LegalPlaceholderProps {
  title: string;
  number: string;
}

export default function LegalPlaceholder({ title, number }: LegalPlaceholderProps) {
  return (
    <section className="min-h-[70vh] pt-32 md:pt-40 pb-24 border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="label text-accent mb-6">{number}</p>
          <h1 className="display text-4xl md:text-5xl text-graphite mb-8">{title}</h1>
          <div className="border-t border-border pt-8">
            <p className="text-base text-graphite-muted leading-relaxed max-w-2xl">
              Rechtliche Angaben werden vor Veröffentlichung mit den tatsächlichen Unternehmensdaten ergänzt.
            </p>
            <p className="text-sm text-graphite-faint mt-4">
              Diese Seite enthält bewusst keine erfundenen Unternehmens-, Adress- oder Registrierungsdaten.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex mt-10 text-sm text-accent hover:text-accent-deep transition-colors"
          >
            ← Zur Startseite
          </Link>
        </div>
      </div>
    </section>
  );
}
