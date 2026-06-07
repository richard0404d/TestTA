// app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // PERBAIKAN 1: Tambahkan 'await' karena di Next.js terbaru cookies() adalah Promise
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // PERBAIKAN 2: Menggunakan for...of agar TypeScript mengenali tipe datanya secara otomatis
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      // PERBAIKAN 3: Menghapus cookie dari cookieStore yang sudah di-await
      cookieStore.delete(cookie.name);
    }
  }

  return NextResponse.json({ success: true });
}