"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export default function LaporanKerusakan() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [idSewa, setIdSewa] = useState<number | null>(null);
  const [idKamar, setIdKamar] = useState<number | null>(null);
  const [kamar, setKamar] = useState<any>(null);
  const [fasilitas, setFasilitas] = useState<any[]>([]);
  const [laporanList, setLaporanList] = useState<any[]>([]);

  // State untuk Toast Notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const [form, setForm] = useState({
    id_fasilitas: "",
    id_detail_fasiliitas_kamar: "",
    laporan: "",
    file: null as File | null,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sewa } = await supabase
      .from("sewa")
      .select("*")
      .eq("id_penyewa", user.id)
      .eq("status_sewa", "Aktif")
      .single();

    if (!sewa) return;

    setIdSewa(sewa.id_sewa);
    setIdKamar(sewa.id_kamar);

    const { data: kamarData } = await supabase.from("kamar").select("*").eq("id_kamar", sewa.id_kamar).single();
    setKamar(kamarData);

    const { data: fasilitasData } = await supabase
      .from("detail_fasilitas_kamar")
      .select("*, fasilitas(nama_fasilitas)")
      .eq("id_kamar", sewa.id_kamar);

    setFasilitas(fasilitasData || []);

    const { data: laporan } = await supabase
      .from("laporan_kerusakan")
      .select("*, fasilitas(nama_fasilitas)")
      .eq("id_sewa", sewa.id_sewa)
      .order("created_at", { ascending: false });

    setLaporanList(laporan || []);
  }

  const handleFasilitas = (e: any) => {
    const detail = fasilitas.find((item) => Number(item.id_detail_fasiliitas_kamar) === Number(e.target.value));
    setForm({
      ...form,
      id_fasilitas: detail?.id_fasilitas || "",
      id_detail_fasiliitas_kamar: detail?.id_detail_fasiliitas_kamar || "",
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Validasi Input
    if (!form.id_detail_fasiliitas_kamar) return showToast("Pilih fasilitas yang rusak!", "error");
    if (!form.laporan.trim()) return showToast("Keterangan laporan wajib diisi!", "error");

    setLoading(true);

    try {
      let imageUrl = null;

      // 1. Upload Gambar ke Bucket 'laporan-kerusakan'
      if (form.file) {
        const fileExt = form.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("laporan_kerusakan")
          .upload(fileName, form.file);

        if (uploadError) throw new Error("Gagal mengupload gambar");

        const { data } = supabase.storage.from("laporan_kerusakan").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // 2. Cek Kondisi
      const fasilitasDipilih = fasilitas.find((i) => i.id_detail_fasiliitas_kamar === Number(form.id_detail_fasiliitas_kamar));
      if (fasilitasDipilih?.kondisi_fasilitas === "Rusak") {
        throw new Error("Fasilitas ini sudah dalam status rusak/sedang dilaporkan.");
      }

      // 3. Insert Database
      const { error: insertError } = await supabase.from("laporan_kerusakan").insert({
        id_sewa: idSewa,
        id_kamar: idKamar,
        id_fasilitas: Number(form.id_fasilitas),
        id_detail_fasiliitas_kamar: Number(form.id_detail_fasiliitas_kamar),
        keterangan_kerusakan: form.laporan,
        gambar_kerusakan: imageUrl,
        status_perbaikan: "Menunggu Perbaikan",
      });

      if (insertError) throw insertError;

      // 4. Update Status Fasilitas
      await supabase.from("detail_fasilitas_kamar")
        .update({ kondisi_fasilitas: "Rusak" })
        .eq("id_detail_fasiliitas_kamar", Number(form.id_detail_fasiliitas_kamar));

      showToast("Laporan berhasil dikirim!", "success");
      setForm({ id_fasilitas: "", id_detail_fasiliitas_kamar: "", laporan: "", file: null });
      getData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">
      {/* Toast Component */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      <div className="border rounded-2xl p-5">
        <h2 className="text-2xl font-bold mb-5">Laporan Saya</h2>
        <div className="space-y-4">
          {laporanList.map((item) => (
            <div key={item.id_kerusakan} className="border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.fasilitas?.nama_fasilitas}</p>
                <p className="text-sm text-gray-500">{item.keterangan_kerusakan}</p>
              </div>
              <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">{item.status_perbaikan}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border rounded-2xl p-6 space-y-5">
        <h2 className="text-2xl font-bold">Buat Laporan</h2>
        
        <div>
          <label className="font-medium">Kamar</label>
          <input type="text" readOnly value={kamar?.id_kamar || ""} className="w-full border rounded-lg p-3 mt-2 bg-gray-100" />
        </div>

        <div>
          <label className="font-medium">Fasilitas</label>
          <select name="id_fasilitas" value={form.id_detail_fasiliitas_kamar} onChange={handleFasilitas} className="w-full border rounded-lg p-3 mt-2">
            <option value="">Pilih Fasilitas</option>
            {fasilitas.map((item) => (
              <option key={item.id_detail_fasiliitas_kamar} value={item.id_detail_fasiliitas_kamar}>{item.fasilitas?.nama_fasilitas}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium">Keterangan Laporan</label>
          <textarea name="laporan" value={form.laporan} onChange={(e) => setForm({...form, laporan: e.target.value})} className="w-full border rounded-lg p-3 mt-2 h-32" placeholder="Jelaskan kerusakannya..." />
        </div>

        <div>
          <label className="font-medium">Upload Gambar (Optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setForm({...form, file: e.target.files?.[0] || null})} className="w-full border rounded-lg p-3 mt-2" />
        </div>

        <Button type="submit" disabled={loading}>{loading ? "Mengirim..." : "Kirim Laporan"}</Button>
      </form>
    </div>
  );
}