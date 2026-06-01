import Link from "next/link";

export default function MenuCepatPenyewa() {
  const menus = [
    {
      title: "Tagihan Saya",
      desc: "Lihat tagihan dan status pembayaran",
      icon: "📄",
      color: "bg-blue-500",
      href: "/user/tagihan",
    },
    {
      title: "Riwayat Pembayaran",
      desc: "Lihat riwayat transaksi pembayaran",
      icon: "💰",
      color: "bg-green-500",
      href: "/user/pembayaran",
    },
    {
      title: "Reservasi Kamar",
      desc: "Reservasi kamar untuk keluarga atau teman",
      icon: "📅",
      color: "bg-purple-500",
      href: "/user/reservasi",
    },
    {
      title: "Pengajuan Perbaikan",
      desc: "Laporkan kerusakan fasilitas kos",
      icon: "🛠️",
      color: "bg-orange-500",
      href: "/user/laporanKerusakan",
    },
    {
      title: "Profil Saya",
      desc: "Kelola data diri dan informasi pribadi",
      icon: "👤",
      color: "bg-cyan-500",
      href: "/user/profil",
    },
    {
      title: "Peraturan Kos",
      desc: "Lihat peraturan dan tata tertib kos",
      icon: "📘",
      color: "bg-blue-600",
      href: "/documents/PeraturanKos.pdf",
    },
  ];

  return (
    <div className="bg-gray-100 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Menu Cepat
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
          {menus.map((menu, index) => (
            <Link key={index} href={menu.href}>
              <div className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-[260px] p-6 flex flex-col items-center text-center">
                
                <div
                  className={`${menu.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white mb-5 shrink-0`}
                >
                  {menu.icon}
                </div>

                <h2 className="font-semibold text-lg text-gray-800 mb-3 min-h-[56px] flex items-center">
                  {menu.title}
                </h2>

                <p className="text-sm text-gray-500 leading-relaxed flex-1 flex items-start">
                  {menu.desc}
                </p>

              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}