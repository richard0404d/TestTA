"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  const logout = async () => {

    localStorage.clear();

    await fetch("/api/auth/logout", { method: "POST" });

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