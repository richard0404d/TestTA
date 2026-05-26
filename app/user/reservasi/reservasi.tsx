"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Reservasi() {
  const [form, setForm] = useState({
    penghuni: "1",
    gender: "",
    kamar: "Kamar 1",
    telepon: "",
    tanggal: "",
    namaPenghuni2: "",
    teleponPenghuni2: "",
    file: null as File | null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!form.gender || !form.telepon || !form.tanggal) {
      alert("Harap lengkapi semua data!");
      return;
    }

    // VALIDASI TAMBAHAN JIKA 2 ORANG
    if (
      form.penghuni === "2" &&
      (!form.namaPenghuni2 || !form.teleponPenghuni2)
    ) {
      alert("Data penghuni ke-2 harus diisi!");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      console.log("Data Reservasi:", form);

      setLoading(false);

      alert("Reservasi berhasil (dummy)");

      setForm({
        penghuni: "1",
        gender: "",
        kamar: "Kamar 1",
        telepon: "",
        tanggal: "",
        namaPenghuni2: "",
        teleponPenghuni2: "",
        file: null,
      });
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-32 px-4 mt-10">

      {/* ================= BANNER ================= */}
      <div className="w-full h-[200px] border flex items-center justify-center mb-6 rounded-xl">
        Banner Image
      </div>

      {/* ================= FORM ================= */}
      <form
        onSubmit={handleSubmit}
        className="border rounded-2xl p-6 space-y-5 bg-white shadow-sm"
      >

        {/* Jumlah Penghuni */}
        <div>
          <label className="font-medium">Jumlah Penghuni:</label>

          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="penghuni"
                value="1"
                checked={form.penghuni === "1"}
                onChange={handleChange}
              />
              Satu Orang
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="penghuni"
                value="2"
                checked={form.penghuni === "2"}
                onChange={handleChange}
              />
              Dua Orang
            </label>
          </div>
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label className="font-medium">Jenis Kelamin:</label>

          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="gender"
                value="Pria"
                checked={form.gender === "Pria"}
                onChange={handleChange}
              />
              Pria
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="gender"
                value="Wanita"
                checked={form.gender === "Wanita"}
                onChange={handleChange}
              />
              Wanita
            </label>
          </div>
        </div>

        {/* Pilih Kamar */}
        <div>
          <label className="font-medium">Pilih Kamar:</label>

          <select
            name="kamar"
            value={form.kamar}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          >
            <option>Kamar 1</option>
            <option>Kamar 2</option>
            <option>Kamar 3</option>
          </select>
        </div>

        {/* Nomor Telepon */}
        <div>
          <label className="font-medium">
            Masukkan Nomor Telepon
          </label>

          <input
            type="text"
            name="telepon"
            value={form.telepon}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        {/* ================= TAMBAHAN JIKA 2 ORANG ================= */}
        {form.penghuni === "2" && (
          <>
            {/* Nama Penghuni 2 */}
            <div>
              <label className="font-medium">
                Nama Penghuni Ke-2
              </label>

              <input
                type="text"
                name="namaPenghuni2"
                value={form.namaPenghuni2}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 mt-2"
                placeholder="Masukkan nama penghuni ke-2"
              />
            </div>

            {/* Telepon Penghuni 2 */}
            <div>
              <label className="font-medium">
                Nomor Telepon Penghuni Ke-2
              </label>

              <input
                type="text"
                name="teleponPenghuni2"
                value={form.teleponPenghuni2}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 mt-2"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </>
        )}

        {/* Tanggal Masuk */}
        <div>
          <label className="font-medium">
            Pilih Tanggal Masuk:
          </label>

          <input
            type="date"
            name="tanggal"
            value={form.tanggal}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

        {/* Upload KTP */}
        <div>
          <label className="font-medium">
            Upload KTP Penghuni:
          </label>

          <div className="border rounded-xl mt-2 p-6 text-center">
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
        <div className="text-center pt-2 ">
          <Button
            type="submit"
            disabled={loading}
            className="px-8 bg-[#2C5EBF] hover:bg-[#244ea0]"
          >
            {loading ? "Memproses..." : "Reservasi"}
          </Button>
        </div>
      </form>

      {/* ================= FASILITAS ================= */}
      <div className="mt-8 border rounded-2xl p-6 bg-white shadow-sm">
        <h2 className="font-semibold text-lg mb-4">
          Fasilitas Kamar
        </h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>🛏 Kasur</div>
          <div>🛌 Bantal</div>
          <div>🪑 Lemari</div>
          <div>🌬 Kipas Angin</div>
        </div>
      </div>
    </div>
  );
}