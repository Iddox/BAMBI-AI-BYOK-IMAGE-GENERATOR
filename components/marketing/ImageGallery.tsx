"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const ImageGallery = () => {
  // Utiliser les images du dossier public/images
  const galleryImages = [
    { src: '/images/image 1.webp', alt: 'Image 1' },
    { src: '/images/image 2.webp', alt: 'Image 2' },
    { src: '/images/image 3.webp', alt: 'Image 3' },
    { src: '/images/image 4.webp', alt: 'Image 4' },
    { src: '/images/image 5.webp', alt: 'Image 5' },
    { src: '/images/image 6.webp', alt: 'Image 6' },
    { src: '/images/image 7.webp', alt: 'Image 7' },
    { src: '/images/image 8.webp', alt: 'Image 8' },
    { src: '/images/image 9.webp', alt: 'Image 9' },
    { src: '/images/image 10.webp', alt: 'Image 10' },
  ];

  // État pour suivre si les animations sont activées (pour éviter les animations pendant le chargement)
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  // Activer les animations après le chargement de la page
  useEffect(() => {
    setAnimationsEnabled(true);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-bambi-background to-bambi-card/30 overflow-hidden">
      <div className="container-landing">
        <div className="text-center mb-16">
          <h2 className="section-title">Voyez ce que vous pouvez créer</h2>
          <p className="section-subtitle">
            Explorez les possibilités infinies avec la génération d'images de Bambi AI
          </p>
        </div>
      </div>

      {/* Conteneur principal de la galerie avec effet de flou sur les côtés - pleine largeur */}
      <div className="relative w-screen overflow-hidden left-[50%] right-[50%] mx-[-50vw]">
        {/* Effet de flou à gauche - aligné parfaitement avec le bord de l'écran */}
        <div className="absolute left-0 top-0 h-full w-[25%] z-10 pointer-events-none gallery-blur gallery-blur-left"
             style={{
               background: 'linear-gradient(to right, rgba(10, 10, 10, 1) 0%, rgba(10, 10, 10, 0.95) 10%, rgba(10, 10, 10, 0.9) 20%, rgba(10, 10, 10, 0.7) 40%, rgba(10, 10, 10, 0.4) 60%, rgba(10, 10, 10, 0.1) 80%, rgba(10, 10, 10, 0) 100%)'
             }}>
        </div>

        {/* Effet de flou à droite - aligné parfaitement avec le bord de l'écran */}
        <div className="absolute right-0 top-0 h-full w-[25%] z-10 pointer-events-none gallery-blur gallery-blur-right"
             style={{
               background: 'linear-gradient(to left, rgba(10, 10, 10, 1) 0%, rgba(10, 10, 10, 0.95) 10%, rgba(10, 10, 10, 0.9) 20%, rgba(10, 10, 10, 0.7) 40%, rgba(10, 10, 10, 0.4) 60%, rgba(10, 10, 10, 0.1) 80%, rgba(10, 10, 10, 0) 100%)'
             }}>
        </div>

          {/* Première rangée - défilement vers la gauche */}
          <div className={`flex mb-6 ${animationsEnabled ? 'animate-scroll-left' : ''}`}>
            {/* Première série d'images */}
            {galleryImages.map((image, index) => (
              <div key={index} className="mx-1 rounded-lg overflow-hidden shadow-lg flex-shrink-0"
                   style={{ width: 'clamp(180px, 22vw, 280px)', height: 'clamp(180px, 22vw, 280px)' }}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ))}
            {/* Répétition des images pour l'animation continue */}
            {galleryImages.map((image, index) => (
              <div key={`repeat1-${index}`} className="mx-1 rounded-lg overflow-hidden shadow-lg flex-shrink-0"
                   style={{ width: 'clamp(180px, 22vw, 280px)', height: 'clamp(180px, 22vw, 280px)' }}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>

          {/* Deuxième rangée - défilement vers la droite */}
          <div className={`flex ${animationsEnabled ? 'animate-scroll-right' : ''}`}>
            {/* Première série d'images */}
            {galleryImages.map((image, index) => (
              <div key={`row2-${index}`} className="mx-1 rounded-lg overflow-hidden shadow-lg flex-shrink-0"
                   style={{ width: 'clamp(180px, 22vw, 280px)', height: 'clamp(180px, 22vw, 280px)' }}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ))}
            {/* Répétition des images pour l'animation continue */}
            {galleryImages.map((image, index) => (
              <div key={`repeat2-${index}`} className="mx-1 rounded-lg overflow-hidden shadow-lg flex-shrink-0"
                   style={{ width: 'clamp(180px, 22vw, 280px)', height: 'clamp(180px, 22vw, 280px)' }}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>

      <div className="container-landing">
        <div className="mt-12 text-center">
          <Link href="/signup" className="btn-cta-primary">
            Commencer Gratuitement
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-bambi-subtext text-sm mt-4 text-center">Aucune carte de crédit requise</p>
      </div>

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scrollRight {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-left {
          animation: scrollLeft 60s linear infinite;
        }

        .animate-scroll-right {
          animation: scrollRight 60s linear infinite;
        }

        /* Styles responsifs */
        @media (max-width: 768px) {
          .animate-scroll-left, .animate-scroll-right {
            animation-duration: 45s;
          }
        }

        @media (max-width: 480px) {
          .animate-scroll-left, .animate-scroll-right {
            animation-duration: 30s;
          }
        }

        /* Styles responsifs pour les effets de flou */
        @media (max-width: 768px) {
          /* Augmenter la largeur des zones de flou sur mobile pour une meilleure couverture */
          .gallery-blur {
            width: 30% !important;
          }
        }

        @media (max-width: 640px) {
          /* Augmenter encore plus la largeur des zones de flou sur très petits écrans */
          .gallery-blur {
            width: 35% !important;
          }
        }

        @media (max-width: 480px) {
          /* Augmenter encore plus la largeur des zones de flou sur très petits écrans */
          .gallery-blur {
            width: 40% !important;
          }
        }
      `}</style>
    </section>
  );
};

export default ImageGallery;
