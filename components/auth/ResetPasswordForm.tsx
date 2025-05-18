"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

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

  // Vérifier si l'utilisateur a une session active avec un hash de réinitialisation
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setError("Session invalide ou expirée. Veuillez demander un nouveau lien de réinitialisation.");
      }
    };

    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bambi-card p-8 rounded-xl border border-bambi-border shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Définir un nouveau mot de passe</h1>

      {success ? (
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500">
            Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.
          </div>
          <Link href="/login" className="text-bambi-accent hover:underline">
            Aller à la page de connexion
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Nouveau mot de passe
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
                Confirmer le nouveau mot de passe
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
              {isLoading ? "Enregistrement..." : "Enregistrer le nouveau mot de passe"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
