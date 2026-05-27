"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { LogoutButton } from '@/components/logout-button'

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // ✅ DETEKSI HALAMAN AKTIF
  const pathname = usePathname();

  const menus = [
    {
      name: "Beranda",
      href: "/",
    },
    {
      name: "Reservasi",
      href: "/user/reservasi",
    },
    {
      name: "Laporan Kerusakan",
      href: "/user/laporanKerusakan",
    },
    {
      name: "Pembayaran",
      href: "/user/pembayaran",
    },
    {
      name: "Tagihan",
      href: "/user/tagihan",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#2C5EBF] shadow-sm">

      {/* ================= NAVBAR ================= */}
      <div className="p-4 flex items-center justify-between">

        {/* LOGO */}
        <div className="text-white text-2xl font-bold">

          <Link
            href="/"
            className="flex items-center gap-2"
          >

            <img
              src="/images/LogoKos.png"
              alt="Logo Kos 75"
              className="w-10 h-10 object-contain"
            />

            <span>Kos 75</span>

          </Link>

        </div>

        {/* ================= DESKTOP MENU ================= */}
        <div className="hidden md:flex items-center gap-3 text-white font-medium">

          {menus.map((menu, index) => {

            // ✅ ACTIVE MENU
            const isActive = pathname === menu.href;

            return (
              <Link
                key={index}
                href={menu.href}
                className={`px-4 py-2 rounded-xl transition-all duration-200
                  
                  ${
                    isActive
                      ? "bg-white text-[#2C5EBF] shadow-md"
                      : "hover:bg-white/20"
                  }
                `}
              >
                {menu.name}
              </Link>
            );
          })}

        </div>

        {/* ================= DESKTOP BUTTON ================= */}
        <div className="hidden md:block">

            <LogoutButton />

        </div>

        {/* ================= HAMBURGER BUTTON ================= */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
        >

          {open ? <X size={28} /> : <Menu size={28} />}

        </button>

      </div>

      {/* ================= MOBILE MENU ================= */}
      {open && (

        <div className="md:hidden bg-[#1c3163] border-t border-white/10 px-4 pb-4">

          <div className="flex flex-col gap-3 text-white font-medium pt-4">

            {menus.map((menu, index) => {

              // ✅ ACTIVE MENU
              const isActive = pathname === menu.href;

              return (
                <Link
                  key={index}
                  href={menu.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-xl transition-all duration-200
                    
                    ${
                      isActive
                        ? "bg-white text-[#2C5EBF]"
                        : "hover:bg-white/20"
                    }
                  `}
                >
                  {menu.name}
                </Link>
              );
            })}

            {/* LOGOUT */}
            <Button className="mt-2">
              Logout
            </Button>

          </div>

        </div>

      )}

    </header>
  );
}