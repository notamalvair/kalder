import PageHeader from '../components/PageHeader';
import WebsiteCheck from '../components/WebsiteCheck';
import Checklist from '../components/Checklist';
import DiagnosticDetail from '../components/DiagnosticDetail';
import FinalCTA from '../components/FinalCTA';

export default function Analyse() {
  return (
    <>
      <PageHeader
        number="K/09"
        title="Analyse vor Angebot."
        subtitle="Bevor wir über Design, Relaunch oder Budgets sprechen, analysieren wir den bestehenden digitalen Auftritt. Wir suchen nach konkreten Schwachstellen."
      />
      <WebsiteCheck />
      <Checklist />
      <DiagnosticDetail />
      <FinalCTA />
    </>
  );
}
