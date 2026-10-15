import Hero from '../components/Hero';
import WebsiteCheck from '../components/WebsiteCheck';
import ProblemSection from '../components/ProblemSection';
import ImageSection from '../components/ImageSection';
import ServicesPreview from '../components/ServicesPreview';
import ProjectPreview from '../components/ProjectPreview';
import ProcessPreview from '../components/ProcessPreview';
import WhyKalder from '../components/WhyKalder';
import FinalCTA from '../components/FinalCTA';

export default function Home() {
  return (
    <>
      <Hero />
      <WebsiteCheck />
      <ProblemSection />
      <ImageSection />
      <ServicesPreview />
      <ProjectPreview />
      <ProcessPreview />
      <WhyKalder />
      <FinalCTA />
    </>
  );
}
