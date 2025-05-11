import { HeroSection } from "@/components/blocks/hero-section-dark"

function HeroSectionDemo() {
  return (
    <HeroSection
      title="Welcome to Bambi AI"
      subtitle={{
        regular: "Transform your ideas into ",
        gradient: "beautiful AI images",
      }}
      description="Generate stunning AI images with your own API keys. Secure, flexible, and designed for creators."
      ctaText="Get Started"
      ctaHref="/signup"
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#2a2a2a",
      }}
    />
  )
}
export { HeroSectionDemo }
