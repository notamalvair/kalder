import { motion } from 'framer-motion';

interface PageHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
}

export default function PageHeader({ number, title, subtitle }: PageHeaderProps) {
  return (
    <section className="pt-32 md:pt-40 pb-16 md:pb-20 bg-ivory border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <p className="label text-accent mb-6">{number}</p>
          <h1 className="display text-3xl md:text-4xl lg:text-[3.5rem] text-graphite mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg text-graphite-muted leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
