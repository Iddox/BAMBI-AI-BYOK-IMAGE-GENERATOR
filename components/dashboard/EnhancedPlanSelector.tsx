"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon, RocketIcon, CreditCardIcon, SparklesIcon, XIcon } from "lucide-react";

export function EnhancedPlanSelector() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Simuler un utilisateur premium (à remplacer par un hook useSubscription)
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Effet pour les utilisateurs premium
  useEffect(() => {
    if (isPremiumUser) {
      console.log("Utilisateur premium détecté");
    }
  }, [isPremiumUser]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Logique pour sélectionner le plan premium (redirection vers Stripe)
      console.log("Upgrade to premium plan");

      // Appeler l'API pour créer une session de paiement Stripe
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      // Rediriger vers l'URL de paiement Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non trouvée dans la réponse');
      }
    } catch (err: any) {
      console.error('Erreur lors de la création de la session de paiement:', err);
      setError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Si l'utilisateur est déjà premium, afficher un message de bienvenue spécial
  if (isPremiumUser) {
    return (
      <div className="max-w-4xl mx-auto p-4">
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-2">Votre plan actuel : Gratuit</h1>
      <p className="text-bambi-subtext text-center mb-8">Débloquez tout le potentiel de Bambi AI avec notre plan Premium</p>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Plan Gratuit - Limitations actuelles */}
        <Card className="p-6 border-2 border-bambi-border bg-bambi-card/40">
          <h2 className="text-xl font-bold mb-4">Limitations actuelles</h2>

          <ul className="space-y-4 mb-6">
            <li className="flex items-start">
              <div className="min-w-[24px] flex-shrink-0 mt-0.5 mr-2">
                <XIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">Seulement 50 générations d'images / mois</p>
                <p className="text-sm text-bambi-subtext">Limitant pour les projets créatifs</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="min-w-[24px] flex-shrink-0 mt-0.5 mr-2">
                <XIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">1 seule configuration de clé API</p>
                <p className="text-sm text-bambi-subtext">Impossible d'utiliser plusieurs fournisseurs</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="min-w-[24px] flex-shrink-0 mt-0.5 mr-2">
                <XIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">Fonctionnalités avancées non disponibles</p>
                <p className="text-sm text-bambi-subtext">Accès limité aux outils de création</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Plan Premium */}
        <Card
          className="p-6 border-4 border-bambi-accent relative bg-gradient-to-br from-bambi-card to-bambi-card/70 shadow-[0_0_20px_rgba(123,92,250,0.3)]"
        >
          {/* Badge "Recommandé" */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-bambi-accent text-xs font-bold text-white py-1.5 px-4 rounded-full shadow-lg">
            RECOMMANDÉ
          </div>

          <h2 className="text-xl font-bold mb-2">Plan Créateur</h2>
          <p className="text-2xl font-bold mb-4 text-bambi-accent">5€ / mois</p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Générations d'images illimitées</p>
                <p className="text-sm text-bambi-subtext">Créez sans contraintes</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Configurations de clés API illimitées</p>
                <p className="text-sm text-bambi-subtext">Utilisez tous vos fournisseurs préférés</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Accès à tous les modèles et fonctionnalités</p>
                <p className="text-sm text-bambi-subtext">Exploitez tout le potentiel de l'IA</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Support prioritaire</p>
                <p className="text-sm text-bambi-subtext">Assistance rapide et personnalisée</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button
          className="btn-primary text-lg py-3 px-8 rounded-full"
          onClick={handleUpgrade}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="h-4 w-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              Chargement...
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
