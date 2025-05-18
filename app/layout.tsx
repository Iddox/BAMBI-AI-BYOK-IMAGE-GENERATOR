import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { DebugPanel } from '@/components/debug/DebugPanel'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bambi AI - Generate Images with Your Own API Keys',
  description: 'Bambi AI is a secure, flexible platform for generating high-quality AI images using your own API keys (BYOK). Compatible with OpenAI, Stability AI, Google, and more.',
  keywords: 'AI image generation, BYOK, OpenAI, DALL-E, Stable Diffusion, API keys, secure image generation',
}

// Script minimal pour éviter les erreurs d'hydratation
const fixHydrationScript = `
  (function() {
    try {
      // Empêcher les modifications automatiques du DOM par le navigateur
      document.documentElement.setAttribute('data-no-auto-format', 'true');
    } catch (e) {
      console.error('Hydration script error:', e);
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.className}`} translate="no" suppressHydrationWarning>
      <head>
        {/* Meta tag pour désactiver la détection automatique de format sur iOS */}
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        {/* Script pour forcer les attributs avant hydratation */}
        <script dangerouslySetInnerHTML={{ __html: fixHydrationScript }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div suppressHydrationWarning>
            {children}
          </div>
          {/* Panneau de débogage - visible uniquement en mode développement */}
          {process.env.NODE_ENV === 'development' && (
            <div suppressHydrationWarning>
              <DebugPanel />
            </div>
          )}
        </Providers>
      </body>
    </html>
  )
}
