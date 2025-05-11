"use client"

import { Sparkles, Zap } from "lucide-react"
import { PricingSection } from "@/components/ui/pricing-section"

const bambiTiers = [
  {
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    description: "Parfait pour essayer Bambi AI",
    icon: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-bambi-border/30 to-bambi-border/30 blur-2xl rounded-full" />
        <Zap className="w-7 h-7 relative z-10 text-bambi-subtext animate-[float_3s_ease-in-out_infinite]" />
      </div>
    ),
    features: [
      {
        name: "50 générations par mois",
        description: "Idéal pour les projets occasionnels",
        included: true,
      },
      {
        name: "1 configuration API",
        description: "Utilisez votre fournisseur préféré",
        included: true,
      },
      {
        name: "Résolution standard",
        description: "Images en 1024x1024",
        included: true,
      },
      {
        name: "Historique de base",
        description: "Accédez à vos générations récentes",
        included: true,
      },
      {
        name: "Support communautaire",
        description: "Aide via notre forum communautaire",
        included: true,
      },
      {
        name: "Résolution HD",
        description: "Images en 4K et SVG",
        included: false,
      },
    ],
    ctaText: "Commencer gratuitement",
    ctaLink: "/signup",
  },
  {
    name: "Premium",
    price: {
      monthly: 5,
      yearly: 50,
    },
    description: "Pour les créateurs et professionnels",
    highlight: true,
    badge: "Le plus populaire",
    icon: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-bambi-accent/30 to-bambi-accent/30 blur-2xl rounded-full" />
        <Sparkles className="w-7 h-7 relative z-10 text-bambi-accent" />
      </div>
    ),
    features: [
      {
        name: "Générations illimitées",
        description: "Créez sans limites",
        included: true,
      },
      {
        name: "Configurations API illimitées",
        description: "Utilisez tous vos fournisseurs préférés",
        included: true,
      },
      {
        name: "Résolution HD",
        description: "Images en 4K et SVG",
        included: true,
      },
      {
        name: "Historique complet",
        description: "Avec organisation et filtres avancés",
        included: true,
      },
      {
        name: "Support prioritaire",
        description: "Assistance rapide et personnalisée",
        included: true,
      },
      {
        name: "Outils de prompt avancés",
        description: "Optimisez vos prompts pour de meilleurs résultats",
        included: true,
      },
    ],
    ctaText: "Passer au Premium",
    ctaLink: "/signup?plan=premium",
  },
]

function PricingSectionDemo() {
  return <PricingSection tiers={bambiTiers} />
}

export { PricingSectionDemo }
