import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Tagihan from "@/app/user/tagihan/tagihan";

export default function Page() {
  return (
    <main>
      <Navbar />
      <Tagihan />
      <Footer />
    </main>
  );
}