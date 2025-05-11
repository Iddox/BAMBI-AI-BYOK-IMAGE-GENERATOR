"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: {
    regular: string
    gradient: string
  }
  description?: string
  ctaText?: string
  ctaHref?: string
  gridOptions?: {
    angle?: number
    cellSize?: number
    opacity?: number
    lightLineColor?: string
    darkLineColor?: string
  }
}

// Composant de particules animées pour l'arrière-plan
const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Configuration des particules
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }> = [];

    // Créer les particules
    const createParticles = () => {
      const particleCount = Math.floor(dimensions.width * dimensions.height / 15000);

      for (let i = 0; i < particleCount; i++) {
        const colors = [
          'rgba(123, 92, 250, 0.6)', // Violet principal
          'rgba(94, 61, 206, 0.5)',  // Violet foncé
          'rgba(147, 123, 255, 0.4)', // Violet clair
          'rgba(255, 255, 255, 0.3)', // Blanc
        ];

        particles.push({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    // Animer les particules
    const animateParticles = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      particles.forEach((particle, index) => {
        // Mettre à jour la position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Rebondir sur les bords
        if (particle.x < 0 || particle.x > dimensions.width) {
          particle.speedX *= -1;
        }

        if (particle.y < 0 || particle.y > dimensions.height) {
          particle.speedY *= -1;
        }

        // Dessiner la particule
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Dessiner des lignes entre particules proches
        for (let j = index + 1; j < particles.length; j++) {
          const dx = particles[j].x - particle.x;
          const dy = particles[j].y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(123, 92, 250, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animateParticles);
    };

    if (dimensions.width > 0 && dimensions.height > 0) {
      createParticles();
      animateParticles();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dimensions.width, dimensions.height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 opacity-70"
    />
  );
};

// Composant de grille rétro amélioré
const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:250px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent to-70% dark:from-black dark:via-black/80" />
    </div>
  )
}

// Composant pour les formes géométriques flottantes
const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Cercle violet flottant */}
      <div className="absolute top-[15%] right-[10%] w-64 h-64 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl animate-pulse-subtle"></div>

      {/* Forme abstraite en haut à gauche */}
      <div className="absolute top-[5%] left-[5%] w-48 h-48 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-2xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>

      {/* Forme abstraite en bas */}
      <div className="absolute bottom-[10%] left-[30%] w-72 h-72 rounded-full bg-pink-400/10 dark:bg-pink-400/5 blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      title = "Build products for everyone",
      subtitle = {
        regular: "Designing your projects faster with ",
        gradient: "the largest figma UI kit.",
      },
      description = "Sed ut perspiciatis unde omnis iste natus voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.",
      ctaText = "Browse courses",
      ctaHref = "#",
      gridOptions,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("relative overflow-hidden", className)} ref={ref} {...props}>
        {/* Arrière-plan amélioré avec dégradé plus riche */}
        <div className="absolute top-0 z-[0] h-screen w-screen bg-purple-950/10 dark:bg-purple-950/10
          bg-[radial-gradient(ellipse_30%_80%_at_50%_-20%,rgba(123,92,250,0.25),rgba(255,255,255,0))]
          dark:bg-[radial-gradient(ellipse_30%_80%_at_50%_-20%,rgba(123,92,250,0.4),rgba(255,255,255,0))]
          after:content-[''] after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_100%_40%_at_50%_60%,rgba(94,61,206,0.15),transparent)] dark:after:bg-[radial-gradient(ellipse_100%_40%_at_50%_60%,rgba(94,61,206,0.3),transparent)]" />

        {/* Effet de bruit subtil */}
        <div className="absolute inset-0 z-[1] opacity-[0.03] dark:opacity-[0.07] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

        <section className="relative max-w-full mx-auto z-1">
          {/* Particules animées */}
          <ParticlesBackground />

          {/* Formes géométriques flottantes */}
          <FloatingShapes />

          {/* Grille rétro améliorée */}
          <RetroGrid {...gridOptions} />

          {/* Contenu principal */}
          <div className="max-w-screen-xl z-10 relative mx-auto px-4 py-28 gap-12 md:px-8">
            <div className="space-y-5 max-w-3xl leading-0 lg:leading-5 mx-auto text-center backdrop-blur-[2px]">
              {/* Badge du titre avec effet de glassmorphisme */}
              <h1 className="text-sm text-gray-600 dark:text-gray-400 group font-geist mx-auto px-5 py-2
                bg-gradient-to-tr from-zinc-300/30 via-purple-400/20 to-transparent
                dark:from-zinc-300/10 dark:via-purple-400/15
                border-[2px] border-black/5 dark:border-white/10
                rounded-3xl w-fit backdrop-blur-sm shadow-sm">
                {title}
                <ChevronRight className="inline w-4 h-4 ml-2 group-hover:translate-x-1 duration-300" />
              </h1>

              {/* Titre principal avec dégradé amélioré */}
              <h2 className="text-4xl tracking-tighter font-geist bg-clip-text text-transparent mx-auto md:text-6xl
                bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)]
                dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.90)_100%)]
                drop-shadow-sm">
                {subtitle.regular}
                <span className="text-transparent bg-clip-text bg-gradient-to-r
                  from-purple-600 via-purple-500 to-pink-500
                  dark:from-purple-300 dark:via-purple-200 dark:to-orange-200">
                  {subtitle.gradient}
                </span>
              </h2>

              {/* Description avec meilleure lisibilité */}
              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 backdrop-blur-[1px] relative z-10">
                {description}
              </p>

              {/* Bouton CTA amélioré */}
              <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
                <span className="relative inline-block overflow-hidden rounded-full p-[1.5px] shadow-lg">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                    <a
                      href={ctaHref}
                      className="inline-flex rounded-full text-center group items-center w-full justify-center
                        bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent
                        dark:from-zinc-300/5 dark:via-purple-400/20
                        text-gray-900 dark:text-white
                        border-input border-[1px]
                        hover:bg-gradient-to-tr hover:from-zinc-300/30 hover:via-purple-400/40 hover:to-transparent
                        dark:hover:from-zinc-300/10 dark:hover:via-purple-400/30
                        transition-all sm:w-auto py-4 px-10
                        shadow-[0_0_15px_rgba(123,92,250,0.15)]
                        hover:shadow-[0_0_20px_rgba(123,92,250,0.25)]"
                    >
                      {ctaText}
                    </a>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  },
)
HeroSection.displayName = "HeroSection"

export { HeroSection }
