import Navbar from "@/components/navbar";
import Banner from "@/app/user/dashboard/banner";
import Footer from "@/components/footer";
import Content from "@/app/user/dashboard/heroContent";
import MenuCepat from "@/app/user/dashboard/menuCepat";
import Fasilitas from "@/app/user/dashboard/fasilitas";

export default function Home() {
    return (
        <main>
            <Navbar />
            <Banner />
            <Content />
            <MenuCepat />
            <Fasilitas />
            <Footer />
        </main> 
)
}