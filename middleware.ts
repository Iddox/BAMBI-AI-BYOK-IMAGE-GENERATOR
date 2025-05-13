import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Rafraîchir la session si elle existe
  const { data } = await supabase.auth.getSession()

  // Protection des routes du dashboard
  const url = new URL(request.url)
  const isDashboardRoute = url.pathname.startsWith('/dashboard') ||
                          url.pathname.startsWith('/account') ||
                          url.pathname.startsWith('/api-keys') ||
                          url.pathname.startsWith('/generate') ||
                          url.pathname.startsWith('/gallery') ||
                          url.pathname.startsWith('/plans')

  // En mode développement, ne pas bloquer l'accès aux routes protégées
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDashboardRoute && !data.session && !isDevelopment) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirection des utilisateurs connectés depuis les pages d'auth
  const isAuthRoute = url.pathname.startsWith('/login') ||
                     url.pathname.startsWith('/signup') ||
                     url.pathname === '/'

  if (isAuthRoute && data.session && !isDevelopment) {
    return NextResponse.redirect(new URL('/generate', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
