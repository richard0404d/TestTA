"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BedDouble,
  Building2,
  CalendarCheck,
  Wallet,
  Receipt,
  Wrench,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);

  // ✅ DETEKSI HALAMAN AKTIF
  const pathname = usePathname();

  const menus = [
    {
      name: "Beranda",
      icon: <LayoutDashboard size={20} />,
      href: "/admin/dashboardAdmin",
    },
    {
      name: "Kamar",
      icon: <BedDouble size={20} />,
      href: "/admin/manajemenKamar",
    },
    {
      name: "Fasilitas",
      icon: <Building2 size={20} />,
      href: "/admin/manajemenFasilitas",
    },
    {
      name: "Reservasi",
      icon: <CalendarCheck size={20} />,
      href: "/admin/manajemenReservasi",
    },
    {
      name: "Sewa",
      icon: <Wallet size={20} />,
      href: "/admin/manajemenSewa",
    },
    {
      name: "Pembayaran",
      icon: <Receipt size={20} />,
      href: "/admin/manajemenPembayaran",
    },
    {
      name: "Pengeluaran",
      icon: <Wallet size={20} />,
      href: "/admin/manajemenPengeluaran",
    },
    {
      name: "Laporan Kerusakan",
      icon: <Wrench size={20} />,
      href: "/admin/manajemenLaporanKerusakan",
    },
    {
      name: "Laporan Keuangan",
      icon: <BarChart3 size={20} />,
      href: "/admin/manajemenLaporanKeuangan",
    },
    {
      name: "Pengguna",
      icon: <Users size={20} />,
      href: "/admin/manajemenPengguna",
    },
  ];

  return (
    <>
      {/* ================= TOPBAR ================= */}
      <div className="fixed top-0 left-0 w-full h-16 bg-[#1c3163] text-white flex items-center justify-between px-5 z-50 shadow-sm">

        <h1 className="text-2xl font-bold">
          Kos 75
        </h1>

        {/* MOBILE BUTTON */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={`md:hidden fixed top-16 left-0 w-full bg-white z-40 border-b overflow-hidden transition-all duration-300 ${
          open ? "max-h-[700px]" : "max-h-0"
        }`}
      >

        <div className="px-4 py-4 flex flex-col gap-3">

          {menus.map((menu, index) => {

            // ✅ ACTIVE MENU
            const isActive = pathname === menu.href;

            return (
              <Link
                key={index}
                href={menu.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium
                  
                  ${
                    isActive
                      ? "bg-[#1c3163] text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }
                `}
              >
                {menu.icon}
                {menu.name}
              </Link>
            );
          })}

        </div>
      </div>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex fixed top-16 left-0 w-[260px] h-[calc(100vh-64px)] bg-white border-r flex-col p-5 overflow-y-auto">

        {/* LOGO */}
        <div className="w-full h-28 border-2 border-dashed rounded-2xl flex items-center justify-center text-gray-400 mb-8">
          Logo
        </div>

        {/* MENU */}
        <div className="flex flex-col gap-2">

          {menus.map((menu, index) => {

            // ✅ ACTIVE MENU
            const isActive = pathname === menu.href;

            return (
              <Link
                key={index}
                href={menu.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium
                
                ${
                  isActive
                    ? "bg-[#1c3163] text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }
              `}
              >
                {menu.icon}
                {menu.name}
              </Link>
            );
          })}

        </div>

        {/* LOGOUT */}
        <div className="mt-auto pt-6">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition font-medium text-gray-700"
          >
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition font-medium text-gray-700 w-full">

            <LogOut size={20} />

            Keluar

          </button>
          </Link>
        </div>

      </aside>
    </>
  );
}