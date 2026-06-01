"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // TAMBAHKAN IMPORT INI
import { CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

declare global {
  interface Window {
    snap: any;
  }
}

export default function PembayaranPage() {
  // ============================================
  // SUPABASE & ROUTER
  // ============================================
  const supabase = createClient();
  const router = useRouter(); // INISIALISASI ROUTER

  // ============================================
  // STATE
  // ============================================
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [tagihan, setTagihan] = useState<any>(null);
  const [histories, setHistories] = useState<any[]>([]);
  const [penyewa, setPenyewa] = useState<any>(null);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // STATE UNTUK TOAST NOTIFICATION
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // ============================================
  // LOAD MIDTRANS SCRIPT
  // ============================================
  useEffect(() => {
    if (document.getElementById("midtrans-script")) return;

    const script = document.createElement("script");
    script.id = "midtrans-script";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";

    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!
    );
    script.async = true;

    document.body.appendChild(script);
  }, []);

  // ============================================
  // GET DATA
  // ============================================
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) return;

      const { data: sewaUser } = await supabase
        .from("sewa")
        .select(`id_sewa, tanggal_berakhir_sewa, status_sewa`)
        .eq("id_penyewa", user.id)
        .neq("status_sewa", "Berakhir");

      const { data: penyewaData } = await supabase
        .from("penyewa")
        .select("*")
        .eq("id_penyewa", user.id)
        .single();

      setPenyewa(penyewaData);

      const { data: tagihanData, error: tagihanError } = await supabase
        .from("tagihan")
        .select(`*, sewa (*, kamar (*))`)
        .in("id_sewa", sewaUser?.map((item) => item.id_sewa) || [])
        .eq("status_tagihan", "Belum Dibayar")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!tagihanError) {
        setTagihan(tagihanData);
      }

      const { data: pembayaranData } = await supabase
        .from("pembayaran")
        .select(`*, tagihan (*, sewa (*))`)
        .order("tanggal_pembayaran", { ascending: false });

      const filteredHistory = (pembayaranData || []).filter((item) =>
        sewaUser?.some((s) => s.id_sewa === item.tagihan?.id_sewa)
      );

      setHistories(filteredHistory);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE BAYAR
  // ============================================
  const handleBayar = async () => {
    if (processing) return;

    try {
      setProcessing(true);

      if (!tagihan || !penyewa) {
        showToast("Tagihan tidak ditemukan", "error");
        setProcessing(false);
        return;
      }

      const response = await fetch("/api/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: `TAGIHAN-${tagihan.id_tagihan}-${Date.now()}`,
          gross_amount: Number(tagihan.total_tagihan),
          first_name: penyewa.nama_penyewa,
          email: penyewa.email_penyewa,
        }),
      });

      const data = await response.json();

      if (!data.token) {
        showToast(data.error || "Token Midtrans gagal dibuat", "error");
        setProcessing(false);
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          console.log("SUCCESS", result);
        
          // 1. Kirim Email Notifikasi Pembayaran Berhasil
          try {
            await fetch("/api/send-pembayaran-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                emailPenyewa: penyewa.email_penyewa, 
                idKamar: tagihan.sewa?.kamar?.id_kamar,
                tanggalPembayaran: new Date().toLocaleDateString("id-ID"), 
                totalPembayaran: tagihan.total_tagihan,
                status: "Pembayaran Berhasil", 
              }),
            });
          } catch (emailError) {
            console.error("Gagal mengirim email:", emailError);
          }

          showToast("Pembayaran berhasil", "success");
          
          // REFRESH HALAMAN SECARA HALUS
          setTimeout(() => {
            router.refresh(); // Me-refresh data server komponen
            router.push("/user/pembayaran"); // Memastikan ada di url yang benar
            
            // Opsional: fetch ulang data secara manual jika state tidak ter-update dari router.refresh()
            setTagihan(null); 
            getData(); 
            setProcessing(false);
          }, 2000);
        },
        onPending: () => {
          showToast("Menunggu pembayaran", "success");
          setTimeout(() => {
            router.refresh();
            router.push("/user/pembayaran");
            setProcessing(false);
          }, 2000);
        },
        onError: () => {
          showToast("Pembayaran gagal", "error");
          setProcessing(false);
        },
        onClose: () => {
          setProcessing(false);
        },
      });
    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan sistem", "error");
      setProcessing(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // ============================================
  // PAGINATION LOGIC
  // ============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistories = histories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(histories.length / itemsPerPage);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 relative">
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold mb-2">Pembayaran</h1>
          <p className="text-sm text-gray-500 mb-6">Lakukan pembayaran tagihan kos</p>

          <div className="border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">Detail Tagihan</h2>
            {tagihan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <span className="text-gray-500">Total Pembayaran</span>
                  <span className="font-bold text-xl">{formatRupiah(tagihan.total_tagihan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nomor Kamar</span>
                  <span className="font-medium">{tagihan.sewa?.kamar?.id_kamar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">{tagihan.status_tagihan}</span>
                </div>
                <div className="pt-6">
                  <Button onClick={handleBayar} disabled={processing} className="w-full h-12 bg-[#2C5EBF] hover:bg-[#244ea0]">
                    {processing ? "Memproses..." : "Bayar Sekarang"}
                  </Button>
                </div>
              </div>
            ) : <div className="text-center py-10 text-gray-400">Tidak ada tagihan aktif</div>}
          </div>
        </div>

        {/* RIGHT (WITH PAGINATION) */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col">
          <h1 className="text-3xl font-bold mb-6">Histori Pembayaran</h1>
          <div className="space-y-4 flex-grow">
            {currentHistories.length > 0 ? (
              currentHistories.map((item) => (
                <div key={item.id_pembayaran} className="border rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{new Date(item.tanggal_pembayaran).toLocaleDateString("id-ID")}</p>
                    <p className="font-semibold mt-1">{formatRupiah(item.tagihan?.total_tagihan || 0)}</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                    {item.status_pembayaran}
                  </div>
                </div>
              ))
            ) : <div className="text-center py-10 text-gray-400">Belum ada histori</div>}
          </div>

          {/* PAGINATION UI */}
          {histories.length > 0 && (
            <div className="flex items-center justify-between pt-6 border-t mt-6">
              <span className="text-sm text-gray-500">Menampilkan {currentPage} halaman dari {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}