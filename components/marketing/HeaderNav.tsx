"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Lightbulb, CreditCard, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Définir les éléments de navigation
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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-bambi-background/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container-landing py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span
            className="text-2xl font-bold bg-button-gradient bg-clip-text text-transparent"
            translate="no"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: 'Bambi AI' }}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((navItem, idx) => (
            <Link 
              key={`nav-item-${idx}`} 
              href={navItem.link}
              className="nav-link flex items-center space-x-2 hover:text-bambi-accent transition-colors"
            >
              <span className="hidden">{navItem.icon}</span>
              <span>{navItem.name}</span>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link href="/signup" className="btn-primary">
            Try For Free
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-bambi-text"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-bambi-card border-t border-bambi-border">
          <div className="container-landing py-4 flex flex-col space-y-4">
            {navItems.map((navItem, idx) => (
              <Link
                key={`mobile-nav-${idx}`}
                href={navItem.link}
                className="nav-link py-2 flex items-center space-x-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{navItem.icon}</span>
                <span>{navItem.name}</span>
              </Link>
            ))}
            <Link
              href="/signup"
              className="btn-primary inline-block text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Try For Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
