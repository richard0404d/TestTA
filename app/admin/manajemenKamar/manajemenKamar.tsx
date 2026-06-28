"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Eye, Info } from "lucide-react";

export default function ManajemenKamar() {
  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================
  const [openModal, setOpenModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kamers, setKamers] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);

  // State untuk Detail Kamar
  const [selectedKamar, setSelectedKamar] = useState<any>(null);
  const [infoPenyewa, setInfoPenyewa] = useState<any>(null);
  const [fasilitasKamar, setFasilitasKamar] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [form, setForm] = useState({
    harga_sewa_kamar: "",
    harga_tambahan_penyewa: "",
    status_kamar: "Tersedia",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // ============================================
  // GET DATA KAMAR
  // ============================================
  const getKamar = async () => {
    const { data, error } = await supabase
      .from("kamar")
      .select("*")
      .order("id_kamar", { ascending: true });

    if (!error) setKamers(data || []);
  };

  useEffect(() => {
    getKamar();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenTambah = () => {
    setEditId(null);
    setForm({ harga_sewa_kamar: "", harga_tambahan_penyewa: "", status_kamar: "Tersedia" });
    setOpenModal(true);
  };

  const handleEdit = (kamar: any) => {
    setEditId(kamar.id_kamar);
    setForm({
      harga_sewa_kamar: kamar.harga_sewa_kamar,
      harga_tambahan_penyewa: kamar.harga_tambahan_penyewa || "0",
      status_kamar: kamar.status_kamar,
    });
    setOpenModal(true);
  };

  // ============================================
  // HANDLE VIEW DETAIL
  // ============================================
  const handleViewDetail = async (kamar: any) => {
    setSelectedKamar(kamar);
    setDetailModal(true);
    setInfoPenyewa(null);
    setFasilitasKamar([]);

    // 1. AMBIL DATA FASILITAS
    try {
      const { data: fasData } = await supabase
        .from("detail_fasilitas_kamar")
        .select(`kondisi_fasilitas, fasilitas ( nama_fasilitas )`)
        .eq("id_kamar", kamar.id_kamar);

      if (fasData) setFasilitasKamar(fasData);
    } catch (err) {
      console.error("Gagal memuat fasilitas:", err);
    }

    // 2. AMBIL DATA PENYEWA
    if (kamar.status_kamar === "Ditempati") {
      try {
        const { data }: { data: any } = await supabase
          .from("sewa")
          .select(`tanggal_sewa, tanggal_berakhir_sewa, penyewa ( nama_penyewa, nomor_telepon_penyewa )`)
          .eq("id_kamar", kamar.id_kamar)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.penyewa) {
          const penyewaData = Array.isArray(data.penyewa) ? data.penyewa[0] : data.penyewa;
          setInfoPenyewa({
            nama: penyewaData?.nama_penyewa,
            telepon: penyewaData?.nomor_telepon_penyewa,
            tipe: "Sewa Aktif",
            keterangan: `Mulai: ${data.tanggal_sewa ? new Date(data.tanggal_sewa).toLocaleDateString("id-ID") : "-"} — Berakhir: ${data.tanggal_berakhir_sewa ? new Date(data.tanggal_berakhir_sewa).toLocaleDateString("id-ID") : "-"}`,
          });
        }
      } catch (err) {
        console.error("Error get sewa:", err);
      }
    } else if (kamar.status_kamar === "Direservasi") {
      try {
        const { data }: { data: any } = await supabase
          .from("reservasi")
          .select(`tanggal_reservasi, tanggal_masuk, penyewa ( nama_penyewa, nomor_telepon_penyewa )`)
          .eq("id_kamar", kamar.id_kamar)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.penyewa) {
          const penyewaData = Array.isArray(data.penyewa) ? data.penyewa[0] : data.penyewa;
          setInfoPenyewa({
            nama: penyewaData?.nama_penyewa,
            telepon: penyewaData?.nomor_telepon_penyewa,
            tipe: "Reservasi",
            keterangan: `Dipesan: ${data.tanggal_reservasi ? new Date(data.tanggal_reservasi).toLocaleDateString("id-ID") : "-"} — Rencana Masuk: ${data.tanggal_masuk ? new Date(data.tanggal_masuk).toLocaleDateString("id-ID") : "-"}`,
          });
        }
      } catch (err) {
        console.error("Error get reservasi:", err);
      }
    }
  };

  // ============================================
  // INSERT / UPDATE
  // ============================================
  const handleSubmit = async () => {
    if (!form.harga_sewa_kamar && form.harga_sewa_kamar.toString().trim() === "") {
      return showToast("Harap mengisi semua field wajib!", "error");
    }
    if (!form.harga_sewa_kamar || form.harga_sewa_kamar.toString().trim() === "") {
      return showToast("Harga Sewa Kamar wajib diisi!", "error");
    }

    try {
      setLoading(true);
      const payload = {
        harga_sewa_kamar: Number(form.harga_sewa_kamar),
        harga_tambahan_penyewa: Number(form.harga_tambahan_penyewa || 0),
        status_kamar: form.status_kamar,
      };

      if (editId) {
        const { error } = await supabase.from("kamar").update(payload).eq("id_kamar", editId);
        if (error) throw error;
        showToast("Kamar berhasil diperbarui", "success");
      } else {
        const { error } = await supabase.from("kamar").insert([payload]);
        if (error) throw error;
        showToast("Kamar berhasil ditambahkan", "success");
      }

      await getKamar();
      setOpenModal(false);
      setEditId(null);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = kamers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(kamers.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-100 md:pt-20">
      
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition"><X size={18} /></button>
        </div>
      )}

      <main className="pt-24 md:ml-[260px] p-5 md:p-8">
        <div className="bg-white rounded-3xl border shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manajemen Kamar</h1>
              <p className="text-gray-500 mt-1">Kelola data kamar kos dan detail fasilitas</p>
            </div>
            <button onClick={handleOpenTambah} className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition shadow-md">
              <Plus size={18} /> Tambah Kamar
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-2xl border bg-white flex flex-col">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">ID Kamar</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Harga Sewa</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Harga Tambahan</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kamers.length > 0 ? (
                currentItems.map((kamar, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-800 font-medium">Kamar {kamar.id_kamar}</td>
                    <td className="px-6 py-4 text-gray-800">Rp {Number(kamar.harga_sewa_kamar).toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-gray-800">Rp {Number(kamar.harga_tambahan_penyewa).toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        kamar.status_kamar === "Tersedia" ? "bg-green-100 text-green-700" :
                        kamar.status_kamar === "Ditempati" ? "bg-red-100 text-red-700" :
                        kamar.status_kamar === "Direservasi" ? "bg-yellow-100 text-yellow-700" : "bg-gray-200 text-gray-700"
                      }`}>{kamar.status_kamar}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleViewDetail(kamar)} className="p-2.5 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition shadow-sm" title="Lihat Detail"><Eye size={18} /></button>
                        <button onClick={() => handleEdit(kamar)} className="p-2.5 rounded-xl bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition shadow-sm" title="Edit Kamar"><Pencil size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-20 text-gray-400">Data kamar belum tersedia</td></tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION UI */}
          {kamers.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
              <div className="text-sm text-gray-500">Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, kamers.length)} dari {kamers.length} data</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50"><ChevronLeft size={18} /></button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button key={number} onClick={() => paginate(number)} className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${currentPage === number ? "bg-[#1c3163] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>{number}</button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50"><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* MODAL FORM EDIT / TAMBAH */}
        {/* ============================================ */}
        {openModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative">
              <button onClick={() => setOpenModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{editId ? "Update Data Kamar" : "Tambah Kamar Baru"}</h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Harga Sewa Utama (Rp)</label>
                    <input type="number" name="harga_sewa_kamar" placeholder="Contoh: 600000" value={form.harga_sewa_kamar} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1c3163]/30 transition" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Harga Tambahan/Orang (Rp)</label>
                    <input type="number" name="harga_tambahan_penyewa" placeholder="Contoh: 300000" value={form.harga_tambahan_penyewa} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1c3163]/30 transition" />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Status Kamar</label>
                  <select name="status_kamar" value={form.status_kamar} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1c3163]/30 bg-white transition">
                    <option value="Tersedia">Tersedia</option>
                    <option value="Ditempati">Ditempati</option>
                    <option value="Direservasi">Direservasi</option>
                    <option value="Diperbaiki">Diperbaiki</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <button onClick={() => setOpenModal(false)} className="px-6 py-2.5 rounded-xl border hover:bg-gray-50 text-gray-700 font-medium transition">Batal</button>
                  <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 rounded-xl bg-[#1c3163] text-white hover:bg-[#16274f] transition disabled:bg-gray-400 font-medium">{loading ? "Menyimpan..." : "Simpan Data"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL DETAIL KAMAR (UI BARU) */}
        {/* ============================================ */}
        {detailModal && selectedKamar && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
              <button onClick={() => setDetailModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition"><X size={24} /></button>

              <div className="flex items-center gap-3 mb-8 border-b pb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Info size={28} /></div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">Detail Kamar {selectedKamar.id_kamar}</h2>
                  <p className="text-gray-500 text-sm mt-1">Informasi lengkap fasilitas dan penyewaan</p>
                </div>
              </div>

              <div className="space-y-8">
                
                {/* INFO DASAR */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Harga Sewa / Bulan</p>
                    <p className="text-lg font-medium text-gray-800">Rp {Number(selectedKamar.harga_sewa_kamar).toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status Saat Ini</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${selectedKamar.status_kamar === "Tersedia" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{selectedKamar.status_kamar}</span>
                  </div>
                </div>

                {/* FASILITAS */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Fasilitas Kamar</h3>
                  <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 text-gray-600 min-h-[80px]">
                    {fasilitasKamar.length > 0 ? (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {fasilitasKamar.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            <span className="text-gray-700 font-medium">{item.fasilitas?.nama_fasilitas || "-"}</span> 
                            <span className="text-[10px] text-gray-500 py-0.5 px-2 bg-gray-50 rounded border">{item.kondisi_fasilitas || "Baik"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Belum ada fasilitas yang ditambahkan ke kamar ini.</p>
                    )}
                  </div>
                </div>

                {/* INFO PENYEWA */}
                {(selectedKamar.status_kamar === "Ditempati" || selectedKamar.status_kamar === "Direservasi") && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Informasi {infoPenyewa?.tipe || "Sewa"}</h3>
                    {/* UI Polos: border dan putih saja, tanpa background biru */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 text-gray-700">
                      {infoPenyewa ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Nama Penyewa</p>
                            <p className="text-gray-800 font-medium">{infoPenyewa.nama || "Tidak diketahui"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Nomor Telepon</p>
                            <p className="text-gray-800 font-medium">{infoPenyewa.telepon || "-"}</p>
                          </div>
                          <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Durasi / Waktu</p>
                            <p className="text-gray-700 text-sm font-medium">{infoPenyewa.keterangan}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic text-sm">Sedang memuat data atau tidak ada transaksi yang tercatat...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 text-right">
                <button onClick={() => setDetailModal(false)} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition font-medium">Tutup Detail</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}