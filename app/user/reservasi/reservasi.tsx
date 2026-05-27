"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

export default function Reservasi() {

  // ============================================
  // SUPABASE
  // ============================================

  const supabase = createClient();

  const router = useRouter();

  // ============================================
  // STATE
  // ============================================

  const [loading, setLoading] =
    useState(false);

  const [kamar, setKamar] =
    useState<any[]>([]);

  const [penyewa, setPenyewa] =
    useState<any>(null);

  const [hargaTotal, setHargaTotal] =
    useState(0);

  const [form, setForm] =
    useState({
      penghuni: "1",

      gender: "",

      kamar: "",

      telepon: "",

      tanggal: "",

      namaPenghuni2: "",

      teleponPenghuni2: "",
    });

  // ============================================
  // GET KAMAR
  // ============================================

  const getKamar =
    async () => {

      const {
        data,
        error,
      } = await supabase
        .from("kamar")
        .select("*")
        .eq(
          "status_kamar",
          "Tersedia"
        );

      if (error) {

        console.log(error);

        return;
      }

      setKamar(data || []);

      // AUTO SELECT
      if (
        data &&
        data.length > 0
      ) {

        setForm((prev) => ({
          ...prev,

          kamar:
            String(
              data[0].id_kamar
            ),
        }));
      }
    };

  // ============================================
  // GET PENYEWA
  // ============================================

  const getPenyewa =
    async () => {

      const {
        data: authData,
      } =
        await supabase.auth
          .getUser();

      const user =
        authData.user;

      if (!user) return;

      const {
        data,
        error,
      } = await supabase
        .from("penyewa")
        .select("*")
        .eq(
          "id_penyewa",
          user.id
        )
        .single();

      if (error) {

        console.log(error);

        return;
      }

      setPenyewa(data);

      setForm((prev) => ({
        ...prev,

        telepon:
          data.nomor_telepon_penyewa || "",

        gender:
          data.jenis_kelamin ===
          true
            ? "Pria"
            : "Wanita",
      }));
    };

  // ============================================
  // LOAD
  // ============================================

  useEffect(() => {

  checkExpiredReservasi();

  getKamar();

  getPenyewa();

}, []);

  // ============================================
  // HITUNG HARGA
  // ============================================

  useEffect(() => {

    if (!form.kamar)
      return;

    const selectedKamar =
      kamar.find(
        (item) =>
          String(
            item.id_kamar
          ) === form.kamar
      );

    if (!selectedKamar)
      return;

    let total =
      Number(
        selectedKamar.harga_sewa_kamar
      );

    // 2 ORANG
    if (
      form.penghuni === "2"
    ) {

      total += Number(
        selectedKamar.harga_tambahan_penyewa
      );
    }

    setHargaTotal(total);

  }, [
    form.penghuni,
    form.kamar,
    kamar,
  ]);

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
// CHECK EXPIRED RESERVASI
// ============================================

const checkExpiredReservasi =
  async () => {

    try {

      const now =
        new Date().toISOString();

      // ============================================
      // CARI RESERVASI EXPIRED
      // ============================================

      const {
        data,
        error,
      } = await supabase
        .from("reservasi")
        .select(`
            *,
            penyewa (
              email_penyewa
            )
          `)
        .eq(
          "status_reservasi",
          "Menunggu Pembayaran"
        )
        .lt(
          "expired_at",
          now
        );

      if (error) {

        console.log(error);

        return;
      }

      if (!data) return;

      // ============================================
      // LOOP DATA EXPIRED
      // ============================================

      for (const item of data) {

        // UPDATE STATUS RESERVASI
        await supabase
          .from("reservasi")
          .update({
            status_reservasi:
              "Batal",
          })
          .eq(
            "id_reservasi",
            item.id_reservasi
          );

        // UPDATE STATUS KAMAR
        await supabase
          .from("kamar")
          .update({
            status_kamar:
              "Tersedia",
          })
          .eq(
            "id_kamar",
            item.id_kamar
          );

          // ============================================
// KIRIM EMAIL BATAL
// ============================================

await fetch(
  "/api/send-reservasi-email",
  {
    method: "POST",

    headers: {
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify({
      emailPenyewa:
        item.penyewa
          ?.email_penyewa,

      kamar:
        item.id_kamar,

      tanggalMasuk:
        item.tanggal_masuk,

      totalHarga: 0,

      status:
        "Batal",
    }),
  }
);
      }

    } catch (error) {

      console.log(error);
    }
  };

  // ============================================
  // HANDLE SUBMIT
  // ============================================

  const handleSubmit =
    async (
      e: any
    ) => {

      e.preventDefault();

      try {

        // ============================================
        // VALIDASI
        // ============================================

        if (
          !form.telepon ||
          !form.tanggal ||
          !form.kamar
        ) {

          alert(
            "Lengkapi data!"
          );

          return;
        }

        // ============================================
        // VALIDASI 2 ORANG
        // ============================================

        if (
          form.penghuni ===
            "2" &&
          (
            !form.namaPenghuni2 ||
            !form.teleponPenghuni2
          )
        ) {

          alert(
            "Data penghuni kedua wajib diisi"
          );

          return;
        }

        // ============================================
        // VALIDASI MAX 5 HARI
        // ============================================

        const today =
          new Date();

        const maxDate =
          new Date();

        maxDate.setDate(
          today.getDate() + 5
        );

        const selectedDate =
          new Date(
            form.tanggal
          );

        if (
          selectedDate >
          maxDate
        ) {

          alert(
            "Tanggal masuk maksimal 5 hari dari hari ini"
          );

          return;
        }

        setLoading(true);

        // ============================================
        // GET USER LOGIN
        // ============================================

        const {
          data: authData,
        } =
          await supabase.auth
            .getUser();

        const user =
          authData.user;

        if (!user) {

          alert(
            "User tidak ditemukan"
          );

          return;
        }

        // ============================================
        // CEK RESERVASI AKTIF
        // ============================================

        const {
          data: reservasiAktif,
        } = await supabase
          .from("reservasi")
          .select(`
            *,
            penyewa (
              email_penyewa
            )
          `)
          .eq(
            "id_penyewa",
            user.id
          )
          .in(
            "status_reservasi",
            [
              "Menunggu Pembayaran",
              "Berhasil",
            ]
          );

        if (
          reservasiAktif &&
          reservasiAktif.length > 0
        ) {

          alert(
            "Anda masih memiliki reservasi aktif"
          );

          return;
        }

        // ============================================
        // CEK SEWA AKTIF
        // ============================================

        const {
          data: sewaAktif,
        } = await supabase
          .from("sewa")
          .select("*")
          .eq(
            "id_penyewa",
            user.id
          )
          .in(
            "status_sewa",
            [
              "Aktif",
              "Menunggu Pembayaran",
            ]
          );

        if (
          sewaAktif &&
          sewaAktif.length > 0
        ) {

          alert(
            "Anda masih memiliki sewa aktif"
          );

          return;
        }

        // ============================================
// INSERT RESERVASI
// ============================================

const {
  data: reservasiData,
  error:
    reservasiError,
} = await supabase
  .from("reservasi")
  .insert([
    {
      id_penyewa:
        user.id,

      id_kamar:
        Number(
          form.kamar
        ),

      jumlah_penghuni:
        Number(
          form.penghuni
        ),

      nama_penghuni2:
        form.namaPenghuni2 ||
        null,

      nomor_telepon2:
        form.teleponPenghuni2 ||
        null,

      tanggal_reservasi:
        new Date()
          .toISOString(),

      tanggal_masuk:
        form.tanggal,

      status_reservasi:
        "Menunggu Pembayaran",

      // ============================================
      // AUTO EXPIRED 1x24 JAM
      // ============================================

      expired_at:
        new Date(
          Date.now() +
            24 *
              60 *
              60 *
              1000
        ).toISOString(),
    },
  ])
  .select()
  .single();

        if (
          reservasiError
        ) {

          console.log(
            reservasiError
          );

          alert(
            reservasiError.message
          );

          return;
        }

        // ============================================
        // UPDATE STATUS KAMAR
        // ============================================

        const {
          error: kamarError,
        } = await supabase
          .from("kamar")
          .update({
            status_kamar:
              "Direservasi",
          })
          .eq(
            "id_kamar",
            Number(
              form.kamar
            )
          );

        if (kamarError) {

          console.log(
            kamarError
          );

          alert(
            kamarError.message
          );

          return;
        }

        // ============================================
// KIRIM EMAIL
// ============================================

await fetch(
  "/api/send-reservasi-email",
  {
    method: "POST",

    headers: {
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify({
      emailPenyewa:
        penyewa.email_penyewa,

      kamar:
        form.kamar,

      tanggalMasuk:
        form.tanggal,

      totalHarga:
        hargaTotal,

      status:
        "Menunggu Pembayaran",
    }),
  }
);

        // ============================================
        // SUCCESS
        // ============================================

        alert(
          "Reservasi berhasil dibuat"
        );

        router.push(
          "/user/pembayaran"
        );

      } catch (error: any) {

        console.log(error);

        alert(
          error.message
        );

      } finally {

        setLoading(false);
      }
    };

  return (

    <div className="max-w-3xl mx-auto pb-32 px-4 mt-10">

      {/* BANNER */}

      <div className="w-full h-[220px] border rounded-2xl overflow-hidden mb-6">

        <img
          src="/hero-3.jpg"
          className="w-full h-full object-cover"
        />

      </div>

      {/* FORM */}

      <form
        onSubmit={
          handleSubmit
        }
        className="border rounded-2xl p-6 bg-white shadow-sm space-y-5"
      >

        {/* JUMLAH PENGHUNI */}

        <div>

          <label className="font-medium">
            Jumlah Penghuni
          </label>

          <div className="flex gap-5 mt-3">

            <label className="flex items-center gap-2">

              <input
                type="radio"
                name="penghuni"
                value="1"
                checked={
                  form.penghuni ===
                  "1"
                }
                onChange={
                  handleChange
                }
              />

              Satu Orang

            </label>

            <label className="flex items-center gap-2">

              <input
                type="radio"
                name="penghuni"
                value="2"
                checked={
                  form.penghuni ===
                  "2"
                }
                onChange={
                  handleChange
                }
              />

              Dua Orang

            </label>

          </div>

        </div>

        {/* JENIS KELAMIN */}

        <div>

          <label className="font-medium">
            Jenis Kelamin
          </label>

          <div className="w-full border rounded-lg p-3 mt-2 bg-gray-50">

            {form.gender}

          </div>

        </div>

        {/* PILIH KAMAR */}

        <div>

          <label className="font-medium">
            Pilih Kamar
          </label>

          <select
            name="kamar"
            value={form.kamar}
            onChange={
              handleChange
            }
            className="w-full border rounded-lg p-3 mt-2"
          >

            {kamar.map(
              (item) => (

                <option
                  key={
                    item.id_kamar
                  }
                  value={
                    item.id_kamar
                  }
                >

                  Kamar {
                    item.id_kamar
                  }

                </option>
              )
            )}

          </select>

        </div>

        {/* TELEPON */}

        <div>

          <label className="font-medium">
            Nomor Telepon
          </label>

          <input
            type="text"
            value={
              form.telepon
            }
            readOnly
            className="w-full border rounded-lg p-3 mt-2 bg-gray-50"
          />

        </div>

        {/* PENGHUNI 2 */}

        {form.penghuni ===
          "2" && (
          <>

            <div>

              <label className="font-medium">
                Nama Penghuni Ke-2
              </label>

              <input
                type="text"
                name="namaPenghuni2"
                value={
                  form.namaPenghuni2
                }
                onChange={
                  handleChange
                }
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>

            <div>

              <label className="font-medium">
                Nomor Telepon Penghuni Ke-2
              </label>

              <input
                type="text"
                name="teleponPenghuni2"
                value={
                  form.teleponPenghuni2
                }
                onChange={
                  handleChange
                }
                className="w-full border rounded-lg p-3 mt-2"
              />

            </div>

          </>
        )}

        {/* TANGGAL */}

        <div>

          <label className="font-medium">
            Tanggal Masuk
          </label>

          <input
            type="date"
            name="tanggal"
            value={
              form.tanggal
            }
            onChange={
              handleChange
            }
            className="w-full border rounded-lg p-3 mt-2"
          />

          <p className="text-sm text-gray-500 mt-2">
            Maksimal 5 hari dari hari ini
          </p>

        </div>

        {/* HARGA */}

        <div className="border rounded-xl p-5 bg-blue-50">

          <p className="text-gray-500 text-sm">
            Total Harga
          </p>

          <h2 className="text-3xl font-bold text-[#1c3163] mt-1">

            Rp{" "}

            {hargaTotal.toLocaleString(
              "id-ID"
            )}

          </h2>

        </div>

        {/* BUTTON */}

        <Button
          type="submit"
          disabled={
            loading
          }
          className="w-full bg-[#1c3163]"
        >

          {loading
            ? "Memproses..."
            : "Reservasi"}

        </Button>

      </form>

    </div>
  );
}