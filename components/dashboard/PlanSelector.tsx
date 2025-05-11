"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon, RocketIcon, CreditCardIcon, SparklesIcon } from "lucide-react";

export function PlanSelector() {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("premium"); // Défaut sur premium pour encourager l'upgrade
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Simuler un utilisateur premium (à remplacer par un hook useSubscription)
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Effet pour les utilisateurs premium (animation visuelle)
  useEffect(() => {
    // Aucun effet spécial pour l'instant
    // Note: L'effet de confettis a été retiré car il nécessitait une dépendance supplémentaire
    if (isPremiumUser) {
      console.log("Utilisateur premium détecté");
    }
  }, [isPremiumUser]);

  const handleSelectPlan = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (selectedPlan === "free") {
        // Pour le plan gratuit, on redirige quand même vers le dashboard
        console.log("Selected free plan");
        window.location.href = "/generate";
      } else {
        // Logique pour sélectionner le plan premium (redirection vers Stripe)
        console.log("Selected premium plan");
        // Simuler un délai pour la démo
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Redirection vers Stripe Checkout (à implémenter)
        // window.location.href = "/api/create-checkout-session";

        // Pour la démo, on redirige directement vers le dashboard
        window.location.href = "/generate";
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Si l'utilisateur est déjà premium, afficher un message de bienvenue spécial
  if (isPremiumUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Bienvenue dans l'expérience Premium ✨</h1>
          <p className="text-bambi-subtext text-lg">
            Merci de soutenir Bambi AI ! Vous bénéficiez de toutes les fonctionnalités premium.
          </p>
        </div>

        <Card className="p-8 border-2 border-bambi-accent bg-gradient-to-br from-bambi-card to-bambi-card/50 shadow-[0_0_25px_rgba(123,92,250,0.3)]">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-bambi-accent/20 flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-bambi-accent" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-6">Plan Créateur</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-medium mb-3">Vos avantages Premium</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Générations d'images illimitées</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Configurations de clés API illimitées</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Accès à tous les modèles et fonctionnalités avancées</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Support et Assistance</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Support prioritaire</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Accès aux futures fonctionnalités en avant-première</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Communauté exclusive de créateurs</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Button
              className="btn-primary text-lg py-3 px-8"
              onClick={() => window.location.href = "/generate"}
            >
              <span className="flex items-center">
                <RocketIcon className="mr-2 h-4 w-4" />
                Commencer à créer
              </span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Affichage pour les utilisateurs non premium
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2 text-red-500">NOUVELLE VERSION - Choisissez votre plan Bambi AI</h1>
      <p className="text-bambi-subtext text-center mb-8">Débloquez tout le potentiel de Bambi AI avec notre plan Premium</p>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Plan Gratuit */}
        <Card
          className={`p-6 border-2 transition-all relative ${
            selectedPlan === "free"
              ? "border-bambi-accent shadow-[0_0_15px_rgba(123,92,250,0.3)]"
              : "border-bambi-border hover:border-bambi-accent/50 opacity-75"
          }`}
          onClick={() => setSelectedPlan("free")}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">Plan Découverte</h2>
              <p className="text-2xl font-bold mt-2">Gratuit</p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              selectedPlan === "free"
                ? "bg-bambi-accent"
                : "border border-bambi-border"
            }`}>
              {selectedPlan === "free" && <CheckIcon className="h-4 w-4 text-white" />}
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>50 générations d'images / mois</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>1 configuration de clé API</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Accès aux fonctionnalités de base</span>
            </li>
          </ul>
        </Card>

        {/* Plan Premium */}
        <Card
          className={`p-6 border-4 transition-all relative bg-gradient-to-br from-bambi-card to-bambi-card/70 ${
            selectedPlan === "premium"
              ? "border-bambi-accent shadow-[0_0_30px_rgba(123,92,250,0.5)]"
              : "border-bambi-accent/50 hover:border-bambi-accent"
          }`}
          onClick={() => setSelectedPlan("premium")}
        >
          {/* Badge "Recommandé" */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-bambi-accent text-xs font-bold text-white py-1.5 px-4 rounded-full shadow-lg">
            RECOMMANDÉ
          </div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">Plan Créateur</h2>
              <p className="text-2xl font-bold mt-2 text-bambi-accent">5€ / mois</p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              selectedPlan === "premium"
                ? "bg-bambi-accent"
                : "border border-bambi-border"
            }`}>
              {selectedPlan === "premium" && <CheckIcon className="h-4 w-4 text-white" />}
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="font-medium">Générations d'images illimitées</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="font-medium">Configurations de clés API illimitées</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="font-medium">Accès à tous les modèles et fonctionnalités avancées</span>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="font-medium">Support prioritaire</span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button
          className="btn-primary text-lg py-4 px-10 rounded-full"
          onClick={handleSelectPlan}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="h-4 w-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              Chargement...
            </span>
          ) : selectedPlan === "free" ? (
            <span className="flex items-center">
              Commencer avec le plan Découverte
            </span>
          ) : (
            <span className="flex items-center">
              <CreditCardIcon className="mr-2 h-5 w-5" />
              Passer au plan Créateur
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
