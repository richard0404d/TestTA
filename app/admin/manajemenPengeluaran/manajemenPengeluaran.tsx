"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function ManajemenPengeluaran() {
  const supabase = createClient();

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pengeluaran, setPengeluaran] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [pegawaiLogin, setPegawaiLogin] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", 
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const [form, setForm] = useState({
    tanggal_pengeluaran: "",
    keterangan_pengeluaran: "",
    jumlah_pengeluaran: "",
  });

  const getPegawaiLogin = async () => {
    try {
      // Ambil session user yang sedang aktif
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn("User belum login atau session tidak ditemukan.");
        return;
      }

      const { data, error } = await supabase
        .from("pegawai")
        .select("*")
        .eq("id_pegawai", user.id)
        .single();

      if (error) {
        console.warn("User login saat ini bukan pegawai atau tidak ada di tabel pegawai:", error.message);
        return;
      }

      setPegawaiLogin(data);
    } catch (err) {
      console.error("Gagal mengambil data login pegawai:", err);
    }
  };

  const getPengeluaran = async () => {
    const { data, error } = await supabase
      .from("pengeluaran")
      .select(`
        *,
        pegawai (
          nama_pegawai
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setPengeluaran(data || []);
  };

  useEffect(() => {
    getPegawaiLogin();
    getPengeluaran();
  }, []);

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!pegawaiLogin && !editId) {
        showToast("Gagal: Anda tidak terdeteksi sebagai pegawai aktif.", "error");
        setLoading(false);
        return;
      }

      const isTanggalKosong = !form.tanggal_pengeluaran || form.tanggal_pengeluaran.trim() === "";
      const isKeteranganKosong = !form.keterangan_pengeluaran || form.keterangan_pengeluaran.trim() === "";
      const isJumlahKosong = !form.jumlah_pengeluaran || form.jumlah_pengeluaran.toString().trim() === "";

      if (isTanggalKosong && isKeteranganKosong && isJumlahKosong) {
        showToast("Harap mengisi semua field wajib!", "error");
        setLoading(false);
        return;
      }

      if (!form.tanggal_pengeluaran || form.tanggal_pengeluaran.trim() === "") {
        showToast("Tanggal pengeluaran wajib diisi!", "error");
        setLoading(false);
        return;
      }

      if (isKeteranganKosong && isJumlahKosong) {
        showToast("Harap mengisi semua field wajib!", "error");
        setLoading(false);
        return;
      }

      if (!form.keterangan_pengeluaran || form.keterangan_pengeluaran.trim() === "") {
        showToast("Keterangan pengeluaran wajib diisi!", "error");
        setLoading(false);
        return;
      }

      if (!form.jumlah_pengeluaran || form.jumlah_pengeluaran.toString().trim() === "") {
        showToast("Jumlah pengeluaran wajib diisi!", "error");
        setLoading(false);
        return;
      }
      
      if (Number(form.jumlah_pengeluaran) <= 0) {
        showToast("Jumlah pengeluaran harus lebih dari 0!", "error");
        setLoading(false);
        return;
      }

      if (editId) {
        const { error } = await supabase
          .from("pengeluaran")
          .update({
            tanggal_pengeluaran: form.tanggal_pengeluaran,
            keterangan_pengeluaran: form.keterangan_pengeluaran,
            jumlah_pengeluaran: Number(form.jumlah_pengeluaran),
          })
          .eq("id_pengeluaran", editId);

        if (error) throw error;

        showToast("Pengeluaran berhasil diubah", "success");
      } else {

        const { error } = await supabase
          .from("pengeluaran")
          .insert([
            {
              id_pegawai: pegawaiLogin.id_pegawai,
              tanggal_pengeluaran: form.tanggal_pengeluaran,
              keterangan_pengeluaran: form.keterangan_pengeluaran,
              jumlah_pengeluaran: Number(form.jumlah_pengeluaran),
            },
          ]);

        if (error) throw error;

        showToast("Pengeluaran berhasil ditambahkan", "success");
      }

      await getPengeluaran();
      setForm({
        tanggal_pengeluaran: "",
        keterangan_pengeluaran: "",
        jumlah_pengeluaran: "",
      });
      setEditId(null);
      setOpenModal(false);

    } catch (error: any) {
      console.log(error);
      showToast(error.message || "Terjadi kesalahan", "error");
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pengeluaran.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pengeluaran.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-100 md:pt-20">
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
        {/* CARD */}
        <div>
          <div className="bg-white rounded-3xl border shadow-sm p-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Manajemen Pengeluaran
                </h1>
                <p className="text-gray-500 mt-1">
                  Kelola data pengeluaran kos
                </p>
              </div>

              <button
                onClick={() => {
                  setOpenModal(true);
                  setEditId(null);
                  setForm({
                    tanggal_pengeluaran: "",
                    keterangan_pengeluaran: "",
                    jumlah_pengeluaran: "",
                  });
                }}
                className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
              >
                <Plus size={18} />
                Tambah Pengeluaran
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="pt-8">
            <div className="overflow-x-auto rounded-2xl border bg-white flex flex-col">
              <table className="w-full min-w-[900px]">
                {/* HEAD */}
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Nama Pegawai</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Tanggal Pengeluaran</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Keterangan</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Jumlah Pengeluaran</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {pengeluaran.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.id_pengeluaran} className="border-t hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-800">
                          {item.pegawai?.nama_pegawai || "-"}
                        </td>

                        <td className="px-6 py-4 text-gray-800">
                          {item.tanggal_pengeluaran ? new Date(item.tanggal_pengeluaran).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          }) : "-"}
                        </td>

                        <td className="px-6 py-4 text-gray-800">
                          {item.keterangan_pengeluaran}
                        </td>

                        <td className="px-6 py-4 text-gray-800 font-medium">
                          Rp {Number(item.jumlah_pengeluaran).toLocaleString("id-ID")}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                setEditId(item.id_pengeluaran);
                                setForm({
                                  tanggal_pengeluaran: item.tanggal_pengeluaran?.split("T")[0] || "",
                                  keterangan_pengeluaran: item.keterangan_pengeluaran || "",
                                  jumlah_pengeluaran: item.jumlah_pengeluaran || "",
                                });
                                setOpenModal(true);
                              }}
                              className="p-3 rounded-xl bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition"
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
                        Data pengeluaran belum tersedia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {pengeluaran.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                  
                  <div className="text-sm text-gray-500">
                    Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, pengeluaran.length)} dari {pengeluaran.length} data
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
                          onClick={() => paginate(number)}
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
        </div>

        {openModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
              
              {/* CLOSE */}
              <button
                onClick={() => setOpenModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                {editId ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
              </h2>

              <div className="space-y-6">

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Nama Pegawai
                  </label>
                  <input
                    type="text"
                    disabled
                    value={pegawaiLogin?.nama_pegawai || "Memuat atau Tidak Ditemukan..."}
                    className="w-full border rounded-xl px-4 py-3 bg-gray-100 text-gray-500 outline-none"
                  />
                  {!pegawaiLogin && !editId && (
                    <p className="text-red-500 text-xs mt-2">
                      *Anda tidak bisa menambah pengeluaran karena Anda tidak login sebagai pegawai.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    name="tanggal_pengeluaran"
                    value={form.tanggal_pengeluaran}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Keterangan Pengeluaran
                  </label>
                  <textarea
                    name="keterangan_pengeluaran"
                    value={form.keterangan_pengeluaran}
                    onChange={handleChange}
                    placeholder="Masukkan keterangan pengeluaran"
                    className="w-full border rounded-xl px-4 py-3 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Jumlah Pengeluaran (Rp)
                  </label>
                  <input
                    type="number"
                    name="jumlah_pengeluaran"
                    value={form.jumlah_pengeluaran}
                    onChange={handleChange}
                    placeholder="Masukkan jumlah pengeluaran"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-5">
                  <button
                    onClick={() => setOpenModal(false)}
                    className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || (!pegawaiLogin && !editId)}
                    className="px-6 py-3 rounded-xl bg-[#1c3163] text-white hover:bg-[#16274f] transition disabled:bg-gray-400"
                  >
                    {loading ? "Menyimpan..." : "Simpan"}
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