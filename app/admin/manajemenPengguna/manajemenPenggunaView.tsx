"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

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

  // ============================================
  // PAGINATION STATE
  // ============================================
  const [currentPagePegawai, setCurrentPagePegawai] = useState(1);
  const [currentPagePenyewa, setCurrentPagePenyewa] = useState(1);
  const itemsPerPage = 5;

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  const isNumber = (val: string) => /^\d*$/.test(val);

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
    ktp_penyewa: "", // Menyimpan URL gambar KTP
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
    const { name, value } = e.target;
    
    // Jika field yang diubah adalah nomor telepon, validasi hanya angka
    if (name === "nomor_telepon_pegawai") {
      if (!isNumber(value)) return; // Berhenti jika bukan angka
    }
    
    setPegawaiForm({
      ...pegawaiForm,
      [name]: value,
    });
  };

  // ============================================
  // HANDLE INPUT PENYEWA
  // ============================================
  const handlePenyewaChange = (e: any) => {
    const { name, value } = e.target;
    
    // Jika field yang diubah adalah nomor telepon, validasi hanya angka
    if (name === "nomor_telepon_penyewa") {
      if (!isNumber(value)) return; // Berhenti jika bukan angka
    }
    
    setPenyewaForm({
      ...penyewaForm,
      [name]: value,
    });
  };

  // ============================================
  // SIMPAN PEGAWAI
  // ============================================
  const handleSavePegawai = async () => {
    try {
      setLoading(true);

      if (!editPegawaiId && (!pegawaiForm.email_pegawai && !pegawaiForm.password && !pegawaiForm.nama_pegawai && !pegawaiForm.nomor_telepon_pegawai)) {
        showToast("Harap mengisi semua field wajib!", "error");
        setLoading(false);
        return;
      }

      // --- VALIDASI PEGAWAI BARU ---
      if (!editPegawaiId) {
        if (!pegawaiForm.email_pegawai || !pegawaiForm.password) {
          showToast("Email dan Password wajib diisi untuk pegawai baru!", "error");
          setLoading(false);
          return;
        }

        // [BARU] CEK KETERSEDIAAN EMAIL DI TABEL PEGAWAI DAN PENYEWA
        const { data: cekPegawai } = await supabase.from("pegawai").select("email_pegawai").eq("email_pegawai", pegawaiForm.email_pegawai).maybeSingle();
        const { data: cekPenyewa } = await supabase.from("penyewa").select("email_penyewa").eq("email_penyewa", pegawaiForm.email_pegawai).maybeSingle();

        if (cekPegawai || cekPenyewa) {
          showToast("Email sudah terdaftar di sistem!", "error");
          setLoading(false);
          return;
        }
      }

      // ============================================
      // UPDATE
      // ============================================
      if (editPegawaiId) {

        if (!pegawaiForm.nama_pegawai && !pegawaiForm.nomor_telepon_pegawai) {
          showToast("Harap mengisi semua field wajib!", "error");
          setLoading(false);
          return;
        }

        if (!pegawaiForm.nama_pegawai) {
          showToast("Nama pegawai wajib diisi!", "error");
          setLoading(false);
          return;
        }

        if (!pegawaiForm.nomor_telepon_pegawai) {
          showToast("Nomor telepon pegawai wajib diisi!", "error");
          setLoading(false);
          return;
        }

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
        showToast("Pegawai berhasil diubah", "success");
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
      
      if (!editPenyewaId) {
        if (!penyewaForm.email_penyewa && !penyewaForm.password && !penyewaForm.nama_penyewa && !penyewaForm.nomor_telepon_penyewa && !fileKtp) {
          showToast("Harap mengisi semua field wajib!", "error");
          setLoading(false);
          return;
        }
        
        if (!penyewaForm.email_penyewa || !penyewaForm.password) {
          showToast("Email dan Password wajib diisi untuk penyewa baru!", "error");
          setLoading(false);
          return;
        }

        if (!penyewaForm.nama_penyewa) {
          showToast("Nama penyewa wajib diisi untuk penyewa baru!", "error");
          setLoading(false);
          return;
        }

        if (!penyewaForm.nomor_telepon_penyewa) {
          showToast("Nomor telepon penyewa wajib diisi untuk penyewa baru!", "error");
          setLoading(false);
          return;
        }
      
        if (!fileKtp) {
          showToast("Foto KTP wajib diunggah untuk penyewa baru!", "error");
          setLoading(false);
          return;
        }

        // [BARU] CEK KETERSEDIAAN EMAIL SEBELUM UPLOAD KTP
        const { data: cekPegawai } = await supabase.from("pegawai").select("email_pegawai").eq("email_pegawai", penyewaForm.email_penyewa).maybeSingle();
        const { data: cekPenyewa } = await supabase.from("penyewa").select("email_penyewa").eq("email_penyewa", penyewaForm.email_penyewa).maybeSingle();

        if (cekPegawai || cekPenyewa) {
          showToast("Email sudah terdaftar di sistem! ", "error");
          setLoading(false);
          return;
        }
      }

      // 1. Upload KTP Image jika ada file baru yang dipilih
      let fotoKtpUrl = null;
      if (fileKtp) {
        const fileExt = fileKtp.name.split(".").pop();
        const fileName = `ktp-${Date.now()}.${fileExt}`;

        // Asumsi bucket Supabase bernama 'ktp'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("ktp") 
          .upload(fileName, fileKtp);

        if (uploadError) throw uploadError;

        // Ambil URL public
        const { data: publicUrlData } = supabase.storage
          .from("ktp")
          .getPublicUrl(uploadData.path);
          
        fotoKtpUrl = publicUrlData.publicUrl;
      }

      // Payload dasar (untuk digunakan di Insert maupun Update)
      const isPria = penyewaForm.jenis_kelamin === "true";
      const payload: any = {
        nama_penyewa: penyewaForm.nama_penyewa,
        email_penyewa: penyewaForm.email_penyewa,
        nomor_telepon_penyewa: penyewaForm.nomor_telepon_penyewa,
        jenis_kelamin_penyewa: isPria, // Konversi ke boolean
        status_penyewa: penyewaForm.status_penyewa,
      };

      // Tambahkan url foto KTP jika file diunggah
      if (fotoKtpUrl) {
        payload.ktp_penyewa = fotoKtpUrl;
      }

      // ============================================
      // UPDATE PENYEWA
      // ============================================
      if (editPenyewaId) {
        if (!penyewaForm.nama_penyewa && !penyewaForm.nomor_telepon_penyewa) {
          showToast("Harap mengisi semua field wajib!", "error");
          setLoading(false);
          return;
        }

        if (!penyewaForm.nama_penyewa) {
          showToast("Nama penyewa wajib diisi!", "error");
          setLoading(false);
          return;
        }

        if (!penyewaForm.nomor_telepon_penyewa) {
          showToast("Nomor telepon penyewa wajib diisi!", "error");
          setLoading(false);
          return;
        }
        
        const { error } = await supabase
          .from("penyewa")
          .update(payload)
          .eq("id_penyewa", editPenyewaId);

        if (error) throw error;

        // --- TRIGGER OTOMATIS: JIKA STATUS NON-AKTIF ATAU DITANGGUHKAN ---
        if (payload.status_penyewa === "Non-Aktif" || payload.status_penyewa === "Ditangguhkan") {
          // Cari data sewa yang masih berjalan (bukan "Berakhir")
          const { data: sewaAktif, error: sewaError } = await supabase
            .from("sewa")
            .select("id_sewa, id_kamar, id_reservasi")
            .eq("id_penyewa", editPenyewaId)
            .neq("status_sewa", "Berakhir");

          if (sewaAktif && sewaAktif.length > 0) {
            for (const sewa of sewaAktif) {
              // 1. Update Sewa menjadi "Berakhir"
              await supabase.from("sewa").update({ status_sewa: "Berakhir" }).eq("id_sewa", sewa.id_sewa);
              // 2. Update Reservasi menjadi "Selesai"
              if (sewa.id_reservasi) await supabase.from("reservasi").update({ status_reservasi: "Selesai" }).eq("id_reservasi", sewa.id_reservasi);
              // 3. Update Kamar menjadi "Tersedia"
              if (sewa.id_kamar) await supabase.from("kamar").update({ status_kamar: "Tersedia" }).eq("id_kamar", sewa.id_kamar);
              // 4. Update Tagihan menjadi "Kadaluarsa"
              await supabase.from("tagihan").update({ status_tagihan: "Kadaluarsa" }).eq("id_sewa", sewa.id_sewa).eq("status_tagihan", "Belum Dibayar");
            }
          }
        }

        showToast("Penyewa berhasil diubah", "success");
      } else {
        // ============================================
        // INSERT AUTH USER (Baru)
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
        payload.role = 3; 

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

  // LOGIKA PAGINATION ITEMS
  const indexOfLastPegawai = currentPagePegawai * itemsPerPage;
  const indexOfFirstPegawai = indexOfLastPegawai - itemsPerPage;
  const currentPegawai = pegawai.slice(indexOfFirstPegawai, indexOfLastPegawai);
  const totalPagesPegawai = Math.ceil(pegawai.length / itemsPerPage);

  const indexOfLastPenyewa = currentPagePenyewa * itemsPerPage;
  const indexOfFirstPenyewa = indexOfLastPenyewa - itemsPerPage;
  const currentPenyewa = penyewa.slice(indexOfFirstPenyewa, indexOfLastPenyewa);
  const totalPagesPenyewa = Math.ceil(penyewa.length / itemsPerPage);

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
                  setPegawaiForm({
                    nama_pegawai: "",
                    email_pegawai: "",
                    password: "",
                    nomor_telepon_pegawai: "",
                    id_role: "2",
                    status_pegawai: "Aktif",
                  });
                }}
                className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl hover:bg-[#16274f] transition"
              >
                <Plus size={18} />
                Tambah Pegawai
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border flex flex-col bg-white">
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
                  {currentPegawai.length > 0 ? (
                    currentPegawai.map((item) => (
                      <tr key={item.id_pegawai} className="border-t hover:bg-gray-50 transition">
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
                      <td colSpan={6} className="text-center py-20 text-gray-400">
                        Data pegawai belum tersedia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION PEGAWAI */}
              {pegawai.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                  <div className="text-sm text-gray-500">
                    Menampilkan {indexOfFirstPegawai + 1} hingga {Math.min(indexOfLastPegawai, pegawai.length)} dari {pegawai.length} data
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPagePegawai((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPagePegawai === 1}
                      className="p-2 rounded-lg border bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPagesPegawai }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => setCurrentPagePegawai(number)}
                          className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                            currentPagePegawai === number
                              ? "bg-[#1c3163] text-white border-[#1c3163]"
                              : "bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPagePegawai((prev) => Math.min(prev + 1, totalPagesPegawai))}
                      disabled={currentPagePegawai === totalPagesPegawai}
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
                  setPenyewaForm({
                    nama_penyewa: "",
                    email_penyewa: "",
                    password: "",
                    nomor_telepon_penyewa: "",
                    ktp_penyewa: "",
                    jenis_kelamin: "true",
                    status_penyewa: "Aktif",
                  });
                }}
                className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl hover:bg-[#16274f] transition"
              >
                <Plus size={18} />
                Tambah Penyewa
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border flex flex-col bg-white">
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
                  {currentPenyewa.length > 0 ? (
                    currentPenyewa.map((item) => (
                      <tr key={item.id_penyewa} className="border-t hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-800">{item.nama_penyewa}</td>
                        <td className="px-6 py-4 text-gray-800">{item.email_penyewa}</td>
                        <td className="px-6 py-4 text-gray-800">{item.nomor_telepon_penyewa}</td>
                        <td className="px-6 py-4 text-gray-800">{item.jenis_kelamin_penyewa ? "Pria" : "Wanita"}</td>
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
                                  jenis_kelamin: String(item.jenis_kelamin_penyewa), 
                                  status_penyewa: item.status_penyewa,
                                });
                                setFileKtp(null); // Reset input file saat mode edit dibuka
                                setOpenPenyewa(true);
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
                      <td colSpan={6} className="text-center py-20 text-gray-400">
                        Data penyewa belum tersedia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* PAGINATION PENYEWA */}
              {penyewa.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                  <div className="text-sm text-gray-500">
                    Menampilkan {indexOfFirstPenyewa + 1} hingga {Math.min(indexOfLastPenyewa, penyewa.length)} dari {penyewa.length} data
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPagePenyewa((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPagePenyewa === 1}
                      className="p-2 rounded-lg border bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPagesPenyewa }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => setCurrentPagePenyewa(number)}
                          className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${
                            currentPagePenyewa === number
                              ? "bg-[#1c3163] text-white border-[#1c3163]"
                              : "bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPagePenyewa((prev) => Math.min(prev + 1, totalPagesPenyewa))}
                      disabled={currentPagePenyewa === totalPagesPenyewa}
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
      </main>

      {/* ============================================ */}
      {/* MODAL PEGAWAI */}
      {/* ============================================ */}
      {openPegawai && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setOpenPegawai(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold mb-8">
              {editPegawaiId ? "Edit Pegawai" : "Tambah Pegawai"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Nama Pegawai</label>
                <input
                  type="text"
                  name="nama_pegawai"
                  value={pegawaiForm.nama_pegawai}
                  onChange={handlePegawaiChange}
                  placeholder="Masukkan nama pegawai"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Email Pegawai</label>
                <input
                  type="email"
                  name="email_pegawai"
                  value={pegawaiForm.email_pegawai}
                  onChange={handlePegawaiChange}
                  placeholder="Masukkan email"
                  readOnly={!!editPegawaiId} // Menjadi true jika sedang mode edit
                  className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 ${
                    editPegawaiId 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0" 
                      : "bg-white"
                  }`}
                />
              </div>

              {!editPegawaiId && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1 ml-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={pegawaiForm.password}
                    onChange={handlePegawaiChange}
                    placeholder="Buat password untuk pegawai"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Nomor Telepon</label>
                <input
                  type="text"
                  name="nomor_telepon_pegawai"
                  value={pegawaiForm.nomor_telepon_pegawai}
                  onChange={handlePegawaiChange}
                  placeholder="08xxxxxxxx"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 ml-1">Role Pegawai</label>
                  <select
                    name="id_role"
                    value={pegawaiForm.id_role}
                    onChange={handlePegawaiChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="1">Pemilik</option>
                    <option value="2">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 ml-1">Status Pegawai</label>
                  <select
                    name="status_pegawai"
                    value={pegawaiForm.status_pegawai}
                    onChange={handlePegawaiChange}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

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
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setOpenPenyewa(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
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
                  readOnly={!!editPenyewaId} // Menjadi true jika sedang mode edit
                  className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 ${
                    editPenyewaId 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0" 
                      : "bg-white"
                  }`}
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
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="true">Pria</option>
                    <option value="false">Wanita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2 ml-1">Foto KTP Penyewa</label>
                {editPenyewaId && penyewaForm.ktp_penyewa ? (
                  <div className="mb-2 border rounded-xl overflow-hidden bg-gray-50 p-2">
                    <img 
                      src={penyewaForm.ktp_penyewa} 
                      alt="KTP Penyewa" 
                      className="max-h-52 mx-auto object-contain rounded-lg" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.insertAdjacentHTML('afterend', '<p class="text-sm text-red-500 text-center p-4">Gambar KTP gagal dimuat.</p>');
                      }}
                    />
                  </div>
                ) : editPenyewaId ? (
                  <p className="text-sm text-gray-400 italic mb-2 ml-1">Belum ada foto KTP terunggah.</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">
                  {editPenyewaId ? "Unggah Foto KTP Baru (Opsional)" : "Unggah Foto KTP"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileKtp(e.target.files?.[0] || null)}
                  className="w-full border rounded-xl px-4 py-3 outline-none bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1 ml-1">Status Penyewa</label>
                <select
                  name="status_penyewa"
                  value={penyewaForm.status_penyewa}
                  onChange={handlePenyewaChange}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 bg-white"
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