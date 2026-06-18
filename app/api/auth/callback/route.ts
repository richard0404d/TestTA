import { NextResponse } from 'next/server'
// Pastikan path ke supabase/server ini sesuai dengan struktur folder kamu
import { createClient } from '@/lib/supabase/server' 

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Menangkap parameter 'next' jika ada, defaultnya kembali ke beranda '/'
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Tambahkan 'await' agar Next.js menunggu Supabase Client benar-benar siap
    const supabase = await createClient(); 

    // Sekarang .auth sudah tersedia dan error akan hilang
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Jika berhasil, arahkan ke halaman ganti password tanpa error
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika kode gagal/kadaluarsa, arahkan ke halaman login dengan pesan error (opsional)
  return NextResponse.redirect(`${origin}/authentication/sign-in?error=Invalid_Link`)
}