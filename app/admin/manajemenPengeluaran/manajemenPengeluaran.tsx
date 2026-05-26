"use client";

import { useState } from "react";

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function ManajemenPengeluaran() {
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
              Manajemen Pengeluaran
            </h1>

            <p className="text-gray-500 mt-1">
              Kelola data pengeluaran kos
            </p>
          </div>

          {/* BUTTON TAMBAH */}
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
          >

            <Plus size={18} />

            Tambah Pengeluaran

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
                  Nama Pegawai
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  Tanggal Pengeluaran
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  Jumlah Pengeluaran
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
                  Data pengeluaran belum tersedia
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>
      </div>
    </main>
  );
}