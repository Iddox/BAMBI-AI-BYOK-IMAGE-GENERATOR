"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Logique de réinitialisation de mot de passe à implémenter
      console.log("Reset password for:", email);
      setSuccess(true);
    } catch (err) {
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bambi-card p-8 rounded-xl border border-bambi-border shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Réinitialiser votre mot de passe</h1>
      
      {success ? (
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500">
            Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.
          </div>
          <Link href="/login" className="text-bambi-accent hover:underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-bambi-subtext">
            Saisissez votre email pour recevoir un lien de réinitialisation.
          </p>
          
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
            
            <Button 
              type="submit" 
              className="w-full btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </Button>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-bambi-accent hover:underline text-sm">
                Retour à la connexion
              </Link>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
