"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
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
  // PAGINATION STATE
  // ============================================
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // ============================================
  // LOGIKA PAGINATION
  // ============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sewaList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sewaList.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

          <div className="overflow-x-auto rounded-2xl border bg-white flex flex-col">

            <table className="w-full min-w-[1000px]">

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
                    Status Sewa
                  </th>

                  <th className="text-center px-6 py-4 font-semibold text-gray-700">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading && (

                  <tr>

                    <td
                      colSpan={5}
                      className="text-center py-20 text-gray-400"
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

                {!loading && sewaList.length > 0 && currentItems.map(
                  (item) => (

                    <tr
                      key={
                        item.id_sewa
                      }
                      className="border-t hover:bg-gray-50 transition"
                    >

                      {/* NAMA */}
                      <td className="px-6 py-4 text-gray-800 font-medium">

                        {
                          item.penyewa
                            ?.nama_penyewa
                        }

                      </td>

                      {/* KAMAR */}
                      <td className="px-6 py-4 text-gray-800">

                        Kamar {
                          item.id_kamar
                        }

                      </td>

                      {/* PENGHUNI */}
                      <td className="px-6 py-4 text-gray-800">

                        {
                          item.reservasi
                            ?.jumlah_penghuni
                        }

                        {" "}Orang

                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.status_sewa === "Aktif"
                              ? "bg-green-100 text-green-700"
                              : item.status_sewa === "Berakhir"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {
                            item.status_sewa
                          }
                        </span>

                      </td>

                      {/* AKSI */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              setSelectedDetail(
                                item
                              )
                            }
                            className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                            title="Detail Sewa"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

            {/* ============================================ */}
            {/* PAGINATION UI */}
            {/* ============================================ */}
            {!loading && sewaList.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
                
                <div className="text-sm text-gray-500">
                  Menampilkan {indexOfFirstItem + 1} hingga {Math.min(indexOfLastItem, sewaList.length)} dari {sewaList.length} data
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
              rounded-3xl
              w-full
              max-w-2xl
              p-8
              space-y-6
              max-h-[90vh]
              overflow-y-auto
              relative
              animate-in fade-in zoom-in duration-200
            "
          >

            {/* CLOSE BUTTON */}
            <button
              onClick={() =>
                setSelectedDetail(
                  null
                )
              }
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition"
            >
              <X size={24} />
            </button>

            {/* TITLE */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              Detail Sewa
            </h2>

            <div className="space-y-5">
              {/* NAMA */}
              <div>

                <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">
                  Nama Penyewa
                </label>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {
                    selectedDetail
                      ?.penyewa
                      ?.nama_penyewa || "-"
                  }
                </div>

              </div>

              {/* KAMAR */}
              <div>

                <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">
                  Nomor Kamar
                </label>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  Kamar {selectedDetail.id_kamar}
                </div>

              </div>

              {/* PENGHUNI */}
              <div>

                <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">
                  Jumlah Penghuni
                </label>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {selectedDetail?.reservasi?.jumlah_penghuni || 0} Orang
                </div>

              </div>

              {/* STATUS */}
              <div>

                <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">
                  Status Sewa
                </label>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {
                    selectedDetail.status_sewa
                  }
                </div>

              </div>

              {/* TANGGAL */}
              <div>

                <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">
                  Tanggal Sewa
                </label>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {formatTanggal(
                    selectedDetail.tanggal_sewa
                  )}
                </div>

              </div>

              {/* TELEPON */}
              <div>

                <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">
                  Nomor Telepon
                </label>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {
                    selectedDetail
                      ?.penyewa
                      ?.nomor_telepon_penyewa || "-"
                  }
                </div>

              </div>

              {/* EMAIL */}
              <div>

                <label className="block mb-2 text-sm font-medium text-gray-700 ml-1">
                  Email
                </label>

                <div className="border rounded-xl px-4 py-3 bg-gray-50 text-gray-800">
                  {
                    selectedDetail
                      ?.penyewa
                      ?.email_penyewa || "-"
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