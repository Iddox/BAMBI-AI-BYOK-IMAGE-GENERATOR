"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  ctaText: string
  ctaLink: string
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
}

function PricingSection({ tiers, className }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)

  const buttonStyles = {
    default: cn(
      "h-12 bg-bambi-card dark:bg-bambi-card",
      "hover:bg-bambi-card/80 dark:hover:bg-bambi-card/80",
      "text-bambi-text dark:text-bambi-text",
      "border border-bambi-border dark:border-bambi-border",
      "hover:border-bambi-accent/50 dark:hover:border-bambi-accent/50",
      "shadow-sm hover:shadow-md",
      "text-sm font-medium",
    ),
    highlight: cn(
      "h-12 bg-button-gradient",
      "hover:shadow-[0_0_15px_rgba(123,92,250,0.5)]",
      "text-white",
      "shadow-[0_1px_15px_rgba(0,0,0,0.1)]",
      "hover:shadow-[0_1px_20px_rgba(0,0,0,0.15)]",
      "font-semibold text-base",
    ),
  }

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-bambi-accent text-white",
    "border-none shadow-lg",
  )

  return (
    <section
      id="pricing"
      className={cn(
        "relative bg-bambi-background text-bambi-text",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-12">
          <h2 className="text-3xl font-bold text-bambi-text dark:text-bambi-text">
            Une tarification simple - 20% de réduction sur l'abonnement annuel
          </h2>
          <div className="inline-flex items-center p-1.5 bg-bambi-card dark:bg-bambi-card rounded-full border border-bambi-border dark:border-bambi-border shadow-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                !isYearly
                  ? "bg-bambi-accent text-white shadow-lg"
                  : "text-bambi-subtext hover:text-bambi-text",
              )}
            >
              Mensuel
            </button>
            <div className="relative">
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  isYearly
                    ? "bg-bambi-accent text-white shadow-lg"
                    : "text-bambi-subtext hover:text-bambi-text",
                )}
              >
                Annuel
              </button>
              <div className="absolute -top-3 -right-2 bg-bambi-accent text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                -20%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-3xl transition-all duration-300",
                "flex flex-col",
                tier.highlight
                  ? "bg-gradient-to-b from-bambi-card/80 to-transparent dark:from-bambi-accent/[0.15]"
                  : "bg-bambi-card/40 dark:bg-bambi-card/40",
                "border",
                tier.highlight
                  ? "border-bambi-accent/50 dark:border-bambi-accent/20 shadow-xl"
                  : "border-bambi-border dark:border-bambi-border shadow-md",
                "hover:translate-y-0 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-6">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      tier.highlight
                        ? "bg-bambi-card dark:bg-bambi-card text-bambi-accent"
                        : "bg-bambi-card dark:bg-bambi-card text-bambi-subtext",
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-bambi-text dark:text-bambi-text">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-bambi-text dark:text-bambi-text">
                      {tier.price.monthly === 0 ? (
                        "Gratuit"
                      ) : (
                        <>
                          {isYearly ? tier.price.yearly : tier.price.monthly}€
                        </>
                      )}
                    </span>
                    {tier.price.monthly > 0 && (
                      <span className="text-sm text-bambi-subtext">
                        /{isYearly ? "an" : "mois"}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-bambi-subtext">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                      <div
                        className={cn(
                          "mt-1 p-0.5 rounded-full transition-colors duration-200",
                          feature.included
                            ? "text-bambi-accent"
                            : "text-bambi-border",
                        )}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-bambi-text dark:text-bambi-text">
                          {feature.name}
                        </div>
                        <div className="text-sm text-bambi-subtext">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Link href={tier.ctaLink}>
                  <Button
                    className={cn(
                      "w-full relative transition-all duration-300",
                      tier.highlight
                        ? buttonStyles.highlight
                        : buttonStyles.default,
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {tier.ctaText}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection }
