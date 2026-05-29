"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ManajemenLaporanKerusakan() {
  const supabase = createClient();
  const [laporan, setLaporan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    getLaporan();
  }, []);

  // ============================================
  // GET DATA
  // ============================================
  async function getLaporan() {
    setLoading(true);

    const { data, error } = await supabase
      .from("laporan_kerusakan")
      .select(`
        *,
        fasilitas (
          id_fasilitas,
          nama_fasilitas
        ),
        detail_fasilitas_kamar (
          id_detail_fasiliitas_kamar,
          kondisi_fasilitas
        ),
        sewa!inner (
          id_penyewa
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    // ============================================
    // GET USER DATA
    // ============================================
    const laporanFix = await Promise.all(
      (data || []).map(async (item) => {
        let nama = "-";
        let namaPegawai = "-";

        // NAMA PENYEWA
        const { data: userData } = await supabase
          .from("penyewa")
          .select("*")
          .eq("id_penyewa", item.sewa?.id_penyewa)
          .single();

        if (userData?.nama_penyewa) {
          nama = userData.nama_penyewa;
        }

        // NAMA PEGAWAI
        if (item.id_pegawai) {
          const { data: pegawaiData } = await supabase
            .from("pegawai")
            .select("nama_pegawai")
            .eq("id_pegawai", item.id_pegawai)
            .single();

          if (pegawaiData?.nama_pegawai) {
            namaPegawai = pegawaiData.nama_pegawai;
          }
        }

        return {
          ...item,
          nama_penyewa: nama,
          nama_pegawai: namaPegawai,
        };
      })
    );

    setLaporan(laporanFix);
    setLoading(false);
  }

  // ============================================
  // UPDATE STATUS
  // ============================================
  async function updateStatus(idKerusakan: number, statusBaru: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("laporan_kerusakan")
      .update({
        status_perbaikan: statusBaru,
        id_pegawai: user?.id,
      })
      .eq("id_kerusakan", idKerusakan);

    if (error) {
      console.log(error);
      alert("Gagal update status");
      return;
    }

    const { data: laporanData } = await supabase
      .from("laporan_kerusakan")
      .select("*")
      .eq("id_kerusakan", idKerusakan)
      .single();

    let kondisi = "Baik";

    if (statusBaru === "Menunggu Perbaikan") {
      kondisi = "Rusak";
    }
    if (statusBaru === "Proses Perbaikan") {
      kondisi = "Sedang Diperbaiki";
    }
    if (statusBaru === "Sudah Diperbaiki" || statusBaru === "Ditolak") {
      kondisi = "Baik";
    }

    await supabase
      .from("detail_fasilitas_kamar")
      .update({ kondisi_fasilitas: kondisi })
      .eq("id_detail_fasiliitas_kamar", laporanData?.id_detail_fasiliitas_kamar);

    alert("Status berhasil diupdate");
    getLaporan();
  }

  // ============================================
  // FORMAT TANGGAL
  // ============================================
  function formatTanggal(tanggal: string) {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <main className="pt-24 md:ml-[260px] p-5 md:p-8">
      <div className="md:pt-20">
        {/* CARD */}
        <div className="bg-white rounded-3xl border shadow-sm p-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Laporan Kerusakan
            </h1>
            <p className="text-gray-500 mt-1">
              Kelola data laporan kerusakan kos
            </p>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4">Nama Penyewa</th>
                <th className="text-left px-6 py-4">Nomor Kamar</th>
                <th className="text-left px-6 py-4">Nama Fasilitas</th>
                <th className="text-left px-6 py-4">Tanggal</th>
                <th className="text-center px-6 py-4">Status</th>
                <th className="text-center px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && laporan.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-gray-400">
                    Data laporan kerusakan belum tersedia
                  </td>
                </tr>
              )}

              {laporan.map((item) => (
                <tr key={item.id_kerusakan} className="border-t">
                  <td className="px-6 py-4">{item.nama_penyewa}</td>
                  <td className="px-6 py-4">Kamar {item.id_kamar}</td>
                  <td className="px-6 py-4">{item.fasilitas?.nama_fasilitas}</td>
                  <td className="px-6 py-4">{formatTanggal(item.created_at)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={item.status_perbaikan}
                      onChange={(e) => updateStatus(item.id_kerusakan, e.target.value)}
                      className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option>Menunggu Perbaikan</option>
                      <option>Proses Perbaikan</option>
                      <option>Sudah Diperbaiki</option>
                      <option>Ditolak</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        const dataTerbaru = laporan.find((x) => x.id_kerusakan === item.id_kerusakan);
                        setSelectedDetail(dataTerbaru);
                      }}
                      className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL DETAIL */}
      {/* ============================================ */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Detail Laporan</h2>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-gray-400 hover:text-red-500 transition text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* ISI */}
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* NAMA */}
                <div>
                  <label className="font-semibold text-gray-700">Nama Penyewa</label>
                  <input
                    type="text"
                    value={selectedDetail.nama_penyewa}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>

                {/* KAMAR */}
                <div>
                  <label className="font-semibold text-gray-700">Nomor Kamar</label>
                  <input
                    type="text"
                    value={`Kamar ${selectedDetail.id_kamar}`}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>
              </div>

              {/* FASILITAS */}
              <div>
                <label className="font-semibold text-gray-700">Nama Fasilitas</label>
                <input
                  type="text"
                  value={selectedDetail?.fasilitas?.nama_fasilitas || ""}
                  readOnly
                  className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                />
              </div>

              {/* KETERANGAN */}
              <div>
                <label className="font-semibold text-gray-700">Keterangan</label>
                <textarea
                  value={selectedDetail.keterangan_kerusakan}
                  readOnly
                  className="w-full border rounded-xl p-3 mt-2 h-24 bg-gray-50 text-gray-800 resize-none"
                />
              </div>

              {/* GAMBAR KERUSAKAN */}
              <div>
                <label className="font-semibold text-gray-700">Foto Kerusakan</label>
                <div className="mt-2">
                  {selectedDetail.gambar_kerusakan ? (
                    <a href={selectedDetail.gambar_kerusakan} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedDetail.gambar_kerusakan}
                        alt="Foto Kerusakan"
                        className="w-full max-h-80 object-contain border rounded-xl bg-gray-50 cursor-pointer hover:opacity-90 transition"
                      />
                    </a>
                  ) : (
                    <div className="w-full p-6 border-2 border-dashed rounded-xl bg-gray-50 text-center text-gray-400">
                      Tidak ada foto kerusakan yang dilampirkan.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* TANGGAL */}
                <div>
                  <label className="font-semibold text-gray-700">Tanggal Laporan</label>
                  <input
                    type="text"
                    value={formatTanggal(selectedDetail.created_at)}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="font-semibold text-gray-700">Status Saat Ini</label>
                  <input
                    type="text"
                    value={selectedDetail.status_perbaikan}
                    readOnly
                    className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                  />
                </div>
              </div>

              {/* PEGAWAI */}
              <div>
                <label className="font-semibold text-gray-700">Pegawai Yang Mengubah Status</label>
                <input
                  type="text"
                  value={selectedDetail.nama_pegawai || "-"}
                  readOnly
                  className="w-full border rounded-xl p-3 mt-2 bg-gray-50 text-gray-800"
                />
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}