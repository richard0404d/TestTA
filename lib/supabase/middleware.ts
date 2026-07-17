import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest
) {

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


  const {
    data: { user },
  } = await supabase.auth.getUser();


  const loginPath =
    "/authentication/sign-in";


  if (
    !user &&
    !request.nextUrl.pathname.startsWith(
      loginPath
    ) &&
    !request.nextUrl.pathname.startsWith(
      "/auth"
    )&&
    !request.nextUrl.pathname.startsWith("/api/auth") && // Mengizinkan proses pengecekan token Hash
    !request.nextUrl.pathname.startsWith("/authentication/update-password") // Mengizinkan masuk ke halaman form ganti password
  ) {

    const url =
      request.nextUrl.clone();

    url.pathname = loginPath;

    return NextResponse.redirect(
      url
    );
  }


  if (
    user &&
    request.nextUrl.pathname.startsWith(
      loginPath
    )
  ) {


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


    const {
      data: penyewa,
    } = await supabase
      .from("penyewa")
      .select("*")
      .eq("id_penyewa", user.id)
      .single();


    if (penyewa) {

      const url =
        request.nextUrl.clone();

      url.pathname =
        "/user/dashboard";

      return NextResponse.redirect(
        url
      );
    }
  }

  return supabaseResponse;
}