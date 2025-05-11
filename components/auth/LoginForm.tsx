"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Logique d'authentification à implémenter
      console.log("Login with:", email, password);
      // Redirection après connexion réussie
      window.location.href = "/generate";
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bambi-card p-8 rounded-xl border border-bambi-border shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Se connecter à Bambi AI</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-bambi-background border-bambi-border"
            placeholder="votre@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Mot de passe
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-bambi-background border-bambi-border"
          />
        </div>
        
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-bambi-accent hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        
        <Button 
          type="submit" 
          className="w-full btn-primary" 
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Connexion"}
        </Button>
        
        <div className="text-center mt-4">
          <span className="text-bambi-subtext text-sm">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-bambi-accent hover:underline">
              S'inscrire
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
}
