'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Qu'est-ce que Bambi AI ?",
      answer:
        "Bambi AI est une plateforme web qui vous permet de générer des images de haute qualité en utilisant vos propres clés API (BYOK - Bring Your Own Key). Notre interface simple et intuitive est compatible avec les principaux fournisseurs d'IA comme OpenAI, Google et XAI.",
    },
    {
      question: "Comment fonctionne le système BYOK (Bring Your Own Key) ?",
      answer:
        "Notre système BYOK vous permet d'utiliser vos propres clés API des fournisseurs supportés. Vos clés sont chiffrées avec un cryptage AES-256 et ne sont jamais exposées côté frontend. Toutes les requêtes API passent par notre proxy sécurisé pour garantir une sécurité maximale.",
    },
    {
      question: "Quels sont les avantages d'utiliser mes propres clés API ?",
      answer:
        "Utiliser vos propres clés API vous donne un contrôle total sur vos coûts, vous permet d'utiliser les crédits que vous avez déjà achetés, et vous offre la flexibilité de choisir le fournisseur et le modèle qui conviennent le mieux à vos besoins. Vous n'êtes pas limité à un seul service et pouvez facilement passer d'un fournisseur à l'autre.",
    },
    {
      question: "Y a-t-il un plan gratuit disponible ?",
      answer:
        "Oui ! Notre plan gratuit inclut 50 générations d'images par mois et vous permet de sauvegarder une configuration API. C'est parfait pour essayer le service ou pour une utilisation occasionnelle.",
    },
    {
      question: "Que comprend le plan Premium ?",
      answer:
        "Le plan Premium (5€/mois ou 50€/an avec 20% de réduction) inclut des générations d'images illimitées, des configurations API illimitées, des exports en haute résolution (4K, SVG), un historique complet avec des fonctionnalités d'organisation, un support prioritaire et des outils avancés pour optimiser vos prompts.",
    },
    {
      question: "Quels fournisseurs d'IA pour la génération d'images sont supportés ?",
      answer:
        "Nous supportons actuellement OpenAI (DALL·E), Google (Imagen) et XAI (Grok). Nous travaillons continuellement à l'amélioration de notre plateforme et pourrons ajouter le support pour d'autres fournisseurs à l'avenir selon les besoins de nos utilisateurs.",
    },
    {
      question: "Comment mes clés API sont-elles sécurisées ?",
      answer:
        "La sécurité est notre priorité absolue. Vos clés API sont chiffrées avec un cryptage AES-256 avant d'être stockées dans notre base de données. Toutes les requêtes API sont effectuées via notre proxy backend sécurisé, de sorte que vos clés ne sont jamais exposées côté client ou à des tiers.",
    },
    {
      question: "Comment puis-je commencer à utiliser Bambi AI ?",
      answer:
        "C'est simple ! Inscrivez-vous gratuitement, ajoutez votre clé API dans la section \"Clés API\", écrivez votre prompt dans l'interface principale et cliquez sur \"Générer\". Vous pouvez ensuite télécharger ou partager vos images générées en quelques secondes.",
    },
    {
      question: "Puis-je utiliser Bambi AI sur mobile ?",
      answer:
        "Absolument ! Bambi AI est entièrement responsive et fonctionne parfaitement sur tous les appareils, qu'il s'agisse d'un ordinateur de bureau, d'une tablette ou d'un smartphone.",
    },
    {
      question: "Comment puis-je obtenir de l'aide si j'ai des questions ?",
      answer:
        "Vous pouvez nous contacter à tout moment via notre formulaire de contact ou par email à support@bambi-ai.com. Les utilisateurs Premium bénéficient d'un support prioritaire avec des temps de réponse garantis.",
    },
  ];

  const toggleFaq = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <section id="faq" className="py-20 bg-bambi-card/30">
      <div className="container-landing">
        <div className="text-center mb-16">
          <h2 className="section-title">Vous avez des questions ? Nous avons des réponses</h2>
          <p className="section-subtitle">
            Tout ce que vous devez savoir sur Bambi AI
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="mb-4 border-b border-bambi-border pb-4 last:border-0"
            >
              <button
                className="flex justify-between items-center w-full text-left py-4"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="text-lg font-medium">{faq.question}</h3>
                <svg
                  className={`h-5 w-5 text-bambi-accent transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-bambi-subtext pb-4">{faq.answer}</p>
              </div>
            </div>
          ))}

          {/* CTA et bouton de contact */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">Prêt à essayer Bambi AI ?</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="btn-primary">
                Commencer gratuitement
              </Link>
              <Link href="/contact" className="btn-secondary flex items-center justify-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Nous contacter
              </Link>
            </div>
            <p className="mt-4 text-sm text-bambi-subtext">
              Aucune carte de crédit requise pour le plan gratuit
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
