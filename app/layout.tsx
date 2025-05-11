import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientHtml from '../components/ClientHtml'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bambi AI - Generate Images with Your Own API Keys',
  description: 'Bambi AI is a secure, flexible platform for generating high-quality AI images using your own API keys (BYOK). Compatible with OpenAI, Stability AI, Google, and more.',
  keywords: 'AI image generation, BYOK, OpenAI, DALL-E, Stable Diffusion, API keys, secure image generation',
}

// Cette fonction est utilisée pour forcer les attributs HTML côté client
// avant que React ne commence l'hydratation
const fixHydrationScript = `
  (function() {
    try {
      var html = document.documentElement;
      if (html) {
        html.setAttribute('lang', 'en');
        html.className = 'dark';
      }
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
    <ClientHtml lang="en" className="dark" translate="no" inter={inter.className}>
      {/* Script pour forcer les attributs avant hydratation */}
      <script dangerouslySetInnerHTML={{ __html: fixHydrationScript }} />
      <Providers>
        {children}
      </Providers>
    </ClientHtml>
  )
}
