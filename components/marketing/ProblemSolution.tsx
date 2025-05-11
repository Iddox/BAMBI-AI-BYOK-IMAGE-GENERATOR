'use client';

import { DollarSign, CreditCard, Terminal, Clock, Smile, Key, Code, Shield, Zap, Server, Lock } from 'lucide-react';
import Link from 'next/link';

const ProblemSolution = () => {
  // Points de douleur principaux
  const painPoints = [
    {
      icon: <DollarSign className="h-8 w-8 text-red-500" />,
      title: "Abonnement vs BYOK : le coup caché des intermédiaires",
      description: "Les plateformes vous vendent des forfaits > 50€/mois, alors que l'API OpenAI coûte 0,04$ par image et Google Gemini 0,03$.",
    },
    {
      icon: <Terminal className="h-8 w-8 text-red-500" />,
      title: "Complexité technique des intégrations DIY",
      description: "Pour chaque provider, il faut installer un SDK différent, passer par la ligne de commande et gérer les tokens.",
    },
    {
      icon: <Server className="h-8 w-8 text-red-500" />,
      title: "❌ Installation locale impossible",
      description: "Générer une image localement, c'est gérer des dépendances, des modèles lourds, et une machine puissante… pour un résultat lent, instable et frustrant.",
    },
    {
      icon: <Lock className="h-8 w-8 text-red-500" />,
      title: "Pas de garantie de confidentialité",
      description: "Vos prompts et images sont souvent stockés, indexés et parfois réutilisés par les plateformes intermédiaires.",
    }
  ];

  return (
    <section id="problem-solution" className="py-12 bg-gradient-to-b from-bambi-background to-bambi-card/10">
      <div className="container-landing">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            L'IA. Simple. Enfin.
          </h2>
          <p className="text-bambi-subtext text-lg max-w-3xl mx-auto">
            Voici pourquoi BAMBI AI, en tant que hub BYOK, fait sens face aux abonnements classiques et à la complexité des intégrations directes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 transform transition-all hover:scale-[1.02] hover:shadow-md"
            >
              <div className="mt-1 flex-shrink-0">
                {point.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{point.title}</h3>
                <p className="text-bambi-subtext text-sm">{point.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Solution Bambi AI */}
        <div className="bg-bambi-accent/10 border-2 border-bambi-accent/30 rounded-lg p-5 mb-8 transform transition-all hover:shadow-[0_0_15px_rgba(123,92,250,0.3)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-bambi-accent/20 p-2 rounded-full">
              <Smile className="h-8 w-8 text-bambi-accent" />
            </div>
            <h3 className="text-xl font-bold text-bambi-accent">Pourquoi choisir BAMBI AI maintenant ?</h3>
          </div>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-bambi-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-bambi-text"><strong>Économies réelles aux tarifs API de base</strong> - Payez seulement 0,03-0,04$ par image au lieu des abonnements gonflés</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-bambi-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-bambi-text"><strong>Simplicité d'utilisation</strong> - Interface visuelle et orchestrée, même pour un non-technique</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-bambi-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-bambi-text"><strong>Contrôle total de vos clés et budget</strong> - Gérez votre facturation directement chez OpenAI, Google ou xAI</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-bambi-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-bambi-text"><strong>Aucune indexation de vos prompts</strong> - Vos prompts et images ne transitent que chez votre provider</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/signup"
            className="bg-button-gradient text-white text-lg font-medium px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(123,92,250,0.5)] transition-shadow duration-300 inline-block"
          >
            Unifiez vos clés, générez en un clic
          </Link>
          <p className="mt-3 text-sm text-bambi-subtext">
            Sans abonnement aberrant ni configuration sans fin
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
