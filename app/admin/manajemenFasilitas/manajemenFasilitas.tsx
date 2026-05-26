"use client";

import { useState } from "react";

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function ManajemenFasilitas() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <main className="pt-24 md:ml-[260px] p-5 md:p-8">

      {/* CARD */}
      <div className="md:pt-20">
      <div className="bg-white rounded-3xl border shadow-sm p-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Fasilitas
            </h1>

            <p className="text-gray-500 mt-1">
              Kelola data Fasilitas Kos
            </p>
          </div>

          {/* BUTTON TAMBAH */}
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
          >

            <Plus size={18} />

            Tambah Fasilitas

          </button>

        </div>
        </div>

        {/* TABLE */}
        <div className="pt-8">
        <div className="overflow-x-auto rounded-2xl border">

          <table className="w-full min-w-[800px]">

            {/* TABLE HEAD */}
            <thead className="bg-gray-100">

              <tr>

                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  Nomor Fasilitas
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  Nama Fasilitas
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  Status
                </th>

                <th className="text-center px-6 py-4 font-semibold text-gray-700">
                  Aksi
                </th>

              </tr>

            </thead>

            {/* TABLE BODY */}
            <tbody>

              <tr>

                <td
                  colSpan={5}
                  className="text-center py-20 text-gray-400"
                >
                  Data Fasilitas belum tersedia
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>
      </div>

      {/* ================= MODAL ================= */}
      {openModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          {/* PANEL */}
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"
            >
              <X size={24} />
            </button>

            {/* TITLE */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              Tambah Fasilitas
            </h2>

            {/* FORM */}
            <div className="space-y-6">

              {/* HARGA */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Nama Fasilitas
                </label>

                <input
                  type="text"
                  placeholder="Masukkan harga kamar"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* STATUS */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Status
                </label>

                <select className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200">

                  <option>Aktif</option>

                  <option>Non-Aktif</option>

                </select>
              </div>

              {/* BUTTON */}
              <div className="flex justify-end gap-4 pt-6">

                <button
                  onClick={() => setOpenModal(false)}
                  className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition"
                >
                  Batal
                </button>

                <button className="px-6 py-3 rounded-xl bg-[#1c3163] text-white hover:bg-[#16274f] transition">
                  Simpan
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}