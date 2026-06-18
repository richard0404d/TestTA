"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const supabase = createClient();
  const router = useRouter(); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false); // State khusus loading password
  
  // State untuk notifikasi Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };
  
  // State untuk form profil
  const [profil, setProfil] = useState({
    nama_penyewa: "",
    nomor_telepon_penyewa: "",
    email: "",
    jenis_kelamin_penyewa: "",
    status_penyewa: "",
    ktp_url: "",
  });

  // State untuk form password
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch data profil
  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("penyewa")
            .select("*")
            .eq("id_penyewa", user.id)
            .single();

          if (data) {
            // Konversi Boolean (true=Pria, false=Wanita)
            const genderText = data.jenis_kelamin_penyewa === true ? "Pria" : "Wanita";
            
            setProfil({
              nama_penyewa: data.nama_penyewa || "",
              nomor_telepon_penyewa: data.nomor_telepon_penyewa || "",
              email: user.email || "",
              jenis_kelamin_penyewa: genderText,
              status_penyewa: data.status_penyewa || "-",
              ktp_url: data.ktp_penyewa || "", 
            });
          }
        }
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfil();
  }, [supabase]);

  // Handle Update Profil
  const handleUpdateProfil = async () => {
    if (!profil.nama_penyewa.trim()) {
      return showToast("Nama tidak boleh kosong!", "error");
    }
    
    if (!/^[0-9]+$/.test(profil.nomor_telepon_penyewa)) {
      return showToast("Nomor telepon hanya boleh berisi angka!", "error");
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from("penyewa")
        .update({
          nama_penyewa: profil.nama_penyewa,
          nomor_telepon_penyewa: profil.nomor_telepon_penyewa,
        })
        .eq("id_penyewa", user.id);
      
      if (error) {
        showToast("Gagal memperbarui profil: " + error.message, "error");
      } else {
        showToast("Profil berhasil diperbarui!", "success");
        setTimeout(() => {
          router.push("/user/dashboard"); 
        }, 1500);
      }
    }
    setSaving(false);
  };

  // Handle Update Password
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

    // Supabase otomatis akan memperbarui password untuk user yang sedang login saat ini
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      showToast("Gagal mereset password: " + error.message, "error");
    } else {
      showToast("Password berhasil diperbarui!", "success");
      // Kosongkan form setelah berhasil
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    }
    
    setUpdatingPassword(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat profil...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 md:pt-10 mb-20 space-y-8">
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold text-sm">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition">
             <X size={18} />
          </button>
        </div>
      )}

      {/* SECTION 1: PROFIL */}
      <div>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Profil Saya</h1>
        <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border">
          {/* Editable Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              value={profil.nama_penyewa}
              onChange={(e) => setProfil({...profil, nama_penyewa: e.target.value})}
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input 
              value={profil.nomor_telepon_penyewa}
              onChange={(e) => {
                 const val = e.target.value;
                 if (val === "" || /^[0-9]+$/.test(val)) {
                   setProfil({...profil, nomor_telepon_penyewa: val});
                 }
              }}
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Read Only Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Email</label>
              <p className="text-gray-700 font-medium mt-1 truncate">{profil.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Jenis Kelamin</label>
              <p className="text-gray-700 font-medium mt-1">{profil.jenis_kelamin_penyewa}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Status Penyewa</label>
            <p className="text-gray-700 font-bold mt-1 capitalize">{profil.status_penyewa}</p>
          </div>

          {/* KTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Foto KTP</label>
            {profil.ktp_url ? (
              <a href={profil.ktp_url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={profil.ktp_url} 
                  alt="KTP Penyewa" 
                  className="w-full max-h-80 object-contain border rounded-2xl bg-gray-50 cursor-pointer hover:opacity-90 transition" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.insertAdjacentHTML('afterend', '<div class="p-8 border-2 border-dashed rounded-2xl text-center text-red-500 bg-gray-50">Gambar gagal dimuat. Pastikan URL valid dan bucket bersifat Public.</div>');
                  }}
                />
              </a>
            ) : (
              <div className="p-8 border-2 border-dashed rounded-2xl text-center text-gray-400 bg-gray-50">
                Tidak ada foto KTP
              </div>
            )}
          </div>

          <button 
            onClick={handleUpdateProfil}
            disabled={saving}
            className="w-full bg-[#1c3163] text-white py-4 rounded-xl font-bold hover:bg-[#15254b] transition shadow-lg disabled:bg-gray-400"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan Profil"}
          </button>
        </div>
      </div>

      {/* SECTION 2: UBAH PASSWORD */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Keamanan Akun</h2>
        <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input 
              type="password"
              placeholder="Minimal 6 karakter"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ulangi Password Baru</label>
            <input 
              type="password"
              placeholder="Ketik ulang password baru"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button 
            onClick={handleUpdatePassword}
            disabled={updatingPassword}
            className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition shadow-lg disabled:bg-gray-400"
          >
            {updatingPassword ? "Memperbarui..." : "Update Password"}
          </button>
        </div>
      </div>
      
    </div>
  );
}