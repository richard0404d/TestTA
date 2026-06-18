import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // ============================================
  // PENGECUALIAN UNTUK API MIDTRANS (TIDAK DICEGAT)
  // ============================================
  if (request.nextUrl.pathname.startsWith("/api/midtrans")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ============================================
  // INISIALISASI SUPABASE (Sesuaikan .env)
  // ============================================
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!, // Sesuaikan dengan .env kamu
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ============================================
  // GET USER & ROUTE PROTECTION
  // ============================================
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/user') || request.nextUrl.pathname.startsWith('/admin')

  // Jika mencoba masuk route terproteksi TAPI tidak ada user
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/authentication/sign-in' // Arahkan ke path login kamu
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}