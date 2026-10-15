import PageHeader from '../components/PageHeader';
import Projects from '../components/Projects';
import ProjectDetail from '../components/ProjectDetail';
import FinalCTA from '../components/FinalCTA';

export default function Projekte() {
  return (
    <>
      <PageHeader
        number="K/10"
        title="Ausgewählte Konzepte."
        subtitle="Digitale Konzepte für Gastronomie, Hospitality und lokale Unternehmen."
      />
      <Projects />
      <ProjectDetail />
      <FinalCTA />
    </>
  );
}
