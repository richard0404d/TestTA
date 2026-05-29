"use client";

import {
  useState,
  useEffect,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  Button,
} from "@/components/ui/button";

declare global {
  interface Window {
    snap: any;
  }
}

export default function PembayaranPage() {

  // ============================================
  // SUPABASE
  // ============================================

  const supabase =
    createClient();

  // ============================================
  // STATE
  // ============================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    tagihan,
    setTagihan,
  ] = useState<any>(null);

  const [
    histories,
    setHistories,
  ] = useState<any[]>([]);

  const [
    penyewa,
    setPenyewa,
  ] = useState<any>(null);

  // ============================================
  // LOAD MIDTRANS SCRIPT
  // ============================================
  useEffect(() => {

  if (
    document.getElementById(
      "midtrans-script"
    )
  ) return;

  const script =
    document.createElement(
      "script"
    );

  script.id =
    "midtrans-script";

  script.src =
    "https://app.sandbox.midtrans.com/snap/snap.js";
    // "https://app.midtrans.com/snap/snap.js";

  script.setAttribute(
    "data-client-key",
    process.env
      .NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!
  );

  script.async = true;

  document.body.appendChild(
    script
  );

}, []);

  // ============================================
  // GET DATA
  // ============================================

  useEffect(() => {

    getData();

  }, []);

  const getData =
    async () => {

      try {

        // ============================================
        // GET USER
        // ============================================

        const {
          data: authData,
        } =
          await supabase.auth
            .getUser();

        const user =
          authData.user;

        if (!user) {

          return;
        }

        // GET SEWA USER
        const {
          data: sewaUser
        } = await supabase
          .from("sewa")
          .select(`
            id_sewa,
            tanggal_berakhir_sewa,
            status_sewa
          `)
          .eq(
            "id_penyewa",
            user.id
          )
          .neq(
            "status_sewa",
            "Berakhir"
          );

        // ============================================
        // GET PENYEWA
        // ============================================

        const {
          data: penyewaData,
        } = await supabase
          .from("penyewa")
          .select("*")
          .eq(
            "id_penyewa",
            user.id
          )
          .single();

        setPenyewa(
          penyewaData
        );

        // GET TAGIHAN BELUM DIBAYAR

        const {
          data: tagihanData,
          error: tagihanError,
        } = await supabase
          .from("tagihan")
          .select(`
            *,
            sewa (
              *,
              kamar (*)
            )
          `)
          .in(
            "id_sewa",
            sewaUser?.map(
              (item) =>
                item.id_sewa
            ) || []
          )
          .eq(
            "status_tagihan",
            "Belum Dibayar"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .single();

        if (
          !tagihanError
        ) {

          setTagihan(
            tagihanData
          );
        }

        // GET HISTORI PEMBAYARAN

        const {
          data: pembayaranData,
        } = await supabase
          .from("pembayaran")
          .select(`
            *,
            tagihan (
              *,
              sewa (*)
            )
          `)
          .order(
            "tanggal_pembayaran",
            {
              ascending: false,
            }
          );

        const filteredHistory =
          (pembayaranData || [])
          .filter(
            (item) =>
              sewaUser?.some(
                (s) =>
                  s.id_sewa ===
                  item.tagihan
                    ?.id_sewa
              )
          );

        setHistories(
          filteredHistory
        );

      } catch (error) {

        console.log(
          error
        );

      } finally {

        setLoading(false);
      }
    };

  // ============================================
  // HANDLE BAYAR
  // ============================================

  const handleBayar =
    async () => {

      if (processing)
        return;

      try {

        setProcessing(
          true
        );

        if (
          !tagihan ||
          !penyewa
        ) {

          alert(
            "Tagihan tidak ditemukan"
          );

          return;
        }

        // ============================================
        // REQUEST TOKEN MIDTRANS
        // ============================================

        const response =
  await fetch(
    "/api/midtrans/token",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({

  order_id:
    `TAGIHAN-${
      tagihan.id_tagihan
    }-${
      Date.now()
    }`,

  gross_amount:
    Number(
      tagihan.total_tagihan
    ),

  first_name:
    penyewa.nama_penyewa,

  email:
    penyewa.email_penyewa,
}),
    }
  );

const data =
  await response.json();

console.log(data);

if (!data.token) {

  alert(
    data.error ||
    "Token Midtrans gagal dibuat"
  );

  return;
}

window.snap.pay(
  data.token,
  {

    onSuccess:
      function (
        result: any
      ) {

        console.log(
          "SUCCESS",
          result
        );

        alert(
          "Pembayaran berhasil"
        );

        window.location.reload();
      },

    onPending:
    function (
      result: any
    ) {

      console.log(
        "PENDING",
        result
      );

      alert(
        "Menunggu pembayaran"
      );

      window.location.reload();
    },

    onError:
      function (
        result: any
      ) {

        console.log(
          "ERROR",
          result
        );

        alert(
          "Pembayaran gagal"
        );
      },

    onClose:
      function () {

        console.log(
          "Popup ditutup"
        );
      },
  }
);

      } catch (error: any) {

        console.log(
          "MIDTRANS ERROR:",
          error
        );

        alert(
          error.message ||
          "Terjadi kesalahan"
        );

      } finally {

        setProcessing(
          false
        );
      }
    };

  // ============================================
  // FORMAT RUPIAH
  // ============================================

  const formatRupiah =
    (
      number: number
    ) => {

      return new Intl.NumberFormat(
        "id-ID",
        {

          style:
            "currency",

          currency:
            "IDR",

          minimumFractionDigits:
            0,
        }
      ).format(number);
    };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <p>
          Loading...
        </p>

      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (

    <div className="min-h-screen bg-gray-100 py-10 px-4 mb-20">

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ============================================ */}
        {/* LEFT */}
        {/* ============================================ */}

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <h1 className="text-3xl font-bold mb-2">

            Pembayaran

          </h1>

          <p className="text-sm text-gray-500 mb-6">

            Lakukan pembayaran tagihan kos

          </p>

          {/* ============================================ */}
          {/* TAGIHAN */}
          {/* ============================================ */}

          <div className="border rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-6">

              Detail Tagihan

            </h2>

            {tagihan ? (

              <div className="space-y-4">

                {/* TOTAL */}

                <div className="flex items-center justify-between border-b pb-4">

                  <span className="text-gray-500">

                    Total Pembayaran

                  </span>

                  <span className="font-bold text-xl">

                    {formatRupiah(
                      tagihan.total_tagihan
                    )}

                  </span>

                </div>

                {/* KAMAR */}

                <div className="flex justify-between">

                  <span className="text-gray-500">

                    Nomor Kamar

                  </span>

                  <span className="font-medium">
                    {
                      tagihan
                        .sewa
                        ?.kamar
                        ?.id_kamar
                    }

                  </span>

                </div>

                {/* STATUS */}

                <div className="flex justify-between">

                  <span className="text-gray-500">

                    Status

                  </span>

                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">

                    {
                      tagihan
                        .status_tagihan
                    }

                  </span>

                </div>

                {/* BATAS */}

                <div className="flex justify-between">

                  <span className="text-gray-500">

                    Batas Pembayaran

                  </span>

                  <span className="font-medium">

                    {new Date(
                      tagihan.batas_pembayaran
                    ).toLocaleDateString(
                      "id-ID"
                    )}

                  </span>

                </div>

                {/* BUTTON */}

                <div className="pt-6">

                  <Button
                    onClick={
                      handleBayar
                    }
                    disabled={
                      processing
                    }
                    className="w-full h-12 text-base bg-[#2C5EBF] hover:bg-[#244ea0]"
                  >

                    {processing
                      ? "Memproses..."
                      : "Bayar Sekarang"}

                  </Button>

                </div>

              </div>

            ) : (

              <div className="text-center py-10 text-gray-400">

                Tidak ada tagihan aktif

              </div>
            )}

          </div>

        </div>

        {/* ============================================ */}
        {/* RIGHT */}
        {/* ============================================ */}

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <h1 className="text-3xl font-bold mb-6">

            Histori Pembayaran

          </h1>

          <div className="space-y-4">

            {histories.length >
            0 ? (

              histories.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={item.id_pembayaran}
                    className="border rounded-2xl p-5 flex items-center justify-between"
                  >

                    <div>

                      <p className="text-sm text-gray-500">

                        {new Date(
                          item.tanggal_pembayaran
                        ).toLocaleDateString(
                          "id-ID"
                        )}

                      </p>

                      <p className="font-semibold mt-1">

                        {formatRupiah(
                          item
                            .tagihan
                            ?.total_tagihan ||
                            0
                        )}

                      </p>

                    </div>

                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">

                      {
                        item.status_pembayaran
                      }

                    </div>

                  </div>
                )
              )

            ) : (

              <div className="text-center py-10 text-gray-400">

                Belum ada histori pembayaran

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}