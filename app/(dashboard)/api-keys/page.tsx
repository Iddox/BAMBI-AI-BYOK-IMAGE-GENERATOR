"use client";

import { Suspense } from "react";
import { Loader2Icon } from "lucide-react";
import { ChunkErrorBoundary } from "@/components/ui/ChunkErrorBoundary";
import dynamic from 'next/dynamic';

// Import dynamique du composant ApiKeyManager
const ApiKeyManager = dynamic(
  () => import('@/components/dashboard/ApiKeyManager').then(mod => ({ default: mod.ApiKeyManager })),
  {
    ssr: false,
    loading: () => <LoadingComponent />
  }
);

// Composant de chargement réutilisable
const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-2">
      <Loader2Icon className="h-8 w-8 animate-spin text-bambi-accent" />
      <p className="text-bambi-subtext">Chargement de la gestion des clés API...</p>
    </div>
  </div>
);

export default function ApiKeysPage() {
  return (
    <ChunkErrorBoundary>
      {/* Utiliser key pour forcer un remontage complet et éviter les erreurs d'hydratation */}
      <Suspense fallback={<LoadingComponent />} key="api-key-manager-suspense">
        <div suppressHydrationWarning>
          <ApiKeyManager />
        </div>
      </Suspense>
    </ChunkErrorBoundary>
  );
}
