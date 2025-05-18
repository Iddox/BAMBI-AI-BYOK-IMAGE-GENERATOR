"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ImageIcon,
  KeyIcon,
  UserIcon,
  HomeIcon,
  FolderIcon,
  RocketIcon,
  BeakerIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function Sidebar({
  messagesCount = 0,
  messagesLimit = 50,
  createdImages = 0,
  isPremium = false
}: {
  messagesCount?: number;
  messagesLimit?: number;
  createdImages?: number;
  isPremium?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  // Calculer le pourcentage d'utilisation pour la barre de progression
  // Utiliser useState et useEffect pour éviter les erreurs d'hydratation
  const [usagePercentage, setUsagePercentage] = useState(0);

  useEffect(() => {
    setUsagePercentage(Math.min(100, (messagesCount / messagesLimit) * 100));
  }, [messagesCount, messagesLimit]);

  return (
    <div className="h-screen w-24 bg-[#111111] border-r border-bambi-accent/30 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-bambi-accent">B</span>
        </div>
      </div>

      {/* Elegant separator */}
      <div className="w-full px-4 mb-2">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-bambi-accent to-transparent"></div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-6">
          <li className="flex flex-col items-center">
            <Link
              href="/generate"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors w-full ${
                isActive("/generate")
                  ? "bg-bambi-accent/20 text-bambi-accent"
                  : "text-bambi-subtext hover:bg-[#222222] hover:text-bambi-text"
              }`}
            >
              <div className="relative">
                <ImageIcon className="h-5 w-5 mx-auto" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-bambi-accent rounded-full"></span>
              </div>
              <span className="text-xs mt-1 text-center">Générer</span>
            </Link>
          </li>
          <li className="flex flex-col items-center">
            <Link
              href="/gallery"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors w-full ${
                isActive("/gallery")
                  ? "bg-bambi-accent/20 text-bambi-accent"
                  : "text-bambi-subtext hover:bg-[#222222] hover:text-bambi-text"
              }`}
            >
              <div className="relative">
                <FolderIcon className="h-5 w-5 mx-auto" />
                {createdImages > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-bambi-accent rounded-full flex items-center justify-center text-[10px] text-white">
                    {createdImages > 99 ? '99+' : createdImages}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 text-center">Créations</span>
            </Link>
          </li>
          <li className="flex flex-col items-center">
            <Link
              href="/api-keys"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors w-full ${
                isActive("/api-keys")
                  ? "bg-bambi-accent/20 text-bambi-accent"
                  : "text-bambi-subtext hover:bg-[#222222] hover:text-bambi-text"
              }`}
            >
              <KeyIcon className="h-5 w-5 mx-auto" />
              <span className="text-xs mt-1 text-center">Clés API</span>
            </Link>
          </li>
          <li className="flex flex-col items-center">
            <Link
              href="/xai-test"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors w-full ${
                isActive("/xai-test")
                  ? "bg-bambi-accent/20 text-bambi-accent"
                  : "text-bambi-subtext hover:bg-[#222222] hover:text-bambi-text"
              }`}
            >
              <BeakerIcon className="h-5 w-5 mx-auto" />
              <span className="text-xs mt-1 text-center">Test xAI</span>
            </Link>
          </li>
          <li className="flex flex-col items-center">
            <Link
              href="/openai-test"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors w-full ${
                isActive("/openai-test")
                  ? "bg-bambi-accent/20 text-bambi-accent"
                  : "text-bambi-subtext hover:bg-[#222222] hover:text-bambi-text"
              }`}
            >
              <BeakerIcon className="h-5 w-5 mx-auto" />
              <span className="text-xs mt-1 text-center">Test OpenAI</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Compteur de messages */}
      <div className="px-2 mt-auto">
        <div className="flex flex-col items-center bg-[#222222] px-2 py-2 rounded-md mb-2">
          <div className="flex items-center justify-center mb-1">
            <span className="text-xs text-bambi-accent font-medium">{messagesCount}</span>
            <span className="text-xs text-bambi-subtext mx-1">/</span>
            <span className="text-xs text-bambi-subtext">{messagesLimit}</span>
          </div>
          <div className="w-16 h-1.5 bg-[#333333] rounded-full overflow-hidden">
            <div
              className="h-full bg-bambi-accent rounded-full"
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Bouton Premium - uniquement pour les utilisateurs non premium */}
        {!isPremium && (
          <Link href="/plans" className="block mb-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-bambi-accent text-bambi-accent hover:bg-bambi-accent/10 text-xs"
            >
              <RocketIcon className="mr-1 h-3.5 w-3.5" />
              <span>Premium</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Elegant separator before user section */}
      <div className="w-full px-4 mb-2">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-bambi-accent to-transparent"></div>
      </div>

      {/* User Section */}
      <div className="p-2">
        <Link
          href="/account"
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            isActive("/account")
              ? "bg-bambi-accent/20 text-bambi-accent"
              : "text-bambi-subtext hover:bg-[#222222] hover:text-bambi-text"
          }`}
        >
          <div className="h-8 w-8 rounded-full bg-bambi-accent flex items-center justify-center text-white font-medium">
            A
          </div>
          <span className="text-xs mt-1 text-center">Compte</span>
        </Link>
      </div>
    </div>
  );
}

