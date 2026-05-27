"use client";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
  Eye,
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

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

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

          <div className="overflow-x-auto rounded-2xl border bg-white">

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

                  reservasi.map(
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
                              className="p-3 rounded-xl bg-blue-100 text-blue-600"
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

          </div>

        </div>

      </div>

      {/* ============================================ */}
      {/* MODAL DETAIL */}
      {/* ============================================ */}

      {detailData && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto">

            {/* CLOSE */}
            <button
              onClick={() =>
                setDetailData(
                  null
                )
              }
              className="absolute top-5 right-5 text-gray-500"
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

                <p className="text-gray-500 mb-1">
                  Nama Penyewa
                </p>

                <div className="border rounded-xl px-4 py-3">

                  {
                    detailData
                      .penyewa
                      ?.nama_penyewa
                  }

                </div>

              </div>

              {/* TELEPON */}
              <div>

                <p className="text-gray-500 mb-1">
                  Nomor Telepon
                </p>

                <div className="border rounded-xl px-4 py-3">

                  {
                    detailData
                      .penyewa
                      ?.nomor_telepon_penyewa
                  }

                </div>

              </div>

              {/* KAMAR */}
              <div>

                <p className="text-gray-500 mb-1">
                  Nomor Kamar
                </p>

                <div className="border rounded-xl px-4 py-3">

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

                <p className="text-gray-500 mb-1">
                  Jumlah Penghuni
                </p>

                <div className="border rounded-xl px-4 py-3">

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

                    <p className="text-gray-500 mb-1">
                      Nama Penghuni Ke-2
                    </p>

                    <div className="border rounded-xl px-4 py-3">

                      {
                        detailData.nama_penghuni2
                      }

                    </div>

                  </div>

                  <div>

                    <p className="text-gray-500 mb-1">
                      Nomor Telepon Penghuni Ke-2
                    </p>

                    <div className="border rounded-xl px-4 py-3">

                      {
                        detailData.nomor_telepon2
                      }

                    </div>

                  </div>
                </>
              )}

              {/* TANGGAL */}
              <div>

                <p className="text-gray-500 mb-1">
                  Tanggal Reservasi
                </p>

                <div className="border rounded-xl px-4 py-3">

                  {formatDate(
                    detailData.tanggal_reservasi
                  )}

                </div>

              </div>

              <div>

                <p className="text-gray-500 mb-1">
                  Tanggal Masuk
                </p>

                <div className="border rounded-xl px-4 py-3">

                  {formatDate(
                    detailData.tanggal_masuk
                  )}

                </div>

              </div>

              {/* STATUS */}
              <div>

                <p className="text-gray-500 mb-1">
                  Status Reservasi
                </p>

                <div className="border rounded-xl px-4 py-3">

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