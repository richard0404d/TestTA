"use client";

import { useState } from "react";


import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

export default function LaporanKeuangan() {

  // ✅ FILTER TYPE
  const [filterType, setFilterType] = useState("Perbulan");

  return (
    <div className="min-h-screen bg-gray-100 md:pt-20">


      {/* CONTENT */}
      <main className="pt-24 md:ml-[260px] p-5 md:p-8">

        {/* CARD */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">

          {/* HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

            {/* TITLE */}
            <div>

              <h1 className="text-3xl font-bold text-gray-800">
                Laporan Keuangan
              </h1>

              <p className="text-gray-500 mt-1">
                Monitoring laporan pemasukan dan pengeluaran kos
              </p>

            </div>

            {/* FILTER */}
            <div className="flex flex-wrap items-center gap-3">

              {/* ICON */}
              <div className="w-11 h-11 rounded-xl border bg-white flex items-center justify-center">

                <CalendarDays size={20} />

              </div>

              {/* FILTER TYPE */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded-xl px-4 py-2 bg-white outline-none"
              >

                <option>Perbulan</option>

                <option>Pertahun</option>

              </select>

              {/* YEAR */}
              <select className="border rounded-xl px-4 py-2 bg-white outline-none">

                <option>2026</option>

                <option>2025</option>

                <option>2024</option>

              </select>

              {/* MONTH */}
              {filterType === "Perbulan" && (

                <select className="border rounded-xl px-4 py-2 bg-white outline-none">

                  <option>Januari</option>

                  <option>Februari</option>

                  <option>Maret</option>

                  <option>April</option>

                  <option>Mei</option>

                  <option>Juni</option>

                  <option>Juli</option>

                  <option>Agustus</option>

                  <option>September</option>

                  <option>Oktober</option>

                  <option>November</option>

                  <option>Desember</option>

                </select>

              )}

            </div>

          </div>

          {/* STATISTICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">

            {/* TOTAL PENDAPATAN */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">

              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">

                <Wallet size={24} />

              </div>

              <p className="text-gray-500 mb-2">
                Total Pendapatan
              </p>

              <h1 className="text-3xl font-bold text-gray-800">
                Rp 5.000.000
              </h1>

            </div>

            {/* TOTAL PENGELUARAN */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">

              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">

                <TrendingDown size={24} />

              </div>

              <p className="text-gray-500 mb-2">
                Total Pengeluaran
              </p>

              <h1 className="text-3xl font-bold text-gray-800">
                Rp 4.500.000
              </h1>

            </div>

            {/* LABA BERSIH */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">

              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">

                <TrendingUp size={24} />

              </div>

              <p className="text-gray-500 mb-2">
                Laba Bersih
              </p>

              <h1 className="text-3xl font-bold text-gray-800">
                Rp 500.000
              </h1>

            </div>

          </div>

          {/* GRAFIK */}
          <div className="bg-white border rounded-3xl p-6 shadow-sm">

            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Grafik Laba Bersih
            </h2>

            {/* PLACEHOLDER */}
            <div className="h-[400px] rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 border flex items-center justify-center text-gray-400">

              Grafik Laporan Keuangan

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}