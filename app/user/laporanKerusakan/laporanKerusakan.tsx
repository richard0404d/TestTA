"use client";

import {
  useEffect,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import { createClient }
from "@/lib/supabase/client";

export default function LaporanKerusakan() {

  const supabase =
    createClient();

  const [loading, setLoading] =
    useState(false);

  const [userId, setUserId] =
    useState("");

  const [idSewa, setIdSewa] =
    useState<number | null>(null);

  const [idKamar, setIdKamar] =
    useState<number | null>(null);

  const [kamar, setKamar] =
    useState<any>(null);

  const [fasilitas, setFasilitas] =
    useState<any[]>([]);

  const [laporanList, setLaporanList] =
    useState<any[]>([]);

  const [form, setForm] =
    useState({
      id_fasilitas: "",
      id_detail_fasiliitas_kamar: "",
      laporan: "",
      file: null as File | null,
    });

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    getData();
  }, []);

  // ============================================
  // GET DATA
  // ============================================

  async function getData() {

    // USER LOGIN
    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    // ============================================
    // CEK SEWA AKTIF
    // ============================================

    const {
      data: sewa,
    } = await supabase
      .from("sewa")
      .select("*")
      .eq(
        "id_penyewa",
        user.id
      )
      .eq(
        "status_sewa",
        "Aktif"
      )
      .single();

    if (!sewa) {
      alert(
        "Anda belum memiliki sewa aktif"
      );
      return;
    }

    setIdSewa(sewa.id_sewa);
    setIdKamar(sewa.id_kamar);

    // ============================================
    // GET KAMAR
    // ============================================

    const {
      data: kamarData,
    } = await supabase
      .from("kamar")
      .select("*")
      .eq(
        "id_kamar",
        sewa.id_kamar
      )
      .single();

    setKamar(kamarData);

    // ============================================
    // GET FASILITAS
    // ============================================

    const {
      data: fasilitasData,
    } = await supabase
      .from(
        "detail_fasilitas_kamar"
      )
      .select(`
        *,
        fasilitas (
          nama_fasilitas
        )
      `)
      .eq(
        "id_kamar",
        sewa.id_kamar
      );

    setFasilitas(
      fasilitasData || []
    );

    console.log(
  "FASILITAS DATA:",
  fasilitasData
);

    // ============================================
    // GET HISTORY LAPORAN
    // ============================================

    const {
      data: laporan,
    } = await supabase
      .from(
        "laporan_kerusakan"
      )
      .select(`
        *,
        fasilitas (
          nama_fasilitas
        )
      `)
      .eq(
        "id_sewa",
        sewa.id_sewa
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    setLaporanList(
      laporan || []
    );
  }

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
  // HANDLE FASILITAS
  // ============================================

  const handleFasilitas = (
  e: any
) => {

  console.log(
    "VALUE SELECT:",
    e.target.value
  );

  const detail =
    fasilitas.find(
      (item) =>
        Number(
          item.id_detail_fasiliitas_kamar
        ) ===
        Number(
          e.target.value
        )
    );

  console.log(
    "DETAIL:",
    detail
  );

  setForm({
    ...form,

    id_fasilitas:
      detail?.id_fasilitas || "",

    id_detail_fasiliitas_kamar:
      detail?.id_detail_fasiliitas_kamar || "",
  });
};

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit =
    async (e: any) => {

      e.preventDefault();

      if (
        !form.laporan
      ) {

        alert(
          "Laporan wajib diisi"
        );

        return;
      }

      setLoading(true);

      let imageUrl = null;

      // ============================================
      // UPLOAD GAMBAR
      // ============================================

      if (form.file) {

        const fileName =
          `${Date.now()}-${form.file.name}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "laporan-kerusakan"
            )
            .upload(
              fileName,
              form.file
            );

        if (
          uploadError
        ) {

          console.log(
            uploadError
          );

          alert(
            "Upload gambar gagal"
          );

          setLoading(
            false
          );

          return;
        }

        const {
          data,
        } =
          supabase.storage
            .from(
              "laporan-kerusakan"
            )
            .getPublicUrl(
              fileName
            );

        imageUrl =
          data.publicUrl;
      }

      console.log({
  id_fasilitas:
    form.id_fasilitas,

  id_detail_fasiliitas_kamar:
    form.id_detail_fasiliitas_kamar,
});

console.log(
  "FORM:",
  form
);

// CEK STATUS FASILITAS
const fasilitasDipilih =
  fasilitas.find(
    (item) =>
      Number(
        item.id_detail_fasiliitas_kamar
      ) ===
      Number(
        form.id_detail_fasiliitas_kamar
      )
  );

if (
  fasilitasDipilih
    ?.kondisi_fasilitas !==
  "Baik"
) {

  alert(
    "Fasilitas ini sedang memiliki laporan aktif"
  );

  setLoading(false);

  return;
}

      // ============================================
      // INSERT DATABASE
      // ============================================

      const { error } =
  await supabase
    .from(
      "laporan_kerusakan"
    )
    .insert({
      id_sewa: idSewa,

      id_kamar: idKamar,

      id_fasilitas:
        Number(
          form.id_fasilitas
        ),

      id_detail_fasiliitas_kamar:
        Number(
          form.id_detail_fasiliitas_kamar
        ),

      keterangan_kerusakan:
        form.laporan,

      gambar_kerusakan:
        imageUrl,

      status_perbaikan:
        "Menunggu Perbaikan",
    });

console.log(
  "ERROR INSERT:",
  error
);

      if (error) {

        console.log(
          error
        );

        alert(
          "Gagal membuat laporan"
        );

        setLoading(
          false
        );

        return;
      }

      // UPDATE STATUS FASILITAS
      await supabase
        .from("detail_fasilitas_kamar")
        .update({
          kondisi_fasilitas: "Rusak",
        })
        .eq(
          "id_detail_fasiliitas_kamar",
          Number(
            form.id_detail_fasiliitas_kamar
          )
        );

      alert(
        "Laporan berhasil dibuat"
      );

      setForm({
        id_fasilitas: "",
        id_detail_fasiliitas_kamar:
          "",
        laporan: "",
        file: null,
      });

      getData();

      setLoading(false);
    };

  return (
    <div className="max-w-5xl mx-auto p-5 space-y-8">

      {/* ============================================ */}
      {/* HISTORY */}
      {/* ============================================ */}

      <div className="border rounded-2xl p-5">

        <h2 className="text-2xl font-bold mb-5">
          Laporan Saya
        </h2>

        <div className="space-y-4">

          {laporanList.length === 0 && (
            <p>
              Belum ada laporan
            </p>
          )}

          {laporanList.map(
            (item) => (

              <div
                key={
                  item.id_kerusakan
                }
                className="border rounded-xl p-4"
              >

                <div className="flex justify-between">

                  <div>
                    <p className="font-semibold">
                      {
                        item
                          .fasilitas
                          ?.nama_fasilitas
                      }
                    </p>

                    <p className="text-sm text-gray-500">
                      {
                        item.keterangan_kerusakan
                      }
                    </p>
                  </div>

                  <div>
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                      {
                        item.status_perbaikan
                      }
                    </span>
                  </div>
                </div>

              </div>
            )
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* FORM */}
      {/* ============================================ */}

      <form
        onSubmit={
          handleSubmit
        }
        className="border rounded-2xl p-6 space-y-5"
      >

        <h2 className="text-2xl font-bold">
          Buat Laporan
        </h2>

        {/* KAMAR */}
        <div>

          <label>
            Kamar
          </label>

          <input
            type="text"
            readOnly
            value={
              kamar
                ?.id_kamar ||
              ""
            }
            className="w-full border rounded-lg p-3 mt-2 bg-gray-100"
          />
        </div>

        {/* FASILITAS */}
        <div>

          <label>
            Fasilitas
          </label>

          <select
  name="id_fasilitas"
  value={form.id_detail_fasiliitas_kamar}
  onChange={handleFasilitas}
  className="w-full border rounded-lg p-3 mt-2"
>

  <option value="">
    Pilih Fasilitas
  </option>

  {fasilitas.map((item, index) => (

  <option
    key={`${item.id_detail_fasiliitas_kamar}-${index}`}
    value={item.id_detail_fasiliitas_kamar}
  >

    {item.fasilitas?.nama_fasilitas}

  </option>

))}

</select>
        </div>

        {/* KETERANGAN */}
        <div>

          <label>
            Keterangan Laporan
          </label>

          <textarea
            name="laporan"
            placeholder="Contoh: Kipas tidak berfungsi"
            value={
              form.laporan
            }
            onChange={
              handleChange
            }
            className="w-full border rounded-lg p-3 mt-2 h-32"
          />
        </div>

        {/* GAMBAR */}
        <div>

          <label>
            Upload Gambar
            (Optional)
          </label>

          <input
            type="file"
            onChange={(e) =>
              setForm({
                ...form,
                file:
                  e.target
                    .files?.[0] ||
                  null,
              })
            }
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

        {/* BUTTON */}
        <Button
          type="submit"
          disabled={loading}
        >

          {loading
            ? "Mengirim..."
            : "Kirim Laporan"}

        </Button>
      </form>
    </div>
  );
}