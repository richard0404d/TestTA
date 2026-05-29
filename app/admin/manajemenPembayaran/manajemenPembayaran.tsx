"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Eye, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ManajemenPembayaran() {
  // ============================================
  // SUPABASE
  // ============================================
  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================
  const [openModal, setOpenModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [pembayarans, setPembayarans] = useState<any[]>([]);
  const [tagihanBelumBayar, setTagihanBelumBayar] = useState<any[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  // Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // 'success' | 'error'
  });

  // FORM STATE
  const [selectedTagihanId, setSelectedTagihanId] = useState("");
  const [autoFillData, setAutoFillData] = useState({
    nama_penyewa: "",
    email_penyewa: "",
    jumlah_penghuni: "",
    total_tagihan: 0,
  });

  // ============================================
  // HELPER TOAST
  // ============================================
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // ============================================
  // HELPER FORMAT TANGGAL
  // ============================================
  const formatTanggal = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ============================================
  // GET DATA UTAMA (DAFTAR PEMBAYARAN)
  // ============================================
  const getPembayaran = async () => {
    const { data, error } = await supabase
      .from("pembayaran")
      .select(`
        id_pembayaran,
        tanggal_pembayaran,
        status_pembayaran,
        created_at,
        tagihan (
          id_tagihan,
          total_tagihan,
          status_tagihan,
          sewa (
            id_sewa,
            id_penyewa,
            kamar ( id_kamar ),
            reservasi ( jumlah_penghuni ),
            penyewa (
              nama_penyewa,
              email_penyewa,
              nomor_telepon_penyewa
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pembayaran:", error);
      return;
    }

    setPembayarans(data || []);
  };

  // ============================================
  // GET DAFTAR TAGIHAN BELUM DIBAYAR UNTUK COMBOBOX
  // ============================================
  const getTagihanBelumBayar = async () => {
    const { data, error } = await supabase
      .from("tagihan")
      .select(`
        id_tagihan,
        total_tagihan,
        sewa (
          id_sewa,
          id_penyewa,
          id_kamar,
          id_reservasi,
          kamar ( id_kamar ),
          reservasi ( id_reservasi, jumlah_penghuni ),
          penyewa (
            nama_penyewa,
            email_penyewa
          )
        )
      `)
      .eq("status_tagihan", "Belum Dibayar");

    if (error) {
      console.error("Error fetching tagihan:", error);
      return;
    }

    setTagihanBelumBayar(data || []);
  };

  // ============================================
  // LOAD
  // ============================================
  useEffect(() => {
    getPembayaran();
  }, []);

  // ============================================
  // HANDLE COMBOBOX KAMAR CHANGED
  // ============================================
  const handleKamarChange = (idTagihan: string) => {
    setSelectedTagihanId(idTagihan);
    if (!idTagihan) {
      setAutoFillData({
        nama_penyewa: "",
        email_penyewa: "",
        jumlah_penghuni: "",
        total_tagihan: 0,
      });
      return;
    }

    const matched = tagihanBelumBayar.find((t) => String(t.id_tagihan) === idTagihan);
    if (matched) {
      setAutoFillData({
        nama_penyewa: matched.sewa?.penyewa?.nama_penyewa || "Penyewa",
        email_penyewa: matched.sewa?.penyewa?.email_penyewa || "-",
        jumlah_penghuni: matched.sewa?.reservasi?.jumlah_penghuni || "-",
        total_tagihan: matched.total_tagihan || 0,
      });
    }
  };

  // ============================================
  // OPEN TAMBAH
  // ============================================
  const handleOpenTambah = async () => {
    await getTagihanBelumBayar();
    setSelectedTagihanId("");
    setAutoFillData({
      nama_penyewa: "",
      email_penyewa: "",
      jumlah_penghuni: "",
      total_tagihan: 0,
    });
    setOpenModal(true);
  };

  // ============================================
  // INSERT PEMBAYARAN & UPDATE STATUS BERANTAI
  // ============================================
  const handleSubmitPembayaran = async () => {
    // --- VALIDASI INPUT ---
    if (!selectedTagihanId || selectedTagihanId.trim() === "") {
      showToast("Kamar / Tagihan wajib dipilih terlebih dahulu!", "error");
      return;
    }

    const matched = tagihanBelumBayar.find((t) => String(t.id_tagihan) === selectedTagihanId);
    if (!matched) {
      showToast("Data tagihan tidak valid atau sudah dibayar!", "error");
      return;
    }
    // -----------------------

    // Mengambil referensi ID untuk update table terkait
    const idSewa = matched.sewa?.id_sewa;
    const idKamar = matched.sewa?.kamar?.id_kamar || matched.sewa?.id_kamar;
    const idReservasi = matched.sewa?.reservasi?.id_reservasi || matched.sewa?.id_reservasi;

    try {
      setLoading(true);

      // 1. Insert ke tabel pembayaran
      const { error: insertError } = await supabase.from("pembayaran").insert([
        {
          id_tagihan: Number(selectedTagihanId),
          tanggal_pembayaran: new Date().toISOString(),
          status_pembayaran: "Berhasil",
        },
      ]);
      if (insertError) throw insertError;

      // 2. Update status tagihan terkait menjadi 'Lunas'
      const { error: updateTagihanError } = await supabase
        .from("tagihan")
        .update({ status_tagihan: "Lunas" })
        .eq("id_tagihan", Number(selectedTagihanId));
      if (updateTagihanError) throw updateTagihanError;

      // 3. Update status sewa menjadi 'Aktif'
      if (idSewa) {
        const { error: updateSewaError } = await supabase
          .from("sewa")
          .update({ status_sewa: "Aktif" })
          .eq("id_sewa", idSewa);
        if (updateSewaError) throw updateSewaError;
      }

      // 4. Update status kamar menjadi 'Ditempati'
      if (idKamar) {
        const { error: updateKamarError } = await supabase
          .from("kamar")
          .update({ status_kamar: "Ditempati" })
          .eq("id_kamar", idKamar);
        if (updateKamarError) throw updateKamarError;
      }

      // 5. Update status reservasi menjadi 'Berhasil'
      if (idReservasi) {
        const { error: updateReservasiError } = await supabase
          .from("reservasi")
          .update({ status_reservasi: "Berhasil" })
          .eq("id_reservasi", idReservasi);
        if (updateReservasiError) throw updateReservasiError;
      }

      showToast("Pembayaran berhasil dicatat!", "success");
      setOpenModal(false);
      await getPembayaran();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // OPEN DETAIL (EYE ACTION)
  // ============================================
  const handleOpenDetail = (pembayaran: any) => {
    setSelectedDetail(pembayaran);
    setOpenDetailModal(true);
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
        {/* ============================================ */}
        {/* CARD */}
        {/* ============================================ */}
        <div>
          <div className="bg-white rounded-3xl border shadow-sm p-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Manajemen Pembayaran
                </h1>
                <p className="text-gray-500 mt-1">
                  Kelola data pembayaran kos
                </p>
              </div>

              {/* BUTTON TAMBAH */}
              <button
                onClick={handleOpenTambah}
                className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
              >
                <Plus size={18} />
                Tambah Pembayaran
              </button>
            </div>
          </div>

          {/* ============================================ */}
          {/* TABLE */}
          {/* ============================================ */}
          <div className="pt-8">
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full min-w-[800px]">
                {/* HEAD */}
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Nama Penyewa</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Nomor Kamar</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Jumlah Pembayaran</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Tanggal Pembayaran</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {pembayarans.length > 0 ? (
                    pembayarans.map((pembayaran, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50 transition">
                        {/* NAMA PENYEWA */}
                        <td className="px-6 py-4 text-black">
                          {pembayaran.tagihan?.sewa?.penyewa?.nama_penyewa || "Penyewa"}
                        </td>
                        
                        {/* NOMOR KAMAR */}
                        <td className="px-6 py-4 text-black">
                          Kamar {pembayaran.tagihan?.sewa?.kamar?.id_kamar || "-"}
                        </td>
                        
                        {/* JUMLAH PEMBAYARAN */}
                        <td className="px-6 py-4 text-black">
                          Rp {(pembayaran.tagihan?.total_tagihan || 0).toLocaleString("id-ID")}
                        </td>
                        
                        {/* TANGGAL PEMBAYARAN */}
                        <td className="px-6 py-4 text-black">
                          {formatTanggal(pembayaran.tanggal_pembayaran)}
                        </td>
                        
                        {/* STATUS */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              pembayaran.status_pembayaran === "Berhasil"
                                ? "bg-green-100 text-green-700"
                                : pembayaran.status_pembayaran === "Menunggu Pembayaran"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {pembayaran.status_pembayaran}
                          </span>
                        </td>
                        
                        {/* AKSI */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenDetail(pembayaran)}
                              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                              title="Lihat Detail"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-gray-400">
                        Data pembayaran belum tersedia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* MODAL TAMBAH PEMBAYARAN */}
        {/* ============================================ */}
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

              <h2 className="text-3xl font-bold text-gray-800 mb-8">Tambah Pembayaran</h2>

              <div className="space-y-6">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Pilih Kamar (Belum Dibayar)</label>
                  <select
                    value={selectedTagihanId}
                    onChange={(e) => handleKamarChange(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option value="">-- Pilih Kamar --</option>
                    {tagihanBelumBayar.map((t) => (
                      <option key={t.id_tagihan} value={t.id_tagihan}>
                        Kamar {t.sewa?.kamar?.id_kamar} - Tagihan: Rp {t.total_tagihan.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Nama Penyewa</label>
                  <input
                    type="text"
                    value={autoFillData.nama_penyewa}
                    disabled
                    placeholder="Terisi otomatis setelah memilih kamar"
                    className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Jumlah Pembayaran (Rp)</label>
                  <input
                    type="text"
                    value={autoFillData.total_tagihan ? `Rp ${autoFillData.total_tagihan.toLocaleString("id-ID")}` : ""}
                    disabled
                    placeholder="Terisi otomatis setelah memilih kamar"
                    className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Tanggal Pembayaran</label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                    disabled
                    className="w-full border rounded-xl px-4 py-3 bg-gray-50 text-gray-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={() => setOpenModal(false)}
                    className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitPembayaran}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-[#1c3163] text-white hover:bg-[#16274f] transition"
                  >
                    {loading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL DETAIL PEMBAYARAN */}
        {/* ============================================ */}
        {openDetailModal && selectedDetail && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative">
              
              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  Detail Pembayaran
                </h2>
                <button
                  onClick={() => {
                    setSelectedDetail(null);
                    setOpenDetailModal(false);
                  }}
                >
                  <X />
                </button>
              </div>

              <div className="space-y-4">
                {/* NAMA */}
                <div>
                  <label className="font-semibold">
                    Nama Penyewa
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedDetail.tagihan?.sewa?.penyewa?.nama_penyewa || "-"}
                    className="w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none text-gray-800"
                  />
                </div>

                {/* KAMAR */}
                <div>
                  <label className="font-semibold">
                    Nomor Kamar
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`Kamar ${selectedDetail.tagihan?.sewa?.kamar?.id_kamar || "-"}`}
                    className="w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none text-gray-800"
                  />
                </div>

                {/* PENGHUNI */}
                <div>
                  <label className="font-semibold">
                    Jumlah Penghuni
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${selectedDetail.tagihan?.sewa?.reservasi?.jumlah_penghuni || 0} Orang`}
                    className="w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none text-gray-800"
                  />
                </div>

                {/* JUMLAH PEMBAYARAN */}
                <div>
                  <label className="font-semibold">
                    Jumlah Pembayaran
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`Rp ${(selectedDetail.tagihan?.total_tagihan || 0).toLocaleString("id-ID")}`}
                    className="w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none text-gray-800"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="font-semibold">
                    Status Pembayaran
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedDetail.status_pembayaran || "-"}
                    className={`w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none font-medium ${
                      selectedDetail.status_pembayaran === "Berhasil" ? "text-green-600" : "text-red-600"
                    }`}
                  />
                </div>

                {/* TANGGAL */}
                <div>
                  <label className="font-semibold">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatTanggal(selectedDetail.tanggal_pembayaran)}
                    className="w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none text-gray-800"
                  />
                </div>

                {/* TELEPON */}
                <div>
                  <label className="font-semibold">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedDetail.tagihan?.sewa?.penyewa?.nomor_telepon_penyewa || "-"}
                    className="w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none text-gray-800"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="font-semibold">
                    Email
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedDetail.tagihan?.sewa?.penyewa?.email_penyewa || "-"}
                    className="w-full border rounded-lg p-3 mt-2 bg-gray-100 outline-none text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}