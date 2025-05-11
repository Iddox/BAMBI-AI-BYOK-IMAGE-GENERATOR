"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Lightbulb, CreditCard, Star, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingHeader() {
  const [scrollLevel, setScrollLevel] = useState(0); // 0: pas de scroll, 1: léger scroll, 2: scroll important
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuAnimation, setMenuAnimation] = useState(""); // Pour gérer l'animation du menu

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY <= 10) {
        setScrollLevel(0); // Pas de scroll
      } else if (window.scrollY <= 50) {
        setScrollLevel(1); // Léger scroll
      } else {
        setScrollLevel(2); // Scroll important
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gestion du défilement fluide pour les liens d'ancrage
  useEffect(() => {
    // Fonction pour gérer le clic sur les liens d'ancrage
    const handleAnchorClick = (e: Event) => {
      e.preventDefault();
      const link = e.currentTarget as HTMLAnchorElement;

      if (link && link.hash && link.hash.startsWith('#') && document.querySelector(link.hash)) {
        // Récupérer l'élément cible
        const targetElement = document.querySelector(link.hash);

        if (targetElement) {
          // Calculer l'offset pour tenir compte du header
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          // Défilement fluide
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Mise à jour de l'URL avec le fragment
          history.pushState(null, '', link.hash);
        }
      }
    };

    // Ajouter l'écouteur d'événement aux liens de navigation desktop
    const desktopNavLinks = document.querySelectorAll('.nav-desktop-link');
    desktopNavLinks.forEach(link => {
      link.addEventListener('click', handleAnchorClick as EventListener);
    });

    return () => {
      // Nettoyer les écouteurs d'événements
      desktopNavLinks.forEach(link => {
        link.removeEventListener('click', handleAnchorClick as EventListener);
      });
    };
  }, []);

  // Définir les éléments de navigation
  const navItems = [
    {
      name: "Fonctionnalités",
      link: "#features",
      icon: <LayoutDashboard className="h-4 w-4 text-bambi-accent" />,
    },
    {
      name: "Comment ça marche",
      link: "#how-it-works",
      icon: <Lightbulb className="h-4 w-4 text-bambi-accent" />,
    },
    {
      name: "Tarifs",
      link: "#pricing",
      icon: <CreditCard className="h-4 w-4 text-bambi-accent" />,
    },
    {
      name: "FAQ",
      link: "#faq",
      icon: <Star className="h-4 w-4 text-bambi-accent" />,
    },
  ];

  return (
    <header className={cn(
      "fixed inset-x-0 z-[5000] flex justify-center transition-all duration-300",
      scrollLevel === 0 ? "top-3" : scrollLevel === 1 ? "top-2" : "top-1"
    )}>
      <div
        className={cn(
          "max-w-6xl w-[95%] mx-auto rounded-full border transition-all duration-300",
          scrollLevel === 0
            ? "py-2 border-white/[0.15] bg-bambi-background/75 backdrop-blur-xl shadow-[0_0_12px_rgba(123,92,250,0.08)]"
            : scrollLevel === 1
              ? "py-1.5 border-white/[0.12] bg-bambi-background/80 backdrop-blur-2xl shadow-[0_0_10px_rgba(123,92,250,0.06)]"
              : "py-1 border-white/[0.1] bg-bambi-background/85 backdrop-blur-3xl shadow-[0_0_8px_rgba(123,92,250,0.05)]"
        )}
      >
        <div className="px-5 flex items-center justify-between">
          {/* Section gauche - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span
                className={cn(
                  "font-bold bg-button-gradient bg-clip-text text-transparent transition-all duration-300",
                  scrollLevel === 0 ? "text-lg md:text-xl" : scrollLevel === 1 ? "text-base md:text-lg" : "text-sm md:text-base"
                )}
                translate="no"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: 'Bambi AI' }}
              />
            </Link>
          </div>

          {/* Section centrale - Navigation */}
          <div className={cn(
            "hidden md:flex items-center justify-center transition-all duration-300",
            scrollLevel === 0 ? "space-x-8" : scrollLevel === 1 ? "space-x-7" : "space-x-6"
          )}>
            {navItems.map((navItem, idx) => (
              <Link
                key={`link-${idx}`}
                href={navItem.link}
                className={cn(
                  "nav-desktop-link text-bambi-text hover:text-bambi-accent transition-colors font-medium",
                  scrollLevel === 0 ? "text-sm" : scrollLevel === 1 ? "text-xs" : "text-[11px]"
                )}
              >
                <span>{navItem.name}</span>
              </Link>
            ))}
          </div>

          {/* Section droite - Boutons */}
          <div className={cn(
            "flex items-center transition-all duration-300",
            scrollLevel === 0 ? "space-x-3" : scrollLevel === 1 ? "space-x-2.5" : "space-x-2"
          )}>
            <Link
              href="/login"
              className={cn(
                "hidden md:inline-flex border border-bambi-border/80 text-bambi-text hover:text-bambi-accent hover:border-bambi-accent font-medium rounded-full transition-all duration-300",
                scrollLevel === 0
                  ? "text-xs px-3 py-1.5"
                  : scrollLevel === 1
                    ? "text-[10px] px-2.5 py-1"
                    : "text-[9px] px-2 py-0.5"
              )}
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className={cn(
                "bg-button-gradient text-white font-medium rounded-full hover:shadow-[0_0_12px_rgba(123,92,250,0.4)] transition-all duration-300",
                scrollLevel === 0
                  ? "text-xs px-3 py-1.5"
                  : scrollLevel === 1
                    ? "text-[10px] px-2.5 py-1"
                    : "text-[9px] px-2 py-0.5"
              )}
            >
              {scrollLevel === 2 ? "Commencer" : "Commencer gratuitement"}
            </Link>

            {/* Menu mobile */}
            <button
              className="md:hidden text-bambi-text bg-bambi-background/40 hover:bg-bambi-background/60 p-1.5 rounded-full border border-bambi-border/30 transition-colors duration-200"
              onClick={() => {
                if (isMobileMenuOpen) {
                  // Animation de fermeture
                  setMenuAnimation("closing");
                  setTimeout(() => {
                    setIsMobileMenuOpen(false);
                    setMenuAnimation("");
                  }, 300);
                } else {
                  // Animation d'ouverture
                  setMenuAnimation("opening");
                  setIsMobileMenuOpen(true);
                  setTimeout(() => {
                    setMenuAnimation("");
                  }, 300);
                }
              }}
              aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-[5001] md:hidden overflow-hidden transition-all duration-300",
            isMobileMenuOpen
              ? menuAnimation === "closing"
                ? "max-h-0 animate-out slide-out-to-top duration-300"
                : "max-h-[500px] animate-in slide-in-from-top duration-300"
              : "max-h-0"
          )}
        >
          {/* Contenu du menu */}
          <div className={cn(
            "bg-bambi-background/90 backdrop-blur-xl border-x border-b border-white/[0.1] rounded-b-2xl shadow-[0_8px_15px_rgba(123,92,250,0.15)] px-4 py-3 mx-2 mt-1 transition-all duration-300",
            menuAnimation === "opening"
              ? "opacity-0 animate-in fade-in duration-300 translate-y-[-8px]"
              : menuAnimation === "closing"
                ? "opacity-100 animate-out fade-out duration-300 translate-y-0"
                : "opacity-100 translate-y-0"
          )}>
            {/* Liens de navigation */}
            <div className="flex flex-col space-y-2">
              {navItems.map((navItem, idx) => (
                <Link
                  key={`mobile-link-${idx}`}
                  href={navItem.link}
                  className="flex items-center space-x-3 text-bambi-text hover:text-bambi-accent transition-all duration-300 text-sm py-3 px-4 rounded-lg hover:bg-bambi-card/40 border border-transparent hover:border-bambi-accent/20"
                  onClick={(e) => {
                    e.preventDefault();
                    // Animation de fermeture
                    setMenuAnimation("closing");
                    setTimeout(() => {
                      setIsMobileMenuOpen(false);
                      setMenuAnimation("");
                      // Naviguer vers le lien après la fermeture du menu
                      const element = document.querySelector(navItem.link);
                      if (element) {
                        // Défilement fluide avec offset pour tenir compte du header
                        const headerOffset = 80;
                        const elementPosition = element.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth"
                        });

                        // Mise à jour de l'URL avec le fragment
                        history.pushState(null, "", navItem.link);
                      }
                    }, 300);
                  }}
                >
                  <span className="text-bambi-accent">{navItem.icon}</span>
                  <span className="font-medium">{navItem.name}</span>
                </Link>
              ))}

              {/* Bouton CTA */}
              <div className="pt-3 mt-1 border-t border-bambi-border/20">
                <Link
                  href="/signup"
                  className="block text-center bg-button-gradient text-white text-sm font-medium px-4 py-2 rounded-full hover:shadow-[0_0_12px_rgba(123,92,250,0.4)] transition-all duration-300"
                  onClick={(e) => {
                    e.preventDefault();
                    // Animation de fermeture
                    setMenuAnimation("closing");
                    setTimeout(() => {
                      setIsMobileMenuOpen(false);
                      setMenuAnimation("");
                      // Naviguer vers la page d'inscription après la fermeture du menu
                      window.location.href = "/signup";
                    }, 300);
                  }}
                >
                  Commencer gratuitement
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
