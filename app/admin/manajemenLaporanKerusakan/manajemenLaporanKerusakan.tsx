"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function ManajemenLaporanKerusakan() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [laporan, setLaporan] = useState<any[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // TOAST STATE
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    getLaporan();
  }, []);

  async function getLaporan() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("laporan_kerusakan")
      .select(`
        *,
        fasilitas ( nama_fasilitas ),
        detail_fasilitas_kamar (
          id_detail_fasiliitas_kamar,
          kondisi_fasilitas
        ),
        sewa!inner ( id_penyewa )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    const laporanFix = await Promise.all(
      (data || []).map(async (item) => {
        const { data: userData } = await supabase.from("penyewa").select("nama_penyewa").eq("id_penyewa", item.sewa?.id_penyewa).single();
        const { data: pegawaiData } = item.id_pegawai ? await supabase.from("pegawai").select("nama_pegawai").eq("id_pegawai", item.id_pegawai).single() : { data: null };
        
        return {
          ...item,
          nama_penyewa: userData?.nama_penyewa || "-",
          nama_pegawai: pegawaiData?.nama_pegawai || "-",
        };
      })
    );

    setLaporan(laporanFix);
    setLoading(false);
  }

  async function updateStatus(idKerusakan: number, statusBaru: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("laporan_kerusakan")
      .update({ status_perbaikan: statusBaru, id_pegawai: user?.id })
      .eq("id_kerusakan", idKerusakan);

    if (error) {
      showToast("Gagal update status", "error");
      return;
    }

    // Ambil detail untuk update kondisi fasilitas
    const { data: laporanData } = await supabase
      .from("laporan_kerusakan")
      .select("id_detail_fasiliitas_kamar")
      .eq("id_kerusakan", idKerusakan)
      .single();

    let kondisi = statusBaru === "Sudah Diperbaiki" || statusBaru === "Ditolak" ? "Baik" : 
                  statusBaru === "Proses Perbaikan" ? "Sedang Diperbaiki" : "Rusak";

    await supabase
      .from("detail_fasilitas_kamar")
      .update({ kondisi_fasilitas: kondisi })
      .eq("id_detail_fasiliitas_kamar", laporanData?.id_detail_fasiliitas_kamar);

    showToast("Status berhasil diupdate", "success");
    getLaporan();
  }

  // LOGIKA PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLaporan = laporan.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(laporan.length / itemsPerPage);

  function formatTanggal(tanggal: string) {
    return new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <main className="pt-24 md:ml-[260px] p-5 md:p-8">
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      <div className="md:pt-20">
        <div className="bg-white rounded-3xl border shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Laporan Kerusakan</h1>
          <p className="text-gray-500 mt-1">Kelola data laporan kerusakan kos</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-white flex flex-col">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Nama Penyewa</th>
                <th className="text-left px-6 py-4 font-semibold">Nomor Kamar</th>
                <th className="text-left px-6 py-4 font-semibold">Fasilitas</th>
                <th className="text-left px-6 py-4 font-semibold">Tanggal</th>
                <th className="text-center px-6 py-4 font-semibold">Status</th>
                <th className="text-center px-6 py-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20">Loading...</td></tr>
              ) : currentLaporan.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-gray-400">Data laporan tidak ditemukan</td></tr>
              ) : (
                currentLaporan.map((item) => (
                  <tr key={item.id_kerusakan} className="border-t hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{item.nama_penyewa}</td>
                    <td className="px-6 py-4">Kamar {item.id_kamar}</td>
                    <td className="px-6 py-4">{item.fasilitas?.nama_fasilitas}</td>
                    <td className="px-6 py-4">{formatTanggal(item.created_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <select value={item.status_perbaikan} onChange={(e) => updateStatus(item.id_kerusakan, e.target.value)} className="border rounded-lg px-3 py-2 outline-none">
                        <option>Menunggu Perbaikan</option>
                        <option>Proses Perbaikan</option>
                        <option>Sudah Diperbaiki</option>
                        <option>Ditolak</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setSelectedDetail(item)} className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ============================================ */}
          {/* PAGINATION UI */}
          {/* ============================================ */}
          {laporan.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
              
              <div className="text-sm text-gray-500">
                Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, laporan.length)} dari {laporan.length} data
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                        currentPage === number
                          ? "bg-[#1c3163] text-white border-[#1c3163]"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL DETAIL */}
      {/* ============================================ */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Detail Laporan</h2>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-gray-400 hover:text-red-500 transition text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* ISI */}
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* NAMA */}
                <div>
                  <label className="font-semibold text-gray-700">Nama Penyewa</label>
                  <input
                    type="text"
                    value={selectedDetail.nama_penyewa}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>

                {/* KAMAR */}
                <div>
                  <label className="font-semibold text-gray-700">Nomor Kamar</label>
                  <input
                    type="text"
                    value={`Kamar ${selectedDetail.id_kamar}`}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>
              </div>

              {/* FASILITAS */}
              <div>
                <label className="font-semibold text-gray-700">Nama Fasilitas</label>
                <input
                  type="text"
                  value={selectedDetail?.fasilitas?.nama_fasilitas || ""}
                  readOnly
                  className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                />
              </div>

              {/* KETERANGAN */}
              <div>
                <label className="font-semibold text-gray-700">Keterangan</label>
                <textarea
                  value={selectedDetail.keterangan_kerusakan}
                  readOnly
                  className="w-full border rounded-xl p-3 mt-2 h-24 bg-gray-50 text-gray-800 resize-none"
                />
              </div>

              {/* GAMBAR KERUSAKAN */}
              <div>
                <label className="font-semibold text-gray-700">Foto Kerusakan</label>
                <div className="mt-2">
                  {selectedDetail.gambar_kerusakan ? (
                    <a href={selectedDetail.gambar_kerusakan} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedDetail.gambar_kerusakan}
                        alt="Foto Kerusakan"
                        className="w-full max-h-80 object-contain border rounded-xl bg-gray-50 cursor-pointer hover:opacity-90 transition"
                      />
                    </a>
                  ) : (
                    <div className="w-full p-6 border-2 border-dashed rounded-xl bg-gray-50 text-center text-gray-400">
                      Tidak ada foto kerusakan yang dilampirkan.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* TANGGAL */}
                <div>
                  <label className="font-semibold text-gray-700">Tanggal Laporan</label>
                  <input
                    type="text"
                    value={formatTanggal(selectedDetail.created_at)}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="font-semibold text-gray-700">Status Saat Ini</label>
                  <input
                    type="text"
                    value={selectedDetail.status_perbaikan}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>
              </div>

              {/* PEGAWAI */}
              <div>
                <label className="font-semibold text-gray-700">Pegawai Yang Mengubah Status Terakhir</label>
                <input
                  type="text"
                  value={selectedDetail.nama_pegawai || "-"}
                  readOnly
                  className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                />
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}