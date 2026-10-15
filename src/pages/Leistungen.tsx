import PageHeader from '../components/PageHeader';
import Services from '../components/Services';
import ServiceDetail from '../components/ServiceDetail';
import Process from '../components/Process';
import FinalCTA from '../components/FinalCTA';

export default function Leistungen() {
  return (
    <>
      <PageHeader
        number="K/08"
        title="Was wir verbessern."
        subtitle="Wir konzentrieren uns auf das, was wirklich zählt: Geschwindigkeit, Klarheit und Conversion. Keine überflüssigen Features, keine Buzzwords."
      />
      <Services />
      <ServiceDetail />
      <Process />
      <FinalCTA />
    </>
  );
}
