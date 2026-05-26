import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LaporanKerusakan from "@/app/user/laporanKerusakan/laporanKerusakan";

export default function Page() {
  return (
    <main>
      <Navbar />
      <LaporanKerusakan />
      <Footer />
    </main>
  );
}