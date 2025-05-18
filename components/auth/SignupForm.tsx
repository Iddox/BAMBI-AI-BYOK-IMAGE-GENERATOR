"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { signUp, isLoading } = useAuth();

  // Fonction pour évaluer la force du mot de passe
  const getPasswordStrength = (password: string): "faible" | "moyen" | "fort" => {
    if (!password) return "faible";

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [hasLowercase, hasUppercase, hasDigit, hasSpecial, isLongEnough].filter(Boolean).length;

    if (score <= 2) return "faible";
    if (score <= 4) return "moyen";
    return "fort";
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError("");

    try {
      // Utilisation du contexte Auth pour l'inscription
      await signUp(email, password);

      // La redirection est gérée dans le contexte Auth, mais nous pouvons
      // rediriger vers la page de confirmation d'email si nécessaire
      router.push(`/email-confirmation?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription. Veuillez vérifier les informations.");
    }
  };

  return (
    <div className="bg-bambi-card p-8 rounded-xl border border-bambi-border shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Créer votre compte Bambi AI</h1>

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
          {password && (
            <div className="mt-1 flex items-center">
              <div className="text-xs mr-2">Force:</div>
              <div className="h-1.5 w-full bg-bambi-border rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    passwordStrength === "faible"
                      ? "w-1/3 bg-red-500"
                      : passwordStrength === "moyen"
                        ? "w-2/3 bg-yellow-500"
                        : "w-full bg-green-500"
                  }`}
                />
              </div>
              <div className="ml-2 text-xs">
                {passwordStrength === "faible" && "Faible"}
                {passwordStrength === "moyen" && "Moyen"}
                {passwordStrength === "fort" && "Fort"}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirmer le mot de passe
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-bambi-background border-bambi-border"
          />
        </div>

        <Button
          type="submit"
          className="w-full btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "Inscription en cours..." : "S'inscrire"}
        </Button>

        <div className="text-center mt-4">
          <span className="text-bambi-subtext text-sm">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-bambi-accent hover:underline">
              Se connecter
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
}
