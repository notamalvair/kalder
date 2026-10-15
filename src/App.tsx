import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SiteMeta from './components/SiteMeta';
import Home from './pages/Home';
import Leistungen from './pages/Leistungen';
import Analyse from './pages/Analyse';
import Projekte from './pages/Projekte';
import Kontakt from './pages/Kontakt';
import LegalPlaceholder from './pages/LegalPlaceholder';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SiteMeta />
      <div className="min-h-screen bg-ivory">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leistungen" element={<Leistungen />} />
            <Route path="/analyse" element={<Analyse />} />
            <Route path="/projekte" element={<Projekte />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="/impressum" element={<LegalPlaceholder title="Impressum" number="LEGAL / 01" />} />
            <Route path="/datenschutz" element={<LegalPlaceholder title="Datenschutz" number="LEGAL / 02" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
