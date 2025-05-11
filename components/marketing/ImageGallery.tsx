"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const ImageGallery = () => {
  // État pour détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Vérifier au chargement
    checkIfMobile();

    // Ajouter un écouteur d'événement pour les changements de taille
    window.addEventListener('resize', checkIfMobile);

    // Nettoyer l'écouteur d'événement
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Using the actual images from the gallery folder
  const galleryImages = [
    { src: '/gallery/image 1.webp', alt: 'AI generated image 1' },
    { src: '/gallery/image 2.webp', alt: 'AI generated image 2' },
    { src: '/gallery/image 3.webp', alt: 'AI generated image 3' },
    { src: '/gallery/image 4.webp', alt: 'AI generated image 4' },
    { src: '/gallery/image 5.webp', alt: 'AI generated image 5' },
    { src: '/gallery/image 6.webp', alt: 'AI generated image 6' },
    { src: '/gallery/image 7.webp', alt: 'AI generated image 7' },
    { src: '/gallery/image 8.webp', alt: 'AI generated image 8' },
    { src: '/gallery/image 9.webp', alt: 'AI generated image 9' },
    { src: '/gallery/image 10.webp', alt: 'AI generated image 10' },
  ];

  // Duplicate the images for continuous scrolling
  const row1Images = [...galleryImages, ...galleryImages, ...galleryImages];
  // Créer une copie pour éviter de modifier l'original avec reverse()
  const row2Images = [...[...galleryImages].reverse(), ...galleryImages, ...[...galleryImages].reverse()];

  return (
    <section className="py-20 bg-gradient-to-b from-bambi-background to-bambi-card/30 overflow-hidden relative">
      <div className="container-landing">
        <div className="text-center mb-16">
          <h2 className="section-title">Voyez ce que vous pouvez créer</h2>
          <p className="section-subtitle">
            Explorez les possibilités infinies avec la génération d'images de Bambi AI
          </p>
        </div>
      </div>

      {/* Full-width gallery with completely fixed edge-to-edge design */}
      <div className="w-screen relative -mx-[calc((100vw-100%)/2)] gallery-container">
        {/* Fixed solid edge masks with reduced width */}
        <div className="absolute left-0 top-0 bottom-0 w-[10vw] bg-bambi-background z-40 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[10vw] bg-bambi-background z-40 pointer-events-none"></div>

        {/* First row - scrolling left */}
        <div className="mb-10 relative">
          {/* Gradient overlays with reduced width for more visible space */}
          <div className={`absolute left-[10vw] top-0 bottom-0 z-30 pointer-events-none ${
            isMobile
              ? 'w-[12vw] gallery-mask-left-mobile'
              : 'w-[18vw] gallery-mask-left'
          }`}></div>
          <div className={`absolute right-[10vw] top-0 bottom-0 z-30 pointer-events-none ${
            isMobile
              ? 'w-[12vw] gallery-mask-right-mobile'
              : 'w-[18vw] gallery-mask-right'
          }`}></div>

          {/* Responsive scrolling container with adaptive speed */}
          <div className={`flex py-4 ${
            isMobile
              ? 'animate-marquee-fast'
              : 'animate-marquee-slow'
          }`}>
            {row1Images.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0 mx-3 rounded-lg overflow-hidden shadow-lg"
                style={{
                  width: isMobile ? '250px' : '320px',
                  height: isMobile ? '250px' : '320px'
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={isMobile ? "250px" : "320px"}
                    className="object-cover"
                    priority={index < 5}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second row - scrolling right */}
        <div className="mb-6 relative">
          {/* Gradient overlays with reduced width for more visible space */}
          <div className={`absolute left-[10vw] top-0 bottom-0 z-30 pointer-events-none ${
            isMobile
              ? 'w-[12vw] gallery-mask-left-mobile'
              : 'w-[18vw] gallery-mask-left'
          }`}></div>
          <div className={`absolute right-[10vw] top-0 bottom-0 z-30 pointer-events-none ${
            isMobile
              ? 'w-[12vw] gallery-mask-right-mobile'
              : 'w-[18vw] gallery-mask-right'
          }`}></div>

          {/* Responsive scrolling container with adaptive speed */}
          <div className={`flex py-4 ${
            isMobile
              ? 'animate-marquee-reverse-fast'
              : 'animate-marquee-reverse-slow'
          }`}>
            {row2Images.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0 mx-3 rounded-lg overflow-hidden shadow-lg"
                style={{
                  width: isMobile ? '250px' : '320px',
                  height: isMobile ? '250px' : '320px'
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={isMobile ? "250px" : "320px"}
                    className="object-cover"
                    priority={index < 5}
                  />
                </div>
              </div>
            ))}
          </div>
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
    </section>
  );
};

export default ImageGallery;
