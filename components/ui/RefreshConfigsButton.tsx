"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { useApiConfig } from "@/contexts/ApiConfigContext";

interface RefreshConfigsButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onRefreshComplete?: () => void;
}

/**
 * Bouton pour rafraîchir les configurations API
 * Permet de forcer la synchronisation des configurations entre la page de génération et la page de gestion des profils API
 */
export function RefreshConfigsButton({
  variant = "outline",
  size = "sm",
  className = "",
  onRefreshComplete
}: RefreshConfigsButtonProps) {
  const { configs, syncPendingConfigs } = useApiConfig();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<"idle" | "success" | "error">("idle");

  // Fonction pour rafraîchir les configurations
  const refreshConfigs = async () => {
    setIsRefreshing(true);
    setRefreshStatus("idle");

    try {
      console.log("RefreshConfigsButton - Synchronisation des configurations en attente...");
      await syncPendingConfigs();
      
      console.log("RefreshConfigsButton - Synchronisation réussie");
      setRefreshStatus("success");
      
      // Appeler le callback si fourni
      if (onRefreshComplete) {
        onRefreshComplete();
      }
      
      // Réinitialiser le statut après 3 secondes
      setTimeout(() => {
        setRefreshStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("RefreshConfigsButton - Erreur lors de la synchronisation:", error);
      setRefreshStatus("error");
      
      // Réinitialiser le statut après 3 secondes
      setTimeout(() => {
        setRefreshStatus("idle");
      }, 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`relative ${className}`}
      onClick={refreshConfigs}
      disabled={isRefreshing}
      title="Rafraîchir les configurations API"
    >
      {isRefreshing ? (
        <RefreshCwIcon className="h-4 w-4 animate-spin" />
      ) : refreshStatus === "success" ? (
        <CheckCircleIcon className="h-4 w-4 text-green-500" />
      ) : refreshStatus === "error" ? (
        <XCircleIcon className="h-4 w-4 text-red-500" />
      ) : (
        <RefreshCwIcon className="h-4 w-4" />
      )}
      
      {size !== "icon" && (
        <span className="ml-2">
          {isRefreshing 
            ? "Synchronisation..." 
            : refreshStatus === "success" 
              ? "Synchronisé" 
              : refreshStatus === "error" 
                ? "Erreur" 
                : "Synchroniser"}
        </span>
      )}
      
      {configs.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-bambi-accent text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {configs.length}
        </span>
      )}
    </Button>
  );
}
