"use client";

import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, BedDouble, Building2, CalendarCheck,
  Wallet, Receipt, Wrench, BarChart3, Users, Menu, X, ChevronDown
} from "lucide-react";

export default function AdminSidebar() {
  const supabase = createClient();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [role, setRole] = useState<number | null>(null);
  const [userName, setUserName] = useState("Admin");

  // Fetch Role & Nama
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(Number(savedRole));

    const fetchAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("pegawai").select("nama_pegawai").eq("id_pegawai", user.id).single();
        if (data) setUserName(data.nama_pegawai);
      }
    };
    fetchAdmin();
  }, [supabase]);

  // Logic Klik di luar dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menus = [
    { name: "Beranda", icon: <LayoutDashboard size={20} />, href: "/admin/dashboardAdmin" },
    { name: "Kamar", icon: <BedDouble size={20} />, href: "/admin/manajemenKamar" },
    { name: "Fasilitas", icon: <Building2 size={20} />, href: "/admin/manajemenFasilitas" },
    { name: "Reservasi", icon: <CalendarCheck size={20} />, href: "/admin/manajemenReservasi" },
    { name: "Sewa", icon: <Wallet size={20} />, href: "/admin/manajemenSewa" },
    { name: "Pembayaran", icon: <Receipt size={20} />, href: "/admin/manajemenPembayaran" },
    { name: "Laporan Kerusakan", icon: <Wrench size={20} />, href: "/admin/manajemenLaporanKerusakan" },
    ...(role === 1 ? [
      { name: "Pengeluaran", icon: <Wallet size={20} />, href: "/admin/manajemenPengeluaran" },
      { name: "Laporan Keuangan", icon: <BarChart3 size={20} />, href: "/admin/manajemenLaporanKeuangan" },
      { name: "Pengguna", icon: <Users size={20} />, href: "/admin/manajemenPengguna" },
    ] : []),
  ];

  return (
    <>
      {/* TOPBAR */}
      <div className="fixed top-0 left-0 w-full h-16 bg-[#1c3163] text-white flex items-center justify-between px-5 z-50 shadow-sm">
        <h1 className="text-2xl font-bold">Kos 75</h1>

        {/* BAGIAN KANAN: HALO DAN DROPDOWN */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-blue-900 px-3 py-1.5 rounded-lg transition"
            >
              Halo, {userName} <ChevronDown size={16} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl border overflow-hidden z-50">
                <Link href="/admin/profil" className="block px-4 py-3 hover:bg-gray-50 border-b font-medium">Saya</Link>
                <div className="px-4 py-3 hover:bg-gray-50 font-medium">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      <div className={`md:hidden fixed top-16 left-0 w-full bg-white z-40 border-b overflow-hidden transition-all duration-300 ${open ? "max-h-[700px]" : "max-h-0"}`}>
        <div className="px-4 py-4 flex flex-col gap-3">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href} onClick={() => setOpen(false)} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${pathname === menu.href ? "bg-[#1c3163] text-white" : "text-gray-700"}`}>
              {menu.icon} {menu.name}
            </Link>
          ))}
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed top-16 left-0 w-[260px] h-[calc(100vh-64px)] bg-white border-r flex-col p-5 overflow-y-auto">
        <div className="w-full h-28 border-2 border-dashed rounded-2xl flex items-center justify-center text-gray-400 mb-8">Logo</div>
        <div className="flex flex-col gap-2">
          {menus.map((menu) => (
            <Link key={menu.href} href={menu.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${pathname === menu.href ? "bg-[#1c3163] text-white shadow-md" : "text-gray-700 hover:bg-blue-50"}`}>
              {menu.icon} {menu.name}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}