"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, Pencil, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function ManajemenLaporanKerusakan() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [laporan, setLaporan] = useState<any[]>([]);
  
  // MODAL STATES
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // FORM EDIT STATES
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    status_perbaikan: "Menunggu Perbaikan",
    keterangan_perbaikan: "",
  });

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

  // ============================================
  // OPEN EDIT MODAL
  // ============================================
  const handleOpenEdit = (item: any) => {
    setEditId(item.id_kerusakan);
    setEditForm({
      status_perbaikan: item.status_perbaikan || "Menunggu Perbaikan",
      keterangan_perbaikan: item.keterangan_perbaikan || "",
    });
    setIsEditModalOpen(true);
  };

  // ============================================
  // PROSES UPDATE DATA (Dengan keterangan & Tanggal)
  // ============================================
  const handleSubmitEdit = async () => {
    if (!editId) return;

    // --- TAMBAHAN VALIDASI ---
    if (!editForm.keterangan_perbaikan || editForm.keterangan_perbaikan.trim() === "") {
      return showToast("Catatan atau detail perbaikan wajib diisi!", "error");
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Menyiapkan Payload Update
      const payload: any = {
        status_perbaikan: editForm.status_perbaikan,
        keterangan_perbaikan: editForm.keterangan_perbaikan,
        id_pegawai: user?.id,
      };

      // Jika statusnya sudah final (Diperbaiki / Ditolak), simpan tanggal perbaikannya
      if (editForm.status_perbaikan === "Sudah Diperbaiki" || editForm.status_perbaikan === "Ditolak") {
        payload.tanggal_perbaikan = new Date().toISOString();
      }

      const { error } = await supabase
        .from("laporan_kerusakan")
        .update(payload)
        .eq("id_kerusakan", editId);

      if (error) throw error;

      // Ambil detail untuk update kondisi fasilitas kamar agar sinkron
      const { data: laporanData } = await supabase
        .from("laporan_kerusakan")
        .select("id_detail_fasiliitas_kamar")
        .eq("id_kerusakan", editId)
        .single();

      let kondisi = editForm.status_perbaikan === "Sudah Diperbaiki" || editForm.status_perbaikan === "Ditolak" ? "Baik" : 
                    editForm.status_perbaikan === "Proses Perbaikan" ? "Sedang Diperbaiki" : "Rusak";

      await supabase
        .from("detail_fasilitas_kamar")
        .update({ kondisi_fasilitas: kondisi })
        .eq("id_detail_fasiliitas_kamar", laporanData?.id_detail_fasiliitas_kamar);

      showToast("Laporan berhasil diperbarui!", "success");
      setIsEditModalOpen(false);
      setEditId(null);
      getLaporan(); // Refresh data tabel
    } catch (err: any) {
      console.error(err);
      showToast("Gagal mengupdate laporan.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLaporan = laporan.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(laporan.length / itemsPerPage);

  function formatTanggal(tanggal: string | null) {
    if (!tanggal) return "-";
    return new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute:"2-digit" });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sudah Diperbaiki": return "bg-green-100 text-green-700 border-green-200";
      case "Ditolak": return "bg-red-100 text-red-700 border-red-200";
      case "Proses Perbaikan": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <main className="pt-24 md:ml-[260px] p-5 md:p-8">
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          {/* Ubah font-medium menjadi font-semibold atau font-bold */}
          <p className="font-semibold">{toast.message}</p> 
        </div>
      )}

      <div className="md:pt-20">
        <div className="bg-white rounded-3xl border shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Laporan Kerusakan</h1>
          <p className="text-gray-500 mt-1">Kelola data laporan kerusakan fasilitas dari penyewa</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border bg-white flex flex-col shadow-sm">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Nama Penyewa</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Nomor Kamar</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Fasilitas</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Tanggal Laporan</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && laporan.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-gray-500">Memuat data...</td></tr>
              ) : currentLaporan.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-gray-400">Data laporan tidak ditemukan</td></tr>
              ) : (
                currentLaporan.map((item) => (
                  <tr key={item.id_kerusakan} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">{item.nama_penyewa}</td>
                    <td className="px-6 py-4 text-gray-600">Kamar {item.id_kamar}</td>
                    <td className="px-6 py-4 text-gray-600">{item.fasilitas?.nama_fasilitas || "-"}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{formatTanggal(item.created_at)}</td>
                    
                    {/* HANYA MENAMPILKAN STATUS (TEXT/BADGE) SEKARANG */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(item.status_perbaikan)}`}>
                          {item.status_perbaikan || "Menunggu Perbaikan"}
                        </span>
                      </div>
                    </td>
                    
                    {/* AKSI (MATA DAN PENSIL) */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => setSelectedDetail(item)} 
                          className="p-2.5 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition shadow-sm"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(item)} 
                          className="p-2.5 rounded-xl bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition shadow-sm"
                          title="Proses / Update Laporan"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* PAGINATION UI */}
          {!loading && laporan.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 bg-white">
              <div className="text-sm text-gray-500">
                Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, laporan.length)} dari {laporan.length} data
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                        currentPage === number ? "bg-[#1c3163] text-white border-[#1c3163]" : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL UPDATE STATUS & KETERANGAN (PENCIL) */}
      {/* ============================================ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Proses Laporan Kerusakan</h2>

            <div className="space-y-5">
              <div>
                <label className="font-semibold text-gray-700 text-sm">Status Perbaikan</label>
                <select
                  value={editForm.status_perbaikan}
                  onChange={(e) => setEditForm({ ...editForm, status_perbaikan: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-2 bg-white focus:ring-2 focus:ring-[#1c3163]/30 outline-none transition"
                >
                  <option value="Menunggu Perbaikan">Menunggu Perbaikan</option>
                  <option value="Proses Perbaikan">Proses Perbaikan</option>
                  <option value="Sudah Diperbaiki">Sudah Diperbaiki</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 text-sm">Catatan / Detail Perbaikan <span className="text-gray-400 font-normal">(Disarankan)</span></label>
                <textarea
                  value={editForm.keterangan_perbaikan}
                  onChange={(e) => setEditForm({ ...editForm, keterangan_perbaikan: e.target.value })}
                  placeholder="Misal: Sudah diganti dengan lampu baru"
                  className="w-full border border-gray-300 rounded-xl p-4 mt-2 h-28 bg-white focus:ring-2 focus:ring-[#1c3163]/30 outline-none transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl border font-medium text-gray-600 hover:bg-gray-50 transition">
                  Batal
                </button>
                <button onClick={handleSubmitEdit} disabled={loading} className="px-6 py-2.5 rounded-xl bg-[#1c3163] text-white font-medium hover:bg-[#15254b] transition disabled:bg-gray-400 shadow-md">
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL DETAIL KESELURUHAN (EYE) */}
      {/* ============================================ */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200 shadow-2xl">
            <button onClick={() => setSelectedDetail(null)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Informasi Lengkap Laporan</h2>

            <div className="space-y-6">
              {/* INFO PELAPOR */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Nama Pelapor</p>
                  <p className="font-bold text-gray-800">{selectedDetail.nama_penyewa}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Nomor Kamar</p>
                  <p className="font-bold text-gray-800">Kamar {selectedDetail.id_kamar}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Tanggal Laporan</p>
                  <p className="font-bold text-gray-800 text-sm">{formatTanggal(selectedDetail.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Objek Fasilitas</p>
                  <p className="font-bold text-[#1c3163]">{selectedDetail?.fasilitas?.nama_fasilitas || "-"}</p>
                </div>
              </div>

              {/* MASALAH / KELUHAN */}
              <div>
                <label className="font-bold text-gray-800 text-sm">Keluhan Penyewa:</label>
                <div className="w-full border border-red-100 rounded-xl p-4 mt-2 bg-red-50/50 text-gray-800 min-h-[60px]">
                  {selectedDetail.keterangan_kerusakan}
                </div>
              </div>

              {/* GAMBAR KERUSAKAN */}
              <div>
                <label className="font-bold text-gray-800 text-sm">Lampiran Foto:</label>
                <div className="mt-2">
                  {selectedDetail.gambar_kerusakan ? (
                    <a href={selectedDetail.gambar_kerusakan} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedDetail.gambar_kerusakan}
                        alt="Foto Kerusakan"
                        className="w-full h-auto max-h-[250px] object-cover border border-gray-200 rounded-xl bg-gray-50 cursor-pointer hover:opacity-90 transition shadow-sm"
                      />
                    </a>
                  ) : (
                    <div className="w-full p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center text-gray-400 text-sm">
                      Penyewa tidak melampirkan foto kerusakan.
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* RIWAYAT TINDAKAN PENGELOLA */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-[#1c3163] mb-4">Catatan Tindakan Pengelola</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Status Saat Ini</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block border ${getStatusColor(selectedDetail.status_perbaikan)}`}>
                      {selectedDetail.status_perbaikan || "Menunggu Perbaikan"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Ditangani Oleh</p>
                    <p className="font-bold text-gray-800 text-sm">{selectedDetail.nama_pegawai || "-"}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Keterangan / Detail Perbaikan</p>
                  <div className="w-full border border-white rounded-xl p-3 bg-white text-gray-700 min-h-[60px] text-sm">
                    {selectedDetail.keterangan_perbaikan || <span className="text-gray-400 italic">Belum ada catatan perbaikan...</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Waktu Penyelesaian</p>
                  <p className="font-bold text-gray-800 text-sm">{formatTanggal(selectedDetail.tanggal_perbaikan)}</p>
                </div>
              </div>

              <div className="text-right pt-2">
                <button onClick={() => setSelectedDetail(null)} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition shadow-md">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}