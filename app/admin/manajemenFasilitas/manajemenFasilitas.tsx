"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
} from "lucide-react";

export default function ManajemenFasilitas() {

  // ============================================
  // SUPABASE
  // ============================================

  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================

  const [openModal, setOpenModal] =
    useState(false);

  const [
    openMasterModal,
    setOpenMasterModal,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [editId, setEditId] =
    useState<number | null>(null);

  const [dataFasilitas,
    setDataFasilitas] =
    useState<any[]>([]);

  const [masterFasilitas,
    setMasterFasilitas] =
    useState<any[]>([]);

  const [kamar, setKamar] =
    useState<any[]>([]);

  const [detailData,
    setDetailData] =
    useState<any | null>(null);

  // ============================================
  // FORM DETAIL
  // ============================================

  const [form, setForm] =
    useState({
      id_kamar: "",
      id_fasilitas: "",
      kondisi_fasilitas: "Baik",
    });

  // ============================================
  // FORM MASTER
  // ============================================

  const [namaFasilitas,
    setNamaFasilitas] =
    useState("");

  // ============================================
  // GET KAMAR
  // ============================================

  const getKamar = async () => {

    const {
      data,
      error,
    } = await supabase
      .from("kamar")
      .select("*")
      .order("id_kamar");

    if (error) {

      console.log(error);

      return;
    }

    setKamar(data || []);
  };

  // ============================================
  // GET MASTER FASILITAS
  // ============================================

  const getMasterFasilitas =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from("fasilitas")
        .select("*")
        .order(
          "id_fasilitas",
          {
            ascending: true,
          }
        );

      if (error) {

        console.log(error);

        return;
      }

      setMasterFasilitas(
        data || []
      );
    };

  // ============================================
  // GET DETAIL FASILITAS
  // ============================================

// ============================================
// GET DETAIL FASILITAS
// ============================================

const getDetailFasilitas =
  async () => {

    try {

      // ============================================
      // GET DETAIL
      // ============================================

      const {
        data: detailData,
        error: detailError,
      } = await supabase
        .from(
          "detail_fasilitas_kamar"
        )
        .select("*");

      if (detailError) {

        console.log(
          "DETAIL ERROR:",
          detailError
        );

        return;
      }

      console.log(
        "DETAIL DATA:",
        detailData
      );

      // ============================================
      // GET FASILITAS
      // ============================================

      const {
        data: fasilitasData,
        error: fasilitasError,
      } = await supabase
        .from("fasilitas")
        .select("*");

      if (fasilitasError) {

        console.log(
          "FASILITAS ERROR:",
          fasilitasError
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
          "KAMAR ERROR:",
          kamarError
        );

        return;
      }

      // ============================================
      // JOIN MANUAL
      // ============================================

      const finalData =
        detailData.map((item) => {

          const fasilitas =
            fasilitasData.find(
              (f: any) =>
                Number(
                  f.id_fasilitas
                ) ===
                Number(
                  item.id_fasilitas
                )
            );

          const kamar =
            kamarData.find(
              (k: any) =>
                Number(
                  k.id_kamar
                ) ===
                Number(
                  item.id_kamar
                )
            );

          return {

            ...item,

            fasilitas,

            kamar,
          };
        });

      console.log(
        "FINAL DATA:",
        finalData
      );

      setDataFasilitas(
        finalData
      );

    } catch (error) {

      console.log(error);
    }
  };

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {

    getKamar();

    getMasterFasilitas();

    getDetailFasilitas();

  }, []);

  // ============================================
  // HANDLE CHANGE
  // ============================================

  const handleChange = (
    e: any
  ) => {

    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  // ============================================
  // SAVE DETAIL
  // ============================================

  const handleSave =
    async () => {

      try {

        setLoading(true);

        // ============================================
        // UPDATE
        // ============================================

        if (editId) {

          const { error } =
            await supabase
              .from(
                "detail_fasilitas_kamar"
              )
              .update({
                id_kamar:
                  Number(
                    form.id_kamar
                  ),

                id_fasilitas:
                  Number(
                    form.id_fasilitas
                  ),

                kondisi_fasilitas:
                  form.kondisi_fasilitas,
              })
              .eq(
                "id_detail_fasiliitas_kamar",
                editId
              );

          if (error)
            throw error;

          alert(
            "Detail fasilitas berhasil diupdate"
          );

        } else {

          // ============================================
// INSERT
// ============================================

// CEK APAKAH SUDAH ADA
const {
  data: existingData,
  error: checkError,
} = await supabase
  .from(
    "detail_fasilitas_kamar"
  )
  .select("*")
  .eq(
    "id_kamar",
    Number(form.id_kamar)
  )
  .eq(
    "id_fasilitas",
    Number(form.id_fasilitas)
  );

if (checkError)
  throw checkError;

// JIKA SUDAH ADA
if (
  existingData &&
  existingData.length > 0
) {

  alert(
    "Fasilitas tersebut sudah digunakan di kamar ini"
  );

  setLoading(false);

  return;
}

// INSERT DATA
const { error } =
  await supabase
    .from(
      "detail_fasilitas_kamar"
    )
    .insert([
      {
        id_kamar:
          Number(
            form.id_kamar
          ),

        id_fasilitas:
          Number(
            form.id_fasilitas
          ),

        kondisi_fasilitas:
          form.kondisi_fasilitas,
      },
    ]);

if (error)
  throw error;

alert(
  "Detail fasilitas berhasil ditambahkan"
);
}

        // ============================================
        // REFRESH
        // ============================================

        await getDetailFasilitas();

        // ============================================
        // RESET
        // ============================================

        setForm({
          id_kamar: "",
          id_fasilitas: "",
          kondisi_fasilitas:
            "Baik",
        });

        setEditId(null);

        setOpenModal(false);

      } catch (error: any) {

        console.log(error);

        alert(error.message);

      } finally {

        setLoading(false);
      }
    };

  // ============================================
  // SAVE MASTER
  // ============================================

  const handleSaveMaster =
    async () => {

      try {

        if (!namaFasilitas)
          return alert(
            "Nama fasilitas wajib diisi"
          );

        const { error } =
          await supabase
            .from("fasilitas")
            .insert([
              {
                nama_fasilitas:
                  namaFasilitas,
              },
            ]);

        if (error)
          throw error;

        alert(
          "Fasilitas berhasil ditambahkan"
        );

        setNamaFasilitas("");

        setOpenMasterModal(false);

        await getMasterFasilitas();

      } catch (error: any) {

        console.log(error);

        alert(error.message);
      }
    };

    // ============================================
// DELETE DETAIL FASILITAS
// ============================================

const handleDeleteFasilitas =
  async (
    id: number
  ) => {

    const confirmDelete =
      confirm(
        "Yakin ingin menghapus fasilitas ini?"
      );

    if (!confirmDelete)
      return;

    try {

      const { error } =
        await supabase
          .from(
            "detail_fasilitas_kamar"
          )
          .delete()
          .eq(
            "id_detail_fasiliitas_kamar",
            id
          );

      if (error)
        throw error;

      // UPDATE STATE
      const updated =
        detailData.filter(
          (item: any) =>
            item.id_detail_fasiliitas_kamar !==
            id
        );

      setDetailData(
        updated
      );

      // REFRESH TABLE
      await getDetailFasilitas();

      alert(
        "Fasilitas berhasil dihapus"
      );

    } catch (error: any) {

      console.log(error);

      alert(error.message);
    }
  };

  return (

    <main className="pt-24 md:ml-[260px] p-5 md:p-8">

      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}

      <div className="bg-white rounded-3xl border shadow-sm p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Fasilitas
            </h1>

            <p className="text-gray-500 mt-1">
              Kelola fasilitas setiap kamar
            </p>

          </div>

          <button
            onClick={() =>
              setOpenModal(true)
            }
            className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl"
          >

            <Plus size={18} />

            Tambah Detail Fasilitas

          </button>

        </div>

      </div>

      {/* ============================================ */}
{/* TABLE DETAIL */}
{/* ============================================ */}

<div className="pt-8">

  <div className="overflow-x-auto rounded-2xl border bg-white">

    <table className="w-full min-w-[700px]">

      <thead className="bg-gray-100">

        <tr>

          <th className="text-left px-6 py-4 font-semibold text-gray-700">
            Nomor Kamar
          </th>

          <th className="text-center px-6 py-4 font-semibold text-gray-700">
            Detail
          </th>

        </tr>

      </thead>

      <tbody>

        {(() => {

          // ============================================
          // GROUP BERDASARKAN KAMAR
          // ============================================

          const groupedData =
            dataFasilitas.reduce(
              (
                acc: any,
                item: any
              ) => {

                const kamarId =
                  item.id_kamar;

                // JIKA BELUM ADA
                if (
                  !acc[kamarId]
                ) {

                  acc[kamarId] =
                    [];
                }

                // PUSH
                acc[kamarId].push(
                  item
                );

                return acc;

              },
              {}
            );

          // ============================================
          // RENDER
          // ============================================

          return Object.entries(
            groupedData
          ).map(
            (
              [kamarId,
                fasilitas]: any,
              index
            ) => (

              <tr
                key={`kamar-${index}`}
                className="border-t"
              >

                {/* NOMOR KAMAR */}
                <td className="px-6 py-4 font-medium">

                  Kamar {kamarId}

                </td>

                {/* DETAIL */}
                <td className="px-6 py-4">

                  <div className="flex justify-center">

                    <button
                      onClick={() => {

                        setDetailData(
                          fasilitas
                        );
                      }}
                      className="p-3 rounded-xl bg-blue-100 text-blue-600"
                    >

                      <Eye size={18} />

                    </button>

                  </div>

                </td>
              </tr>
            )
          );

        })()}

      </tbody>

    </table>

  </div>

</div>

      {/* ============================================ */}
      {/* MASTER FASILITAS */}
      {/* ============================================ */}

      <div className="pt-16">

        <div className="flex justify-between items-center mb-5">

          <div>

            <h2 className="text-2xl font-bold text-gray-800">
              Data Master Fasilitas
            </h2>

            <p className="text-gray-500 mt-1">
              Kelola daftar fasilitas kos
            </p>

          </div>

          <button
            onClick={() =>
              setOpenMasterModal(true)
            }
            className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl"
          >

            <Plus size={18} />

            Tambah Fasilitas

          </button>

        </div>

        {/* TABLE MASTER */}

        <div className="overflow-x-auto rounded-2xl border bg-white">

          <table className="w-full min-w-[600px]">

            <thead className="bg-gray-100">

              <tr>

                <th className="px-6 py-4 text-left">
                  ID
                </th>

                <th className="px-6 py-4 text-left">
                  Nama Fasilitas
                </th>

              </tr>

            </thead>

            <tbody>

              {masterFasilitas.length > 0 ? (

                masterFasilitas.map(
                  (item, index) => (

                    <tr
                      key={
                        `master-${index}`
                      }
                      className="border-t"
                    >

                      <td className="px-6 py-4">
                        {
                          item.id_fasilitas
                        }
                      </td>

                      <td className="px-6 py-4">
                        {
                          item.nama_fasilitas
                        }
                      </td>

                    </tr>
                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan={2}
                    className="text-center py-20 text-gray-400"
                  >
                    Data fasilitas belum tersedia
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ============================================ */}
      {/* MODAL DETAIL */}
      {/* ============================================ */}

      {openModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative">

            <button
              onClick={() =>
                setOpenModal(false)
              }
              className="absolute top-5 right-5"
            >

              <X size={24} />

            </button>

            <h2 className="text-3xl font-bold mb-8">

              {editId
                ? "Edit Detail Fasilitas"
                : "Tambah Detail Fasilitas"}

            </h2>

            <div className="space-y-5">

              {/* KAMAR */}
              <select
                name="id_kamar"
                value={form.id_kamar}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3"
              >

                <option value="">
                  Pilih Kamar
                </option>

                {kamar.map((item, index) => (

                  <option
                    key={
                      `kamar-${index}`
                    }
                    value={
                      item.id_kamar
                    }
                  >

                    Kamar {
                      item.id_kamar
                    }

                  </option>
                ))}

              </select>

              {/* FASILITAS */}
              <select
                name="id_fasilitas"
                value={
                  form.id_fasilitas
                }
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3"
              >

                <option value="">
                  Pilih Fasilitas
                </option>

                {masterFasilitas.map(
                  (item, index) => (

                    <option
                      key={
                        `fasilitas-option-${index}`
                      }
                      value={
                        item.id_fasilitas
                      }
                    >

                      {
                        item.nama_fasilitas
                      }

                    </option>
                  )
                )}

              </select>

              {/* KONDISI */}
              <select
                name="kondisi_fasilitas"
                value={
                  form.kondisi_fasilitas
                }
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3"
              >

                <option value="Baik">
                  Baik
                </option>

                <option value="Rusak">
                  Rusak
                </option>

                <option value="Sedang Diperbaiki">
                  Sedang Diperbaiki
                </option>

              </select>

              {/* BUTTON */}
              <div className="flex justify-end gap-4 pt-5">

                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                  className="px-6 py-3 rounded-xl border"
                >

                  Batal

                </button>

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#1c3163] text-white"
                >

                  {loading
                    ? "Menyimpan..."
                    : "Simpan"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ============================================ */}
      {/* MODAL MASTER */}
      {/* ============================================ */}

      {openMasterModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-xl rounded-3xl p-8 relative">

            <button
              onClick={() =>
                setOpenMasterModal(false)
              }
              className="absolute top-5 right-5"
            >

              <X size={24} />

            </button>

            <h2 className="text-3xl font-bold mb-8">
              Tambah Fasilitas
            </h2>

            <div className="space-y-5">

              <input
                type="text"
                placeholder="Nama fasilitas"
                value={namaFasilitas}
                onChange={(e) =>
                  setNamaFasilitas(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl px-4 py-3"
              />

              <div className="flex justify-end gap-4 pt-5">

                <button
                  onClick={() =>
                    setOpenMasterModal(false)
                  }
                  className="px-6 py-3 rounded-xl border"
                >

                  Batal

                </button>

                <button
                  onClick={
                    handleSaveMaster
                  }
                  className="px-6 py-3 rounded-xl bg-[#1c3163] text-white"
                >

                  Simpan

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ============================================ */}
{/* MODAL DETAIL VIEW */}
{/* ============================================ */}

{detailData && (

  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 z-50">

    <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative max-h-[85vh] overflow-y-auto">

      {/* CLOSE */}
      <button
        onClick={() =>
          setDetailData(null)
        }
        className="absolute top-5 right-5"
      >

        <X size={24} />

      </button>

      {/* TITLE */}
      <h2 className="text-3xl font-bold mb-8">

        Detail Fasilitas
      </h2>

      {/* NOMOR KAMAR */}
      <div className="mb-8">

        <p className="text-gray-500 mb-2">
          Nomor Kamar
        </p>

        <div className="border rounded-xl px-4 py-3 font-medium">

          Kamar {
            detailData[0]
              ?.id_kamar
          }

        </div>

      </div>

      {/* LIST FASILITAS */}
      <div className="space-y-4">

        {detailData.map(
          (
            item: any,
            index: number
          ) => (

            <div
              key={`detail-${index}`}
              className="border rounded-2xl p-5"
            >

              {/* NAMA */}
              <div className="mb-4">

                <p className="text-gray-500 mb-2">
                  Nama Fasilitas
                </p>

                <div className="border rounded-xl px-4 py-3 bg-gray-50">

                  {
                    item.fasilitas
                      ?.nama_fasilitas
                  }

                </div>

              </div>

              {/* STATUS */}
              <div>

                <p className="text-gray-500 mb-2">
                  Kondisi Fasilitas
                </p>

                <select
                  value={
                    item.kondisi_fasilitas
                  }
                  onChange={
                    async (e) => {

                      const value =
                        e.target.value;

                      // UPDATE DB
                      const {
                        error,
                      } = await supabase
                        .from(
                          "detail_fasilitas_kamar"
                        )
                        .update({
                          kondisi_fasilitas:
                            value,
                        })
                        .eq(
                          "id_detail_fasiliitas_kamar",
                          item.id_detail_fasiliitas_kamar
                        );

                      if (error) {

                        alert(
                          error.message
                        );

                        return;
                      }

                      // UPDATE STATE
                      const updated =
                        detailData.map(
                          (
                            d: any
                          ) => {

                            if (
                              d.id_detail_fasiliitas_kamar ===
                              item.id_detail_fasiliitas_kamar
                            ) {

                              return {

                                ...d,

                                kondisi_fasilitas:
                                  value,
                              };
                            }

                            return d;
                          }
                        );

                      setDetailData(
                        updated
                      );

                      await getDetailFasilitas();
                    }
                  }
                  className="w-full border rounded-xl px-4 py-3"
                >

                  <option value="Baik">
                    Baik
                  </option>

                  <option value="Rusak">
                    Rusak
                  </option>

                  <option value="Sedang Diperbaiki">
                    Sedang Diperbaiki
                  </option>

                </select>

                {/* DELETE BUTTON */}
<div className="flex justify-end pt-4">

  <button
    onClick={() =>
      handleDeleteFasilitas(
        item.id_detail_fasiliitas_kamar
      )
    }
    className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-xl hover:bg-red-200 transition"
  >

    <Trash2 size={16} />

    Hapus Fasilitas

  </button>

</div>

              </div>

            </div>
          )
        )}

      </div>

    </div>

  </div>

)}

    </main>
  );
}