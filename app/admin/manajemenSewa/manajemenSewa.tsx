"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  X,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";

export default function ManajemenSewa() {

  const supabase =
    createClient();

  const [loading, setLoading] =
    useState(true);

  const [sewaList, setSewaList] =
    useState<any[]>([]);

  const [selectedDetail, setSelectedDetail] =
    useState<any>(null);

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    getSewa();
  }, []);

  // ============================================
  // GET DATA
  // ============================================

  async function getSewa() {

    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("sewa")
      .select(`
        *,
        penyewa (
          id_penyewa,
          nama_penyewa,
          nomor_telepon_penyewa,
          email_penyewa
        ),
        reservasi (
          jumlah_penghuni
        )
      `)
      .order(
        "id_sewa",
        {
          ascending: false,
        }
      );

    console.log(
      "DATA SEWA:",
      data
    );

    if (error) {

      console.log(error);

      setLoading(false);

      return;
    }

    setSewaList(
      data || []
    );

    setLoading(false);
  }

  // ============================================
  // FORMAT TANGGAL
  // ============================================

  function formatTanggal(
    tanggal: string
  ) {

    if (!tanggal)
      return "-";

    return new Date(
      tanggal
    ).toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  return (
    <main className="pt-24 md:ml-[260px] p-5 md:p-8">

      <div className="md:pt-20">

        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}

        <div className="bg-white rounded-3xl border shadow-sm p-6">

          <h1 className="text-3xl font-bold text-gray-800">
            Manajemen Sewa
          </h1>

          <p className="text-gray-500 mt-1">
            Kelola data sewa kos
          </p>

        </div>

        {/* ============================================ */}
        {/* TABLE */}
        {/* ============================================ */}

        <div className="pt-8">

          <div className="overflow-x-auto rounded-2xl border bg-white">

            <table className="w-full min-w-[1000px]">

              <thead className="bg-gray-100">

                <tr>

                  <th className="text-left px-6 py-4 font-semibold">
                    Nama Penyewa
                  </th>

                  <th className="text-left px-6 py-4 font-semibold">
                    Nomor Kamar
                  </th>

                  <th className="text-left px-6 py-4 font-semibold">
                    Jumlah Penghuni
                  </th>

                  <th className="text-left px-6 py-4 font-semibold">
                    Status Sewa
                  </th>

                  <th className="text-center px-6 py-4 font-semibold">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading && (

                  <tr>

                    <td
                      colSpan={5}
                      className="text-center py-20"
                    >
                      Loading...
                    </td>

                  </tr>

                )}

                {!loading &&
                  sewaList.length === 0 && (

                  <tr>

                    <td
                      colSpan={5}
                      className="text-center py-20 text-gray-400"
                    >
                      Data sewa belum tersedia
                    </td>

                  </tr>

                )}

                {sewaList.map(
                  (item) => (

                    <tr
                      key={
                        item.id_sewa
                      }
                      className="border-t"
                    >

                      {/* NAMA */}
                      <td className="px-6 py-4">

                        {
                          item.penyewa
                            ?.nama_penyewa
                        }

                      </td>

                      {/* KAMAR */}
                      <td className="px-6 py-4">

                        Kamar {
                          item.id_kamar
                        }

                      </td>

                      {/* PENGHUNI */}
                      <td className="px-6 py-4">

                        {
                          item.reservasi
                            ?.jumlah_penghuni
                        }

                        {" "}Orang

                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">

                        <span
                          className="
                            px-3 py-1
                            rounded-full
                            bg-gray-100
                          "
                        >
                          {
                            item.status_sewa
                          }
                        </span>

                      </td>

                      {/* AKSI */}
                      <td className="px-6 py-4 text-center">

                        <button
                          onClick={() =>
                            setSelectedDetail(
                              item
                            )
                          }
                          className="
                            p-3 rounded-xl
                            bg-blue-100
                            text-blue-600
                          "
                        >
                          <Eye size={18} />
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ============================================ */}
      {/* MODAL DETAIL */}
      {/* ============================================ */}

      {selectedDetail && (

        <div
          className="
            fixed inset-0
            bg-black/50
            flex items-center
            justify-center
            z-50
            p-5
          "
        >

          <div
            className="
              bg-white
              rounded-2xl
              w-full
              max-w-2xl
              p-6
              space-y-5
              max-h-[90vh]
              overflow-auto
            "
          >

            {/* HEADER */}

            <div className="flex justify-between items-center">

              <h2 className="text-2xl font-bold">
                Detail Sewa
              </h2>

              <button
                onClick={() =>
                  setSelectedDetail(
                    null
                  )
                }
              >
                <X />
              </button>

            </div>

            {/* NAMA */}

            <div>

              <label className="font-semibold">
                Nama Penyewa
              </label>

              <input
                type="text"
                readOnly
                value={
                  selectedDetail
                    ?.penyewa
                    ?.nama_penyewa || "-"
                }
                className="
                  w-full border
                  rounded-lg
                  p-3 mt-2
                  bg-gray-100
                "
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
                value={`Kamar ${selectedDetail.id_kamar}`}
                className="
                  w-full border
                  rounded-lg
                  p-3 mt-2
                  bg-gray-100
                "
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
                value={`${selectedDetail?.reservasi?.jumlah_penghuni || 0} Orang`}
                className="
                  w-full border
                  rounded-lg
                  p-3 mt-2
                  bg-gray-100
                "
              />

            </div>

            {/* STATUS */}

            <div>

              <label className="font-semibold">
                Status Sewa
              </label>

              <input
                type="text"
                readOnly
                value={
                  selectedDetail.status_sewa
                }
                className="
                  w-full border
                  rounded-lg
                  p-3 mt-2
                  bg-gray-100
                "
              />

            </div>

            {/* TANGGAL */}

            <div>

              <label className="font-semibold">
                Tanggal Sewa
              </label>

              <input
                type="text"
                readOnly
                value={formatTanggal(
                  selectedDetail.tanggal_sewa
                )}
                className="
                  w-full border
                  rounded-lg
                  p-3 mt-2
                  bg-gray-100
                "
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
                value={
                  selectedDetail
                    ?.penyewa
                    ?.nomor_telepon_penyewa || "-"
                }
                className="
                  w-full border
                  rounded-lg
                  p-3 mt-2
                  bg-gray-100
                "
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
                value={
                  selectedDetail
                    ?.penyewa
                    ?.email_penyewa || "-"
                }
                className="
                  w-full border
                  rounded-lg
                  p-3 mt-2
                  bg-gray-100
                "
              />

            </div>

          </div>

        </div>

      )}

    </main>
  );
}