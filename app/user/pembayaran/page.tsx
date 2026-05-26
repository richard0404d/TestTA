import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Pembayaran from "@/app/user/pembayaran/pembayaran";

export default function Page() {
  return (
    <main>
      <Navbar />
      <Pembayaran />
      <Footer />
    </main>
  );
}