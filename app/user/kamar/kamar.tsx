"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, X, BedDouble, Users, DoorOpen, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KamarPenyewaPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  
  // NEW: State untuk menampung banyak sewa/kamar aktif
  const [sewaList, setSewaList] = useState<any[]>([]);
  const [selectedSewaId, setSelectedSewaId] = useState<string>("");

  const [sewa, setSewa] = useState<any>(null);
  const [reservasi, setReservasi] = useState<any>(null);
  const [kamar, setKamar] = useState<any>(null);
  const [fasilitas, setFasilitas] = useState<any[]>([]);

  // State Modals
  const [showModalPenghuni, setShowModalPenghuni] = useState(false);
  const [showModalKeluar, setShowModalKeluar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form Ubah Penghuni
  const [formPenghuni, setFormPenghuni] = useState({
    jumlah: 1,
    nama_penghuni2: "",
    nomor_telepon2: "",
  });

  const statusColors: any = {
    "Baik": "bg-green-100 text-green-700",
    "Rusak": "bg-red-100 text-red-700",
    "Sedang Diperbaiki": "bg-yellow-100 text-yellow-700",
  };

  // State Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // ============================================
  // LOAD DAFTAR KAMAR AKTIF (Langkah 1)
  // ============================================
  const fetchSewaList = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mengambil semua sewa aktif tanpa .single()
      const { data: sewaData } = await supabase
        .from("sewa")
        .select("*")
        .eq("id_penyewa", user.id)
        .eq("status_sewa", "Aktif");

      setSewaList(sewaData || []);

      if (sewaData && sewaData.length > 0) {
        // Jika belum ada yang dipilih, pilih kamar pertama secara default
        if (!selectedSewaId) {
          setSelectedSewaId(String(sewaData[0].id_sewa));
        }
      } else {
        setSewa(null);
      }
    } catch (error) {
      console.error("Gagal memuat daftar sewa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSewaList();
  }, [supabase]);

  // ============================================
  // LOAD DETAIL KAMAR YANG DIPILIH (Langkah 2)
  // ============================================
  useEffect(() => {
    if (!selectedSewaId || sewaList.length === 0) return;

    const fetchDetailKamarTerpilih = async () => {
      try {
        const currentSewa = sewaList.find((s) => String(s.id_sewa) === selectedSewaId);
        if (!currentSewa) return;

        setSewa(currentSewa);

        // Get Data Reservasi terkait kamar ini
        const { data: reservasiData } = await supabase
          .from("reservasi")
          .select("*")
          .eq("id_reservasi", currentSewa.id_reservasi)
          .single();
        
        if (reservasiData) {
          setReservasi(reservasiData);
          setFormPenghuni({
            jumlah: reservasiData.jumlah_penghuni || 1,
            nama_penghuni2: reservasiData.nama_penghuni2 || "",
            nomor_telepon2: reservasiData.nomor_telepon2 || "",
          });
        }

        // Get Data Detail Kamar (Harga)
        const { data: kamarData } = await supabase
          .from("kamar")
          .select("*")
          .eq("id_kamar", currentSewa.id_kamar)
          .single();
        setKamar(kamarData);

        // Get Fasilitas Kamar
        const { data: fasilitasData } = await supabase
          .from("detail_fasilitas_kamar")
          .select("kondisi_fasilitas, fasilitas(nama_fasilitas)")
          .eq("id_kamar", currentSewa.id_kamar);
        
        setFasilitas(fasilitasData || []);
      } catch (error) {
        console.error("Gagal memuat detail kamar:", error);
      }
    };

    fetchDetailKamarTerpilih();
  }, [selectedSewaId, sewaList]);

  // ============================================
  // LOGIKA: BATAS WAKTU UBAH PENGHUNI
  // ============================================
  const cekBisaUbahPenghuni = () => {
    if (!reservasi) return false;
    if (!reservasi.terakhir_ubah_penghuni) return true; 

    const lastChange = new Date(reservasi.terakhir_ubah_penghuni).getTime();
    const daysPassed = (Date.now() - lastChange) / (1000 * 60 * 60 * 24);
    return daysPassed >= 30;
  };

  const isUbahPenghuniDisabled = !cekBisaUbahPenghuni();

  // ============================================
  // ACTION: UBAH PENGHUNI
  // ============================================
  const handleUbahPenghuni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formPenghuni.jumlah === 2 && (!formPenghuni.nama_penghuni2 || !formPenghuni.nomor_telepon2)) {
      return showToast("Data penghuni kedua wajib diisi!", "error");
    }

    setIsProcessing(true);
    try {
      const updateData: any = {
        jumlah_penghuni: formPenghuni.jumlah,
        nama_penghuni2: formPenghuni.jumlah === 2 ? formPenghuni.nama_penghuni2 : null,
        nomor_telepon2: formPenghuni.jumlah === 2 ? formPenghuni.nomor_telepon2 : null,
        terakhir_ubah_penghuni: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("reservasi")
        .update(updateData)
        .eq("id_reservasi", reservasi.id_reservasi);

      if (error) throw error;
      
      setReservasi({ ...reservasi, ...updateData });
      showToast("Jumlah penghuni berhasil diperbarui!", "success");
      setShowModalPenghuni(false);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // ACTION: KELUAR KOS
  // ============================================
  const handleKeluarKos = async () => {
    setIsProcessing(true);
    try {
      const { error: errSewa } = await supabase
        .from("sewa")
        .update({ status_sewa: "Berakhir" })
        .eq("id_sewa", sewa.id_sewa);
      if (errSewa) throw errSewa;

      const { error: errKamar } = await supabase
        .from("kamar")
        .update({ status_kamar: "Tersedia" })
        .eq("id_kamar", sewa.id_kamar);
      if (errKamar) throw errKamar;

      const { error: errReservasi } = await supabase
        .from("reservasi")
        .update({ status_reservasi: "Selesai" })
        .eq("id_reservasi", reservasi.id_reservasi);
      if (errReservasi) throw errReservasi;

      showToast("Anda telah berhasil menyelesaikan masa sewa kos.", "success");
      setShowModalKeluar(false);

      // Memuat ulang daftar kamar aktif yang tersisa
      setTimeout(() => {
        setSelectedSewaId("");
        fetchSewaList();
      }, 2000);

    } catch (err: any) {
      showToast("Gagal memproses keluar kos: " + err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Kalkulasi Harga
  const hargaTotal = kamar && reservasi 
    ? Number(kamar.harga_sewa_kamar) + (reservasi.jumlah_penghuni === 2 ? Number(kamar.harga_tambahan_penyewa) : 0)
    : 0;

  if (loading) return <div className="p-8 text-center text-gray-500 mt-20">Memuat data kamar...</div>;

  if (sewaList.length === 0 || !sewa) return (
    <div className="max-w-2xl mx-auto p-6 md:pt-20 text-center space-y-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <BedDouble size={40} className="text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Tidak Ada Kamar Aktif</h2>
      <p className="text-gray-500">Anda belum memiliki kamar yang sedang disewa saat ini.</p>
      <Button onClick={() => router.push("/user/reservasi")} className="mt-4 bg-[#2C5EBF]">Cari Kamar Sekarang</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-6 md:pt-10 mb-20 relative">
      
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold text-gray-800">Kamar Saya</h1>
        
        {/* DROPDOWN PILIHAN KAMAR (Hanya tampil jika kamar lebih dari 1) */}
        {sewaList.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Pilih Kamar:</span>
            <select
              value={selectedSewaId}
              onChange={(e) => setSelectedSewaId(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100 transition"
            >
              {sewaList.map((item) => (
                <option key={item.id_sewa} value={item.id_sewa}>
                  Kamar {item.id_kamar}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: INFO KAMAR */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-500 font-medium">Nomor Kamar</p>
                <h2 className="text-5xl font-extrabold text-[#2C5EBF] mt-1">{sewa.id_kamar}</h2>
              </div>
              <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                Status: {sewa.status_sewa}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-6">
              <div>
                <p className="text-sm text-gray-500">Tanggal Masuk</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {reservasi?.tanggal_masuk ? new Date(reservasi.tanggal_masuk).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Berakhir Pada</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {sewa.tanggal_berakhir_sewa ? new Date(sewa.tanggal_berakhir_sewa).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* FASILITAS */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Fasilitas Kamar</h3>
            {fasilitas.length === 0 ? (
              <p className="text-gray-400 text-sm">Belum ada data fasilitas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fasilitas.map((f, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-xl bg-gray-50">
                    <span className="font-medium text-gray-700">{f.fasilitas?.nama_fasilitas}</span>
                    <span className={`text-xs px-2 py-1 rounded-md font-semibold ${statusColors[f.kondisi_fasilitas] || 'bg-gray-100 text-gray-700'}`}>
                      {f.kondisi_fasilitas}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* KOLOM KANAN: PENGHUNI & ACTION */}
        <div className="space-y-6">
          
          {/* HARGA & PENGHUNI */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-[#2C5EBF]" /> Penghuni
            </h3>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-blue-600/80 font-medium">Harga Kamar Saat Ini</p>
              <p className="text-2xl font-bold text-[#1c3163] mt-1">Rp {hargaTotal.toLocaleString('id-ID')}</p>
              <p className="text-xs text-blue-600/60 mt-1">*(Sudah menyesuaikan jumlah penghuni)</p>
            </div>

            {reservasi && (
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Jumlah Penghuni</span>
                  <span className="font-bold text-gray-800">{reservasi.jumlah_penghuni} Orang</span>
                </div>
                {reservasi.jumlah_penghuni === 2 && (
                  <>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Penghuni 2</span>
                      <span className="font-semibold text-gray-800">{reservasi.nama_penghuni2}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-gray-500">No. Telepon 2</span>
                      <span className="font-semibold text-gray-800">{reservasi.nomor_telepon2}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <Button 
              onClick={() => setShowModalPenghuni(true)} 
              disabled={isUbahPenghuniDisabled}
              className="w-full mt-6 bg-[#2C5EBF] hover:bg-blue-800 transition"
            >
              Ubah Penghuni
            </Button>
            
            {isUbahPenghuniDisabled && reservasi && (
              <p className="text-xs text-orange-500 mt-3 flex items-start gap-1">
                <Info size={14} className="shrink-0 mt-0.5" /> 
                Perubahan penghuni hanya dapat dilakukan 1 kali dalam 30 hari. 
                (Terakhir diubah: {reservasi.terakhir_ubah_penghuni ? new Date(reservasi.terakhir_ubah_penghuni).toLocaleDateString("id-ID") : "-"})
              </p>
            )}
          </div>

          {/* DANGER ZONE */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
              <DoorOpen size={20} /> Berhenti Sewa
            </h3>
            <p className="text-sm text-red-600/80 mb-4">
              Tindakan ini akan mengakhiri status sewa kamar Anda secara permanen.
            </p>
            <Button 
              onClick={() => setShowModalKeluar(true)} 
              variant="destructive" 
              className="w-full"
            >
              Keluar Kos
            </Button>
          </div>

        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL UBAH PENGHUNI */}
      {/* ============================================ */}
      {showModalPenghuni && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Ubah Jumlah Penghuni</h3>
              <button onClick={() => setShowModalPenghuni(false)} className="text-gray-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUbahPenghuni} className="space-y-4">
              <div>
                <label className="font-medium text-sm text-gray-700">Pilih Jumlah Penghuni</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="jumlah_penghuni" value={1} 
                      checked={formPenghuni.jumlah === 1} 
                      onChange={() => setFormPenghuni({...formPenghuni, jumlah: 1})} 
                      className="text-[#2C5EBF]" /> 1 Orang
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="jumlah_penghuni" value={2} 
                      checked={formPenghuni.jumlah === 2} 
                      onChange={() => setFormPenghuni({...formPenghuni, jumlah: 2})} 
                      className="text-[#2C5EBF]" /> 2 Orang
                  </label>
                </div>
              </div>

              {formPenghuni.jumlah === 2 && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nama Penghuni Ke-2</label>
                    <input type="text" required value={formPenghuni.nama_penghuni2} onChange={(e) => setFormPenghuni({...formPenghuni, nama_penghuni2: e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">No. Telepon Penghuni Ke-2</label>
                    <input type="text" required value={formPenghuni.nomor_telepon2} onChange={(e) => setFormPenghuni({...formPenghuni, nomor_telepon2: e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 outline-none" />
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-start gap-2 mt-4">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>Harga sewa bulan berikutnya akan menyesuaikan dengan perubahan jumlah penghuni ini.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowModalPenghuni(false)}>Batal</Button>
                <Button type="submit" disabled={isProcessing} className="bg-[#2C5EBF]">{isProcessing ? "Menyimpan..." : "Simpan Perubahan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL KONFIRMASI KELUAR */}
      {/* ============================================ */}
      {showModalKeluar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Yakin Ingin Keluar Kos?</h3>
            <p className="text-gray-500 text-sm mb-6">Masa sewa kamar {sewa?.id_kamar} akan dihentikan dan kamar ini akan tersedia untuk penyewa lain.</p>
            
            <div className="flex gap-3">
              <Button onClick={() => setShowModalKeluar(false)} variant="outline" className="flex-1">Batal</Button>
              <Button onClick={handleKeluarKos} variant="destructive" disabled={isProcessing} className="flex-1">
                {isProcessing ? "Memproses..." : "Ya, Keluar"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}