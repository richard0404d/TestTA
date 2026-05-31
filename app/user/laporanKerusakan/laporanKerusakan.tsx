"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function LaporanKerusakan() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [idSewa, setIdSewa] = useState<number | null>(null);
  const [idKamar, setIdKamar] = useState<number | null>(null);
  const [kamar, setKamar] = useState<any>(null);
  const [fasilitas, setFasilitas] = useState<any[]>([]);
  const [laporanList, setLaporanList] = useState<any[]>([]);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State untuk Toast Notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const [form, setForm] = useState({
    id_fasilitas: "",
    id_detail_fasiliitas_kamar: "",
    laporan: "",
    file: null as File | null,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sewa } = await supabase
      .from("sewa")
      .select("*")
      .eq("id_penyewa", user.id)
      .eq("status_sewa", "Aktif")
      .single();

    if (!sewa) {
      setLoading(false);
      return;
    }

    setIdSewa(sewa.id_sewa);
    setIdKamar(sewa.id_kamar);

    const { data: kamarData } = await supabase.from("kamar").select("*").eq("id_kamar", sewa.id_kamar).single();
    setKamar(kamarData);

    const { data: fasilitasData } = await supabase
      .from("detail_fasilitas_kamar")
      .select("*, fasilitas(nama_fasilitas)")
      .eq("id_kamar", sewa.id_kamar);

    setFasilitas(fasilitasData || []);

    const { data: laporan } = await supabase
      .from("laporan_kerusakan")
      .select("*, fasilitas(nama_fasilitas)")
      .eq("id_sewa", sewa.id_sewa)
      .order("created_at", { ascending: false });

    setLaporanList(laporan || []);
    setLoading(false);
  }

  // LOGIKA PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLaporan = laporanList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(laporanList.length / itemsPerPage);

  const handleFasilitas = (e: any) => {
    const detail = fasilitas.find((item) => Number(item.id_detail_fasiliitas_kamar) === Number(e.target.value));
    setForm({
      ...form,
      id_fasilitas: detail?.id_fasilitas || "",
      id_detail_fasiliitas_kamar: detail?.id_detail_fasiliitas_kamar || "",
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.id_detail_fasiliitas_kamar) return showToast("Pilih fasilitas yang rusak!", "error");
    if (!form.laporan.trim()) return showToast("Keterangan laporan wajib diisi!", "error");

    setLoading(true);
    try {
      let imageUrl = null;
      if (form.file) {
        const fileExt = form.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("laporan-kerusakan").upload(fileName, form.file);
        if (uploadError) throw new Error("Gagal mengupload gambar");
        const { data } = supabase.storage.from("laporan-kerusakan").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase.from("laporan_kerusakan").insert({
        id_sewa: idSewa,
        id_kamar: idKamar,
        id_fasilitas: Number(form.id_fasilitas),
        id_detail_fasiliitas_kamar: Number(form.id_detail_fasiliitas_kamar),
        keterangan_kerusakan: form.laporan,
        gambar_kerusakan: imageUrl,
        status_perbaikan: "Menunggu Perbaikan",
      });

      if (insertError) throw insertError;

      await supabase.from("detail_fasilitas_kamar")
        .update({ kondisi_fasilitas: "Rusak" })
        .eq("id_detail_fasiliitas_kamar", Number(form.id_detail_fasiliitas_kamar));

      showToast("Laporan berhasil dikirim!", "success");
      setForm({ id_fasilitas: "", id_detail_fasiliitas_kamar: "", laporan: "", file: null });
      getData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8 pb-32">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${toast.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Daftar Laporan */}
      <div className="border rounded-2xl p-5 bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-5">Laporan Saya</h2>
        <div className="space-y-4">
          {currentLaporan.length > 0 ? (
            currentLaporan.map((item) => (
              <div key={item.id_kerusakan} className="border rounded-xl p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold text-gray-800">{item.fasilitas?.nama_fasilitas || "Fasilitas"}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.keterangan_kerusakan}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  item.status_perbaikan === "Sudah Diperbaiki" ? "bg-green-100 text-green-700" :
                  item.status_perbaikan === "Proses Perbaikan" ? "bg-yellow-100 text-yellow-700" :
                  item.status_perbaikan === "Ditolak" ? "bg-red-100 text-red-700" :
                  "bg-gray-200 text-gray-700"
                }`}>
                  {item.status_perbaikan}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-gray-400">Belum ada laporan kerusakan yang dibuat.</p>
          )}
        </div>

        {/* Pagination */}
        {laporanList.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <span className="text-sm text-gray-500">Menampilkan {currentPage} halaman dari {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                <ChevronLeft size={16} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Laporan */}
      <form onSubmit={handleSubmit} className="border rounded-2xl p-6 space-y-5 bg-white shadow-sm">
        <h2 className="text-2xl font-bold">Buat Laporan</h2>
        
        <div>
          <label className="font-medium text-gray-700">Kamar</label>
          <input type="text" readOnly value={kamar?.id_kamar ? `Kamar ${kamar.id_kamar}` : "-"} className="w-full border rounded-xl p-3 mt-2 bg-gray-100 text-gray-600 outline-none" />
        </div>

        <div>
          <label className="font-medium text-gray-700">Fasilitas</label>
          <select name="id_fasilitas" value={form.id_detail_fasiliitas_kamar} onChange={handleFasilitas} className="w-full border rounded-xl p-3 mt-2 outline-none focus:ring-2 focus:ring-blue-100 transition bg-white">
            <option value="">Pilih Fasilitas</option>
            {fasilitas.length > 0 ? (
              fasilitas.map((item) => (
                <option key={item.id_detail_fasiliitas_kamar} value={item.id_detail_fasiliitas_kamar}>
                  {item.fasilitas?.nama_fasilitas}
                </option>
              ))
            ) : (
              <option disabled>Tidak ada fasilitas di kamar ini</option>
            )}
          </select>
        </div>

        <div>
          <label className="font-medium text-gray-700">Keterangan Laporan</label>
          <textarea name="laporan" value={form.laporan} onChange={(e) => setForm({...form, laporan: e.target.value})} className="w-full border rounded-xl p-3 mt-2 h-32 outline-none focus:ring-2 focus:ring-blue-100 transition resize-none" placeholder="Jelaskan detail kerusakannya di sini..." />
        </div>

        <div>
          <label className="font-medium text-gray-700">Upload Gambar (Optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setForm({...form, file: e.target.files?.[0] || null})} className="w-full border rounded-xl p-3 mt-2 outline-none bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
        </div>

        {/* BUTTON TENGAH DAN SESUAI WARNA NAVBAR */}
        <div className="flex justify-center w-full mt-4 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full md:w-auto min-w-[200px] bg-[#1c3163] hover:bg-[#15254b] text-white py-6 text-lg font-medium rounded-xl transition-all disabled:bg-gray-400"
          >
            {loading ? "Mengirim..." : "Kirim Laporan"}
          </Button>
        </div>
      </form>
    </div>
  );
}