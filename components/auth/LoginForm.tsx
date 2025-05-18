"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { signIn, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Utilisation du contexte Auth pour la connexion
      await signIn(email, password);

      // La redirection est gérée dans le contexte Auth
    } catch (err: any) {
      // Gestion spécifique de l'erreur "Email not confirmed"
      if (err.message && err.message.includes("Email not confirmed")) {
        // Rediriger vers la page de confirmation d'email
        router.push(`/email-confirmation?email=${encodeURIComponent(email)}`);
        return;
      }

      setError(err.message || "Email ou mot de passe incorrect.");
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
