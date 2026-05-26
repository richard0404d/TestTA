import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeroContent() {
  return (
    <div className="py-16 px-6 border-b bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-md border p-10 text-center">
        
        <h1 className="text-4xl font-bold mb-6">
          Temukan Hunian Nyaman di Kos Kaliasin 75
        </h1>

        <p className="text-muted-foreground leading-8 mb-8">
          Kos Kaliasin 75 hadir sebagai pilihan tempat tinggal yang nyaman,
          aman, dan strategis bagi mahasiswa maupun pekerja. Dengan fasilitas
          yang lengkap, lingkungan yang nyaman, serta sistem reservasi yang
          mudah dilakukan secara online, Kos Kaliasin 75 siap membantu memenuhi
          kebutuhan hunian Anda. Segera lakukan reservasi kamar sekarang dan
          dapatkan pengalaman tinggal yang lebih praktis, nyaman, dan
          terintegrasi bersama Kos Kaliasin 75.
        </p>

        <Link href="/user/reservasi">
          <Button className="px-8 py-6 text-base rounded-xl bg-[#2C5EBF]">
            Reservasi Sekarang
          </Button>
        </Link>

      </div>
    </div>
  );
}