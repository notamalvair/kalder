import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLElement>(null);
  const desktopRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); setMenuOpen(false); buttonRef.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const resize = () => {
      if (!desktop.matches) return;
      if (mobileRef.current?.contains(document.activeElement) || document.activeElement === buttonRef.current) {
        desktopRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
      }
      setMenuOpen(false);
    };
    desktop.addEventListener('change', resize);
    return () => desktop.removeEventListener('change', resize);
  }, []);

  const navLinks = [
    { label: 'Leistungen', href: '/leistungen' },
    { label: 'Analyse', href: '/analyse' },
    { label: 'Projekte', href: '/projekte' },
    { label: 'Kontakt', href: '/kontakt' },
  ];

  const isActive = (path: string) => (location.pathname.toLowerCase().replace(/\/+$/, '') || '/') === path;

  return (
    <header
      ref={headerRef}
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
          <nav ref={desktopRef} aria-label="Hauptnavigation" className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
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
            ref={buttonRef}
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col items-center justify-center gap-1.5 p-2 min-h-11 min-w-11"
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
        {menuOpen && (
          <motion.nav
            ref={mobileRef}
            aria-label="Mobile Navigation"
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== buttonRef.current) setMenuOpen(false);
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            id="mobile-navigation"
            className="lg:hidden bg-ivory border-b border-border max-h-[calc(100dvh-4rem)] md:max-h-[calc(100dvh-5rem)] overflow-y-auto"
          >
            <div className="px-6 py-8 flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
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
          </motion.nav>
        )}
    </header>
  );
}
