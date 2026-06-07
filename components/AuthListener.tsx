"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthListener({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  useEffect(() => {
    // 1. Fungsi untuk menendang user dan me-reset browser
    const handleForceLogout = () => {
      // Jangan lakukan redirect jika user sudah berada di halaman login
      if (window.location.pathname.includes("/authentication/sign-in") || window.location.pathname.includes("/authentication/sign-up")) {
        return;
      }

      // Bersihkan sisa role
      localStorage.removeItem("role"); 
      
      // HARD REDIRECT: Memaksa browser memuat ulang dari awal
      // Ini menyelesaikan masalah "harus refresh sebelum login lagi"
      window.location.href = "/authentication/sign-in";
    };

    // 2. Cek sesi saat komponen pertama kali dimuat atau tab dibuka kembali
    const checkSessionOnMount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        handleForceLogout();
      }
    };
    checkSessionOnMount();

    // 3. Pantau perubahan status secara real-time (jika token kedaluwarsa di tengah jalan)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        handleForceLogout();
      }
    });

    return () => {
      subscription.unsubscribe(); // Membersihkan listener agar tidak bocor
    };
  }, [supabase]);

  return <>{children}</>;
}