"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type TopNavbarProps = {
  showBackButton?: boolean;
  title?: string;
};

export function TopNavbar({
  showBackButton = true,
  title
}: TopNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Déterminer le titre en fonction du chemin si aucun titre n'est fourni
  const getTitle = () => {
    if (title) return title;

    if (pathname?.includes("/generate")) return "Bambi AI";
    if (pathname?.includes("/gallery")) return "Mes Créations";
    if (pathname?.includes("/canvas")) return "Canvas";
    if (pathname?.includes("/batch")) return "Batch";
    if (pathname?.includes("/api-keys")) return "Gestion des Clés API";
    if (pathname?.includes("/account")) return "Mon Compte";
    if (pathname?.includes("/home")) return "Accueil";

    return "Bambi AI";
  };

  return (
    <div className="h-16 border-b border-[#222222] flex items-center px-6">
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#222222] transition-colors mr-3"
          >
            <ChevronLeft className="h-5 w-5 text-bambi-subtext" />
          </button>
        )}
        <h1 className="text-lg font-medium text-bambi-text">{getTitle()}</h1>
      </div>
    </div>
  );
}
