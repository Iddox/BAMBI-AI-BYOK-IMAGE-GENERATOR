'use client';

import React, { useEffect, useState } from 'react';

interface ClientHtmlProps {
  children: React.ReactNode;
  lang: string;
  className: string;
  translate: "yes" | "no";
  inter: string;
}

export default function ClientHtml({ children, lang, className, translate, inter }: ClientHtmlProps) {
  // État pour suivre si nous sommes côté client
  const [isClient, setIsClient] = useState(false);

  // Effet pour marquer que nous sommes côté client après le montage
  useEffect(() => {
    // Définir isClient à true après le montage
    setIsClient(true);

    // S'assurer que les attributs HTML sont cohérents après l'hydratation
    const html = document.documentElement;
    if (html) {
      html.setAttribute('lang', lang);
      html.className = className;
      html.setAttribute('translate', translate);
    }

    // S'assurer que les attributs body sont cohérents après l'hydratation
    if (document.body) {
      document.body.className = inter;
    }
  }, [lang, className, translate, inter]);

  // Utiliser les attributs statiques pour le rendu initial côté serveur
  // et ajouter suppressHydrationWarning pour éviter les avertissements
  return (
    <html lang={lang} className={className} translate={translate} suppressHydrationWarning>
      <body className={inter} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
