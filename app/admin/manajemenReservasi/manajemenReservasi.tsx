"use client";

import { useState } from "react";

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function ManajemenReservasi() {
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
              Manajemen Reservasi
            </h1>

            <p className="text-gray-500 mt-1">
              Kelola data Reservasi Kos
            </p>
          </div>

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
                  Nama Penyewa
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  Nomor Kamar
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

              </tr>

            </thead>

            {/* TABLE BODY */}
            <tbody>

              <tr>

                <td
                  colSpan={5}
                  className="text-center py-20 text-gray-400"
                >
                  Data Reservasi belum tersedia
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