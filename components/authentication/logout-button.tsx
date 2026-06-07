"use client";

import { createClient } from "@/lib/supabase/client";
// Hapus import useRouter dan Link karena sudah tidak dipakai lagi untuk Hard Redirect
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const logout = async () => {
    const supabase = createClient();

    // 1. PERBAIKAN: Gunakan local scope agar perangkat lain tidak ikut ter-logout
    await supabase.auth.signOut({ scope: 'local' });

    // 2. PERBAIKAN: Gunakan window.location.href untuk hard-redirect
    // Ini memastikan seluruh sisa memori/cache di browser terhapus bersih
    window.location.href = "/";
  };

  return (
    <div className="mt-auto pt-6">
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition font-medium text-gray-700 w-full"
      >
        <LogOut size={20} />
        Keluar
      </button>
    </div>
  );
}