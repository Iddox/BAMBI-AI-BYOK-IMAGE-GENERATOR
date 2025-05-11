import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-20 bg-bambi-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-bambi-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-bambi-accentDark/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container-landing relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Prêt à libérer votre{' '}
            <span className="bg-button-gradient bg-clip-text text-transparent">
              créativité IA ?
            </span>
          </h2>
          <p className="text-bambi-subtext text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de créateurs qui utilisent Bambi AI pour donner vie à leur imagination avec une génération d'images sécurisée et flexible.
          </p>
          <Link
            href="/signup"
            className="bg-button-gradient text-white text-lg font-medium px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(123,92,250,0.5)] transition-shadow duration-300 inline-flex items-center gap-2"
          >
            Commencer gratuitement
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-bambi-subtext font-medium">
            Aucune carte de crédit requise
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