export function MobileSidebar({
  messagesCount = 0,
  messagesLimit = 50,
  createdImages = 0,
  isPremium = false
}: {
  messagesCount?: number;
  messagesLimit?: number;
  createdImages?: number;
  isPremium?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  // Calculer le pourcentage d'utilisation pour la barre de progression
  // Utiliser useState et useEffect pour éviter les erreurs d'hydratation
  const [usagePercentage, setUsagePercentage] = useState(0);

  useEffect(() => {
    setUsagePercentage(Math.min(100, (messagesCount / messagesLimit) * 100));
  }, [messagesCount, messagesLimit]);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-bambi-accent/30 z-30">


      {/* Elegant separator for mobile */}
      <div className="w-full px-4">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-bambi-accent to-transparent"></div>
      </div>
      {/* Compteur de messages et bouton premium */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-[#222222]">
        <div className="flex items-center bg-[#222222] px-2 py-1 rounded-md">
          <span className="text-xs text-bambi-accent font-medium">{messagesCount}</span>
          <span className="text-xs text-bambi-subtext mx-1">/</span>
          <span className="text-xs text-bambi-subtext">{messagesLimit}</span>
          <div className="ml-2 w-16 h-1.5 bg-[#333333] rounded-full overflow-hidden">
            <div
              className="h-full bg-bambi-accent rounded-full"
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>

        {!isPremium && (
          <Link href="/plans">
            <Button
              variant="outline"
              size="sm"
              className="border-bambi-accent text-bambi-accent hover:bg-bambi-accent/10"
            >
              <RocketIcon className="mr-1 h-3.5 w-3.5" />
              <span className="text-xs">Premium</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Navigation principale */}
      <div className="flex justify-around p-2">
        <Link href="/generate" className="p-2 flex flex-col items-center">
          <div className="relative">
            <ImageIcon className={`h-5 w-5 ${isActive("/generate") ? "text-bambi-accent" : "text-bambi-subtext"}`} />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-bambi-accent rounded-full"></span>
          </div>
          <span className={`text-xs mt-1 ${isActive("/generate") ? "text-bambi-accent" : "text-bambi-subtext"}`}>Générer</span>
        </Link>
        <Link href="/gallery" className="p-2 flex flex-col items-center">
          <div className="relative">
            <FolderIcon className={`h-5 w-5 ${isActive("/gallery") ? "text-bambi-accent" : "text-bambi-subtext"}`} />
            {createdImages > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-bambi-accent rounded-full flex items-center justify-center text-[10px] text-white">
                {createdImages > 99 ? '99+' : createdImages}
              </span>
            )}
          </div>
          <span className={`text-xs mt-1 ${isActive("/gallery") ? "text-bambi-accent" : "text-bambi-subtext"}`}>Créations</span>
        </Link>
        <Link href="/api-keys" className="p-2 flex flex-col items-center">
          <KeyIcon className={`h-5 w-5 ${isActive("/api-keys") ? "text-bambi-accent" : "text-bambi-subtext"}`} />
          <span className={`text-xs mt-1 ${isActive("/api-keys") ? "text-bambi-accent" : "text-bambi-subtext"}`}>Clés API</span>
        </Link>
        <Link href="/xai-test" className="p-2 flex flex-col items-center">
          <BeakerIcon className={`h-5 w-5 ${isActive("/xai-test") ? "text-bambi-accent" : "text-bambi-subtext"}`} />
          <span className={`text-xs mt-1 ${isActive("/xai-test") ? "text-bambi-accent" : "text-bambi-subtext"}`}>Test xAI</span>
        </Link>
        <Link href="/openai-test" className="p-2 flex flex-col items-center">
          <BeakerIcon className={`h-5 w-5 ${isActive("/openai-test") ? "text-bambi-accent" : "text-bambi-subtext"}`} />
          <span className={`text-xs mt-1 ${isActive("/openai-test") ? "text-bambi-accent" : "text-bambi-subtext"}`}>Test OpenAI</span>
        </Link>
        <Link href="/account" className="p-2 flex flex-col items-center">
          <div className="h-6 w-6 rounded-full bg-bambi-accent flex items-center justify-center text-white font-medium text-xs">
            A
          </div>
          <span className={`text-xs mt-1 ${isActive("/account") ? "text-bambi-accent" : "text-bambi-subtext"}`}>Compte</span>
        </Link>
      </div>
    </div>
  );
}
