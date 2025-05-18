"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircleIcon, RefreshCwIcon, HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Composant de gestion des erreurs de chargement de chunks
 * Affiche un message d'erreur convivial et propose des solutions
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour afficher le fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidMount(): void {
    // Ajouter un gestionnaire d'erreur global pour les erreurs de chargement de chunks
    window.addEventListener('error', (event) => {
      if (
        event.message.includes("ChunkLoadError") ||
        event.message.includes("Loading chunk") ||
        event.message.includes("failed to load chunk") ||
        event.message.includes("Cannot read properties of undefined") ||
        event.error?.toString().includes("ChunkLoadError")
      ) {
        console.error('Erreur de chargement de chunk détectée:', event);
        this.setState({
          hasError: true,
          error: event.error || new Error(event.message),
          errorInfo: { componentStack: event.filename || '' } as ErrorInfo
        });

        // Empêcher la propagation de l'erreur
        event.preventDefault();
      }
    });
  }

  componentWillUnmount(): void {
    // Supprimer le gestionnaire d'erreur global
    window.removeEventListener('error', () => {});
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Enregistrer l'erreur pour le débogage
    console.error("ChunkErrorBoundary a capturé une erreur:", error, errorInfo);
    this.setState({
      errorInfo,
    });
  }

  // Fonction pour recharger la page
  handleReload = (): void => {
    window.location.reload();
  };

  // Fonction pour retourner à l'accueil
  handleGoHome = (): void => {
    window.location.href = "/";
  };

  // Fonction pour effacer le cache local
  handleClearCache = (): void => {
    // Effacer le cache de l'application
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Effacer le localStorage
    localStorage.clear();

    // Recharger la page
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Vérifier si l'erreur est liée au chargement de chunks
      const isChunkError =
        this.state.error?.message.includes("ChunkLoadError") ||
        this.state.error?.message.includes("Loading chunk") ||
        this.state.error?.message.includes("failed to load chunk") ||
        this.state.error?.message.includes("Cannot read properties of undefined") ||
        this.state.error?.message.includes("call") ||
        this.state.error?.toString().includes("ChunkLoadError");

      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Afficher un message d'erreur convivial
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertCircleIcon className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {isChunkError
              ? "Erreur de chargement de la page"
              : "Une erreur est survenue"}
          </h2>
          <p className="text-bambi-subtext mb-6 max-w-md">
            {isChunkError
              ? "Nous avons rencontré un problème lors du chargement de cette page. Cela peut être dû à une connexion instable ou à un problème temporaire."
              : "Une erreur inattendue s'est produite. Veuillez réessayer ou contacter le support si le problème persiste."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={this.handleReload}
              className="flex items-center justify-center"
            >
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Recharger la page
            </Button>

            {isChunkError && (
              <Button
                onClick={this.handleClearCache}
                variant="outline"
                className="flex items-center justify-center"
              >
                Effacer le cache et recharger
              </Button>
            )}

            <Button
              onClick={this.handleGoHome}
              variant="ghost"
              className="flex items-center justify-center"
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </div>

          {/* Afficher les détails de l'erreur en mode développement */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-800 text-white rounded-md text-left overflow-auto max-w-full w-full max-h-[300px]">
              <p className="font-mono text-sm mb-2">
                {this.state.error?.toString()}
              </p>
              <pre className="font-mono text-xs">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
