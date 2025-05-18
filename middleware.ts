import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Vérifier si la requête concerne une ressource statique ou une API
  // Si c'est le cas, ne pas exécuter le middleware de vérification de session
  const url = new URL(request.url);
  const isStaticResource = url.pathname.includes('/_next/') ||
                          url.pathname.includes('/api/') ||
                          url.pathname.endsWith('.ico') ||
                          url.pathname.endsWith('.png') ||
                          url.pathname.endsWith('.jpg') ||
                          url.pathname.endsWith('.svg') ||
                          url.pathname.endsWith('.webp');

  if (isStaticResource) {
    return NextResponse.next();
  }

  // Créer la réponse initiale
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Créer le client Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Mettre à jour les cookies de la requête
          request.cookies.set({
            name,
            value,
            ...options,
          });

          // Mettre à jour les cookies de la réponse
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Mettre à jour les cookies de la requête
          request.cookies.set({
            name,
            value: '',
            ...options,
          });

          // Mettre à jour les cookies de la réponse
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Rafraîchir la session si elle existe
  console.log(`Middleware - Checking session for ${url.pathname}...`);

  // Déclarer la variable data en dehors du bloc try-catch
  let data = { session: null };

  try {
    // Ajouter un timeout pour la vérification de la session
    const sessionPromise = supabase.auth.getSession();

    // Créer une promesse qui se résout après 10 secondes (augmenté de 5 à 10 secondes)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('Middleware - Session check timed out');
        resolve({ data: { session: null } });
      }, 10000);
    });

    // Utiliser Promise.race pour prendre le résultat le plus rapide
    const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
    data = result.data;

    console.log(`Middleware - Session check result for ${url.pathname}:`, { hasSession: !!data.session });
  } catch (error) {
    console.error(`Middleware - Error checking session for ${url.pathname}:`, error);
    // En cas d'erreur, considérer qu'il n'y a pas de session
    data = { session: null };
  }

  // Protection des routes du dashboard
  const isDashboardRoute = url.pathname.startsWith('/dashboard') ||
                          url.pathname.startsWith('/account') ||
                          url.pathname.startsWith('/api-keys') ||
                          url.pathname.startsWith('/generate') ||
                          url.pathname.startsWith('/gallery') ||
                          url.pathname.startsWith('/plans');

  // Protection des routes du dashboard - Toujours actif, même en développement
  if (isDashboardRoute && !data?.session) {
    console.log(`Middleware - Redirecting to login from ${url.pathname}`);
    // Éviter les redirections en boucle
    if (url.pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirection des utilisateurs connectés depuis les pages d'auth
  const isAuthRoute = url.pathname.startsWith('/login') ||
                     url.pathname.startsWith('/signup') ||
                     url.pathname === '/';

  if (isAuthRoute && data?.session) {
    console.log(`Middleware - Redirecting to generate from ${url.pathname}`);
    // Éviter les redirections en boucle
    if (url.pathname !== '/generate') {
      return NextResponse.redirect(new URL('/generate', request.url));
    }
  }

  return response
}

// Configuration du matcher pour le middleware
export const config = {
  matcher: [
    /*
     * Match uniquement les routes pertinentes pour l'authentification:
     * - Routes du dashboard (/dashboard, /account, /api-keys, /generate, /gallery, /plans)
     * - Routes d'authentification (/login, /signup, /)
     */
    '/dashboard/:path*',
    '/account/:path*',
    '/api-keys/:path*',
    '/generate/:path*',
    '/gallery/:path*',
    '/plans/:path*',
    '/login/:path*',
    '/signup/:path*',
    '/'
  ]
}
