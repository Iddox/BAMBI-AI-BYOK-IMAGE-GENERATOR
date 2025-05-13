"use client";

/**
 * Utilitaires pour la gestion des modales et des redirections
 */

import React from "react";
import { useRouter } from "next/navigation";

/**
 * Ouvre une modale en ajoutant la classe modal-open au body
 */
export function openModal() {
  if (typeof document !== "undefined") {
    // Vérifier si la classe n'est pas déjà présente pour éviter les doublons
    if (!document.body.classList.contains("modal-open")) {
      document.body.classList.add("modal-open");
    }
  }
}

/**
 * Ferme une modale en supprimant la classe modal-open du body
 */
export function closeModal() {
  if (typeof document !== "undefined") {
    document.body.classList.remove("modal-open");
  }
}

/**
 * Nettoie les classes modales lors du démontage d'un composant
 * À utiliser dans un useEffect avec un tableau de dépendances vide
 */
export function cleanupModal() {
  return () => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("modal-open");
    }
  };
}

/**
 * Redirige vers une URL en utilisant le router Next.js
 * @param router Le router Next.js obtenu via useRouter()
 * @param url L'URL de destination
 */
export function navigateTo(router: ReturnType<typeof useRouter>, url: string) {
  if (router) {
    router.push(url);
  } else if (typeof window !== "undefined") {
    // Fallback si le router n'est pas disponible
    window.location.href = url;
  }
}

/**
 * Hook personnalisé pour gérer l'état d'une modale
 * @param initialState État initial de la modale (ouverte ou fermée)
 * @returns Un objet contenant l'état de la modale et des fonctions pour la manipuler
 */
export function useModalState(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState);
  const [isExiting, setIsExiting] = React.useState(false);

  // Ouvrir la modale
  const open = React.useCallback(() => {
    setIsOpen(true);
    openModal();
  }, []);

  // Fermer la modale avec animation
  const close = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsExiting(false);
      closeModal();
    }, 200); // Durée de l'animation de sortie
  }, []);

  // Nettoyer lors du démontage
  React.useEffect(() => {
    return cleanupModal();
  }, []);

  return {
    isOpen,
    isExiting,
    open,
    close
  };
}
