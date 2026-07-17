"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Bed, DoorOpen, CalendarCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function DashboardContent() {
  const supabase = createClient();

  const [stats, setStats] = useState({
    total: 0,
    ditempati: 0,
    tersedia: 0,
    direservasi: 0,
    diperbaiki: 0,
  });

  const [loading, setLoading] = useState(true);

  const getKamarData = async () => {
    try {
      setLoading(true);
      
      // Mengambil hanya kolom status_kamar untuk dihitung
      const { data, error } = await supabase
        .from("kamar")
        .select("status_kamar");

      if (error) throw error;

      if (data) {
        // Menghitung jumlah masing-masing status
        const total = data.length;
        const ditempati = data.filter((k) => k.status_kamar === "Ditempati").length;
        const tersedia = data.filter((k) => k.status_kamar === "Tersedia").length;
        const direservasi = data.filter((k) => k.status_kamar === "Direservasi").length;
        const diperbaiki = data.filter((k) => k.status_kamar === "Diperbaiki").length;

        setStats({ total, ditempati, tersedia, direservasi, diperbaiki });
      }
    } catch (error) {
      console.error("Error fetching kamar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getKamarData();
  }, []);

  const statCards = [
    {
      title: "Total Kamar",
      value: stats.total,
      icon: <Building2 size={24} />,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "Kamar Ditempati",
      value: stats.ditempati,
      icon: <Bed size={24} />,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
    },
    {
      title: "Kamar Tersedia",
      value: stats.tersedia,
      icon: <DoorOpen size={24} />,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Kamar Direservasi",
      value: stats.direservasi,
      icon: <CalendarCheck size={24} />,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
  ];

  const chartData = [
    { name: "Tersedia", jumlah: stats.tersedia, color: "#10B981" }, // Hijau
    { name: "Ditempati", jumlah: stats.ditempati, color: "#EF4444" }, // Merah
    { name: "Direservasi", jumlah: stats.direservasi, color: "#F59E0B" }, // Kuning
    { name: "Diperbaiki", jumlah: stats.diperbaiki, color: "#6B7280" }, // Abu-abu
  ];

  return (
    <main className="flex-1 p-5 md:p-8 md:ml-[260px]">

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8 pt-20">
        {statCards.map((item, index) => (
          <div
            key={index}
            className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.bgColor} ${item.textColor}`}
            >
              {item.icon}
            </div>

            <p className="text-gray-500 mb-2 font-medium">{item.title}</p>

            <h1 className="text-3xl font-bold text-gray-800">
              {loading ? "..." : item.value}
            </h1>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-3xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Statistik Status Kamar
        </h2>

        <div className="h-[350px] w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border text-gray-400 animate-pulse">
              Memuat grafik...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                {/* Garis Horizontal */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                
                {/* Sumbu X (Tersedia, Ditempati, dll) */}
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 14 }} 
                  dy={10}
                />
                
                {/* Sumbu Y (Jumlah) */}
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 14 }}
                  allowDecimals={false} // Angka bulat saja
                />
                
                {/* Tooltip saat di-hover */}
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                
                {/* Bar Grafik */}
                <Bar dataKey="jumlah" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </main>
  );
}