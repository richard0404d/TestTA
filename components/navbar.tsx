"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Menu, X, ChevronDown, CheckCircle, AlertCircle } from "lucide-react";
import { LogoutButton } from '@/components/logout-button';

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================================
  // STATE
  // ============================================
  const [open, setOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Gunakan nilai default "User" agar tidak terjadi hydration mismatch
  const [userName, setUserName] = useState("User");

  const menus = [
    { name: "Beranda", href: "/user/dashboard" },
    { name: "Reservasi", href: "/user/reservasi" },
    { name: "Kamar", href: "/user/kamar" },
    { name: "Laporan Kerusakan", href: "/user/laporanKerusakan" },
    { name: "Pembayaran", href: "/user/pembayaran" },
    { name: "Tagihan", href: "/user/tagihan" },
  ];

  // ============================================
  // LOGIC CLICK OUTSIDE UNTUK DROPDOWN
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================
  // FETCH NAMA PENYEWA (DENGAN VALIDASI CACHE)
  // ============================================
  useEffect(() => {
    const fetchUserName = async () => {
      // 1. Tampilkan nama dari cache sementara (agar cepat/tidak terlihat loading)
      const cachedName = localStorage.getItem("user_name");
      if (cachedName) {
        setUserName(cachedName);
      }

      try {
        // 2. Tetap ambil ID user terbaru dari session aktif
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 3. Tarik data nama penyewa berdasarkan user aktif
          const { data: penyewaData, error } = await supabase
            .from("penyewa")
            .select("nama_penyewa")
            .eq("id_penyewa", user.id)
            .single();

          const finalName = (!error && penyewaData?.nama_penyewa) 
            ? penyewaData.nama_penyewa 
            : (user.user_metadata?.nama_penyewa || "User");

          // 4. Update state dan cache jika namanya berbeda dari cache
          if (finalName !== cachedName) {
            setUserName(finalName);
            localStorage.setItem("user_name", finalName);
          }
        } else {
          // Jika tidak ada user login (session habis), reset state
          setUserName("User");
          localStorage.removeItem("user_name");
        }
      } catch (err) {
        console.error("Gagal mengambil nama penyewa:", err);
      }
    };

    fetchUserName();
  }, [supabase]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#2C5EBF] shadow-sm">
      <div className="p-4 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="text-white text-2xl font-bold">
          <Link href="/user/dashboard" className="flex items-center gap-2">
            <img
              src="/images/LogoKos.png"
              alt="Logo Kos 75"
              className="w-10 h-10 object-contain"
            />
            <span>Kos 75</span>
          </Link>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-3 text-white font-medium">
          {menus.map((menu, index) => {
            const isActive = pathname === menu.href;
            return (
              <Link
                key={index}
                href={menu.href}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-white text-[#2C5EBF] shadow-md"
                    : "hover:bg-white/20"
                }`}
              >
                {menu.name}
              </Link>
            );
          })}
        </div>

        {/* DESKTOP DROPDOWN USER */}
        <div className="hidden md:block relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-[#2C5EBF] hover:bg-white/20 text-white px-4 py-2.5 rounded-lg transition-all duration-200 font-medium"
          >
            Halo, {userName} <ChevronDown size={18} />
          </button>

          {/* DROPDOWN MENU */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col z-50 text-gray-800 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link
                href="/user/profil"
                onClick={() => setIsDropdownOpen(false)}
                className="px-5 py-3.5 hover:bg-gray-50 transition border-b text-sm font-medium text-gray-700"
              >
                Saya
              </Link>
              
              <div className="px-5 py-3 hover:bg-gray-50 transition">
                <LogoutButton />
              </div>
            </div>
          )}
        </div>

        {/* HAMBURGER BUTTON */}
        <button
          className="md:hidden text-white hover:bg-white/20 p-2 rounded-lg transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-[#2C5EBF] border-t border-white/10 px-4 pb-6 pt-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2 text-white font-medium">
            
            <div className="px-4 py-3 mb-2 border-b border-white/10 text-gray-200 text-sm">
              Halo, <span className="font-bold text-white">{userName}</span>
            </div>

            {menus.map((menu, index) => {
              const isActive = pathname === menu.href;
              return (
                <Link
                  key={index}
                  href={menu.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive ? "bg-white text-[#2C5EBF]" : "hover:bg-white/20"
                  }`}
                >
                  {menu.name}
                </Link>
              );
            })}

            <Link
              href="/user/profil"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl hover:bg-white/20 transition-all duration-200"
            >
              Saya
            </Link>

            <div className="mt-4 border-t border-white/10 pt-4 px-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}