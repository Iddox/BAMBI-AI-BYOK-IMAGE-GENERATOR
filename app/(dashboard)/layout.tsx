"use client";

import { ToastContainer } from "@/components/ui/ToastNotification";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logLoadingEvent, monitorStateChanges } from "@/utils/debug";
import ClientSideComponents from "@/components/dashboard/ClientSideComponents";
// Nous n'utilisons plus ForceClientRender

// Pas besoin d'importer de composant de correction d'hydratation

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {
    user,
    userData,
    isLoading
  } = useAuth();

  // Nous n'avons plus besoin de l'état loadingTimeout car nous avons supprimé l'écran de chargement

  // État pour suivre si l'utilisateur a déjà été authentifié
  const [hasBeenAuthenticated, setHasBeenAuthenticated] = useState(false);

  // Effet pour vérifier si l'utilisateur a déjà été authentifié (côté client uniquement)
  useEffect(() => {
    // Vérifier si l'utilisateur a déjà été authentifié (stocké dans localStorage)
    const storedValue = localStorage.getItem('hasBeenAuthenticated');
    if (storedValue === 'true') {
      setHasBeenAuthenticated(true);
    }

    // Forcer la disparition de l'écran de chargement après 3 secondes
    // même si isLoading est toujours true
    const forceHideLoadingTimeout = setTimeout(() => {
      setHasBeenAuthenticated(true);
    }, 3000);

    return () => {
      clearTimeout(forceHideLoadingTimeout);
    };
  }, []);

  // Mettre à jour l'état hasBeenAuthenticated lorsque l'utilisateur est authentifié
  useEffect(() => {
    if (user) {
      setHasBeenAuthenticated(true);
      localStorage.setItem('hasBeenAuthenticated', 'true');
    }
  }, [user]);

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;

    // Déboguer le problème de chargement infini
    logLoadingEvent('DashboardLayout', 'Auth State', { isLoading, hasUser: !!user, hasBeenAuthenticated });

    // Surveiller les changements d'état
    monitorStateChanges('DashboardLayout', { isLoading, hasUser: !!user, hasBeenAuthenticated });

    // Vérifier si nous sommes déjà sur la page de connexion pour éviter les redirections en boucle
    // Utiliser une variable pour stocker l'état, initialisée à false pour le rendu côté serveur
    let isLoginPage = false;

    // Vérifier côté client uniquement
    if (typeof window !== 'undefined') {
      isLoginPage = window.location.pathname.includes('/login');
    }

    if (!isLoading && !user && !isLoginPage) {
      logLoadingEvent('DashboardLayout', 'Redirecting to login page');
      // Ajouter un délai avant la redirection pour éviter une boucle infinie
      redirectTimeout = setTimeout(() => {
        router.push('/login');
      }, 100);
    }

    // Nous n'avons plus besoin de gérer les timeouts de chargement car nous avons supprimé l'écran de chargement

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [isLoading, user, router, hasBeenAuthenticated]);

  // Nous ne bloquons plus l'interface avec un écran de chargement complet
  // Les données utilisateur seront chargées en arrière-plan

  // Si l'utilisateur est en cours de chargement mais a déjà été authentifié,
  // on affiche directement le contenu sans écran de chargement

  // Nous n'avons plus besoin du composant LoadingTimer car nous avons supprimé l'écran de chargement complet

  // Nous n'utilisons plus ForceClientRender car il cause des problèmes
  // Nous utilisons directement un div avec suppressHydrationWarning
  return (
    <div className="flex h-screen bg-[#111111]" suppressHydrationWarning>
      {/* Indicateur de chargement discret en haut de la page */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-bambi-accent">
          <div className="h-full w-1/3 animate-pulse bg-bambi-accentDark"></div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-28 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6" suppressHydrationWarning>
          {children}
        </div>
      </div>

      {/* Composants côté client */}
      <ClientSideComponents
        userData={userData}
      />

      {/* Toast Notifications */}
      <ToastContainer position="top-right" />
    </div>
  );
}


