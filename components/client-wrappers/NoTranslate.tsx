'use client';

import React from 'react';

interface NoTranslateProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Composant qui empêche la traduction automatique du contenu par les navigateurs
 * Utile pour les noms de marque, les termes techniques, etc.
 */
export default function NoTranslate({ children, className = '' }: NoTranslateProps) {
  return (
    <span className={`notranslate ${className}`} translate="no">
      {children}
    </span>
  );
}
