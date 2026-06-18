"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertCircle, X, UserCircle } from "lucide-react";

export default function ProfilAdminPage() {
  // ============================================
  // SUPABASE
  // ============================================
  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false); // State untuk loading password

  // State Toast Notification
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

  // State Form Profil
  const [profil, setProfil] = useState({
    nama_pegawai: "",
    nomor_telepon_pegawai: "",
    email_pegawai: "",
    jenis_kelamin_pegawai: "true", // "true" untuk Pria, "false" untuk Wanita
    status_pegawai: "",
    id_role: 0,
  });

  // State Form Password
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // ============================================
  // FETCH DATA PROFIL PEGAWAI
  // ============================================
  useEffect(() => {
    const fetchProfil = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from("pegawai")
            .select("*")
            .eq("id_pegawai", user.id)
            .single();

          if (error) throw error;

          if (data) {
            setProfil({
              nama_pegawai: data.nama_pegawai || "",
              nomor_telepon_pegawai: data.nomor_telepon_pegawai || "",
              email_pegawai: data.email_pegawai || user.email || "",
              jenis_kelamin_pegawai: data.jenis_kelamin_pegawai === false ? "false" : "true",
              status_pegawai: data.status_pegawai || "-",
              id_role: data.id_role || 2,
            });
          }
        }
      } catch (err: any) {
        console.error("Gagal memuat profil:", err);
        showToast("Gagal memuat data profil", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, [supabase]);

  // ============================================
  // HANDLE UPDATE PROFIL
  // ============================================
  const handleUpdateProfil = async () => {
    if (!profil.nama_pegawai.trim()) {
      return showToast("Nama pegawai tidak boleh kosong!", "error");
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User tidak ditemukan, silakan login ulang.");

      const isPria = profil.jenis_kelamin_pegawai === "true";

      const { error } = await supabase
        .from("pegawai")
        .update({
          nama_pegawai: profil.nama_pegawai,
          nomor_telepon_pegawai: profil.nomor_telepon_pegawai,
          jenis_kelamin_pegawai: isPria,
        })
        .eq("id_pegawai", user.id);
      
      if (error) throw error;
      
      showToast("Profil berhasil diperbarui!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gagal memperbarui profil", "error");
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // HANDLE UPDATE PASSWORD
  // ============================================
  const handleUpdatePassword = async () => {
    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword || !confirmPassword) {
      return showToast("Password tidak boleh kosong!", "error");
    }

    if (newPassword !== confirmPassword) {
      return showToast("Password dan Konfirmasi Password tidak cocok!", "error");
    }

    if (newPassword.length < 6) {
      return showToast("Password minimal 6 karakter!", "error");
    }

    setUpdatingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      showToast("Gagal mereset password: " + error.message, "error");
    } else {
      showToast("Password berhasil diperbarui!", "success");
      setPasswordForm({ newPassword: "", confirmPassword: "" }); // Kosongkan form setelah sukses
    }
    
    setUpdatingPassword(false);
  };

  // ============================================
  // RENDER LOADING
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Memuat profil...</p>
      </div>
    );
  }

  // ============================================
  // RENDER UI
  // ============================================
  return (
    <div className="min-h-screen bg-gray-100 md:pt-20">
      
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 ${
          toast.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold text-sm">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition">
            <X size={18} />
          </button>
        </div>
      )}

      <main className="pt-24 md:ml-[260px] p-5 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* HEADER PROFIL */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1c3163] text-white rounded-full flex items-center justify-center shadow-md">
              <UserCircle size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Profil Saya</h1>
              <p className="text-gray-500 mt-1">
                {profil.id_role === 1 ? "Pemilik Kos" : "Administrator"}
              </p>
            </div>
          </div>

          {/* SECTION 1: FORM PROFIL */}
          <div className="bg-white rounded-3xl border shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Informasi Pribadi</h2>
            <div className="space-y-6">
              
              {/* NAMA LENGKAP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                  Nama Lengkap
                </label>
                <input 
                  type="text"
                  value={profil.nama_pegawai}
                  onChange={(e) => setProfil({...profil, nama_pegawai: e.target.value})}
                  placeholder="Masukkan nama lengkap"
                  className="w-full p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* GRID: TELEPON & KELAMIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Nomor Telepon
                  </label>
                  <input 
                    type="text"
                    value={profil.nomor_telepon_pegawai}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9]+$/.test(val)) {
                        setProfil({...profil, nomor_telepon_pegawai: val});
                      }
                    }}
                    placeholder="Contoh: 0812..."
                    className="w-full p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Jenis Kelamin
                  </label>
                  <select 
                    value={profil.jenis_kelamin_pegawai}
                    onChange={(e) => setProfil({...profil, jenis_kelamin_pegawai: e.target.value})}
                    className="w-full p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white transition"
                  >
                    <option value="true">Pria</option>
                    <option value="false">Wanita</option>
                  </select>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              {/* READ-ONLY FIELDS */}
              <h3 className="text-lg font-bold text-gray-800 mb-4">Informasi Akun</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Akun</label>
                  <p className="text-gray-800 font-medium mt-1.5 truncate">{profil.email_pegawai}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Pegawai</label>
                  <div className="mt-1.5">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      profil.status_pegawai === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {profil.status_pegawai}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOMBOL SIMPAN PROFIL */}
              <div className="pt-6">
                <button 
                  onClick={handleUpdateProfil}
                  disabled={saving}
                  className="w-full md:w-auto px-8 py-3.5 bg-[#1c3163] text-white rounded-xl font-semibold hover:bg-[#16274f] transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md shadow-blue-900/10"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan Profil"}
                </button>
              </div>

            </div>
          </div>

          {/* SECTION 2: FORM PASSWORD */}
          <div className="bg-white rounded-3xl border shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Keamanan Akun</h2>
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Password Baru</label>
                  <input 
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Ulangi Password Baru</label>
                  <input 
                    type="password"
                    placeholder="Ketik ulang password baru"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                  className="w-full md:w-auto px-8 py-3.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updatingPassword ? "Memperbarui..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}