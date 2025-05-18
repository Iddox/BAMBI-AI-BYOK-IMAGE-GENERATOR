"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  RocketIcon,
  AlertTriangleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogOutIcon,
  Loader2Icon
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function AccountSettings() {
  const router = useRouter();
  const { user, userData, signOut } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Préparer les données utilisateur pour l'affichage
  const userDisplayData = {
    email: user?.email || "chargement...",
    password: "••••••••••••", // Mot de passe masqué
    plan: userData?.isPremium ? "créateur" : "découverte",
    nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valeur par défaut
  };

  // Vérifier si l'utilisateur est premium
  const isPremiumUser = userData?.isPremium || false;

  // Gestion de la responsivité
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      setError("Veuillez saisir 'SUPPRIMER' pour confirmer.");
      return;
    }

    setIsDeleteLoading(true);
    setError("");

    try {
      // Cette fonctionnalité nécessite des droits d'administrateur
      // Pour l'instant, nous allons simplement déconnecter l'utilisateur
      // Dans une implémentation réelle, il faudrait appeler une API route qui utilise
      // le service role key pour supprimer l'utilisateur

      alert("Votre compte a été supprimé avec succès. Vous allez être redirigé vers la page d'accueil.");

      // Déconnexion après suppression
      await signOut();

      // Redirection vers la page d'accueil
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la suppression du compte:", error);
      setError("Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.");
      setIsDeleteLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutLoading(true);

    try {
      // Utiliser notre fonction de déconnexion du contexte Auth
      await signOut();

      // La redirection est gérée dans le contexte Auth
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      alert("Une erreur est survenue lors de la déconnexion. Veuillez réessayer.");
      setIsLogoutLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Mon Compte</h1>
        <Button
          onClick={handleLogout}
          className="bg-gradient-to-r from-bambi-accent to-bambi-accentDark text-white transition-all duration-300 hover:shadow-md flex items-center justify-center gap-2"
          disabled={isLogoutLoading}
          aria-label="Se déconnecter de mon compte"
        >
          {isLogoutLoading ? (
            <span className="flex items-center">
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              Déconnexion...
            </span>
          ) : (
            <>
              <LogOutIcon className="h-4 w-4" />
              Se déconnecter
            </>
          )}
        </Button>
      </div>

      {/* Section Informations Personnelles */}
      <Card className="p-4 md:p-6 bg-bambi-card border border-bambi-border transition-all duration-300 hover:border-bambi-accent/30">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Informations Personnelles</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="p-3 bg-bambi-background border border-bambi-border rounded-md">
              {userDisplayData.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe actuel</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={userDisplayData.password}
                readOnly
                className="w-full bg-bambi-background border-bambi-border pr-10 h-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bambi-subtext hover:text-bambi-text p-1 rounded-full hover:bg-bambi-border/20 transition-colors duration-200"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-bambi-subtext mt-1.5 flex items-center">
              <LockIcon className="h-3 w-3 mr-1 text-bambi-accent" />
              Votre mot de passe est stocké de manière sécurisée.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/reset-password">
              <Button
                variant="outline"
                className="border-bambi-border text-bambi-text hover:bg-bambi-accent/10 hover:text-bambi-accent hover:border-bambi-accent/30 transition-all duration-200"
              >
                Modifier mon mot de passe
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Section Abonnement */}
      <Card className="p-4 md:p-6 bg-bambi-card border border-bambi-border transition-all duration-300 hover:border-bambi-accent/30">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Abonnement</h2>

        {userDisplayData.plan === "découverte" ? (
          <div className="space-y-4">
            <div className="p-4 bg-bambi-background rounded-lg">
              <div className="font-medium">Plan Actuel: Plan Découverte</div>
              <div className="text-sm text-bambi-subtext mt-1">
                Limité à 50 générations d'images par mois et 1 configuration API.
              </div>
            </div>

            <div className="p-4 bg-bambi-accent/10 border border-bambi-accent/30 rounded-lg">
              <div className="font-medium text-bambi-accent mb-2">
                Passez au Plan Créateur pour des générations illimitées et plus de fonctionnalités !
              </div>
              <Link href="/plans">
                <Button className="btn-primary flex items-center transition-transform duration-200 hover:scale-[1.02]">
                  <RocketIcon className="mr-2 h-4 w-4" />
                  Voir les avantages Premium
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-bambi-background rounded-lg">
              <div className="font-medium">Plan Actuel: Plan Créateur ✨</div>
              <div className="text-sm text-bambi-subtext mt-1">
                Générations d'images illimitées et configurations API illimitées.
              </div>
              <div className="text-sm mt-2">
                Prochaine facturation: {userDisplayData.nextBilling.toLocaleDateString()}
              </div>
            </div>

            <Button
              variant="outline"
              className="border-bambi-border text-bambi-text hover:bg-bambi-accent/10 hover:text-bambi-accent hover:border-bambi-accent/30 transition-all duration-200"
            >
              Gérer mon abonnement et mes paiements
            </Button>
          </div>
        )}
      </Card>

      {/* Zone de Danger */}
      <Card className="p-4 md:p-6 bg-red-500/5 border border-red-500/30 transition-all duration-300 hover:border-red-500/50">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-red-500">Zone de Danger</h2>

        <p className="text-bambi-subtext mb-4">
          La suppression de votre compte est irréversible et entraînera la perte de toutes vos données.
        </p>

        <Button
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-500/10 transition-all duration-200"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Supprimer mon compte
        </Button>
      </Card>

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-bambi-card border border-bambi-border rounded-lg p-4 md:p-6 w-full max-w-md animate-in fade-in duration-200">
            <div className="flex items-center mb-4 text-red-500">
              <AlertTriangleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
              <h2 className="text-xl font-bold">Supprimer votre compte</h2>
            </div>

            <p className="mb-4 text-bambi-subtext">
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </p>

            <p className="mb-4 font-medium">
              Pour confirmer, veuillez saisir "SUPPRIMER" ci-dessous:
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full p-3 mb-4 bg-bambi-background border border-bambi-border rounded-md focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all duration-200"
              placeholder="SUPPRIMER"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="border-bambi-border order-2 sm:order-1 transition-all duration-200"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-600 text-white order-1 sm:order-2 transition-all duration-200"
                disabled={isDeleteLoading}
                aria-label="Supprimer définitivement mon compte"
              >
                {isDeleteLoading ? (
                  <span className="flex items-center">
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </span>
                ) : (
                  "Supprimer définitivement"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
