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
    setIsClient(true);
  }, []);

  // Utiliser suppressHydrationWarning pour éviter les erreurs d'hydratation
  return (
    <html lang={lang} className={className} translate={translate} suppressHydrationWarning>
      <body className={inter} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
