import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // Tangkap parameter baru (Token Hash untuk Lintas Perangkat)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as any
  
  // Tangkap parameter lama (Code PKCE) sebagai cadangan
  const code = searchParams.get('code')
  
  const next = searchParams.get('next') ?? '/'
  const supabase = await createClient()

  // 1. PRIORITAS UTAMA: Cek menggunakan Token Hash (Bisa Lintas Perangkat)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } 
  // 2. CADANGAN: Cek menggunakan PKCE Code standar
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika semua gagal (link kadaluarsa / token salah)
  return NextResponse.redirect(`${origin}/authentication/sign-in?error=Link_Tidak_Valid`)
}