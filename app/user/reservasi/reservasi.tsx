"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, X, XCircle, CalendarDays } from "lucide-react";

export default function Reservasi() {
  // ============================================
  // SUPABASE & ROUTER
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
  const [fasilitas, setFasilitas] = useState<any[]>([]);

  // State untuk Data Reservasi User
  const [userReservasi, setUserReservasi] = useState<any[]>([]);
  const [cancelData, setCancelData] = useState<{ id_reservasi: number, id_kamar: number } | null>(null);

  // State untuk Persetujuan & Modal Aturan Kos
  const [isAgreed, setIsAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // State untuk Toast Notification
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", 
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
  // CAROUSEL LOGIC AUTOMATIC SLIDE
  // ============================================
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const bannerImages = [
    "/images/GambarKamar.png",
    "/images/GambarKamar2.png", 
    "/images/GambarKamar3.png", 
  ];

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

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // ============================================
  // FORMAT TANGGAL & WARNA STATUS
  // ============================================
  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Berhasil": return "bg-green-100 text-green-700 border border-green-200";
      case "Batal": return "bg-red-100 text-red-700 border border-red-200";
      case "Menunggu Pembayaran": return "bg-blue-100 text-blue-700 border border-blue-200";
      default: return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    }
  };

  // ============================================
  // GET DATA AWAL
  // ============================================
  const getKamar = async () => {
    const { data, error } = await supabase
      .from("kamar")
      .select("*")
      .eq("status_kamar", "Tersedia");

    if (!error) {
      setKamar(data || []);
      if (data && data.length > 0) {
        setForm((prev) => ({
          ...prev,
          kamar: String(data[0].id_kamar),
        }));
      }
    }
  };

  const getPenyewa = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) return;

    const { data, error } = await supabase
      .from("penyewa")
      .select("*")
      .eq("id_penyewa", user.id)
      .single();

    if (!error && data) {
      setPenyewa(data);
      setForm((prev) => ({
        ...prev,
        telepon: data.nomor_telepon_penyewa || "",
        gender: data.jenis_kelamin_penyewa === true || data.jenis_kelamin ? "Pria" : "Wanita",
      }));
      getUserReservasi(user.id);
    }
  };

  const getUserReservasi = async (userId: string) => {
    const { data, error } = await supabase
      .from("reservasi")
      .select(`*, kamar (id_kamar)`)
      .eq("id_penyewa", userId)
      .in("status_reservasi", ["Menunggu Pembayaran", "Berhasil"]) 
      .order("tanggal_reservasi", { ascending: false }); 
    
    if (!error && data) setUserReservasi(data);
  };

  useEffect(() => {
    checkExpiredReservasi();
    getKamar();
    getPenyewa();
  }, []);

  // ============================================
  // LOAD FASILITAS BERDASARKAN KAMAR (BARU)
  // ============================================
  useEffect(() => {
    const fetchFasilitasKamar = async () => {
      if (!form.kamar) {
        setFasilitas([]);
        return;
      }

      // Ambil detail fasilitas khusus untuk id_kamar yang dipilih di dropdown
      const { data, error } = await supabase
        .from("detail_fasilitas_kamar")
        .select("id_detail_fasiliitas_kamar, informasi_tambahan, fasilitas(nama_fasilitas)")
        .eq("id_kamar", form.kamar);

      if (!error && data) {
        setFasilitas(data);
      }
    };

    fetchFasilitasKamar();
  }, [form.kamar]); // Effect ini akan berjalan setiap kali form.kamar berubah

  // ============================================
  // KALKULASI HARGA DINAMIS
  // ============================================
  useEffect(() => {
    if (!form.kamar) return;
    const selectedKamar = kamar.find((item) => String(item.id_kamar) === form.kamar);
    if (!selectedKamar) return;

    let total = Number(selectedKamar.harga_sewa_kamar);
    if (form.penghuni === "2") {
      total += Number(selectedKamar.harga_tambahan_penyewa);
    }
    setHargaTotal(total);
  }, [form.penghuni, form.kamar, kamar]);

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================
  // BERSIHKAN RESERVASI KADALUARSA
  // ============================================
  const checkExpiredReservasi = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("reservasi")
        .select(`*, penyewa (email_penyewa)`)
        .eq("status_reservasi", "Menunggu Pembayaran")
        .lt("expired_at", now);

      if (!error && data) {
        for (const item of data) {
          await supabase.from("reservasi").update({ status_reservasi: "Batal" }).eq("id_reservasi", item.id_reservasi);
          await supabase.from("kamar").update({ status_kamar: "Tersedia" }).eq("id_kamar", item.id_kamar);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  function tambahSatuBulan(tanggalAwal: string) {
    const start = new Date(tanggalAwal);
    const tahun = start.getFullYear();
    const bulan = start.getMonth();
    const tanggal = start.getDate();
    const lastDayTarget = new Date(tahun, bulan + 2, 0).getDate();
    const tanggalFix = Math.min(tanggal, lastDayTarget);
    return new Date(tahun, bulan + 1, tanggalFix);
  }

  // ============================================
  // PROSES SIMPAN RESERVASI
  // ============================================
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    let roomClaimedId: number | null = null;

    try {
      if (!form.kamar) return showToast("Pilih kamar terlebih dahulu!", "error");
      if (!form.telepon) return showToast("Nomor telepon tidak boleh kosong!", "error");
      if (!form.tanggal) return showToast("Tanggal masuk wajib diisi!", "error");
      if (!isAgreed) return showToast("Anda wajib menyetujui Syarat dan Ketentuan Kos terlebih dahulu!", "error");

      if (form.penghuni === "2") {
        if (!form.namaPenghuni2 || form.namaPenghuni2.trim() === "") return showToast("Nama penghuni kedua wajib diisi!", "error");
        if (!form.teleponPenghuni2 || form.teleponPenghuni2.trim() === "") return showToast("Nomor telepon penghuni kedua wajib diisi!", "error");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 5);
      const selectedDate = new Date(form.tanggal);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) return showToast("Tanggal masuk tidak boleh di masa lalu!", "error");
      if (selectedDate > maxDate) return showToast("Tanggal masuk maksimal 5 hari dari hari ini!", "error");

      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        setLoading(false);
        return showToast("User tidak ditemukan, silakan login kembali.", "error");
      }

      // ============================================
      // VALIDASI BATAS MAKSIMAL (3 KAMAR)
      // ============================================
      const { data: sewaAktif } = await supabase
        .from("sewa")
        .select("id_sewa")
        .eq("id_penyewa", user.id)
        .in("status_sewa", ["Aktif", "Menunggu Pembayaran"]);

      if (sewaAktif && sewaAktif.length >= 3) {
        setLoading(false);
        return showToast("Anda hanya dapat melakukan sewa/reservasi maksimal 3 kamar.", "error");
      }

      // Claim kamar
      const { data: claimKamar, error: errClaim } = await supabase
        .from("kamar")
        .update({ status_kamar: "Direservasi" })
        .eq("id_kamar", Number(form.kamar))
        .eq("status_kamar", "Tersedia") 
        .select();

      if (errClaim || !claimKamar || claimKamar.length === 0) {
        setLoading(false);
        getKamar(); 
        return showToast("Gagal! Kamar ini baru saja direservasi oleh orang lain.", "error");
      }

      roomClaimedId = Number(form.kamar);

      // Insert Reservasi
      const { data: reservasiData, error: reservasiError } = await supabase
        .from("reservasi")
        .insert([{
            id_penyewa: user.id,
            id_kamar: Number(form.kamar),
            jumlah_penghuni: Number(form.penghuni),
            nama_penghuni2: form.namaPenghuni2 || null,
            nomor_telepon2: form.teleponPenghuni2 || null,
            tanggal_reservasi: new Date().toISOString(),
            tanggal_masuk: form.tanggal,
            status_reservasi: "Menunggu Pembayaran",
            expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select().single();

      if (reservasiError) throw new Error("Gagal membuat data reservasi: " + reservasiError.message);

      // Insert Sewa
      const tanggalBerakhir = tambahSatuBulan(form.tanggal);
      const tanggalBerakhirString = `${tanggalBerakhir.getFullYear()}-${String(tanggalBerakhir.getMonth() + 1).padStart(2, "0")}-${String(tanggalBerakhir.getDate()).padStart(2, "0")}`;

      const { data: sewaData, error: sewaError } = await supabase
        .from("sewa")
        .insert([{
            id_reservasi: reservasiData.id_reservasi,
            id_penyewa: user.id,
            id_kamar: Number(form.kamar),
            tanggal_sewa: form.tanggal,
            tanggal_berakhir_sewa: tanggalBerakhirString,
            status_sewa: "Menunggu Pembayaran",
        }])
        .select().single();

      if (sewaError) throw new Error("Gagal membuat kontrak sewa: " + sewaError.message);

      // Insert Tagihan
      const batasPembayaran = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const { error: tagihanError } = await supabase
        .from("tagihan")
        .insert([{
            id_sewa: sewaData.id_sewa,
            batas_pembayaran: batasPembayaran,
            total_tagihan: hargaTotal,
            status_tagihan: "Belum Dibayar",
        }]);

      if (tagihanError) throw new Error("Gagal menerbitkan lembar tagihan: " + tagihanError.message);

      showToast("Reservasi berhasil dibuat!", "success");
      getUserReservasi(user.id);
      setTimeout(() => { router.push("/user/pembayaran"); }, 1500);

    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Terjadi kesalahan sistem internal.", "error");
      setLoading(false);
      if (roomClaimedId) {
        await supabase.from("kamar").update({ status_kamar: "Tersedia" }).eq("id_kamar", roomClaimedId);
      }
    }
  };

  // ============================================
  // HANDLE BATALKAN RESERVASI (User)
  // ============================================
  const executeBatalkanReservasiUser = async () => {
    if (!cancelData) return;
    const { id_reservasi, id_kamar } = cancelData;
    const { data: authData } = await supabase.auth.getUser();

    try {
      setLoading(true);

      const { error: errorReservasi } = await supabase.from("reservasi").update({ status_reservasi: "Batal" }).eq("id_reservasi", id_reservasi);
      if (errorReservasi) throw errorReservasi;

      if (id_kamar) await supabase.from("kamar").update({ status_kamar: "Tersedia" }).eq("id_kamar", id_kamar);

      const { data: sewaData } = await supabase.from("sewa").select("id_sewa").eq("id_reservasi", id_reservasi).maybeSingle();
      if (sewaData && sewaData.id_sewa) {
        const id_sewa = sewaData.id_sewa;
        await supabase.from("sewa").update({ status_sewa: "Berakhir" }).eq("id_sewa", id_sewa);

        const { data: tagihanData } = await supabase.from("tagihan").select("id_tagihan").eq("id_sewa", id_sewa).maybeSingle();
        if (tagihanData && tagihanData.id_tagihan) {
          const id_tagihan = tagihanData.id_tagihan;
          await supabase.from("tagihan").update({ status_tagihan: "Kadaluarsa" }).eq("id_tagihan", id_tagihan);
          await supabase.from("pembayaran").update({ status_pembayaran: "Gagal" }).eq("id_tagihan", id_tagihan);
        }
      }

      showToast("Reservasi berhasil dibatalkan.", "success");
      getKamar(); 
      if (authData?.user) getUserReservasi(authData.user.id); 
    } catch (error: any) {
      showToast("Terjadi kesalahan saat membatalkan: " + error.message, "error");
    } finally {
      setLoading(false);
      setCancelData(null);
    }
  };

  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const maxDateLimit = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto pb-32 px-4 mt-10 relative">

      {/* TOAST COMPONENT */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 ${toast.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition"><X size={18} /></button>
        </div>
      )}

      {/* BANNER CAROUSEL CONTAINER */}
      <div className="relative mb-8 rounded-2xl overflow-hidden h-[220px] md:h-[400px]">
        <div ref={carouselRef} onScroll={handleScroll} className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {bannerImages.map((src, idx) => (
            <div key={idx} className="flex-shrink-0 w-full h-full snap-center relative ">
              <img src={src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`Kamar ${idx + 1}`} />
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          {bannerImages.map((_, idx) => (
            <div key={idx} className={`h-2 rounded-full transition-all duration-300 shadow-sm ${currentSlide === idx ? "w-8 bg-white" : "w-2 bg-white/60"}`} />
          ))}
        </div>
      </div>

      {/* MAIN FORM TRANSACTION */}
      <form onSubmit={handleSubmit} className="border rounded-2xl p-6 bg-white shadow-sm space-y-5">
        <div>
          <label className="font-medium">Jumlah Penghuni</label>
          <div className="flex gap-5 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="penghuni" value="1" checked={form.penghuni === "1"} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer" /> Satu Orang
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="penghuni" value="2" checked={form.penghuni === "2"} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer" /> Dua Orang
            </label>
          </div>
        </div>

        <div>
          <label className="font-medium">Jenis Kelamin</label>
          <div className="w-full border rounded-lg p-3 mt-2 bg-gray-50 text-gray-700">{form.gender || "Memuat..."}</div>
        </div>

        <div>
          <label className="font-medium">Denah Kamar Kos</label>
          <p className="text-sm text-gray-500 mb-2">Silakan lihat denah di bawah ini untuk mengetahui posisi kamar.</p>
          <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-2 mt-2">
            <img src="/images/DenahKamar.png" alt="Denah Kamar Kos" className="w-full h-auto object-contain max-h-[300px] rounded-md" />
          </div>
        </div>

        <div>
          <label className="font-medium">Pilih Kamar</label>
          <select name="kamar" value={form.kamar} onChange={handleChange} className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition">
            {kamar.length === 0 ? <option value="">-- Kamar Tidak Tersedia --</option> : kamar.map((item) => <option key={item.id_kamar} value={item.id_kamar}>Kamar {item.id_kamar}</option>)}
          </select>
        </div>

        <div>
          <label className="font-medium">Nomor Telepon</label>
          <input type="text" value={form.telepon} readOnly className="w-full border rounded-lg p-3 mt-2 bg-gray-50 text-gray-700 outline-none" />
        </div>

        {form.penghuni === "2" && (
          <>
            <div>
              <label className="font-medium">Nama Penghuni Ke-2 <span className="text-red-500">*</span></label>
              <input type="text" name="namaPenghuni2" value={form.namaPenghuni2} onChange={handleChange} placeholder="Masukkan nama lengkap" className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition" />
            </div>
            <div>
              <label className="font-medium">Nomor Telepon Penghuni Ke-2 <span className="text-red-500">*</span></label>
              <input type="text" name="teleponPenghuni2" value={form.teleponPenghuni2} onChange={handleChange} placeholder="Contoh: 08123456789" className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition" />
            </div>
          </>
        )}

        <div>
          <label className="font-medium">Tanggal Masuk <span className="text-red-500">*</span></label>
          <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} min={localToday} max={maxDateLimit} className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-blue-100 outline-none transition" />
          <p className="text-sm text-gray-500 mt-2">Maksimal 5 hari dari hari ini</p>
        </div>

        <div className="border rounded-xl p-5 bg-blue-50 border-blue-100">
          <p className="text-blue-600/80 text-sm font-medium">Total Harga</p>
          <h2 className="text-3xl font-bold text-[#1c3163] mt-1">Rp {hargaTotal.toLocaleString("id-ID")}</h2>
        </div>

        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <input type="checkbox" id="terms" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="mt-1 w-5 h-5 text-[#1c3163] rounded border-gray-300 focus:ring-[#1c3163] cursor-pointer" />
          <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
            Saya telah membaca dan menyetujui <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 font-semibold hover:underline">Syarat, Ketentuan, dan Aturan Kos</button>.
          </label>
        </div>

        <Button type="submit" disabled={loading || kamar.length === 0} className="w-full bg-[#1c3163] hover:bg-[#15254b] text-white py-6 text-lg font-medium transition disabled:bg-gray-400">
          {loading ? "Memproses Reservasi..." : "Lanjutkan Reservasi"}
        </Button>
      </form>

      {/* ============================================ */}
      {/* UPDATE FASILITAS KAMAR DENGAN INFORMASI TAMBAHAN */}
      {/* ============================================ */}
      <div className="border rounded-2xl p-6 bg-white shadow-sm mt-6">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-3">Fasilitas Kamar {form.kamar}</h3>
        {fasilitas.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fasilitas.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-gray-700">
                <CheckCircle size={20} className="text-[#1c3163] shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium capitalize block">
                    {item.fasilitas?.nama_fasilitas}
                  </span>
                  {/* Menampilkan informasi tambahan (Daya Watt, Ukuran, dll) jika ada */}
                  {item.informasi_tambahan && (
                    <span className="text-xs text-gray-500 block mt-0.5 leading-relaxed">
                      {item.informasi_tambahan}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Memuat data fasilitas / fasilitas tidak tersedia...</p>
        )}
      </div>

      <div className="border rounded-2xl bg-white shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b bg-gray-50 flex items-center gap-3">
          <CalendarDays className="text-gray-600" size={20} />
          <h3 className="font-bold text-gray-800 text-lg">Reservasi Anda</h3>
        </div>
        
        <div className="p-0">
          {userReservasi.length > 0 ? (
            <div className="divide-y">
              {userReservasi.map((res) => {
                const kamarData = Array.isArray(res.kamar) ? res.kamar[0] : res.kamar;
                return (
                  <div key={res.id_reservasi} className="p-5 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-gray-800 text-lg">Kamar {kamarData?.id_kamar}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(res.status_reservasi)}`}>
                          {res.status_reservasi}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Tanggal Masuk: {formatDate(res.tanggal_masuk)}</p>
                    </div>
                    
                    {res.status_reservasi === "Menunggu Pembayaran" && (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={() => router.push("/user/pembayaran")} className="flex-1 md:w-32 bg-[#1c3163] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-[#15254b] transition text-center">Bayar Sekarang</button>
                        <button onClick={() => setCancelData({ id_reservasi: res.id_reservasi, id_kamar: kamarData?.id_kamar })} className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex items-center justify-center border border-red-100" title="Batalkan Reservasi"><XCircle size={18} /></button>
                      </div>
                    )}
                    {res.status_reservasi === "Berhasil" && (
                      <div className="text-center py-2 px-6 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-100">Reservasi Berhasil</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <CalendarDays className="mx-auto mb-3 opacity-30" size={32} />
              <p className="text-sm">Anda belum memiliki reservasi yang aktif.</p>
            </div>
          )}
        </div>
      </div>

      {cancelData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 relative animate-in zoom-in duration-200 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Batalkan Pesanan?</h2>
              <p className="text-gray-500 text-sm leading-relaxed">Kamar ini akan kembali tersedia untuk orang lain. Tagihan Anda akan otomatis dibatalkan. Yakin ingin melanjutkan?</p>
              <div className="flex gap-3 w-full mt-4 pt-2">
                <button onClick={() => setCancelData(null)} disabled={loading} className="flex-1 px-4 py-3 rounded-xl border font-medium text-gray-700 hover:bg-gray-50 transition">Kembali</button>
                <button onClick={executeBatalkanReservasiUser} disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:bg-gray-400">{loading ? "Proses..." : "Ya, Batal"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTerms && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-[#1c3163]">Syarat & Ketentuan Kos 75</h3>
              <button onClick={() => setShowTerms(false)} className="text-gray-500 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 text-gray-700 text-sm leading-relaxed">
              <section><h4 className="font-bold text-gray-900 mb-2">1. Pemesanan & Durasi Sewa</h4><ul className="list-disc pl-5 space-y-1"><li>Pemesanan kamar melalui sistem dianggap sah setelah pembayaran diverifikasi oleh admin.</li><li>Durasi sewa kos adalah <b>minimal 1 (satu) bulan</b>.</li><li>Uang yang sudah dibayarkan tidak dapat dikembalikan *(Non-refundable)* dengan alasan apapun.</li></ul></section>
              <section><h4 className="font-bold text-gray-900 mb-2">2. Tagihan & Perpanjangan</h4><ul className="list-disc pl-5 space-y-1"><li>Tagihan bulan berikutnya akan otomatis diterbitkan oleh sistem 10 hari sebelum masa jatuh tempo.</li><li>Batas waktu pembayaran perpanjangan adalah selambat-lambatnya pada tanggal masa sewa berakhir.</li><li>Keterlambatan pembayaran tanpa konfirmasi kepada pengelola dapat berakibat pada pemutusan hak sewa kamar secara sepihak.</li></ul></section>
              <section><h4 className="font-bold text-gray-900 mb-2">3. Pembatalan & Pengosongan Kamar</h4><ul className="list-disc pl-5 space-y-1"><li>Jika penyewa ingin berhenti menyewa, harap menginformasikan kepada pengelola selambat-lambatnya 7 hari sebelum masa sewa habis.</li><li>Kamar yang ditinggalkan harus dalam keadaan bersih seperti sedia kala tanpa adanya kerusakan fasilitas.</li></ul></section>
              <section><h4 className="font-bold text-gray-900 mb-2">4. Tata Tertib Kos</h4><ul className="list-disc pl-5 space-y-1"><li>Penyewa diwajibkan menjaga kebersihan, ketertiban, dan ketenangan lingkungan kos.</li><li>Dilarang membawa atau menggunakan obat-obatan terlarang (narkoba), minuman keras, dan berjudi di dalam area kos.</li><li>Pengelola berhak melakukan tindakan tegas berupa pengusiran apabila penyewa terbukti melanggar tata tertib berat.</li></ul></section>
            </div>
            <div className="p-5 border-t bg-gray-50 flex gap-3">
              <Button type="button" onClick={() => { setIsAgreed(true); setShowTerms(false); }} className="w-full bg-[#1c3163] hover:bg-[#15254b] text-white">Saya Mengerti & Setuju</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}