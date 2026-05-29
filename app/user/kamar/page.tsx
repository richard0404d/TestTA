import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Kamar from "@/app/user/kamar/kamar";

export default function Page() {
  return (
    <main>
      <Navbar />
      <Kamar />
      <Footer />
    </main>
  );
}