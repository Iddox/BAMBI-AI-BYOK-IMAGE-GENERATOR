"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  UserPlus,
  Key,
  Image as ImageIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowRight
} from "lucide-react";

const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const controls = useAnimation();
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  // Fonctions de navigation
  const goToNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setActiveStep(stepIndex);
    }
  };

  const steps = [
    {
      icon: <UserPlus className="h-10 w-10" />,
      title: "Inscription / Authentification",
      description: "Créez un compte ou connectez-vous pour commencer à générer des images IA.",
      planInfo: "Plan Gratuit: Accès immédiat sans carte bancaire",
      illustration: (
        <div className="relative w-full h-36 sm:h-48 bg-bambi-card/50 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-bambi-accent/10 to-transparent"></div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-bambi-card rounded-lg flex items-center justify-center border border-bambi-border">
            <UserPlus className="h-12 w-12 sm:h-16 sm:w-16 text-bambi-accent/70" />
          </div>
        </div>
      )
    },
    {
      icon: <Key className="h-10 w-10" />,
      title: "Configuration de l'API",
      description: "Ajoutez votre clé API pour accéder aux modèles d'IA de votre choix.",
      planInfo: "Plan Gratuit: 1 configuration d'API | Premium: Configurations multiples",
      illustration: (
        <div className="relative w-full h-36 sm:h-48 bg-bambi-card/50 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-bambi-accent/10 to-transparent"></div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-bambi-card rounded-lg flex items-center justify-center border border-bambi-border">
            <Key className="h-12 w-12 sm:h-16 sm:w-16 text-bambi-accent/70" />
          </div>
        </div>
      )
    },
    {
      icon: <ImageIcon className="h-10 w-10" />,
      title: "Génération d'Images",
      description: "Écrivez votre prompt et générez des images IA de haute qualité.",
      planInfo: "Plan Gratuit: 50 messages/mois | Premium: Messages illimités, qualité HD",
      illustration: (
        <div className="relative w-full h-36 sm:h-48 bg-bambi-card/50 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-bambi-accent/10 to-transparent"></div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-bambi-card rounded-lg flex items-center justify-center border border-bambi-border">
            <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 text-bambi-accent/70" />
          </div>
        </div>
      )
    },
    {
      icon: <Download className="h-10 w-10" />,
      title: "Téléchargement",
      description: "Téléchargez vos images générées en haute résolution pour tout usage.",
      planInfo: "Plan Premium: Téléchargement en qualité HD sans filigrane",
      illustration: (
        <div className="relative w-full h-36 sm:h-48 bg-bambi-card/50 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-bambi-accent/10 to-transparent"></div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-bambi-card rounded-lg flex items-center justify-center border border-bambi-border">
            <Download className="h-12 w-12 sm:h-16 sm:w-16 text-bambi-accent/70" />
          </div>
        </div>
      )
    },
  ];

  // Effet d'apparition des éléments
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  // Variantes d'animation pour les éléments
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };





  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-20 bg-bambi-background relative overflow-hidden"
    >
      {/* Fond avec effet de grille subtil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>

      <motion.div
        className="container-landing relative z-10"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
      >
        <motion.div
          className="text-center mb-12"
          variants={itemVariants}
        >
          <h2 className="section-title">Aussi simple que 1-2-3-4</h2>
          <p className="section-subtitle">
            Un processus guidé en 4 étapes pour générer des images IA sans compétences techniques
          </p>
        </motion.div>

        {/* Indicateur de progression avec chiffres et barre */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-3xl">
            {/* Conteneur pour la barre de progression */}
            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 px-5 sm:px-6">
              {/* Barre de progression de fond (non colorée) */}
              <div className="h-2 bg-bambi-border/40 w-full rounded-full"></div>

              {/* Barre de progression colorée (jusqu'à l'étape active) */}
              <div
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-bambi-accent to-bambi-accentDark rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${activeStep === 0 ? 0 : (activeStep / (steps.length - 1)) * 100}%`,
                }}
                aria-hidden="true"
              ></div>



              {/* Zones cliquables sur la barre */}
              <div className="absolute top-0 left-0 w-full h-full flex">
                {steps.map((_, index) => {
                  const width = 100 / steps.length;
                  const left = index * width;
                  return (
                    <button
                      key={index}
                      onClick={() => goToStep(index)}
                      className={`h-full transition-all duration-300 hover:bg-white/10 rounded-full ${
                        index === activeStep + 1 ? 'animate-pulse-subtle' : ''
                      }`}
                      style={{ width: `${width}%`, left: `${left}%` }}
                      aria-label={`Aller à l'étape ${index + 1}`}
                    ></button>
                  );
                })}
              </div>
            </div>

            {/* Chiffres des étapes */}
            <div className="flex justify-between relative z-10 px-0">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 border-2 shadow-sm ${
                    index < activeStep
                      ? 'bg-bambi-accent text-white border-bambi-accent' // Étapes complétées
                      : index === activeStep
                        ? 'bg-bambi-accent text-white border-bambi-accent scale-110 shadow-md' // Étape active
                        : index === activeStep + 1
                          ? 'bg-bambi-card text-bambi-subtext border-bambi-border hover:border-bambi-accent/50 animate-pulse-subtle' // Prochaine étape
                          : 'bg-bambi-card text-bambi-subtext border-bambi-border hover:border-bambi-accent/50' // Étapes futures
                  }`}
                  aria-label={`Aller à l'étape ${index + 1}: ${step.title}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu de l'étape active */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Afficher uniquement l'étape active */}
            <motion.div
              key={activeStep}
              className="w-full max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card-feature p-6 sm:p-8">
                {/* Illustration */}
                <div className="mb-6">
                  {steps[activeStep].illustration}
                </div>

                {/* Titre et icône */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-bambi-accent/10 flex items-center justify-center mr-4 text-bambi-accent">
                    {steps[activeStep].icon}
                  </div>
                  <h3 className="text-2xl font-semibold">{steps[activeStep].title}</h3>
                </div>

                {/* Description */}
                <p className="text-bambi-subtext text-lg mb-6">{steps[activeStep].description}</p>

                {/* Information sur les plans */}
                <div className="flex items-start mb-8 text-sm sm:text-base">
                  <Info className="h-5 w-5 text-bambi-accent mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-bambi-subtext/90">{steps[activeStep].planInfo}</p>
                </div>

                {/* Boutons de navigation */}
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={goToPreviousStep}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors duration-200 ${
                      activeStep === 0
                        ? 'border-bambi-border/30 text-bambi-subtext/50 cursor-not-allowed'
                        : 'border-bambi-border text-bambi-text hover:border-bambi-accent/50'
                    }`}
                    disabled={activeStep === 0}
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Précédent
                  </button>

                  {activeStep < steps.length - 1 ? (
                    <button
                      onClick={goToNextStep}
                      className="flex items-center px-4 py-2 rounded-lg bg-bambi-accent text-white hover:bg-bambi-accentDark transition-colors duration-200"
                    >
                      Suivant
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </button>
                  ) : (
                    <Link
                      href="/signup"
                      className="btn-primary flex items-center group"
                    >
                      Essayer gratuitement
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
};

export default HowItWorks;
