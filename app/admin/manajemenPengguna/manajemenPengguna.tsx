"use client";

import { useState } from "react";


import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function ManajemenPengguna() {

  const [openPegawai, setOpenPegawai] = useState(false);
  const [openPenyewa, setOpenPenyewa] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 md:pt-20">

      {/* CONTENT */}
      <main className="pt-24 md:ml-[260px] p-5 md:p-8">

        {/* CARD */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">

          {/* TITLE */}
          <div className="mb-8">

            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Pengguna
            </h1>

            <p className="text-gray-500 mt-1">
              Kelola data pegawai dan penyewa kos
            </p>

          </div>

          {/* ================= PEGAWAI ================= */}
          <div className="mb-10">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

              <h2 className="text-2xl font-bold text-gray-800">
                Data Pegawai
              </h2>

              <button
                onClick={() => setOpenPegawai(true)}
                className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
              >

                <Plus size={18} />

                Tambah Pegawai

              </button>

            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-2xl border">

              <table className="w-full min-w-[900px]">

                {/* HEAD */}
                <thead className="bg-gray-100">

                  <tr>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Nama
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Email
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Nomor Telepon
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Role
                    </th>

                    <th className="text-center px-6 py-4 font-semibold text-gray-700">
                      Aksi
                    </th>

                  </tr>

                </thead>

                {/* BODY */}
                <tbody>

                  <tr>

                    <td
                      colSpan={5}
                      className="text-center py-20 text-gray-400"
                    >
                      Data pegawai belum tersedia
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* ================= PENYEWA ================= */}
          <div>

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

              <h2 className="text-2xl font-bold text-gray-800">
                Data Penyewa
              </h2>

              <button
                onClick={() => setOpenPenyewa(true)}
                className="flex items-center gap-2 bg-[#1c3163] hover:bg-[#16274f] text-white px-5 py-3 rounded-xl transition"
              >

                <Plus size={18} />

                Tambah Penyewa

              </button>

            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-2xl border">

              <table className="w-full min-w-[1000px]">

                {/* HEAD */}
                <thead className="bg-gray-100">

                  <tr>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Nama Penyewa
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Email
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Nomor Telepon
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Kamar
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="text-center px-6 py-4 font-semibold text-gray-700">
                      Aksi
                    </th>

                  </tr>

                </thead>

                {/* BODY */}
                <tbody>

                  <tr>

                    <td
                      colSpan={6}
                      className="text-center py-20 text-gray-400"
                    >
                      Data penyewa belum tersedia
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </main>

      {/* ================= MODAL PEGAWAI ================= */}
      {openPegawai && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative">

            {/* CLOSE */}
            <button
              onClick={() => setOpenPegawai(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500"
            >

              <X size={24} />

            </button>

            {/* TITLE */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              Tambah Pegawai
            </h2>

            {/* FORM */}
            <div className="space-y-5">

              <input
                type="text"
                placeholder="Nama Pegawai"
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Nomor Telepon"
                className="w-full border rounded-xl px-4 py-3"
              />

              <select className="w-full border rounded-xl px-4 py-3">

                <option>Admin</option>

                <option>Pemilik</option>

              </select>

              {/* BUTTON */}
              <div className="flex justify-end gap-4 pt-5">

                <button
                  onClick={() => setOpenPegawai(false)}
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

      {/* ================= MODAL PENYEWA ================= */}
      {openPenyewa && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative">

            {/* CLOSE */}
            <button
              onClick={() => setOpenPenyewa(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500"
            >

              <X size={24} />

            </button>

            {/* TITLE */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              Tambah Penyewa
            </h2>

            {/* FORM */}
            <div className="space-y-5">

              <input
                type="text"
                placeholder="Nama Penyewa"
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Nomor Telepon"
                className="w-full border rounded-xl px-4 py-3"
              />

              <select className="w-full border rounded-xl px-4 py-3">

                <option>Kamar 001</option>

                <option>Kamar 002</option>

                <option>Kamar 003</option>

              </select>

              <select className="w-full border rounded-xl px-4 py-3">

                <option>Aktif</option>

                <option>Non-Aktif</option>

              </select>

              {/* BUTTON */}
              <div className="flex justify-end gap-4 pt-5">

                <button
                  onClick={() => setOpenPenyewa(false)}
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

    </div>
  );
}