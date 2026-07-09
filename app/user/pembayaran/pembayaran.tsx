"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

declare global {
  interface Window {
    snap: any;
  }
}

export default function PembayaranPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [semuaTagihan, setSemuaTagihan] = useState<any[]>([]);
  const [selectedTagihanId, setSelectedTagihanId] = useState<string>(""); 

  const [histories, setHistories] = useState<any[]>([]);
  const [penyewa, setPenyewa] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    if (document.getElementById("midtrans-script")) return;
    const script = document.createElement("script");
    script.id = "midtrans-script";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!);
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const txStatus = urlParams.get("transaction_status");

    if (txStatus === "settlement" || txStatus === "capture" || txStatus === "pending") {
      showToast("Memverifikasi pembayaran Anda...", "success");
      setProcessing(true);
      
      let attempts = 0;
      getData();

      const interval = setInterval(() => {
        attempts++;
        getData(); 
        
        if (attempts >= 4) {
          clearInterval(interval);
          setProcessing(false);
          router.replace("/user/pembayaran");
        }
      }, 3000);

      return () => clearInterval(interval);
    } else {
      getData();
    }
  }, []);

  const getData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      // 1. Ambil SEMUA data sewa milik penyewa ini (termasuk yang sudah "Berakhir")
      const { data: semuaSewaUser } = await supabase
        .from("sewa")
        .select(`id_sewa, tanggal_berakhir_sewa, status_sewa`)
        .eq("id_penyewa", user.id);

      const { data: penyewaData } = await supabase.from("penyewa").select("*").eq("id_penyewa", user.id).single();
      setPenyewa(penyewaData);

      // 2. Ambil SEMUA pembayaran, urutkan dari yang terbaru
      const { data: pembayaranData } = await supabase
        .from("pembayaran")
        .select(`*, tagihan (*, sewa (*))`)
        .order("tanggal_pembayaran", { ascending: false });

      // 3. Cocokkan histori pembayaran dengan SEMUA riwayat sewa (Agar yang "Berakhir" tetap muncul)
      const filteredHistory = (pembayaranData || []).filter((item) =>
        semuaSewaUser?.some((s) => s.id_sewa === item.tagihan?.id_sewa)
      );
      setHistories(filteredHistory);

      // 4. Filter id_sewa yang HANYA AKTIF untuk mengecek tagihan yang belum dibayar
      const sewaAktifIds = semuaSewaUser?.filter(s => s.status_sewa !== "Berakhir").map(s => s.id_sewa) || [];

      // 5. Ambil tagihan "Belum Dibayar" hanya untuk kamar yang saat ini aktif
      const { data: tagihanData, error: tagihanError } = await supabase
        .from("tagihan")
        .select(`*, sewa (*, kamar (*))`)
        .in("id_sewa", sewaAktifIds.length > 0 ? sewaAktifIds : [0]) // Hindari error array kosong
        .eq("status_tagihan", "Belum Dibayar")
        .order("created_at", { ascending: false });

      if (!tagihanError && tagihanData && tagihanData.length > 0) {
        // Filter ganda: pastikan tagihan belum dilunasi di tabel pembayaran
        const tagihanBelumLunas = tagihanData.filter(t => 
          !filteredHistory.some(h => h.id_tagihan === t.id_tagihan && h.status_pembayaran === "Berhasil")
        );
        
        setSemuaTagihan(tagihanBelumLunas);
        
        const urlParams = new URLSearchParams(window.location.search);
        const tagihanIdDariUrl = urlParams.get("tagihan_id");

        if (tagihanBelumLunas.length > 0) {
          if (tagihanIdDariUrl && tagihanBelumLunas.some(t => String(t.id_tagihan) === tagihanIdDariUrl)) {
            setSelectedTagihanId(tagihanIdDariUrl);
          } else if (!selectedTagihanId) {
            setSelectedTagihanId(String(tagihanBelumLunas[0].id_tagihan));
          }
        }
      } else {
        setSemuaTagihan([]); 
      }

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBayar = async () => {
    if (processing) return;

    try {
      setProcessing(true);
      const tagihanAktif = semuaTagihan.find(t => String(t.id_tagihan) === selectedTagihanId);

      if (!tagihanAktif || !penyewa) {
        showToast("Pilih tagihan yang ingin dibayar terlebih dahulu", "error");
        setProcessing(false);
        return;
      }

      const response = await fetch("/api/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: `TAGIHAN-${tagihanAktif.id_tagihan}-${Date.now()}`,
          gross_amount: Number(tagihanAktif.total_tagihan),
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
        onSuccess: function (result: any) {
          showToast("Pembayaran berhasil! Memverifikasi...", "success");
          let attempts = 0;
          const interval = setInterval(async () => {
            attempts++;
            await getData();
            if (attempts >= 4) {
              clearInterval(interval);
              setProcessing(false);
            }
          }, 3000);
        },
        onPending: () => {
          showToast("Menunggu pembayaran...", "success");
          setTimeout(() => { router.refresh(); setProcessing(false); }, 2000);
        },
        onError: () => { showToast("Pembayaran gagal", "error"); setProcessing(false); },
        onClose: () => { setProcessing(false); },
      });
    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan sistem", "error");
      setProcessing(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistories = histories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(histories.length / itemsPerPage);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat data pembayaran...</div>;

  const selectedTagihanDetail = semuaTagihan.find(t => String(t.id_tagihan) === selectedTagihanId);

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 md:pt-28">
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${toast.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-semibold text-sm">{toast.message}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm h-fit">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Detail Tagihan</h2>
            
          {semuaTagihan.length > 0 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Pilih Tagihan Pembayaran</label>
                <select 
                  value={selectedTagihanId}
                  onChange={(e) => setSelectedTagihanId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                >
                  {semuaTagihan.map(tagihan => (
                    <option key={tagihan.id_tagihan} value={tagihan.id_tagihan}>
                      Kamar {tagihan.sewa?.kamar?.id_kamar} - Rp {tagihan.total_tagihan.toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              <hr className="border-gray-100" />

              {selectedTagihanDetail && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="font-bold text-xl">Total Pembayaran</span>
                    <span className="font-bold text-xl">{formatRupiah(selectedTagihanDetail.total_tagihan)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Nomor Kamar</span>
                    <span className=" text-gray-800 px-3 py-1 rounded-md font-semibold">
                      Kamar {selectedTagihanDetail.sewa?.kamar?.id_kamar}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status Tagihan</span>
                    <span className="bg-[#fef3c7] text-[#b45309] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {selectedTagihanDetail.status_tagihan}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Jatuh Tempo</span>
                    <span className="text-red-500 font-medium">
                      {new Date(selectedTagihanDetail.batas_pembayaran).toLocaleDateString("id-ID", { day: "numeric", month: "short", year:"numeric" })}
                    </span>
                  </div>

                  <div className="pt-6">
                    <Button onClick={handleBayar} disabled={processing} className="w-full h-12 text-base font-semibold bg-[#1e2b4d] hover:bg-[#15203b] transition-all rounded-lg">
                      {processing ? "Memproses Gateway..." : "Bayar Tagihan Ini"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="text-green-500 opacity-80" size={32} />
              </div>
              <p className="text-gray-500 font-medium">Hore! Tidak ada tagihan aktif.</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm flex flex-col h-fit">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Histori Pembayaran</h2>
          
          <div className="space-y-4 flex-grow">
            {currentHistories.length > 0 ? (
              currentHistories.map((item) => (
                <div key={item.id_pembayaran} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {new Date(item.tanggal_pembayaran).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{formatRupiah(item.tagihan?.total_tagihan || 0)}</p>
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Kamar {item.tagihan?.sewa?.id_kamar}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      item.status_pembayaran === "Berhasil" ? "bg-green-100 text-green-700" : 
                      item.status_pembayaran === "Gagal" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.status_pembayaran}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">Belum ada histori pembayaran</div>
            )}
          </div>

          {histories.length > 0 && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-2">
              <span className="text-sm text-gray-500">Halaman {currentPage} dari {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="rounded-md border-gray-300">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-md border-gray-300">
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