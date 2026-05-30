"use client";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function ManajemenReservasi() {

  // ============================================
  // SUPABASE
  // ============================================

  const supabase =
    createClient();

  // ============================================
  // STATE
  // ============================================

  const [
    reservasi,
    setReservasi,
  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailData,
    setDetailData,
  ] = useState<any | null>(
    null
  );

  // STATE PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ============================================
  // GET RESERVASI
  // ============================================

  const getReservasi =
    async () => {

      try {

        setLoading(true);

        // ============================================
        // GET RESERVASI
        // ============================================

        const {
          data:
            reservasiData,
          error:
            reservasiError,
        } = await supabase
          .from(
            "reservasi"
          )
          .select("*")
          .order(
            "id_reservasi",
            {
              ascending:
                false,
            }
          );

        if (
          reservasiError
        ) {

          console.log(
            reservasiError
          );

          return;
        }

        // ============================================
        // GET PENYEWA
        // ============================================

        const {
          data: penyewaData,
          error: penyewaError,
        } = await supabase
          .from("penyewa")
          .select("*");

        if (
          penyewaError
        ) {

          console.log(
            penyewaError
          );

          return;
        }

        // ============================================
        // GET KAMAR
        // ============================================

        const {
          data: kamarData,
          error: kamarError,
        } = await supabase
          .from("kamar")
          .select("*");

        if (kamarError) {

          console.log(
            kamarError
          );

          return;
        }

        // ============================================
        // JOIN MANUAL
        // ============================================

        const finalData =
          reservasiData.map(
            (
              item: any
            ) => {

              const penyewa =
                penyewaData.find(
                  (
                    p: any
                  ) =>
                    p.id_penyewa ===
                    item.id_penyewa
                );

              const kamar =
                kamarData.find(
                  (
                    k: any
                  ) =>
                    Number(
                      k.id_kamar
                    ) ===
                    Number(
                      item.id_kamar
                    )
                );

              return {

                ...item,

                penyewa,

                kamar,
              };
            }
          );

        setReservasi(
          finalData
        );

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);
      }
    };

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {

    getReservasi();

  }, []);

  // ============================================
  // FORMAT TANGGAL
  // ============================================

  const formatDate = (
    date: string
  ) => {

    if (!date)
      return "-";

    return new Date(
      date
    ).toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ============================================
  // BADGE STATUS
  // ============================================

  const getStatusColor = (
    status: string
  ) => {

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
      {/* CARD */}
      {/* ============================================ */}

      <div className="md:pt-20">

        <div className="bg-white rounded-3xl border shadow-sm p-6">

          {/* HEADER */}
          <div className="mb-6">

            <h1 className="text-3xl font-bold text-gray-800">

              Manajemen Reservasi

            </h1>

            <p className="text-gray-500 mt-1">

              Kelola data reservasi kos

            </p>

          </div>

        </div>

        {/* ============================================ */}
        {/* TABLE */}
        {/* ============================================ */}

        <div className="pt-8">

          <div className="overflow-x-auto rounded-2xl border bg-white flex flex-col">

            <table className="w-full min-w-[1000px]">

              {/* HEAD */}
              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Nama Penyewa
                  </th>

                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Nomor Kamar
                  </th>

                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Jumlah Penghuni
                  </th>

                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Tanggal Reservasi
                  </th>

                  <th className="text-left px-6 py-4 font-semibold text-gray-700">
                    Tanggal Masuk
                  </th>

                  <th className="text-center px-6 py-4 font-semibold text-gray-700">
                    Status
                  </th>

                  <th className="text-center px-6 py-4 font-semibold text-gray-700">
                    Detail
                  </th>

                </tr>

              </thead>

              {/* BODY */}
              <tbody>

                {!loading &&
                reservasi.length >
                  0 ? (

                  // MENGGUNAKAN currentItems BUKAN reservasi
                  currentItems.map(
                    (
                      item
                    ) => (

                      <tr
                        key={
                          item.id_reservasi
                        }
                        className="border-t"
                      >

                        {/* NAMA */}
                        <td className="px-6 py-4">

                          {
                            item
                              .penyewa
                              ?.nama_penyewa
                          }

                        </td>

                        {/* KAMAR */}
                        <td className="px-6 py-4">

                          Kamar{" "}

                          {
                            item
                              .kamar
                              ?.id_kamar
                          }

                        </td>

                        {/* PENGHUNI */}
                        <td className="px-6 py-4">

                          {
                            item.jumlah_penghuni
                          }{" "}
                          Orang

                        </td>

                        {/* TANGGAL RESERVASI */}
                        <td className="px-6 py-4">

                          {formatDate(
                            item.tanggal_reservasi
                          )}

                        </td>

                        {/* TANGGAL MASUK */}
                        <td className="px-6 py-4">

                          {formatDate(
                            item.tanggal_masuk
                          )}

                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">

                          <div className="flex justify-center">

                            <span
                              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                                item.status_reservasi
                              )}`}
                            >

                              {
                                item.status_reservasi
                              }

                            </span>

                          </div>

                        </td>

                        {/* DETAIL */}
                        <td className="px-6 py-4">

                          <div className="flex justify-center">

                            <button
                              onClick={() =>
                                setDetailData(
                                  item
                                )
                              }
                              className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                            >

                              <Eye size={18} />

                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan={7}
                      className="text-center py-20 text-gray-400"
                    >

                      {loading
                        ? "Loading..."
                        : "Data reservasi belum tersedia"}

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

            {/* ============================================ */}
            {/* PAGINATION UI */}
            {/* ============================================ */}
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
      {/* MODAL DETAIL */}
      {/* ============================================ */}

      {detailData && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">

            {/* CLOSE */}
            <button
              onClick={() =>
                setDetailData(
                  null
                )
              }
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500 text-2xl"
            >

              ✕

            </button>

            {/* TITLE */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">

              Detail Reservasi

            </h2>

            <div className="space-y-5">

              {/* NAMA */}
              <div>

                <p className="text-gray-500 mb-1 font-medium">
                  Nama Penyewa
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                  {
                    detailData
                      .penyewa
                      ?.nama_penyewa
                  }

                </div>

              </div>

              {/* TELEPON */}
              <div>

                <p className="text-gray-500 mb-1 font-medium">
                  Nomor Telepon
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                  {
                    detailData
                      .penyewa
                      ?.nomor_telepon_penyewa
                  }

                </div>

              </div>

              {/* KAMAR */}
              <div>

                <p className="text-gray-500 mb-1 font-medium">
                  Nomor Kamar
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                  Kamar{" "}

                  {
                    detailData
                      .kamar
                      ?.id_kamar
                  }

                </div>

              </div>

              {/* PENGHUNI */}
              <div>

                <p className="text-gray-500 mb-1 font-medium">
                  Jumlah Penghuni
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                  {
                    detailData.jumlah_penghuni
                  }{" "}
                  Orang

                </div>

              </div>

              {/* PENGHUNI 2 */}
              {detailData.jumlah_penghuni ===
                2 && (
                <>
                  <div>

                    <p className="text-gray-500 mb-1 font-medium">
                      Nama Penghuni Ke-2
                    </p>

                    <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                      {
                        detailData.nama_penghuni2
                      }

                    </div>

                  </div>

                  <div>

                    <p className="text-gray-500 mb-1 font-medium">
                      Nomor Telepon Penghuni Ke-2
                    </p>

                    <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                      {
                        detailData.nomor_telepon2
                      }

                    </div>

                  </div>
                </>
              )}

              {/* TANGGAL */}
              <div>

                <p className="text-gray-500 mb-1 font-medium">
                  Tanggal Reservasi
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                  {formatDate(
                    detailData.tanggal_reservasi
                  )}

                </div>

              </div>

              <div>

                <p className="text-gray-500 mb-1 font-medium">
                  Tanggal Masuk
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                  {formatDate(
                    detailData.tanggal_masuk
                  )}

                </div>

              </div>

              {/* STATUS */}
              <div>

                <p className="text-gray-500 mb-1 font-medium">
                  Status Reservasi
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">

                  {
                    detailData.status_reservasi
                  }

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}