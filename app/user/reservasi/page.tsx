import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Reservasi from "@/app/user/reservasi/reservasi";

export default function Page() {
  return (
    <main>
      <Navbar />
      <Reservasi />
      <Footer />
    </main>
  );
}