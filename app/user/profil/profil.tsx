"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export default function ProfilPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State untuk notifikasi Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };
  
  // State untuk form
  const [profil, setProfil] = useState({
    nama_penyewa: "",
    nomor_telepon_penyewa: "",
    email: "",
    jenis_kelamin_penyewa: "",
    status_penyewa: "",
    ktp_url: "",
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
              // PERBAIKAN: Gunakan nama kolom yang tepat yaitu ktp_penyewa
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

  // Handle Update
  const handleUpdate = async () => {
    // Validasi sederhana
    if (!profil.nama_penyewa.trim()) {
      showToast("Nama tidak boleh kosong!", "error");
      return;
    }
    
    // Validasi nomor telepon hanya angka (opsional tapi disarankan)
    if (!/^[0-9]+$/.test(profil.nomor_telepon_penyewa)) {
      showToast("Nomor telepon hanya boleh berisi angka!", "error");
      return;
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
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat profil...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 md:pt-10">
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8 text-gray-800">Profil Saya</h1>
      
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
               // Cegah input selain angka secara realtime
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
            <p className="text-gray-700 font-medium mt-1">{profil.email}</p>
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
          onClick={handleUpdate}
          disabled={saving}
          className="w-full bg-[#2C5EBF] text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-200"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}