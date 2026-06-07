"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  const logout = async () => {
    // 1. Bersihkan sisa-sisa data (seperti role) di browser lokal ini
    localStorage.clear();

    // 2. Panggil API jalur belakang untuk menghapus Cookies di browser ini saja
    await fetch("/api/auth/logout", { method: "POST" });

    // 3. Hard Redirect: Memaksa browser muat ulang halaman dari awal
    window.location.href = "/authentication/sign-in";
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