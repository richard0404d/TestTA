"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, ChevronLeft, ChevronRight, XCircle, CheckCircle, AlertCircle, X } from "lucide-react"; // Menambahkan import icon untuk pop-up

export default function ManajemenReservasi() {
  // ============================================
  // SUPABASE
  // ============================================
  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================
  const [reservasi, setReservasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<any | null>(null);

  // STATE UNTUK POP-UP CUSTOM
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [cancelData, setCancelData] = useState<{ id_reservasi: number, id_kamar: number } | null>(null);

  // STATE PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ============================================
  // HELPER TOAST (POP-UP PESAN)
  // ============================================
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  // ============================================
  // GET RESERVASI
  // ============================================
  const getReservasi = async () => {
    try {
      setLoading(true);

      const { data: reservasiData, error: reservasiError } = await supabase
        .from("reservasi")
        .select("*")
        .order("id_reservasi", { ascending: false });

      if (reservasiError) {
        console.log(reservasiError);
        return;
      }

      const { data: penyewaData, error: penyewaError } = await supabase
        .from("penyewa")
        .select("*");

      if (penyewaError) {
        console.log(penyewaError);
        return;
      }

      const { data: kamarData, error: kamarError } = await supabase
        .from("kamar")
        .select("*");

      if (kamarError) {
        console.log(kamarError);
        return;
      }

      // JOIN MANUAL
      const finalData = reservasiData.map((item: any) => {
        const penyewa = penyewaData.find(
          (p: any) => p.id_penyewa === item.id_penyewa
        );
        const kamar = kamarData.find(
          (k: any) => Number(k.id_kamar) === Number(item.id_kamar)
        );
        return { ...item, penyewa, kamar };
      });

      setReservasi(finalData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReservasi();
  }, []);

  // ============================================
  // HANDLE BATALKAN RESERVASI (CASCADE UPDATE)
  // ============================================
  const executeBatalkanReservasi = async () => {
    if (!cancelData) return;
    const { id_reservasi, id_kamar } = cancelData;

    try {
      setLoading(true);

      // 1. UBAH STATUS RESERVASI -> Batal
      const { error: errorReservasi } = await supabase
        .from("reservasi")
        .update({ status_reservasi: "Batal" })
        .eq("id_reservasi", id_reservasi);
      if (errorReservasi) throw errorReservasi;

      // 2. KEMBALIKAN KAMAR -> Tersedia
      if (id_kamar) {
        const { error: errorKamar } = await supabase
          .from("kamar")
          .update({ status_kamar: "Tersedia" })
          .eq("id_kamar", id_kamar);
        if (errorKamar) throw errorKamar;
      }

      // 3. CARI DATA SEWA (Berdasarkan id_reservasi)
      const { data: sewaData } = await supabase
        .from("sewa")
        .select("id_sewa")
        .eq("id_reservasi", id_reservasi)
        .maybeSingle();

      if (sewaData && sewaData.id_sewa) {
        const id_sewa = sewaData.id_sewa;

        // 4. UBAH STATUS SEWA -> Berakhir
        await supabase
          .from("sewa")
          .update({ status_sewa: "Berakhir" })
          .eq("id_sewa", id_sewa);

        // 5. CARI DATA TAGIHAN (Berdasarkan id_sewa)
        const { data: tagihanData } = await supabase
          .from("tagihan")
          .select("id_tagihan")
          .eq("id_sewa", id_sewa)
          .maybeSingle();

        if (tagihanData && tagihanData.id_tagihan) {
          const id_tagihan = tagihanData.id_tagihan;

          // 6. UBAH STATUS TAGIHAN -> Kadaluarsa
          await supabase
            .from("tagihan")
            .update({ status_tagihan: "Kadaluarsa" })
            .eq("id_tagihan", id_tagihan);

          // 7. UBAH STATUS PEMBAYARAN -> Gagal
          await supabase
            .from("pembayaran")
            .update({ status_pembayaran: "Gagal" })
            .eq("id_tagihan", id_tagihan);
        }
      }

      showToast("Reservasi berhasil dibatalkan.", "success");
      getReservasi(); // Refresh data tabel
    } catch (error: any) {
      console.error(error);
      showToast("Terjadi kesalahan: " + error.message, "error");
    } finally {
      setLoading(false);
      setCancelData(null); // Tutup modal konfirmasi
    }
  };

  // ============================================
  // FORMAT TANGGAL
  // ============================================
  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ============================================
  // BADGE STATUS
  // ============================================
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Berhasil":
        return "bg-green-100 text-green-700";
      case "Batal":
        return "bg-red-100 text-red-700";
      case "Menunggu Pembayaran":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  // ============================================
  // LOGIKA PAGINATION
  // ============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reservasi.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reservasi.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <main className="pt-24 md:ml-[260px] p-5 md:p-8">

      {/* ============================================ */}
      {/* TOAST NOTIFICATION (POP-UP PESAN) */}
      {/* ============================================ */}
      {toast.show && (
        <div className={`fixed top-24 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition"><X size={18} /></button>
        </div>
      )}

      <div className="md:pt-20">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Manajemen Reservasi</h1>
            <p className="text-gray-500 mt-1">Kelola data reservasi kos</p>
          </div>
        </div>

        {/* ============================================ */}
        {/* TABLE */}
        {/* ============================================ */}
        <div className="pt-8">
          <div className="overflow-x-auto rounded-2xl border bg-white flex flex-col">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Nama Penyewa</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Nomor Kamar</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Jumlah Penghuni</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Tanggal Reservasi</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Tanggal Masuk</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!loading && reservasi.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id_reservasi} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{item.penyewa?.nama_penyewa}</td>
                      <td className="px-6 py-4">Kamar {item.kamar?.id_kamar}</td>
                      <td className="px-6 py-4">{item.jumlah_penghuni} Orang</td>
                      <td className="px-6 py-4">{formatDate(item.tanggal_reservasi)}</td>
                      <td className="px-6 py-4">{formatDate(item.tanggal_masuk)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(item.status_reservasi)}`}>
                            {item.status_reservasi}
                          </span>
                        </div>
                      </td>
                      
                      {/* AKSI */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailData(item)}
                            className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {/* Tombol batal memicu modal konfirmasi custom, bukan window.confirm */}
                          {item.status_reservasi === "Menunggu Pembayaran" && (
                            <button
                              onClick={() => setCancelData({ id_reservasi: item.id_reservasi, id_kamar: item.id_kamar })}
                              className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                              title="Batalkan Reservasi"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-gray-400">
                      {loading ? "Loading..." : "Data reservasi belum tersedia"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINATION UI */}
            {!loading && reservasi.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                <div className="text-sm text-gray-500">
                  Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, reservasi.length)} dari {reservasi.length} data
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

      {/* ============================================ */}
      {/* MODAL KONFIRMASI PEMBATALAN (CUSTOM UI) */}
      {/* ============================================ */}
      {cancelData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative animate-in zoom-in duration-200 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Batalkan Reservasi?</h2>
              <p className="text-gray-500 text-sm">
                Tindakan ini tidak dapat diurungkan. Semua data sewa, tagihan, dan pembayaran terkait akan dibatalkan otomatis dan kamar akan kembali menjadi <b>'Tersedia'</b>.
              </p>
              <div className="flex gap-3 w-full mt-4 pt-2">
                <button
                  onClick={() => setCancelData(null)}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl border font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Kembali
                </button>
                <button
                  onClick={executeBatalkanReservasi}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  {loading ? "Memproses..." : "Ya, Batalkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL DETAIL */}
      {/* ============================================ */}
      {detailData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <button
              onClick={() => setDetailData(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500 text-2xl"
            >
              ✕
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Detail Reservasi</h2>
            <div className="space-y-5">
              <div>
                <p className="text-gray-500 mb-1 font-medium">Nama Penyewa</p>
                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {detailData.penyewa?.nama_penyewa}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1 font-medium">Nomor Telepon</p>
                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {detailData.penyewa?.nomor_telepon_penyewa}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1 font-medium">Nomor Kamar</p>
                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  Kamar {detailData.kamar?.id_kamar}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1 font-medium">Jumlah Penghuni</p>
                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {detailData.jumlah_penghuni} Orang
                </div>
              </div>
              {detailData.jumlah_penghuni === 2 && (
                <>
                  <div>
                    <p className="text-gray-500 mb-1 font-medium">Nama Penghuni Ke-2</p>
                    <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                      {detailData.nama_penghuni2}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1 font-medium">Nomor Telepon Penghuni Ke-2</p>
                    <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                      {detailData.nomor_telepon2}
                    </div>
                  </div>
                </>
              )}
              <div>
                <p className="text-gray-500 mb-1 font-medium">Tanggal Reservasi</p>
                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {formatDate(detailData.tanggal_reservasi)}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1 font-medium">Tanggal Masuk</p>
                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {formatDate(detailData.tanggal_masuk)}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1 font-medium">Status Reservasi</p>
                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800 font-semibold">
                  {detailData.status_reservasi}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}