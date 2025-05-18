"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sparkles } from "@/components/ui/sparkles"
// Temporairement commenté pour résoudre l'erreur
// import { SparklesText } from "@/components/ui/sparkles-text"
import NoTranslate from "@/components/client-wrappers/NoTranslate"
import { OpenAIIcon, GoogleIcon, XAIIcon } from "@/components/icons/ai-providers"

const TrustedBy = () => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fournisseurs d'IA compatibles
  const aiProviders = [
    { id: "openai", name: 'OpenAI', model: 'DALL-E', Icon: OpenAIIcon },
    { id: "google", name: 'Google', model: 'Imagen', Icon: GoogleIcon },
    { id: "xai", name: 'xAI', model: 'Grok', Icon: XAIIcon },
  ];

  return (
    <section className="relative py-8 sm:py-10 border-y border-bambi-border overflow-hidden bg-bambi-background">
      {/* Effet de rayonnement subtil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,92,250,0.15),transparent_70%)] opacity-40" />

      {/* Étoiles discrètes en arrière-plan */}
      {mounted && (
        <Sparkles
          density={30}
          className="absolute inset-0 h-full w-full"
          color={theme === "dark" ? "#FFFFFF" : "#7B5CFA"}
          opacity={0.2}
          size={1}
        />
      )}

      <div className="container-landing relative z-10">
        <div className="text-center mb-8">
          {/* Temporairement désactivé pour résoudre l'erreur */}
          <h3 className="text-3xl font-bold mb-2 bg-button-gradient bg-clip-text text-transparent">
            Compatible avec les leaders de l'IA
          </h3>
          <p className="text-xl text-bambi-subtext">
            Utilisez vos clés API existantes avec vos fournisseurs préférés
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12 lg:gap-16 mb-8">
          {aiProviders.map((provider) => (
            <div
              key={provider.id}
              className="flex flex-col items-center justify-center p-2 sm:p-3"
            >
              <div className="h-14 sm:h-16 w-auto mb-1 sm:mb-2 relative flex items-center justify-center">
                {/* Logo officiel */}
                <provider.Icon
                  className={`w-auto h-full ${theme === 'dark' ? 'fill-white' : 'fill-bambi-text'} opacity-80 hover:opacity-100 hover:scale-110 hover:filter hover:brightness-110 transition-all duration-300 cursor-pointer`}
                  aria-label={`${provider.name} logo`}
                />
              </div>
              <div className="text-center">
                <span className="text-bambi-subtext text-xs sm:text-sm block mt-1 font-medium">
                  {provider.model}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Curved line at the bottom - version plus discrète */}
      <div className="absolute -bottom-16 left-0 right-0 w-full">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[200%] aspect-[1/0.5] rounded-[100%] border-t border-bambi-border/10 bg-bambi-background"></div>
      </div>

      {/* Effet de glow subtil au centre */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-bambi-accent/10 blur-3xl rounded-full"></div>
    </section>
  );
};

export default TrustedBy;
