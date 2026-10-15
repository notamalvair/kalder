import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StudioInfo from '../components/StudioInfo';
import { siteConfig } from '../config/site';
import ReportRequest from '../components/ReportRequest';


export default function Kontakt() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [searchParams] = useSearchParams();

  return (
    <>
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 bg-ivory border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <p className="label text-accent mb-6">K/11 — KONTAKT / STUDIO</p>
            <h1 className="display text-4xl md:text-5xl lg:text-[4rem] text-graphite mb-6">
              Erst die Website. Dann das Gespräch.
            </h1>
            <p className="text-base md:text-lg text-graphite-muted leading-relaxed max-w-2xl">
              Fordern Sie einen technischen Website-Bericht an. Für ein individuelles Projekt erreichen Sie uns direkt per E-Mail.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 lg:py-32 bg-ivory">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4"
            >
              <p className="label text-graphite-muted mb-3">DIREKT ERREICHEN</p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-lg text-graphite hover:text-accent transition-colors duration-300"
              >
                {siteConfig.email}
              </a>
              <p className="text-sm text-graphite-muted mt-3 max-w-xs">
                Direkter Kontakt, ohne Account-Management-Schicht.
              </p>

              <div className="border-t border-border mt-8 pt-8">
                <p className="label text-graphite-muted mb-4">NOCH KEIN PROJEKTBRIEFING?</p>
                <Link to="/analyse" className="text-sm text-accent hover:text-accent-deep transition-colors">
                  Mit Website-Analyse starten →
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="lg:col-span-7 lg:col-start-6"
            >
              <ReportRequest initialWebsite={searchParams.get('website') ?? ''} />
            </motion.div>
          </div>
        </div>
      </section>

      <StudioInfo />
    </>
  );
}
