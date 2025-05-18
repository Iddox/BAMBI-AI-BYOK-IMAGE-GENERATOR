"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import Link from "next/link";
import { MailIcon, RefreshCwIcon } from "lucide-react";

export function EmailConfirmationInfo() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resendStatus, setResendStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleResendConfirmation = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setResendStatus("");
    
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      
      if (error) throw error;
      
      setResendStatus("Email de confirmation renvoyé avec succès.");
    } catch (err: any) {
      setResendStatus(`Erreur: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bambi-card p-8 rounded-xl border border-bambi-border shadow-lg max-w-md mx-auto mt-10">
      <div className="flex justify-center mb-6">
        <div className="bg-bambi-accent/10 p-4 rounded-full">
          <MailIcon className="h-10 w-10 text-bambi-accent" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Confirmation d'email requise</h1>
      
      <div className="mb-6 text-center">
        <p className="mb-2">
          Un email de confirmation a été envoyé à <strong>{email}</strong>.
        </p>
        <p className="text-bambi-subtext">
          Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation pour activer votre compte.
        </p>
      </div>
      
      {resendStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          resendStatus.startsWith("Erreur") 
            ? "bg-red-500/10 border border-red-500/30 text-red-500" 
            : "bg-green-500/10 border border-green-500/30 text-green-500"
        }`}>
          {resendStatus}
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        <Button
          onClick={handleResendConfirmation}
          variant="outline"
          className="w-full border-bambi-border hover:bg-bambi-accent/10 hover:text-bambi-accent hover:border-bambi-accent/30"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Renvoyer l'email de confirmation"
          )}
        </Button>
        
        <Link href="/login">
          <Button
            className="w-full bg-bambi-accent hover:bg-bambi-accentDark text-white"
          >
            Retour à la connexion
          </Button>
        </Link>
      </div>
    </div>
  );
}
