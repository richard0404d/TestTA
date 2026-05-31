"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  Button,
} from "@/components/ui/button";

export default function TagihanPage() {

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
    tagihan,
    setTagihan,
  ] = useState<any[]>([]);

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

        // ============================================
        // GET SEWA USER
        // ============================================

        const {
  data: sewaUser,
  error: sewaError,
} = await supabase
  .from("sewa")
  .select("*")
  .eq(
    "id_penyewa",
    user.id
  );

console.log(
  "SEWA USER:",
  sewaUser
);

console.log(
  "SEWA ERROR:",
  sewaError
);

        // ============================================
        // GET TAGIHAN
        // ============================================

        console.log(
          "USER LOGIN:",
          user.id
        );

        console.log(
          "SEWA USER:",
          sewaUser
        );

        const {
          data: tagihanData,
          error: tagihanError,
        } = await supabase
          .from("tagihan")
          .select(`
            *,
            sewa!inner (
              *,
              tanggal_berakhir_sewa,
              kamar (
                id_kamar
              )
            )
          `)
          .eq(
            "status_tagihan",
            "Belum Dibayar"
          )
          .eq(
            "sewa.id_penyewa",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        setTagihan(
          tagihanData || []
        );

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);
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
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
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

  return (

    <div className="min-h-screen bg-gray-100 p-4 md:p-6">

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">

        <div className="p-5 md:p-10 min-h-[500px]">

          {/* TITLE */}
          <h1 className="text-4xl md:text-6xl font-bold mb-10 md:mb-16">

            Tagihan

          </h1>

          {/* HEADER */}
          <div className="hidden md:grid grid-cols-4 gap-4 text-lg font-semibold text-gray-700 border-b pb-6 mb-4">

            <div>
              Tagihan
            </div>

            <div>
              Tunggakan
            </div>

            <div>
              Batas Pembayaran
            </div>

            <div></div>

          </div>

          {/* DATA */}
          <div className="space-y-5">

            {tagihan.length >
            0 ? (

              tagihan.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={item.id_tagihan}
                    className="
                      border rounded-2xl p-5 bg-gray-50
                      flex flex-col gap-5
                      md:grid md:grid-cols-4 md:items-center
                    "
                  >

                    {/* TAGIHAN */}
                    <div>

                      <p className="text-sm text-gray-500 mb-1 md:hidden">

                        Tagihan

                      </p>

                      <p className="font-medium text-base md:text-lg">

                        Tagihan {

                          new Date(
                            item.created_at
                          ).toLocaleDateString(
                            "id-ID",
                            {
                              month: "long",
                              year: "numeric",
                            }
                          )

                        }

                        {" - "}Kamar {

                          item.sewa?.kamar?.id_kamar

                        }

                      </p>

                    </div>

                    {/* TUNGGAKAN */}
                    <div>

                      <p className="text-sm text-gray-500 mb-1 md:hidden">

                        Tunggakan

                      </p>

                      <p className="font-semibold text-lg">

                        {formatRupiah(
                          item.total_tagihan
                        )}

                      </p>

                    </div>

                    {/* INFORMASI */}

                    <div>

                      <p className="text-sm text-gray-500 mb-1 md:hidden">
                        Informasi Tagihan
                      </p>

                      <div className="space-y-1 font-medium text-base md:text-lg">

                        <p>

                          {" "}

                          {new Date(
                            item.batas_pembayaran
                          ).toLocaleDateString(
                            "id-ID"
                          )}

                        </p>


                      </div>

                    </div>

                    {/* BUTTON */}
                    <div className="md:flex md:justify-end">

                      <Link
                        href="/user/pembayaran"
                      >

                        <Button className="w-full md:w-auto px-8 py-6 rounded-xl text-base bg-[#2C5EBF] hover:bg-[#244ea0]">

                          Bayar

                        </Button>

                      </Link>

                    </div>

                  </div>
                )
              )

            ) : (

              <div className="text-center py-20 text-gray-400">

                Tidak ada tagihan aktif

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}