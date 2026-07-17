"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function LaporanKerusakan() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // DATA STATES
  const [sewaList, setSewaList] = useState<any[]>([]); 
  const [fasilitas, setFasilitas] = useState<any[]>([]);
  const [laporanList, setLaporanList] = useState<any[]>([]);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const [form, setForm] = useState({
    id_sewa: "",
    id_fasilitas: "",
    id_detail_fasiliitas_kamar: "",
    laporan: "",
    file: null as File | null,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    
    let safeDateString = dateString.replace(" ", "T");
    
    if (!safeDateString.endsWith("Z") && !safeDateString.includes("+")) {
      safeDateString += "Z";
    }

    const date = new Date(safeDateString);
    
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(':', '.') + " WIB";
  };

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sewaData } = await supabase
      .from("sewa")
      .select("*")
      .eq("id_penyewa", user.id)
      .eq("status_sewa", "Aktif");

    setSewaList(sewaData || []);

    if (sewaData && sewaData.length > 0 && !form.id_sewa) {
      setForm((prev) => ({ ...prev, id_sewa: String(sewaData[0].id_sewa) }));
    }

    const idSewaArray = (sewaData || []).map(s => s.id_sewa);
    
    if (idSewaArray.length > 0) {
      const { data: laporan } = await supabase
        .from("laporan_kerusakan")
        .select("*, fasilitas(nama_fasilitas)")
        .in("id_sewa", idSewaArray)
        .order("created_at", { ascending: false });

      setLaporanList(laporan || []);
    } else {
      setLaporanList([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (form.id_sewa) {
      fetchFasilitasKamar(form.id_sewa);
    } else {
      setFasilitas([]);
    }
  }, [form.id_sewa]);

  async function fetchFasilitasKamar(selectedSewaId: string) {
    const selectedSewa = sewaList.find((s) => String(s.id_sewa) === selectedSewaId);
    
    if (selectedSewa) {
      const { data: fasilitasData } = await supabase
        .from("detail_fasilitas_kamar")
        .select("*, fasilitas(nama_fasilitas)")
        .eq("id_kamar", selectedSewa.id_kamar);

      setFasilitas(fasilitasData || []);
    }
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLaporan = laporanList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(laporanList.length / itemsPerPage);

  const handleKamarChange = (e: any) => {
    setForm({
      ...form,
      id_sewa: e.target.value,
      id_fasilitas: "",
      id_detail_fasiliitas_kamar: "",
    });
  };

  const handleFasilitasChange = (e: any) => {
    const detail = fasilitas.find((item) => Number(item.id_detail_fasiliitas_kamar) === Number(e.target.value));
    setForm({
      ...form,
      id_fasilitas: detail?.id_fasilitas || "",
      id_detail_fasiliitas_kamar: detail?.id_detail_fasiliitas_kamar || "",
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.id_fasilitas && !form.id_detail_fasiliitas_kamar && !form.laporan) return showToast("Harap mengisi semua field wajib!", "error");
    if (!form.id_sewa) return showToast("Pilih kamar terlebih dahulu!", "error");
    if (!form.id_detail_fasiliitas_kamar) return showToast("Pilih fasilitas yang rusak!", "error");
    if (!form.laporan.trim()) return showToast("Keterangan laporan wajib diisi!", "error");

    setLoading(true);
    try {

      const { data: cekFasilitas, error: errCek } = await supabase
        .from("detail_fasilitas_kamar")
        .select("kondisi_fasilitas")
        .eq("id_detail_fasiliitas_kamar", Number(form.id_detail_fasiliitas_kamar))
        .single();

      if (cekFasilitas) {
        if (cekFasilitas.kondisi_fasilitas === "Rusak" || cekFasilitas.kondisi_fasilitas === "Sedang Diperbaiki") {
          setLoading(false);
          return showToast("Fasilitas ini sudah dilaporkan sebelumnya.", "error");
        }
      }

      let imageUrl = null;
      if (form.file) {
        const fileExt = form.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("laporan-kerusakan").upload(fileName, form.file);
        if (uploadError) throw new Error("Gagal mengupload gambar");
        const { data } = supabase.storage.from("laporan-kerusakan").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const sewaTerkait = sewaList.find(s => String(s.id_sewa) === form.id_sewa);
      const idKamar = sewaTerkait?.id_kamar;

      const { error: insertError } = await supabase.from("laporan_kerusakan").insert({
        id_sewa: Number(form.id_sewa),
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

      showToast("Laporan kerusakan berhasil dikirim!", "success");
      
      setForm({ ...form, id_fasilitas: "", id_detail_fasiliitas_kamar: "", laporan: "", file: null });
      
      getData();
      
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8 pb-32">

      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 ${toast.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold text-sm">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="border rounded-2xl p-5 bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-5">Laporan Saya</h2>
        <div className="space-y-4">
          {currentLaporan.length > 0 ? (
            currentLaporan.map((item) => (
              <div key={item.id_kerusakan} className="border rounded-xl p-5 flex flex-col gap-3 bg-gray-50 hover:bg-gray-100 transition shadow-sm relative">
                
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-gray-800 text-lg">
                      {item.fasilitas?.nama_fasilitas || "Fasilitas"} 
                      <span className="text-gray-500 font-normal text-sm ml-2">- Kamar {item.id_kamar}</span>
                    </p>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 mb-3">
                      <Clock size={13} />
                      <span>Dilaporkan: {formatDateTime(item.created_at)}</span>
                    </div>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800 mr-1">Keluhan Anda:</span> 
                      {item.keterangan_kerusakan}
                    </p>
                  </div>

                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border shrink-0 ${
                    item.status_perbaikan === "Sudah Diperbaiki" ? "bg-green-50 text-green-700 border-green-200" :
                    item.status_perbaikan === "Proses Perbaikan" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    item.status_perbaikan === "Ditolak" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-gray-100 text-gray-700 border-gray-200"
                  }`}>
                    {item.status_perbaikan}
                  </span>
                </div>

                {item.keterangan_perbaikan && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-sm font-semibold text-[#1c3163]">Catatan / Detail Perbaikan:</p>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock size={11} />
                        <span>Direspons: {formatDateTime(item.tanggal_perbaikan)}</span>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                      {item.keterangan_perbaikan}
                    </div>
                  </div>
                )}

              </div>
            ))
          ) : (
            <p className="text-center py-10 text-gray-400">Belum ada laporan kerusakan yang dibuat.</p>
          )}
        </div>

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

      <form onSubmit={handleSubmit} className="border rounded-2xl p-6 space-y-5 bg-white shadow-sm">
        <h2 className="text-2xl font-bold">Buat Laporan</h2>
        
        <div>
          <label className="font-medium text-gray-700">Kamar</label>
          <select 
            name="id_sewa" 
            value={form.id_sewa} 
            onChange={handleKamarChange} 
            className="w-full border rounded-xl p-3 mt-2 outline-none focus:ring-2 focus:ring-blue-100 transition bg-white"
          >
            {sewaList.length === 0 ? (
              <option value="">-- Tidak ada kamar aktif --</option>
            ) : (
              sewaList.map((item) => (
                <option key={item.id_sewa} value={item.id_sewa}>
                  Kamar {item.id_kamar}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="font-medium text-gray-700">Fasilitas</label>
          <select 
            name="id_fasilitas" 
            value={form.id_detail_fasiliitas_kamar} 
            onChange={handleFasilitasChange} 
            disabled={!form.id_sewa || fasilitas.length === 0}
            className="w-full border rounded-xl p-3 mt-2 outline-none focus:ring-2 focus:ring-blue-100 transition bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
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
          <textarea 
            name="laporan" 
            value={form.laporan} 
            onChange={(e) => setForm({...form, laporan: e.target.value})} 
            className="w-full border rounded-xl p-3 mt-2 h-32 outline-none focus:ring-2 focus:ring-blue-100 transition resize-none" 
            placeholder="Jelaskan detail kerusakannya di sini..." 
          />
        </div>

        <div>
          <label className="font-medium text-gray-700">Upload Gambar (Optional)</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setForm({...form, file: e.target.files?.[0] || null})} 
            className="w-full border rounded-xl p-3 mt-2 outline-none bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" 
          />
        </div>

        <div className="flex justify-center w-full mt-4 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={loading || sewaList.length === 0} 
            className="w-full md:w-auto min-w-[200px] bg-[#1c3163] hover:bg-[#15254b] text-white py-6 text-lg font-medium rounded-xl transition-all disabled:bg-gray-400"
          >
            {loading ? "Mengirim..." : "Kirim Laporan"}
          </Button>
        </div>
      </form>
    </div>
  );
}