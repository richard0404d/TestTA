"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function LaporanKeuangan() {
  const supabase = createClient();

  // ============================================
  // STATE FILTER
  // ============================================
  const [filterType, setFilterType] = useState("Perbulan");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  
  // State untuk menyimpan daftar tahun dinamis
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // ============================================
  // STATE DATA
  // ============================================
  const [rawPembayaran, setRawPembayaran] = useState<any[]>([]);
  const [rawPengeluaran, setRawPengeluaran] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // FUNGSI MENGAMBIL DAFTAR TAHUN DINAMIS
  // ============================================
  const getAvailableYears = async () => {
    try {
      // Mengambil 1 data pembayaran paling lama untuk mengetahui tahun terawal
      const { data, error } = await supabase
        .from("pembayaran")
        .select("tanggal_pembayaran")
        .order("tanggal_pembayaran", { ascending: true })
        .limit(1);

      const currentYear = new Date().getFullYear();
      let oldestYear = currentYear;

      if (data && data.length > 0 && data[0].tanggal_pembayaran) {
        oldestYear = new Date(data[0].tanggal_pembayaran).getFullYear();
      }

      // Generate array tahun dari tahun terbaru mundur ke tahun tertua
      const years = [];
      for (let y = currentYear; y >= oldestYear; y--) {
        years.push(y.toString());
      }
      setAvailableYears(years);
    } catch (error) {
      console.error("Gagal mengambil rentang tahun:", error);
      // Fallback jika gagal: berikan tahun ini saja
      setAvailableYears([new Date().getFullYear().toString()]);
    }
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch data pembayaran yang Berhasil
      const { data: dataPembayaran, error: errPembayaran } = await supabase
        .from("pembayaran")
        .select(`
          tanggal_pembayaran,
          status_pembayaran,
          tagihan ( total_tagihan )
        `)
        .eq("status_pembayaran", "Berhasil");

      if (errPembayaran) throw errPembayaran;

      // 2. Fetch data pengeluaran
      const { data: dataPengeluaran, error: errPengeluaran } = await supabase
        .from("pengeluaran")
        .select(`
          tanggal_pengeluaran,
          jumlah_pengeluaran
        `);

      if (errPengeluaran) throw errPengeluaran;

      setRawPembayaran(dataPembayaran || []);
      setRawPengeluaran(dataPengeluaran || []);
    } catch (error) {
      console.error("Error fetching data keuangan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAvailableYears();
    fetchData();
  }, []);

  // ============================================
  // DATA PROCESSING (CALCULATE STATS & CHART)
  // ============================================
  const { chartData, stats } = useMemo(() => {
    let processedData: any[] = [];
    let totalPendapatan = 0;
    let totalPengeluaran = 0;

    const targetYear = parseInt(selectedYear);
    const targetMonthIndex = MONTHS.indexOf(selectedMonth);

    if (filterType === "Pertahun") {
      // --- LOGIKA PERTAHUN (Group by Bulan 1-12) ---
      processedData = MONTHS.map((month) => ({
        name: month.substring(0, 3), // Jan, Feb, Mar, etc.
        Pendapatan: 0,
        Pengeluaran: 0,
      }));

      // Tambahkan Pembayaran ke bulan yang sesuai
      rawPembayaran.forEach((item) => {
        if (!item.tanggal_pembayaran) return;
        const date = new Date(item.tanggal_pembayaran);
        if (date.getFullYear() === targetYear) {
          const mIndex = date.getMonth();
          const amount = item.tagihan?.total_tagihan || 0;
          processedData[mIndex].Pendapatan += amount;
          totalPendapatan += amount;
        }
      });

      // Tambahkan Pengeluaran ke bulan yang sesuai
      rawPengeluaran.forEach((item) => {
        if (!item.tanggal_pengeluaran) return;
        const date = new Date(item.tanggal_pengeluaran);
        if (date.getFullYear() === targetYear) {
          const mIndex = date.getMonth();
          const amount = item.jumlah_pengeluaran || 0;
          processedData[mIndex].Pengeluaran += amount;
          totalPengeluaran += amount;
        }
      });

    } else {
      // --- LOGIKA PERBULAN (Group by Hari 1 - 28/30/31) ---
      const daysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
      processedData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`, // 1, 2, 3, ..., 31
        Pendapatan: 0,
        Pengeluaran: 0,
      }));

      // Filter & Sum Pembayaran
      rawPembayaran.forEach((item) => {
        if (!item.tanggal_pembayaran) return;
        const date = new Date(item.tanggal_pembayaran);
        if (date.getFullYear() === targetYear && date.getMonth() === targetMonthIndex) {
          const dayIndex = date.getDate() - 1;
          const amount = item.tagihan?.total_tagihan || 0;
          processedData[dayIndex].Pendapatan += amount;
          totalPendapatan += amount;
        }
      });

      // Filter & Sum Pengeluaran
      rawPengeluaran.forEach((item) => {
        if (!item.tanggal_pengeluaran) return;
        const date = new Date(item.tanggal_pengeluaran);
        if (date.getFullYear() === targetYear && date.getMonth() === targetMonthIndex) {
          const dayIndex = date.getDate() - 1;
          const amount = item.jumlah_pengeluaran || 0;
          processedData[dayIndex].Pengeluaran += amount;
          totalPengeluaran += amount;
        }
      });
    }

    return {
      chartData: processedData,
      stats: {
        pendapatan: totalPendapatan,
        pengeluaran: totalPengeluaran,
        laba: totalPendapatan - totalPengeluaran,
      },
    };
  }, [rawPembayaran, rawPengeluaran, filterType, selectedYear, selectedMonth]);

  // ============================================
  // FORMAT CURRENCY
  // ============================================
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="min-h-screen bg-gray-100 md:pt-20">
      {/* CONTENT */}
      <main className="pt-24 md:ml-[260px] p-5 md:p-8">
        {/* CARD UTAMA */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          
          {/* HEADER */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">
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
              <div className="w-11 h-11 rounded-xl border bg-white flex items-center justify-center text-gray-600 shadow-sm">
                <CalendarDays size={20} />
              </div>

              {/* FILTER TYPE */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded-xl px-4 py-2 bg-white outline-none shadow-sm text-gray-700 font-medium cursor-pointer"
              >
                <option value="Perbulan">Perbulan</option>
                <option value="Pertahun">Pertahun</option>
              </select>

              {/* YEAR DINAMIS */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border rounded-xl px-4 py-2 bg-white outline-none shadow-sm text-gray-700 font-medium cursor-pointer"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              {/* MONTH (Hanya Muncul Jika Perbulan) */}
              {filterType === "Perbulan" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border rounded-xl px-4 py-2 bg-white outline-none shadow-sm text-gray-700 font-medium cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* STATISTICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
            {/* TOTAL PENDAPATAN */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Wallet size={24} />
              </div>
              <p className="text-gray-500 mb-2 font-medium">Total Pendapatan</p>
              <h1 className="text-3xl font-bold text-gray-800">
                {loading ? "..." : formatRupiah(stats.pendapatan)}
              </h1>
            </div>

            {/* TOTAL PENGELUARAN */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <TrendingDown size={24} />
              </div>
              <p className="text-gray-500 mb-2 font-medium">Total Pengeluaran</p>
              <h1 className="text-3xl font-bold text-gray-800">
                {loading ? "..." : formatRupiah(stats.pengeluaran)}
              </h1>
            </div>

            {/* LABA BERSIH */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <p className="text-gray-500 mb-2 font-medium">Laba Bersih</p>
              <h1 className={`text-3xl font-bold ${stats.laba < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {loading ? "..." : formatRupiah(stats.laba)}
              </h1>
            </div>
          </div>

          {/* GRAFIK */}
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Grafik Keuangan {filterType === "Perbulan" ? `${selectedMonth} ${selectedYear}` : `Tahun ${selectedYear}`}
            </h2>

            <div className="h-[400px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border text-gray-400 animate-pulse">
                  Memuat grafik...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value) => `Rp ${value / 1000}k`} // Mempersingkat angka ribuan
                    />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      // Ubah tipe 'value' menjadi 'any' dan pastikan nilainya dijadikan Number
                      formatter={(value: any) => formatRupiah(Number(value || 0))}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Pendapatan" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Pendapatan" />
                    <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} name="Pengeluaran" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}