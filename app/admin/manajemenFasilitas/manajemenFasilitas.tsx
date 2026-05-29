"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Eye, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ManajemenFasilitas() {
  // ============================================
  // SUPABASE
  // ============================================
  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================
  const [openModal, setOpenModal] = useState(false);
  const [openMasterModal, setOpenMasterModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [dataFasilitas, setDataFasilitas] = useState<any[]>([]);
  const [masterFasilitas, setMasterFasilitas] = useState<any[]>([]);
  const [kamar, setKamar] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any | null>(null);

  // State untuk Konfirmasi Hapus
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // ============================================
  // TOAST NOTIFICATION STATE
  // ============================================
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000); // otomatis hilang dalam 3 detik
  };

  // ============================================
  // FORM DETAIL
  // ============================================
  const [form, setForm] = useState({
    id_kamar: "",
    id_fasilitas: "",
    kondisi_fasilitas: "Baik",
  });

  // ============================================
  // FORM MASTER
  // ============================================
  const [namaFasilitas, setNamaFasilitas] = useState("");

  // ============================================
  // GET KAMAR
  // ============================================
  const getKamar = async () => {
    const { data, error } = await supabase
      .from("kamar")
      .select("*")
      .order("id_kamar");

    if (error) {
      console.log(error);
      return;
    }
    setKamar(data || []);
  };

  // ============================================
  // GET MASTER FASILITAS
  // ============================================
  const getMasterFasilitas = async () => {
    const { data, error } = await supabase
      .from("fasilitas")
      .select("*")
      .order("id_fasilitas", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }
    setMasterFasilitas(data || []);
  };

  // ============================================
  // GET DETAIL FASILITAS
  // ============================================
  const getDetailFasilitas = async () => {
    try {
      // GET DETAIL
      const { data: detailDataFetch, error: detailError } = await supabase
        .from("detail_fasilitas_kamar")
        .select("*");

      if (detailError) {
        console.log("DETAIL ERROR:", detailError);
        return;
      }

      // GET FASILITAS
      const { data: fasilitasData, error: fasilitasError } = await supabase
        .from("fasilitas")
        .select("*");

      if (fasilitasError) {
        console.log("FASILITAS ERROR:", fasilitasError);
        return;
      }

      // GET KAMAR
      const { data: kamarData, error: kamarError } = await supabase
        .from("kamar")
        .select("*");

      if (kamarError) {
        console.log("KAMAR ERROR:", kamarError);
        return;
      }

      // JOIN MANUAL
      const finalData = detailDataFetch.map((item) => {
        const fasilitas = fasilitasData.find(
          (f: any) => Number(f.id_fasilitas) === Number(item.id_fasilitas)
        );
        const kamarItem = kamarData.find(
          (k: any) => Number(k.id_kamar) === Number(item.id_kamar)
        );

        return {
          ...item,
          fasilitas,
          kamar: kamarItem,
        };
      });

      setDataFasilitas(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    getKamar();
    getMasterFasilitas();
    getDetailFasilitas();
  }, []);

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
  // SAVE DETAIL
  // ============================================
  const handleSave = async () => {
    // --- VALIDASI INPUT ---
    if (!form.id_kamar) {
      return showToast("Silakan pilih Nomor Kamar terlebih dahulu", "error");
    }
    if (!form.id_fasilitas) {
      return showToast("Silakan pilih Fasilitas terlebih dahulu", "error");
    }
    if (!form.kondisi_fasilitas) {
      return showToast("Kondisi fasilitas wajib diisi", "error");
    }
    // -----------------------

    try {
      setLoading(true);

      // ============================================
      // UPDATE
      // ============================================
      if (editId) {
        const { error } = await supabase
          .from("detail_fasilitas_kamar")
          .update({
            id_kamar: Number(form.id_kamar),
            id_fasilitas: Number(form.id_fasilitas),
            kondisi_fasilitas: form.kondisi_fasilitas,
          })
          .eq("id_detail_fasiliitas_kamar", editId);

        if (error) throw error;
        showToast("Detail fasilitas berhasil diupdate", "success");
      } else {
        // ============================================
        // INSERT
        // ============================================
        // CEK APAKAH SUDAH ADA
        const { data: existingData, error: checkError } = await supabase
          .from("detail_fasilitas_kamar")
          .select("*")
          .eq("id_kamar", Number(form.id_kamar))
          .eq("id_fasilitas", Number(form.id_fasilitas));

        if (checkError) throw checkError;

        // JIKA SUDAH ADA
        if (existingData && existingData.length > 0) {
          showToast("Fasilitas tersebut sudah digunakan di kamar ini", "error");
          setLoading(false);
          return;
        }

        // INSERT DATA
        const { error } = await supabase.from("detail_fasilitas_kamar").insert([
          {
            id_kamar: Number(form.id_kamar),
            id_fasilitas: Number(form.id_fasilitas),
            kondisi_fasilitas: form.kondisi_fasilitas,
          },
        ]);

        if (error) throw error;
        showToast("Detail fasilitas berhasil ditambahkan", "success");
      }

      // REFRESH & RESET
      await getDetailFasilitas();
      setForm({
        id_kamar: "",
        id_fasilitas: "",
        kondisi_fasilitas: "Baik",
      });
      setEditId(null);
      setOpenModal(false);
    } catch (error: any) {
      console.log(error);
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAVE MASTER
  // ============================================
  const handleSaveMaster = async () => {
    try {
      // --- VALIDASI INPUT ---
      if (!namaFasilitas || namaFasilitas.trim() === "") {
        return showToast("Nama fasilitas wajib diisi!", "error");
      }
      // -----------------------

      const { error } = await supabase.from("fasilitas").insert([
        {
          nama_fasilitas: namaFasilitas,
        },
      ]);

      if (error) throw error;

      showToast("Fasilitas berhasil ditambahkan", "success");
      setNamaFasilitas("");
      setOpenMasterModal(false);
      await getMasterFasilitas();
    } catch (error: any) {
      console.log(error);
      showToast(error.message, "error");
    }
  };

  // ============================================
  // TRIGGER DELETE FASILITAS (Buka Modal)
  // ============================================
  const triggerDeleteFasilitas = (id: number) => {
    setDeleteTargetId(id);
    setShowConfirmDelete(true);
  };

  // ============================================
  // EKSEKUSI DELETE FASILITAS
  // ============================================
  const executeDeleteFasilitas = async () => {
    if (deleteTargetId === null) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("detail_fasilitas_kamar")
        .delete()
        .eq("id_detail_fasiliitas_kamar", deleteTargetId);

      if (error) throw error;

      // UPDATE STATE AGAR LANGSUNG HILANG DI MODAL DETAIL
      if (detailData) {
        const updated = detailData.filter(
          (item: any) => item.id_detail_fasiliitas_kamar !== deleteTargetId
        );
        setDetailData(updated);
      }

      // REFRESH TABLE
      await getDetailFasilitas();
      showToast("Fasilitas berhasil dihapus", "success");
    } catch (error: any) {
      console.log(error);
      showToast(error.message || "Gagal menghapus fasilitas", "error");
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 md:pt-20">
      
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

      <main className="pt-24 md:ml-[260px] p-5 md:p-8">
        
        {/* ============================================ */}
        {/* HEADER & TABLE DETAIL FASILITAS */}
        {/* ============================================ */}
        <div>
          <div className="bg-white rounded-3xl border shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Fasilitas</h1>
                <p className="text-gray-500 mt-1">Kelola fasilitas setiap kamar</p>
              </div>
              <button
                onClick={() => {
                  setOpenModal(true);
                  setEditId(null);
                  setForm({ id_kamar: "", id_fasilitas: "", kondisi_fasilitas: "Baik" });
                }}
                className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] transition text-white px-5 py-3 rounded-xl"
              >
                <Plus size={18} />
                Tambah Detail Fasilitas
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Nomor Kamar</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-700">Detail</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // GROUP BERDASARKAN KAMAR
                  const groupedData = dataFasilitas.reduce((acc: any, item: any) => {
                    const kamarId = item.id_kamar;
                    if (!acc[kamarId]) acc[kamarId] = [];
                    acc[kamarId].push(item);
                    return acc;
                  }, {});

                  // RENDER
                  const entries = Object.entries(groupedData);
                  
                  if (entries.length === 0) {
                    return (
                      <tr>
                        <td colSpan={2} className="text-center py-20 text-gray-400">
                          Data detail fasilitas belum tersedia
                        </td>
                      </tr>
                    );
                  }

                  return entries.map(([kamarId, fasilitas]: any, index) => (
                    <tr key={`kamar-${index}`} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        Kamar {kamarId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setDetailData(fasilitas)}
                            className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================ */}
        {/* MASTER FASILITAS */}
        {/* ============================================ */}
        <div className="pt-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Data Master Fasilitas</h2>
              <p className="text-gray-500 mt-1">Kelola daftar keseluruhan fasilitas kos</p>
            </div>
            <button
              onClick={() => {
                setOpenMasterModal(true);
                setNamaFasilitas("");
              }}
              className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
            >
              <Plus size={18} />
              Tambah Fasilitas
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Nama Fasilitas</th>
                </tr>
              </thead>
              <tbody>
                {masterFasilitas.length > 0 ? (
                  masterFasilitas.map((item, index) => (
                    <tr key={`master-${index}`} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-800">{item.id_fasilitas}</td>
                      <td className="px-6 py-4 text-gray-800 font-medium">{item.nama_fasilitas}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center py-20 text-gray-400">
                      Data fasilitas belum tersedia
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================ */}
        {/* MODAL TAMBAH DETAIL */}
        {/* ============================================ */}
        {openModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setOpenModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-8 text-gray-800">
                {editId ? "Edit Detail Fasilitas" : "Tambah Detail Fasilitas"}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">Nomor Kamar</label>
                  <select
                    name="id_kamar"
                    value={form.id_kamar}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="">-- Pilih Kamar --</option>
                    {kamar.map((item, index) => (
                      <option key={`kamar-${index}`} value={item.id_kamar}>
                        Kamar {item.id_kamar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">Nama Fasilitas</label>
                  <select
                    name="id_fasilitas"
                    value={form.id_fasilitas}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="">-- Pilih Fasilitas --</option>
                    {masterFasilitas.map((item, index) => (
                      <option key={`fasilitas-option-${index}`} value={item.id_fasilitas}>
                        {item.nama_fasilitas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">Kondisi Saat Ini</label>
                  <select
                    name="kondisi_fasilitas"
                    value={form.kondisi_fasilitas}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Sedang Diperbaiki">Sedang Diperbaiki</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4 pt-5">
                  <button
                    onClick={() => setOpenModal(false)}
                    className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition font-medium text-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-[#1c3163] hover:bg-[#16274f] text-white transition disabled:bg-gray-400 font-medium"
                  >
                    {loading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL MASTER FASILITAS */}
        {/* ============================================ */}
        {openMasterModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setOpenMasterModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-8 text-gray-800">Tambah Data Master Fasilitas</h2>

              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">Nama Fasilitas</label>
                  <input
                    type="text"
                    placeholder="Contoh: AC, Lemari, Kasur..."
                    value={namaFasilitas}
                    onChange={(e) => setNamaFasilitas(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-5">
                  <button
                    onClick={() => setOpenMasterModal(false)}
                    className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition font-medium text-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveMaster}
                    className="px-6 py-3 rounded-xl bg-[#1c3163] hover:bg-[#16274f] text-white transition font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL DETAIL VIEW (MATA) */}
        {/* ============================================ */}
        {detailData && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setDetailData(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold mb-8 text-gray-800">Detail Fasilitas</h2>

              {/* NOMOR KAMAR */}
              <div className="mb-8">
                <p className="text-gray-500 mb-2 font-medium">Nomor Kamar</p>
                <div className="border rounded-xl px-4 py-3 font-semibold bg-gray-50 text-gray-800 text-lg">
                  Kamar {detailData[0]?.id_kamar}
                </div>
              </div>

              {/* LIST FASILITAS */}
              <div className="space-y-4">
                {detailData.map((item: any, index: number) => (
                  <div key={`detail-${index}`} className="border rounded-2xl p-6 bg-white shadow-sm relative">
                    
                    {/* NAMA */}
                    <div className="mb-4">
                      <p className="text-gray-500 mb-1 text-sm font-medium">Nama Fasilitas</p>
                      <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800 font-medium">
                        {item.fasilitas?.nama_fasilitas}
                      </div>
                    </div>

                    {/* STATUS */}
                    <div>
                      <p className="text-gray-500 mb-1 text-sm font-medium">Ubah Kondisi</p>
                      <select
                        value={item.kondisi_fasilitas}
                        onChange={async (e) => {
                          const value = e.target.value;
                          try {
                            const { error } = await supabase
                              .from("detail_fasilitas_kamar")
                              .update({ kondisi_fasilitas: value })
                              .eq("id_detail_fasiliitas_kamar", item.id_detail_fasiliitas_kamar);

                            if (error) throw error;

                            // UPDATE STATE
                            const updated = detailData.map((d: any) => {
                              if (d.id_detail_fasiliitas_kamar === item.id_detail_fasiliitas_kamar) {
                                return { ...d, kondisi_fasilitas: value };
                              }
                              return d;
                            });
                            setDetailData(updated);
                            showToast("Kondisi fasilitas berhasil diubah", "success");
                            await getDetailFasilitas();
                          } catch (error: any) {
                            showToast(error.message, "error");
                          }
                        }}
                        className={`w-full border rounded-xl px-4 py-3 outline-none font-medium focus:ring-2 focus:ring-blue-100 ${
                          item.kondisi_fasilitas === "Baik" ? "text-green-600 bg-green-50" :
                          item.kondisi_fasilitas === "Rusak" ? "text-red-600 bg-red-50" :
                          "text-yellow-600 bg-yellow-50"
                        }`}
                      >
                        <option value="Baik" className="text-gray-800">Baik</option>
                        <option value="Rusak" className="text-gray-800">Rusak</option>
                        <option value="Sedang Diperbaiki" className="text-gray-800">Sedang Diperbaiki</option>
                      </select>
                    </div>

                    {/* BUTTON HAPUS FASILITAS */}
                    <div className="flex justify-end pt-5">
                      <button
                        onClick={() => triggerDeleteFasilitas(item.id_detail_fasiliitas_kamar)}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-100 transition font-medium"
                      >
                        <Trash2 size={16} />
                        Hapus Fasilitas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL KONFIRMASI HAPUS FASILITAS */}
        {/* ============================================ */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Hapus Fasilitas?</h3>
                <p className="text-gray-500 mb-6">
                  Apakah Anda yakin ingin menghapus fasilitas ini dari kamar?
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmDelete(false);
                      setDeleteTargetId(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border hover:bg-gray-100 transition font-medium text-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeDeleteFasilitas}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition font-medium disabled:bg-gray-400"
                  >
                    {loading ? "..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}