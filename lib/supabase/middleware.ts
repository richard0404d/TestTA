import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest
) {

  // IZINKAN API MIDTRANS
  if (
    request.nextUrl.pathname.startsWith(
      "/api/midtrans"
    )
  ) {

    return NextResponse.next();
  }

  let supabaseResponse =
    NextResponse.next({
      request,
    });

  // ============================================
  // SUPABASE CLIENT
  // ============================================

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,

      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,

      {
        cookies: {

          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {

            cookiesToSet.forEach(
              ({ name, value }) =>
                request.cookies.set(
                  name,
                  value
                )
            );

            supabaseResponse =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) =>
                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                )
            );
          },
        },
      }
    );

  // ============================================
  // GET USER
  // ============================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ============================================
  // LOGIN PATH
  // ============================================

  const loginPath =
    "/authentication/sign-in";

  // ============================================
  // JIKA BELUM LOGIN
  // ============================================

  if (
    !user &&
    !request.nextUrl.pathname.startsWith(
      loginPath
    ) &&
    !request.nextUrl.pathname.startsWith(
      "/auth"
    )
  ) {

    const url =
      request.nextUrl.clone();

    url.pathname = loginPath;

    return NextResponse.redirect(
      url
    );
  }

  // ============================================
  // JIKA SUDAH LOGIN
  // ============================================

  if (
    user &&
    request.nextUrl.pathname.startsWith(
      loginPath
    )
  ) {

    // ============================================
    // CEK PEGAWAI
    // ============================================

    const {
      data: pegawai,
    } = await supabase
      .from("pegawai")
      .select(`
        id_role,
        role (
          nama_role
        )
      `)
      .eq("id_pegawai", user.id)
      .single();

    // ============================================
    // JIKA PEGAWAI
    // ============================================

    if (
      pegawai &&
      pegawai.role &&
      pegawai.role.length > 0
    ) {

      const roleName =
        pegawai.role[0]
          .nama_role
          .toLowerCase();

      const url =
        request.nextUrl.clone();

      // ADMIN / PEMILIK
      if (
        roleName === "admin" ||
        roleName === "pemilik"
      ) {

        url.pathname =
          "/admin/dashboardAdmin";

        return NextResponse.redirect(
          url
        );
      }
    }

    // ============================================
    // CEK PENYEWA
    // ============================================

    const {
      data: penyewa,
    } = await supabase
      .from("penyewa")
      .select("*")
      .eq("id_penyewa", user.id)
      .single();

    // ============================================
    // JIKA PENYEWA
    // ============================================

    if (penyewa) {

      const url =
        request.nextUrl.clone();

      url.pathname =
        "/";

      return NextResponse.redirect(
        url
      );
    }
  }

  return supabaseResponse;
}