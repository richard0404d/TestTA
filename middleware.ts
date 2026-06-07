import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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

  // 1. Dapatkan data user yang sedang aktif
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Tentukan route mana saja yang perlu diproteksi
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/user') || request.nextUrl.pathname.startsWith('/admin')

  // 3. Logika Route Protection: Jika mencoba masuk route terproteksi TAPI tidak ada user
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    // Arahkan ke halaman login kamu yang sesuai
    url.pathname = '/authentication/sign-in' 
    return NextResponse.redirect(url)
  }

  // JIKA berhasil login dan mencoba akses halaman login, lempar ke dashboard (Opsional)
  // if (user && request.nextUrl.pathname.startsWith('/authentication/sign-in')) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/user/dashboard' // Lempar ke dashboard sesuai role jika perlu
  //   return NextResponse.redirect(url)
  // }

  return supabaseResponse
}

// Config matcher wajib ada di root middleware.ts
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}