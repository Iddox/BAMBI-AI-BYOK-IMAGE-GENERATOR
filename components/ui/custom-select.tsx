"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Types pour les options
export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  size?: "default" | "sm";
  onValueChange?: (value: string) => void;
}

const CustomSelect = React.forwardRef<
  HTMLSelectElement,
  CustomSelectProps
>(({
  options,
  placeholder,
  className,
  error,
  size = "default",
  onValueChange,
  onChange,
  value,
  ...props
}, ref) => {
  // État pour suivre si le select est ouvert
  const [isOpen, setIsOpen] = useState(false);

  // Sélectionner automatiquement la première option si aucune valeur n'est fournie
  useEffect(() => {
    if (!value && options && options.length > 0 && onValueChange) {
      onValueChange(options[0].value);
    }
  }, [value, options, onValueChange]);

  // Gérer le changement de valeur
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Appeler le gestionnaire onChange standard s'il existe
    if (onChange) {
      onChange(e);
    }

    // Appeler onValueChange avec la nouvelle valeur si elle existe
    if (onValueChange) {
      onValueChange(e.target.value);
    }
  };

  // Gérer l'ouverture/fermeture du select
  const handleFocus = () => setIsOpen(true);
  const handleBlur = () => setIsOpen(false);

  // Détection du mode mobile
  const isMobile = typeof window !== 'undefined' ?
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) :
    false;

  // Trouver l'option sélectionnée pour l'afficher dans un format personnalisé
  const selectedOption = options?.find(option => option.value === value);

  // État pour suivre si c'est le premier rendu
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Désactiver l'animation après le premier rendu
  useEffect(() => {
    if (isFirstRender) {
      const timer = setTimeout(() => {
        setIsFirstRender(false);
      }, 3000); // Durée totale de l'animation + un peu de marge

      return () => clearTimeout(timer);
    }
  }, [isFirstRender]);

  return (
    <div className="relative group">
      {/* Effet de glow subtil au hover */}
      <div className={cn(
        "absolute -inset-0.5 rounded-md opacity-0 transition-opacity duration-300 pointer-events-none",
        "bg-gradient-to-r from-bambi-accent/5 to-bambi-accentDark/5",
        "group-hover:opacity-100",
        isOpen && "opacity-0"
      )} />

      <div className={cn(
        "flex items-center w-full rounded-md border text-white font-medium bg-[#222222] border-[#333333]/60",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-bambi-accent/30 focus-within:border-bambi-accent/50",
        "transition-all duration-300 ease-in-out relative z-10",
        "hover:border-[#444444]/80 group-hover:bg-[#1E1E1E]",
        size === "default" ? "h-10 text-sm" : "h-8 text-xs",
        error && "border-red-500/70 focus-within:border-red-500",
        isOpen && "border-bambi-accent/50 shadow-[0_0_0_1px_rgba(123,92,250,0.15),0_2px_8px_rgba(0,0,0,0.15)] bg-[#1E1E1E]",
        className
      )}>
        <select
          ref={ref}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "appearance-none w-full bg-transparent border-none outline-none focus:ring-0 px-3",
            "text-bambi-text placeholder:text-bambi-subtext",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-300 ease-in-out",
            size === "default" ? "py-2" : "py-1.5",
            isMobile && "mobile-select text-white",
          )}
          value={value}
          aria-label={props['aria-label'] || "Sélectionner une option"}
          {...props}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Indicateur visuel supprimé complètement */}
      </div>

      {/* Indicateur de focus pour l'accessibilité */}
      <div
        className={cn(
          "absolute inset-0 rounded-md pointer-events-none",
          "ring-0 transition-all duration-300",
          isOpen ? "ring-2 ring-bambi-accent/30" : "ring-0"
        )}
        aria-hidden="true"
      />
    </div>
  );
});

CustomSelect.displayName = "CustomSelect";

export { CustomSelect };
