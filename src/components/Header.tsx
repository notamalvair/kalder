import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Leistungen', href: '/leistungen' },
    { label: 'Analyse', href: '/analyse' },
    { label: 'Projekte', href: '/projekte' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-ivory/95 backdrop-blur-sm border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-baseline gap-3 group">
            <span className="font-display text-xl font-medium tracking-tight text-graphite">
              KALDER
            </span>
            <span className="label text-graphite-muted hidden sm:inline">
              Digital Studio
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`text-[13px] transition-colors duration-300 tracking-wide ${
                  isActive(link.href)
                    ? 'text-graphite'
                    : 'text-graphite-muted hover:text-graphite'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:block">
            <Link
              to="/analyse"
              className="inline-flex items-center px-5 py-2.5 bg-graphite text-ivory text-[12px] font-medium tracking-wider uppercase hover:bg-charcoal transition-colors duration-300"
            >
              Website prüfen
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menü"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            <span className={`w-5 h-[1px] bg-graphite transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
            <span className={`w-5 h-[1px] bg-graphite transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-[1px] bg-graphite transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id="mobile-navigation"
            className="lg:hidden bg-ivory border-b border-border overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-sm transition-colors ${
                    isActive(link.href) ? 'text-graphite' : 'text-graphite-muted hover:text-graphite'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/analyse"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-graphite text-ivory text-xs font-medium tracking-wider uppercase mt-2"
              >
                Website prüfen
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
