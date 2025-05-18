"use client";

import { useState, useEffect } from "react";
import { Sidebar, MobileSidebar } from "@/components/dashboard/Sidebar";

// Interface pour les propriétés du composant
interface ClientSideComponentsProps {
  userData: {
    messagesCount?: number;
    messagesLimit?: number;
    createdImages?: number;
    isPremium?: boolean;
  } | null;
}

// Composant client séparé pour les parties qui doivent être rendues uniquement côté client
export default function ClientSideComponents({ userData }: ClientSideComponentsProps) {
  // État pour suivre si nous sommes côté client
  const [isMounted, setIsMounted] = useState(false);

  // Effet pour marquer que le composant est monté (côté client uniquement)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ne rien rendre côté serveur ou pendant l'hydratation
  if (!isMounted) {
    return null;
  }

  // Préparer les données utilisateur avec des valeurs par défaut cohérentes
  const messagesCount = userData?.messagesCount ?? 0;
  const messagesLimit = userData?.messagesLimit ?? 50;
  const createdImages = userData?.createdImages ?? 0;
  const isPremium = userData?.isPremium ?? false;

  return (
    <>
      {/* Sidebar - visible uniquement sur desktop */}
      <div className="hidden lg:block" suppressHydrationWarning>
        <Sidebar
          messagesCount={messagesCount}
          messagesLimit={messagesLimit}
          createdImages={createdImages}
          isPremium={isPremium}
        />
      </div>

      {/* Mobile Navigation - visible uniquement sur mobile */}
      <MobileSidebar
        messagesCount={messagesCount}
        messagesLimit={messagesLimit}
        createdImages={createdImages}
        isPremium={isPremium}
      />
    </>
  );
}
