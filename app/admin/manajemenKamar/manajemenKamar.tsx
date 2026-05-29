"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ManajemenKamar() {
  // ============================================
  // SUPABASE
  // ============================================
  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kamers, setKamers] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  const [form, setForm] = useState({
    harga_sewa_kamar: "",
    harga_tambahan_penyewa: "",
    status_kamar: "Tersedia",
  });

  // ============================================
  // HELPER TOAST
  // ============================================
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // ============================================
  // GET DATA
  // ============================================
  const getKamar = async () => {
    const { data, error } = await supabase
      .from("kamar")
      .select("*")
      .order("id_kamar", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }
    setKamers(data || []);
  };

  // ============================================
  // LOAD
  // ============================================
  useEffect(() => {
    getKamar();
  }, []);

  // ============================================
  // HANDLE CHANGE
  // ============================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================
  // OPEN TAMBAH
  // ============================================
  const handleOpenTambah = () => {
    setEditId(null);
    setForm({
      harga_sewa_kamar: "",
      harga_tambahan_penyewa: "",
      status_kamar: "Tersedia",
    });
    setOpenModal(true);
  };

  // ============================================
  // OPEN EDIT
  // ============================================
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
  // INSERT / UPDATE
  // ============================================
  const handleSubmit = async () => {
    // --- VALIDASI INPUT ---
    if (!form.harga_sewa_kamar || form.harga_sewa_kamar.toString().trim() === "") {
      return showToast("Harga Sewa Kamar wajib diisi!", "error");
    }
    if (Number(form.harga_sewa_kamar) <= 0) {
      return showToast("Harga Sewa Kamar harus lebih dari 0!", "error");
    }
    // -----------------------

    try {
      setLoading(true);

      // ============================================
      // UPDATE
      // ============================================
      if (editId) {
        const { error } = await supabase
          .from("kamar")
          .update({
            harga_sewa_kamar: Number(form.harga_sewa_kamar),
            harga_tambahan_penyewa: Number(form.harga_tambahan_penyewa || 0),
            status_kamar: form.status_kamar,
          })
          .eq("id_kamar", editId);

        if (error) throw error;
        showToast("Kamar berhasil diupdate", "success");
      } else {
        // ============================================
        // INSERT
        // ============================================
        const { error } = await supabase.from("kamar").insert([
          {
            harga_sewa_kamar: Number(form.harga_sewa_kamar),
            harga_tambahan_penyewa: Number(form.harga_tambahan_penyewa || 0),
            status_kamar: form.status_kamar,
          },
        ]);

        if (error) throw error;
        showToast("Kamar berhasil ditambahkan", "success");
      }

      // REFRESH
      await getKamar();

      // CLOSE & RESET
      setOpenModal(false);
      setEditId(null);
      setForm({
        harga_sewa_kamar: "",
        harga_tambahan_penyewa: "",
        status_kamar: "Tersedia",
      });
    } catch (error: any) {
      console.log(error);
      showToast(error.message, "error");
    } finally {
      setLoading(false);
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
        {/* CARD */}
        {/* ============================================ */}
        <div>
          <div className="bg-white rounded-3xl border shadow-sm p-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Kamar</h1>
                <p className="text-gray-500 mt-1">Kelola data kamar kos</p>
              </div>

              {/* BUTTON TAMBAH */}
              <button
                onClick={handleOpenTambah}
                className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
              >
                <Plus size={18} />
                Tambah Kamar
              </button>
            </div>
          </div>

          {/* ============================================ */}
          {/* TABLE */}
          {/* ============================================ */}
          <div className="pt-8">
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full min-w-[800px]">
                {/* HEAD */}
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">ID Kamar</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Harga Sewa</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Harga Tambahan</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {kamers.length > 0 ? (
                    kamers.map((kamar, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50 transition">
                        {/* ID */}
                        <td className="px-6 py-4 text-gray-800 font-medium">Kamar {kamar.id_kamar}</td>

                        {/* HARGA SEWA */}
                        <td className="px-6 py-4 text-gray-800">
                          Rp {Number(kamar.harga_sewa_kamar).toLocaleString("id-ID")}
                        </td>

                        {/* HARGA TAMBAHAN */}
                        <td className="px-6 py-4 text-gray-800">
                          Rp {Number(kamar.harga_tambahan_penyewa).toLocaleString("id-ID")}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              kamar.status_kamar === "Tersedia"
                                ? "bg-green-100 text-green-700"
                                : kamar.status_kamar === "Ditempati"
                                ? "bg-red-100 text-red-700"
                                : kamar.status_kamar === "Direservasi"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {kamar.status_kamar}
                          </span>
                        </td>

                        {/* AKSI */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* EDIT */}
                            <button
                              onClick={() => handleEdit(kamar)}
                              className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition"
                            >
                              <Pencil size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-gray-400">
                        Data kamar belum tersedia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* MODAL */}
        {/* ============================================ */}
        {openModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            {/* PANEL */}
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
              {/* CLOSE */}
              <button
                onClick={() => setOpenModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
              >
                <X size={24} />
              </button>

              {/* TITLE */}
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                {editId ? "Update Kamar" : "Tambah Kamar"}
              </h2>

              {/* FORM */}
              <div className="space-y-6">
                {/* HARGA SEWA */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Harga Sewa Kamar (Rp)
                  </label>
                  <input
                    type="number"
                    name="harga_sewa_kamar"
                    value={form.harga_sewa_kamar}
                    onChange={handleChange}
                    placeholder="Contoh: 1500000"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* HARGA TAMBAHAN */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Harga Tambahan / Orang (Rp) (Opsional)
                  </label>
                  <input
                    type="number"
                    name="harga_tambahan_penyewa"
                    value={form.harga_tambahan_penyewa}
                    onChange={handleChange}
                    placeholder="Contoh: 500000"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Status Kamar
                  </label>
                  <select
                    name="status_kamar"
                    value={form.status_kamar}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Ditempati">Ditempati</option>
                    <option value="Direservasi">Direservasi</option>
                    <option value="Diperbaiki">Diperbaiki</option>
                  </select>
                </div>

                {/* BUTTON */}
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={() => setOpenModal(false)}
                    className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition font-medium text-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-[#1c3163] text-white hover:bg-[#16274f] transition disabled:bg-gray-400 font-medium"
                  >
                    {loading ? "Menyimpan..." : editId ? "Update" : "Simpan"}
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