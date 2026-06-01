"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export default function Reservasi() {
  // ============================================
  // SUPABASE
  // ============================================
  const supabase = createClient();
  const router = useRouter();

  // ============================================
  // STATE
  // ============================================
  const [loading, setLoading] = useState(false);
  const [kamar, setKamar] = useState<any[]>([]);
  const [penyewa, setPenyewa] = useState<any>(null);
  const [hargaTotal, setHargaTotal] = useState(0);

  // STATE BARU UNTUK FASILITAS
  const [fasilitas, setFasilitas] = useState<any[]>([]);

  // State untuk Toast Notification
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  const [form, setForm] = useState({
    penghuni: "1",
    gender: "",
    kamar: "",
    telepon: "",
    tanggal: "",
    namaPenghuni2: "",
    teleponPenghuni2: "",
  });

  // ============================================
  // CAROUSEL LOGIC UNIFIED (MOBILE & DESKTOP)
  // ============================================
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Masukkan gambar-gambar yang ingin ditampilkan di sini
  const bannerImages = [
    "/images/GambarKamar.png",
    "/images/GambarKamar2.png", 
    "/images/GambarKamar3.png", 
  ];

  // Auto-slide effect (setiap 3 detik pindah)
  useEffect(() => {
    const timer = setInterval(() => {
      if (carouselRef.current) {
        const maxIndex = bannerImages.length - 1;
        const nextIndex = currentSlide === maxIndex ? 0 : currentSlide + 1;
        
        carouselRef.current.scrollTo({
          left: nextIndex * carouselRef.current.clientWidth,
          behavior: "smooth",
        });
        setCurrentSlide(nextIndex);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [currentSlide, bannerImages.length]);

  // Sinkronisasi manual swipe dengan state indikator titik
  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollPosition = carouselRef.current.scrollLeft;
      const width = carouselRef.current.clientWidth;
      const newIndex = Math.round(scrollPosition / width);
      if (newIndex !== currentSlide) {
        setCurrentSlide(newIndex);
      }
    }
  };

  // Helper untuk memunculkan notifikasi
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // ============================================
  // GET KAMAR
  // ============================================
  const getKamar = async () => {
    const { data, error } = await supabase
      .from("kamar")
      .select("*")
      .eq("status_kamar", "Tersedia");

    if (error) {
      console.log(error);
      return;
    }

    setKamar(data || []);

    // AUTO SELECT
    if (data && data.length > 0) {
      setForm((prev) => ({
        ...prev,
        kamar: String(data[0].id_kamar),
      }));
    }
  };

  // ============================================
  // GET PENYEWA
  // ============================================
  const getPenyewa = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) return;

    const { data, error } = await supabase
      .from("penyewa")
      .select("*")
      .eq("id_penyewa", user.id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setPenyewa(data);

    setForm((prev) => ({
      ...prev,
      telepon: data.nomor_telepon_penyewa || "",
      gender: data.jenis_kelamin_penyewa === true || data.jenis_kelamin ? "Pria" : "Wanita",
    }));
  };

  // ============================================
  // GET SEMUA FASILITAS (Karena semua kamar fasilitasnya sama)
  // ============================================
  const getFasilitas = async () => {
    const { data, error } = await supabase
      .from("fasilitas")
      .select("*");

    if (!error && data) {
      setFasilitas(data);
    }
  };

  // ============================================
  // LOAD
  // ============================================
  useEffect(() => {
    checkExpiredReservasi();
    getKamar();
    getPenyewa();
    getFasilitas(); // Panggil saat awal komponen di-load
  }, []);

  // ============================================
  // HITUNG HARGA
  // ============================================
  useEffect(() => {
    if (!form.kamar) return;

    const selectedKamar = kamar.find(
      (item) => String(item.id_kamar) === form.kamar
    );

    if (!selectedKamar) return;

    let total = Number(selectedKamar.harga_sewa_kamar);

    // 2 ORANG
    if (form.penghuni === "2") {
      total += Number(selectedKamar.harga_tambahan_penyewa);
    }

    setHargaTotal(total);
  }, [form.penghuni, form.kamar, kamar]);

  // ============================================
  // HANDLE CHANGE
  // ============================================
  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================
  // CHECK EXPIRED RESERVASI
  // ============================================
  const checkExpiredReservasi = async () => {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("reservasi")
        .select(`*, penyewa (email_penyewa)`)
        .eq("status_reservasi", "Menunggu Pembayaran")
        .lt("expired_at", now);

      if (error) {
        console.log(error);
        return;
      }

      if (!data) return;

      for (const item of data) {
        // UPDATE STATUS RESERVASI
        await supabase
          .from("reservasi")
          .update({ status_reservasi: "Batal" })
          .eq("id_reservasi", item.id_reservasi);

        // UPDATE STATUS KAMAR
        await supabase
          .from("kamar")
          .update({ status_kamar: "Tersedia" })
          .eq("id_kamar", item.id_kamar);

        // KIRIM EMAIL BATAL
        await fetch("/api/send-reservasi-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailPenyewa: item.penyewa?.email_penyewa,
            kamar: item.id_kamar,
            tanggalMasuk: item.tanggal_masuk,
            totalHarga: 0,
            status: "Batal",
          }),
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  function tambahSatuBulan(
    tanggalAwal: string
  ) {

    const start =
      new Date(tanggalAwal);

    const tahun =
      start.getFullYear();

    const bulan =
      start.getMonth();

    const tanggal =
      start.getDate();

    const lastDayTarget =
      new Date(
        tahun,
        bulan + 2,
        0
      ).getDate();

    const tanggalFix =
      Math.min(
        tanggal,
        lastDayTarget
      );

    return new Date(
      tahun,
      bulan + 1,
      tanggalFix
    );
  }

  // ============================================
  // HANDLE SUBMIT
  // ============================================
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      // ============================================
      // VALIDASI INPUT 
      // ============================================
      if (!form.kamar) {
        return showToast("Pilih kamar terlebih dahulu!", "error");
      }
      if (!form.telepon) {
        return showToast("Nomor telepon tidak boleh kosong!", "error");
      }
      if (!form.tanggal) {
        return showToast("Tanggal masuk wajib diisi!", "error");
      }

      // VALIDASI 2 ORANG
      if (form.penghuni === "2") {
        if (!form.namaPenghuni2 || form.namaPenghuni2.trim() === "") {
          return showToast("Nama penghuni kedua wajib diisi!", "error");
        }
        if (!form.teleponPenghuni2 || form.teleponPenghuni2.trim() === "") {
          return showToast("Nomor telepon penghuni kedua wajib diisi!", "error");
        }
      }

      // VALIDASI TANGGAL MAX 5 HARI
      const today = new Date();
      // Reset jam ke 00:00:00 untuk perbandingan tanggal yang akurat
      today.setHours(0, 0, 0, 0); 
      
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 5);
      
      const selectedDate = new Date(form.tanggal);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return showToast("Tanggal masuk tidak boleh di masa lalu!", "error");
      }
      if (selectedDate > maxDate) {
        return showToast("Tanggal masuk maksimal 5 hari dari hari ini!", "error");
      }

      setLoading(true);

      // ============================================
      // GET USER LOGIN
      // ============================================
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        setLoading(false);
        return showToast("User tidak ditemukan, silakan login kembali.", "error");
      }

      // ============================================
      // CEK RESERVASI AKTIF
      // ============================================
      const { data: reservasiAktif } = await supabase
        .from("reservasi")
        .select(`*, penyewa (email_penyewa)`)
        .eq("id_penyewa", user.id)
        .in("status_reservasi", ["Menunggu Pembayaran", "Berhasil"]);

      if (reservasiAktif && reservasiAktif.length > 0) {
        setLoading(false);
        return showToast("Anda masih memiliki reservasi aktif!", "error");
      }

      // ============================================
      // CEK SEWA AKTIF
      // ============================================
      const { data: sewaAktif } = await supabase
        .from("sewa")
        .select("*")
        .eq("id_penyewa", user.id)
        .in("status_sewa", ["Aktif", "Menunggu Pembayaran"]);

      if (sewaAktif && sewaAktif.length > 0) {
        setLoading(false);
        return showToast("Anda masih memiliki sewa aktif!", "error");
      }

      // ============================================
      // INSERT RESERVASI
      // ============================================
      const { data: reservasiData, error: reservasiError } = await supabase
        .from("reservasi")
        .insert([
          {
            id_penyewa: user.id,
            id_kamar: Number(form.kamar),
            jumlah_penghuni: Number(form.penghuni),
            nama_penghuni2: form.namaPenghuni2 || null,
            nomor_telepon2: form.teleponPenghuni2 || null,
            tanggal_reservasi: new Date().toISOString(),
            tanggal_masuk: form.tanggal,
            status_reservasi: "Menunggu Pembayaran",
            expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select()
        .single();

      if (reservasiError) {
        console.log(reservasiError);
        setLoading(false);
        return showToast("Gagal membuat reservasi: " + reservasiError.message, "error");
      }

      // ============================================
      // INSERT SEWA
      // ============================================
      const tanggalBerakhir =
      tambahSatuBulan(
        form.tanggal
      );

      const tanggalBerakhirString =
      `${tanggalBerakhir.getFullYear()}-${
        String(
          tanggalBerakhir.getMonth() + 1
        ).padStart(2, "0")
      }-${
        String(
          tanggalBerakhir.getDate()
        ).padStart(2, "0")
      }`;

      const { data: sewaData, error: sewaError } = await supabase
        .from("sewa")
        .insert([
          {
            id_reservasi: reservasiData.id_reservasi,
            id_penyewa: user.id,
            id_kamar: Number(form.kamar),
            tanggal_sewa: form.tanggal,
            tanggal_berakhir_sewa: tanggalBerakhirString,
            status_sewa: "Menunggu Pembayaran",
          },
        ])
        .select()
        .single();

      if (sewaError) {
        console.log(sewaError);
        setLoading(false);
        return showToast("Gagal membuat data sewa: " + sewaError.message, "error");
      }

      // ============================================
      // INSERT TAGIHAN
      // ============================================
      const batasPembayaran = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const { error: tagihanError } = await supabase
        .from("tagihan")
        .insert([
          {
            id_sewa: sewaData.id_sewa,
            batas_pembayaran: batasPembayaran,
            total_tagihan: hargaTotal,
            status_tagihan: "Belum Dibayar",
          },
        ]);

      if (tagihanError) {
        console.log(tagihanError);
        setLoading(false);
        return showToast("Gagal membuat tagihan: " + tagihanError.message, "error");
      }

      // ============================================
      // UPDATE STATUS KAMAR
      // ============================================
      const { error: kamarError } = await supabase
        .from("kamar")
        .update({ status_kamar: "Direservasi" })
        .eq("id_kamar", Number(form.kamar));

      if (kamarError) {
        console.log(kamarError);
        setLoading(false);
        return showToast("Gagal update status kamar: " + kamarError.message, "error");
      }

      // ============================================
      // KIRIM EMAIL
      // ============================================
      await fetch("/api/send-reservasi-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailPenyewa: penyewa?.email_penyewa,
          kamar: form.kamar,
          tanggalMasuk: form.tanggal,
          totalHarga: hargaTotal,
          status: "Menunggu Pembayaran",
        }),
      });

      // ============================================
      // SUCCESS
      // ============================================
      showToast("Reservasi berhasil dibuat!", "success");
      
      // Delay sedikit agar toast terbaca sebelum pindah halaman
      setTimeout(() => {
        router.push("/user/pembayaran");
      }, 1500);

    } catch (error: any) {
      console.log(error);
      showToast(error.message || "Terjadi kesalahan sistem.", "error");
      setLoading(false);
    }
  };

  // ============================================
  // FORMAT LOCAL DATE UNTUK INPUT CALENDAR
  // ============================================
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const maxDateLimit = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto pb-32 px-4 mt-10 relative">

      {/* ============================================ */}
      {/* TOAST NOTIFICATION */}
      {/* ============================================ */}
      {toast.show && (
        <div 
          className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 ${
            toast.type === "success" 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
          <button 
            onClick={() => setToast({ ...toast, show: false })} 
            className="ml-4 hover:opacity-70 transition"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* UNIFIED BANNER (CAROUSEL AUTO-SLIDE) */}
      {/* ============================================ */}
      <div className="relative mb-8 rounded-2xl overflow-hidden h-[220px] md:h-[400px]">
        <div 
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {bannerImages.map((src, idx) => (
            <div key={idx} className="flex-shrink-0 w-full h-full snap-center relative ">
              <img 
                src={src} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={`Kamar ${idx + 1}`} 
              />
            </div>
          ))}
        </div>
        
        {/* Indikator Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {bannerImages.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 shadow-sm ${currentSlide === idx ? "w-8 bg-white" : "w-2 bg-white/60"}`}
            />
          ))}
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="border rounded-2xl p-6 bg-white shadow-sm space-y-5"
      >
        {/* JUMLAH PENGHUNI */}
        <div>
          <label className="font-medium">Jumlah Penghuni</label>
          <div className="flex gap-5 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="penghuni"
                value="1"
                checked={form.penghuni === "1"}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              Satu Orang
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="penghuni"
                value="2"
                checked={form.penghuni === "2"}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              Dua Orang
            </label>
          </div>
        </div>

        {/* JENIS KELAMIN */}
        <div>
          <label className="font-medium">Jenis Kelamin</label>
          <div className="w-full border rounded-lg p-3 mt-2 bg-gray-50 text-gray-700">
            {form.gender || "Memuat..."}
          </div>
        </div>

        {/* PILIH KAMAR */}
        <div>
          <label className="font-medium">Pilih Kamar</label>
          <select
            name="kamar"
            value={form.kamar}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition"
          >
            {kamar.length === 0 ? (
              <option value="">-- Kamar Tidak Tersedia --</option>
            ) : (
              kamar.map((item) => (
                <option key={item.id_kamar} value={item.id_kamar}>
                  Kamar {item.id_kamar}
                </option>
              ))
            )}
          </select>
        </div>

        {/* TELEPON */}
        <div>
          <label className="font-medium">Nomor Telepon</label>
          <input
            type="text"
            value={form.telepon}
            readOnly
            className="w-full border rounded-lg p-3 mt-2 bg-gray-50 text-gray-700 outline-none"
          />
        </div>

        {/* PENGHUNI 2 */}
        {form.penghuni === "2" && (
          <>
            <div>
              <label className="font-medium">Nama Penghuni Ke-2 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="namaPenghuni2"
                value={form.namaPenghuni2}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
            <div>
              <label className="font-medium">Nomor Telepon Penghuni Ke-2 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="teleponPenghuni2"
                value={form.teleponPenghuni2}
                onChange={handleChange}
                placeholder="Contoh: 08123456789"
                className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
          </>
        )}

        {/* TANGGAL */}
        <div>
          <label className="font-medium">Tanggal Masuk <span className="text-red-500">*</span></label>
          <input
            type="date"
            name="tanggal"
            value={form.tanggal}
            onChange={handleChange}
            min={localToday}
            max={maxDateLimit}
            className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
          <p className="text-sm text-gray-500 mt-2">Maksimal 5 hari dari hari ini</p>
        </div>

        {/* HARGA */}
        <div className="border rounded-xl p-5 bg-blue-50 border-blue-100">
          <p className="text-blue-600/80 text-sm font-medium">Total Harga</p>
          <h2 className="text-3xl font-bold text-[#1c3163] mt-1">
            Rp {hargaTotal.toLocaleString("id-ID")}
          </h2>
        </div>

        {/* BUTTON */}
        <Button
          type="submit"
          disabled={loading || kamar.length === 0}
          className="w-full bg-[#1c3163] hover:bg-[#15254b] text-white py-6 text-lg font-medium transition disabled:bg-gray-400"
        >
          {loading ? "Memproses Reservasi..." : "Lanjutkan Reservasi"}
        </Button>
      </form>

      {/* ============================================ */}
      {/* SECTION FASILITAS KAMAR DARI DATABASE */}
      {/* ============================================ */}
      <div className="border rounded-2xl p-6 bg-white shadow-sm mt-6">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-3">Fasilitas Kamar</h3>
        {fasilitas.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fasilitas.map((item) => (
              <div key={item.id_fasilitas} className="flex items-center gap-3 text-gray-700">
                <CheckCircle size={20} className="text-[#1c3163]" />
                <span className="text-sm font-medium capitalize">{item.nama_fasilitas}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Memuat data fasilitas...</p>
        )}
      </div>

    </div>
  );
}