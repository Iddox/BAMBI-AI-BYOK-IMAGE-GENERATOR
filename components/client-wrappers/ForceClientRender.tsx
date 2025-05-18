'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ForceClientRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Composant qui force le rendu côté client pour éviter les erreurs d'hydratation
 * Ce composant est plus radical que ClientOnly car il force un remontage complet
 * après l'hydratation, ce qui évite les erreurs d'hydratation mais peut causer
 * un flash de contenu.
 */
export default function ForceClientRender({ children, fallback = null }: ForceClientRenderProps) {
  const [mounted, setMounted] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Marquer comme monté après l'hydratation
    setMounted(true);
    
    // Forcer un remontage complet après l'hydratation
    const timeout = setTimeout(() => {
      setKey(prev => prev + 1);
    }, 0);
    
    return () => clearTimeout(timeout);
  }, []);

  if (!mounted) {
    return fallback;
  }

  return (
    <div key={key} suppressHydrationWarning>
      {children}
    </div>
  );
}
