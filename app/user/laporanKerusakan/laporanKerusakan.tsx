"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LaporanKerusakan() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    kamar: "Kamar 1",
    fasilitas: "Lemari",
    laporan: "",
    file: null as File | null,
  });

  // 🔥 DATA DUMMY TABLE
  const [data] = useState([
    {
      laporan: "Kipas Angin Rusak",
      tanggal: "2026-04-12",
      status: "Check",
    },
    {
      laporan: "Lampu Rusak",
      tanggal: "2026-03-28",
      status: "Resolved",
    },
  ]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!form.laporan) {
      alert("Laporan tidak boleh kosong!");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      console.log("Data laporan:", form);
      setLoading(false);
      alert("Laporan berhasil dikirim (dummy)");

      setForm({
        kamar: "Kamar 1",
        fasilitas: "Lemari",
        laporan: "",
        file: null,
      });
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 px-4 space-y-6">

      {/* ================= TABLE ================= */}
      <div className="border p-4">
        <h2 className="font-semibold mb-3">Laporan Saya</h2>

        <table className="w-full border text-sm">
          <thead>
            <tr className="border bg-gray-100">
              <th className="p-2 border text-left">Laporan</th>
              <th className="p-2 border text-left">Tanggal</th>
              <th className="p-2 border text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border">
                <td className="p-2 border">{item.laporan}</td>
                <td className="p-2 border">{item.tanggal}</td>
                <td className="p-2 border">({item.status})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= FORM ================= */}
      <form
        onSubmit={handleSubmit}
        className="border p-6 max-w-xl mx-auto space-y-4"
      >
        {/* Kamar */}
        <div>
          <label className="font-medium">Kamar:</label>
          <input
            type="text"
            name="kamar"
            value={form.kamar}
            readOnly
            className="w-full border p-2 mt-1 bg-gray-100"
          />
        </div>

        {/* Fasilitas */}
        <div>
          <label className="font-medium">Fasilitas yang Rusak:</label>
          <select
            name="fasilitas"
            value={form.fasilitas}
            onChange={handleChange}
            className="w-full border p-2 mt-1"
          >
            <option>Lemari</option>
            <option>Kipas Angin</option>
            <option>Lampu</option>
            <option>Pintu</option>
          </select>
        </div>

        {/* Laporan */}
        <div>
          <label className="font-medium">Laporan Kerusakan:</label>
          <textarea
            name="laporan"
            value={form.laporan}
            onChange={handleChange}
            className="w-full border p-2 mt-1 h-24"
            placeholder="Contoh: Pintu lemari rusak"
          />
        </div>

        {/* Upload */}
        <div>
          <label className="font-medium">
            Upload Barang Rusak (Opsional):
          </label>
          <div className="border mt-2 p-6 text-center">
            <input
              type="file"
              onChange={(e) =>
                setForm({
                  ...form,
                  file: e.target.files?.[0] || null,
                })
              }
            />
            {form.file && (
              <p className="text-sm mt-2 text-gray-500">
                File: {form.file.name}
              </p>
            )}
          </div>
        </div>

        {/* BUTTON */}
        <div className="text-center">
          <Button type="submit" disabled={loading}>
            {loading ? "Mengirim..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}