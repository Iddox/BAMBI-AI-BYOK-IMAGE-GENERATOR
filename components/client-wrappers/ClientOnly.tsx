'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Composant qui s'assure que son contenu est rendu uniquement côté client
 * Utile pour éviter les erreurs d'hydratation avec les composants qui utilisent
 * des APIs uniquement disponibles côté client (window, document, etc.)
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return fallback;
  }

  return (
    <div suppressHydrationWarning>
      {children}
    </div>
  );
}
