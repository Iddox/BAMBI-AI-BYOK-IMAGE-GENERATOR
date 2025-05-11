"use client";

import { Suspense } from "react";
import { Loader2Icon } from "lucide-react";
import { ChunkErrorBoundary } from "@/components/ui/ChunkErrorBoundary";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";

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
      <Suspense fallback={<LoadingComponent />}>
        <ApiKeyManager />
      </Suspense>
    </ChunkErrorBoundary>
  );
}
