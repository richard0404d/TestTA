// components/Navbar.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <div className="w-full border-b p-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 border rounded flex items-center justify-center">
          Logo
        </div>
      </div>

      {/* Menu */}
      <div className="flex gap-6 text-blue-600 font-medium">
        <Link href="#">Beranda</Link>
        <Link href="#">Reservasi</Link>
        <Link href="#">Laporan Kerusakan</Link>
        <Link href="#">Pembayaran</Link>
      </div>

      {/* Logout / Login */}
      <Button variant="outline">⮕</Button>
    </div>
  );
}