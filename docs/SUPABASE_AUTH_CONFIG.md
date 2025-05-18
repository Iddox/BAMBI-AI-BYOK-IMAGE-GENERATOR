# Configuration de l'authentification Supabase

Ce document explique comment configurer l'authentification Supabase pour le projet Bambi AI.

## Problème d'authentification

Si vous rencontrez un problème où les utilisateurs peuvent s'inscrire mais ne peuvent pas se connecter (message d'erreur indiquant que l'email est inconnu), cela peut être dû à la configuration de confirmation d'email de Supabase.

## Solution

### 1. Désactiver la confirmation d'email (pour le développement)

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.io)
2. Sélectionnez votre projet
3. Allez dans "Authentication" > "Providers" > "Email"
4. Désactivez l'option "Confirm email" (décochez la case)
5. Cliquez sur "Save"

![Désactiver la confirmation d'email](https://i.imgur.com/example.png)

### 2. Configuration pour la production

Pour la production, il est recommandé de garder la confirmation d'email activée pour des raisons de sécurité. Dans ce cas, assurez-vous que:

1. Les emails de confirmation sont correctement configurés
2. L'URL de redirection après confirmation est correcte
3. Les utilisateurs sont informés qu'ils doivent confirmer leur email avant de pouvoir se connecter

## Vérification des sessions

Si le problème persiste, vérifiez la gestion des sessions dans le middleware:

1. Ouvrez le fichier `middleware.ts`
2. Assurez-vous que la session est correctement rafraîchie:

```typescript
// Rafraîchir la session si elle existe
const { data } = await supabase.auth.getSession()
```

3. Vérifiez que les cookies sont correctement gérés

## Déboguer l'authentification

Pour déboguer les problèmes d'authentification:

1. Activez les logs côté client:

```typescript
// Dans utils/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        debug: process.env.NODE_ENV === 'development',
      }
    }
  );
}
```

2. Vérifiez les logs dans la console du navigateur
3. Vérifiez les logs d'authentification dans le dashboard Supabase (Authentication > Logs)

## Ressources supplémentaires

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Guide d'authentification Next.js avec Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
