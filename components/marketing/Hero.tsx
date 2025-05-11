import { HeroSection } from "@/components/blocks/hero-section-dark";
import Link from "next/link";

const Hero = () => {
  return (
    <HeroSection
      title="Bambi AI"
      subtitle={{
        regular: "Générez des images IA avec ",
        gradient: "VOS clés API!",
      }}
      description="Simple. Sécurisé. Économique. Utilisez vos propres clés API pour générer des images IA de haute qualité, sans abonnements coûteux ni installations complexes."
      ctaText="Commencer gratuitement"
      ctaHref="/signup"
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#2a2a2a",
      }}
    />
  );
};

export default Hero;
