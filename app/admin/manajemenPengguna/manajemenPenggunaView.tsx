"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ManajemenPenggunaView() {
  // ============================================
  // SUPABASE
  // ============================================
  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================
  const [pegawai, setPegawai] = useState<any[]>([]);
  const [penyewa, setPenyewa] = useState<any[]>([]);

  const [openPegawai, setOpenPegawai] = useState(false);
  const [openPenyewa, setOpenPenyewa] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editPegawaiId, setEditPegawaiId] = useState<string | null>(null);
  const [editPenyewaId, setEditPenyewaId] = useState<string | null>(null);

  // File Upload State untuk KTP
  const [fileKtp, setFileKtp] = useState<File | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  // ============================================
  // HELPER TOAST
  // ============================================
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000); // Otomatis hilang setelah 3 detik
  };

  // ============================================
  // FORM PEGAWAI
  // ============================================
  const [pegawaiForm, setPegawaiForm] = useState({
    nama_pegawai: "",
    email_pegawai: "",
    password: "",
    nomor_telepon_pegawai: "",
    id_role: "2",
    status_pegawai: "Aktif",
  });

  // ============================================
  // FORM PENYEWA
  // ============================================
  const [penyewaForm, setPenyewaForm] = useState({
    nama_penyewa: "",
    email_penyewa: "",
    password: "",
    nomor_telepon_penyewa: "",
    ktp_penyewa: "",
    jenis_kelamin: "true", // Default 'true' = Pria
    status_penyewa: "Aktif",
  });

  // ============================================
  // GET PEGAWAI
  // ============================================
  const getPegawai = async () => {
    const { data, error } = await supabase
      .from("pegawai")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }
    setPegawai(data || []);
  };

  // ============================================
  // GET PENYEWA
  // ============================================
  const getPenyewa = async () => {
    const { data, error } = await supabase
      .from("penyewa")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }
    setPenyewa(data || []);
  };

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    getPegawai();
    getPenyewa();
  }, []);

  // ============================================
  // HANDLE INPUT PEGAWAI
  // ============================================
  const handlePegawaiChange = (e: any) => {
    setPegawaiForm({
      ...pegawaiForm,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================
  // HANDLE INPUT PENYEWA
  // ============================================
  const handlePenyewaChange = (e: any) => {
    setPenyewaForm({
      ...penyewaForm,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================
  // SIMPAN PEGAWAI
  // ============================================
  const handleSavePegawai = async () => {
    try {
      setLoading(true);

      // --- VALIDASI PEGAWAI BARU ---
      // Jika mode tambah (editPegawaiId kosong) dan email/password belum diisi
      if (!editPegawaiId && (!pegawaiForm.email_pegawai || !pegawaiForm.password)) {
        showToast("Email dan Password wajib diisi untuk pegawai baru!", "error");
        setLoading(false);
        return;
      }

      // ============================================
      // UPDATE
      // ============================================
      if (editPegawaiId) {
        const { error } = await supabase
          .from("pegawai")
          .update({
            nama_pegawai: pegawaiForm.nama_pegawai,
            email_pegawai: pegawaiForm.email_pegawai,
            nomor_telepon_pegawai: pegawaiForm.nomor_telepon_pegawai,
            id_role: Number(pegawaiForm.id_role),
            status_pegawai: pegawaiForm.status_pegawai,
          })
          .eq("id_pegawai", editPegawaiId);

        if (error) throw error;
        showToast("Pegawai berhasil diupdate", "success");
      } else {
        // ============================================
        // INSERT AUTH USER
        // ============================================
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: pegawaiForm.email_pegawai,
          password: pegawaiForm.password,
        });

        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) {
          throw new Error("User gagal dibuat");
        }

        // ============================================
        // INSERT PEGAWAI
        // ============================================
        const { error } = await supabase.from("pegawai").insert([
          {
            id_pegawai: userId,
            nama_pegawai: pegawaiForm.nama_pegawai,
            email_pegawai: pegawaiForm.email_pegawai,
            nomor_telepon_pegawai: pegawaiForm.nomor_telepon_pegawai,
            id_role: Number(pegawaiForm.id_role),
            status_pegawai: pegawaiForm.status_pegawai,
          },
        ]);

        if (error) throw error;
        showToast("Pegawai berhasil ditambahkan", "success");
      }

      // REFRESH & RESET
      await getPegawai();
      setPegawaiForm({
        nama_pegawai: "",
        email_pegawai: "",
        password: "",
        nomor_telepon_pegawai: "",
        id_role: "2",
        status_pegawai: "Aktif",
      });
      setEditPegawaiId(null);
      setOpenPegawai(false);
    } catch (error: any) {
      console.log(error);
      showToast(error.message || "Terjadi kesalahan", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SIMPAN PENYEWA
  // ============================================
  const handleSavePenyewa = async () => {
    try {
      setLoading(true);

      // --- VALIDASI PENYEWA BARU ---
      // Jika mode tambah (editPenyewaId kosong) dan email/password belum diisi
      if (!editPenyewaId && (!penyewaForm.email_penyewa || !penyewaForm.password)) {
        showToast("Email dan Password wajib diisi untuk penyewa baru!", "error");
        setLoading(false);
        return;
      }

      // 1. Upload KTP Image jika ada file baru yang dipilih
      let fotoKtpUrl = null;
      if (fileKtp) {
        const fileExt = fileKtp.name.split(".").pop();
        const fileName = `ktp-${Date.now()}.${fileExt}`;

        // Asumsi bucket Supabase bernama 'berkas_ktp'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("berkas_ktp") 
          .upload(fileName, fileKtp);

        if (uploadError) throw uploadError;

        // Ambil URL public
        const { data: publicUrlData } = supabase.storage
          .from("berkas_ktp")
          .getPublicUrl(uploadData.path);
          
        fotoKtpUrl = publicUrlData.publicUrl;
      }

      // Payload dasar (untuk digunakan di Insert maupun Update)
      const isPria = penyewaForm.jenis_kelamin === "true";
      const payload: any = {
        nama_penyewa: penyewaForm.nama_penyewa,
        email_penyewa: penyewaForm.email_penyewa,
        nomor_telepon_penyewa: penyewaForm.nomor_telepon_penyewa,
        ktp_penyewa: penyewaForm.ktp_penyewa,
        jenis_kelamin: isPria, // Konversi ke boolean
        status_penyewa: penyewaForm.status_penyewa,
      };

      // Tambahkan url foto KTP jika file diunggah
      if (fotoKtpUrl) {
        payload.foto_ktp = fotoKtpUrl;
      }

      // ============================================
      // UPDATE PENYEWA
      // ============================================
      if (editPenyewaId) {
        const { error } = await supabase
          .from("penyewa")
          .update(payload)
          .eq("id_penyewa", editPenyewaId);

        if (error) throw error;
        showToast("Penyewa berhasil diupdate", "success");
      } else {
        // ============================================
        // INSERT AUTH USER
        // ============================================
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: penyewaForm.email_penyewa,
          password: penyewaForm.password,
        });

        if (authError) throw authError;

        const userId = authData.user?.id;
        if (!userId) {
          throw new Error("User gagal dibuat");
        }

        // ============================================
        // INSERT PENYEWA BARU
        // ============================================
        payload.id_penyewa = userId;
        payload.id_role = 3; 

        const { error } = await supabase.from("penyewa").insert([payload]);

        if (error) throw error;
        showToast("Penyewa berhasil ditambahkan", "success");
      }

      // REFRESH & RESET
      await getPenyewa();
      setPenyewaForm({
        nama_penyewa: "",
        email_penyewa: "",
        password: "",
        nomor_telepon_penyewa: "",
        ktp_penyewa: "",
        jenis_kelamin: "true",
        status_penyewa: "Aktif",
      });
      setFileKtp(null);
      setEditPenyewaId(null);
      setOpenPenyewa(false);

    } catch (error: any) {
      console.log(error);
      showToast(error.message || "Terjadi kesalahan", "error");
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
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          
          {/* TITLE */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Manajemen Pengguna</h1>
            <p className="text-gray-500 mt-1">Kelola data pegawai dan penyewa kos</p>
          </div>

          {/* ============================================ */}
          {/* DATA PEGAWAI */}
          {/* ============================================ */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold">Data Pegawai</h2>
              <button
                onClick={() => {
                  setOpenPegawai(true);
                  setEditPegawaiId(null);
                }}
                className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl"
              >
                <Plus size={18} />
                Tambah Pegawai
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Nama</th>
                    <th className="px-6 py-4 text-left font-semibold">Email</th>
                    <th className="px-6 py-4 text-left font-semibold">Telepon</th>
                    <th className="px-6 py-4 text-left font-semibold">Role</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pegawai.map((item) => (
                    <tr key={item.id_pegawai} className="border-t">
                      <td className="px-6 py-4 text-gray-800">{item.nama_pegawai}</td>
                      <td className="px-6 py-4 text-gray-800">{item.email_pegawai}</td>
                      <td className="px-6 py-4 text-gray-800">{item.nomor_telepon_pegawai}</td>
                      <td className="px-6 py-4 text-gray-800">{item.id_role === 1 ? "Pemilik" : "Admin"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.status_pegawai === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.status_pegawai}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setEditPegawaiId(item.id_pegawai);
                              setPegawaiForm({
                                nama_pegawai: item.nama_pegawai,
                                email_pegawai: item.email_pegawai,
                                password: "",
                                nomor_telepon_pegawai: item.nomor_telepon_pegawai,
                                id_role: String(item.id_role),
                                status_pegawai: item.status_pegawai,
                              });
                              setOpenPegawai(true);
                            }}
                            className="p-3 rounded-xl bg-yellow-100 text-yellow-600"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================ */}
          {/* DATA PENYEWA */}
          {/* ============================================ */}
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold">Data Penyewa</h2>
              <button
                onClick={() => {
                  setOpenPenyewa(true);
                  setEditPenyewaId(null);
                  setFileKtp(null); // Reset input foto
                }}
                className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl"
              >
                <Plus size={18} />
                Tambah Penyewa
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Nama</th>
                    <th className="px-6 py-4 text-left font-semibold">Email</th>
                    <th className="px-6 py-4 text-left font-semibold">Telepon</th>
                    <th className="px-6 py-4 text-left font-semibold">Kelamin</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {penyewa.map((item) => (
                    <tr key={item.id_penyewa} className="border-t">
                      <td className="px-6 py-4 text-gray-800">{item.nama_penyewa}</td>
                      <td className="px-6 py-4 text-gray-800">{item.email_penyewa}</td>
                      <td className="px-6 py-4 text-gray-800">{item.nomor_telepon_penyewa}</td>
                      <td className="px-6 py-4 text-gray-800">{item.jenis_kelamin ? "Pria" : "Perempuan"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.status_penyewa === "Aktif" ? "bg-green-100 text-green-700" :
                          item.status_penyewa === "Non-Aktif" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {item.status_penyewa}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setEditPenyewaId(item.id_penyewa);
                              setPenyewaForm({
                                nama_penyewa: item.nama_penyewa,
                                email_penyewa: item.email_penyewa || "",
                                password: "",
                                nomor_telepon_penyewa: item.nomor_telepon_penyewa,
                                ktp_penyewa: item.ktp_penyewa,
                                jenis_kelamin: String(item.jenis_kelamin),
                                status_penyewa: item.status_penyewa,
                              });
                              setFileKtp(null); // Reset input file saat mode edit dibuka
                              setOpenPenyewa(true);
                            }}
                            className="p-3 rounded-xl bg-yellow-100 text-yellow-600"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================ */}
      {/* MODAL PEGAWAI */}
      {/* ============================================ */}
      {openPegawai && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative">
            <button
              onClick={() => setOpenPegawai(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold mb-8">
              {editPegawaiId ? "Edit Pegawai" : "Tambah Pegawai"}
            </h2>

            <div className="space-y-5">
              <input
                type="text"
                name="nama_pegawai"
                value={pegawaiForm.nama_pegawai}
                onChange={handlePegawaiChange}
                placeholder="Nama Pegawai"
                className="w-full border rounded-xl px-4 py-3 outline-none"
              />
              <input
                type="email"
                name="email_pegawai"
                value={pegawaiForm.email_pegawai}
                onChange={handlePegawaiChange}
                placeholder="Email"
                className="w-full border rounded-xl px-4 py-3 outline-none"
              />
              {!editPegawaiId && (
                <input
                  type="password"
                  name="password"
                  value={pegawaiForm.password}
                  onChange={handlePegawaiChange}
                  placeholder="Password"
                  className="w-full border rounded-xl px-4 py-3 outline-none"
                />
              )}
              <input
                type="text"
                name="nomor_telepon_pegawai"
                value={pegawaiForm.nomor_telepon_pegawai}
                onChange={handlePegawaiChange}
                placeholder="Nomor Telepon"
                className="w-full border rounded-xl px-4 py-3 outline-none"
              />
              <select
                name="id_role"
                value={pegawaiForm.id_role}
                onChange={handlePegawaiChange}
                className="w-full border rounded-xl px-4 py-3 outline-none"
              >
                <option value="1">Pemilik</option>
                <option value="2">Admin</option>
              </select>
              <select
                name="status_pegawai"
                value={pegawaiForm.status_pegawai}
                onChange={handlePegawaiChange}
                className="w-full border rounded-xl px-4 py-3 outline-none"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>

              <div className="flex justify-end gap-4 pt-5">
                <button
                  onClick={() => setOpenPegawai(false)}
                  className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSavePegawai}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#1c3163] hover:bg-[#16274f] text-white transition disabled:bg-gray-400"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL PENYEWA */}
      {/* ============================================ */}
      {openPenyewa && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setOpenPenyewa(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold mb-8">
              {editPenyewaId ? "Edit Penyewa" : "Tambah Penyewa"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Nama Penyewa</label>
                <input
                  type="text"
                  name="nama_penyewa"
                  value={penyewaForm.nama_penyewa}
                  onChange={handlePenyewaChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Email Penyewa</label>
                <input
                  type="email"
                  name="email_penyewa"
                  value={penyewaForm.email_penyewa}
                  onChange={handlePenyewaChange}
                  placeholder="Masukkan email valid"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {!editPenyewaId && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1 ml-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={penyewaForm.password}
                    onChange={handlePenyewaChange}
                    placeholder="Buat password untuk penyewa"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 ml-1">Nomor Telepon</label>
                  <input
                    type="text"
                    name="nomor_telepon_penyewa"
                    value={penyewaForm.nomor_telepon_penyewa}
                    onChange={handlePenyewaChange}
                    placeholder="08xxxxxxxx"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 ml-1">Jenis Kelamin</label>
                  <select
                    name="jenis_kelamin"
                    value={penyewaForm.jenis_kelamin}
                    onChange={handlePenyewaChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="true">Pria</option>
                    <option value="false">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Nomor NIK KTP</label>
                <input
                  type="text"
                  name="ktp_penyewa"
                  value={penyewaForm.ktp_penyewa}
                  onChange={handlePenyewaChange}
                  placeholder="Masukkan Nomor KTP"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* INPUT FILE FOTO KTP */}
              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Unggah Foto KTP (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileKtp(e.target.files?.[0] || null)}
                  className="w-full border rounded-xl px-4 py-3 outline-none bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Status Penyewa</label>
                <select
                  name="status_penyewa"
                  value={penyewaForm.status_penyewa}
                  onChange={handlePenyewaChange}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                  <option value="Ditangguhkan">Ditangguhkan</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-5">
                <button
                  onClick={() => setOpenPenyewa(false)}
                  className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSavePenyewa}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#1c3163] hover:bg-[#16274f] text-white transition disabled:bg-gray-400"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}