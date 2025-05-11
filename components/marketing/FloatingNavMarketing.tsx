"use client";

import React from "react";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { LayoutDashboard, Lightbulb, CreditCard, Star } from "lucide-react";
import Link from "next/link";

export function FloatingNavMarketing() {
  // Définir les éléments de navigation avec les mêmes liens que dans le Navbar existant
  const navItems = [
    {
      name: "Features",
      link: "#features",
      icon: <LayoutDashboard className="h-4 w-4 text-bambi-accent" />,
    },
    {
      name: "How It Works",
      link: "#how-it-works",
      icon: <Lightbulb className="h-4 w-4 text-bambi-accent" />,
    },
    {
      name: "Pricing",
      link: "#pricing",
      icon: <CreditCard className="h-4 w-4 text-bambi-accent" />,
    },
    {
      name: "Testimonials",
      link: "#testimonials",
      icon: <Star className="h-4 w-4 text-bambi-accent" />,
    },
  ];

  // Personnaliser le style pour correspondre au design de Bambi AI
  const customClassName = "bg-bambi-card border-bambi-border dark:bg-bambi-background shadow-[0px_2px_10px_rgba(123,92,250,0.2)]";

  return (
    <FloatingNav
      navItems={navItems}
      className={customClassName}
    />
  );
}
