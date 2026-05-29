import { NextResponse }
from "next/server";

import {
  createClient
} from "@supabase/supabase-js";

const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,

    process.env
      .SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET() {

  try {

    const today =
      new Date();

    // ============================================
    // GET SEWA AKTIF
    // ============================================

    const {
      data: sewa,
      error,
    } = await supabase
      .from("sewa")
      .select(`
        *,
        kamar (*)
      `)
      .eq(
        "status_sewa",
        "Aktif"
      );

    if (error) {

      console.log(error);

      return NextResponse.json({
        success: false,
      });
    }

    // ============================================
    // LOOP SEWA
    // ============================================

    for (
      const item of sewa || []
    ) {

      if (
        !item.tanggal_berakhir_sewa
      ) {

        continue;
      }

      // ============================================
      // 10 HARI SEBELUM BERAKHIR
      // ============================================

      const tanggalTagihan =
        new Date(
          item.tanggal_berakhir_sewa
        );

      tanggalTagihan.setDate(
        tanggalTagihan.getDate() - 10
      );

      const isSameDate =

        tanggalTagihan
          .toDateString() ===
        today.toDateString();

      if (!isSameDate)
        continue;

      // ============================================
      // CEK TAGIHAN AKTIF
      // ============================================

      const {
        data: existing,
      } = await supabase
        .from("tagihan")
        .select("*")
        .eq(
          "id_sewa",
          item.id_sewa
        )
        .eq(
          "status_tagihan",
          "Belum Dibayar"
        );

      if (
        existing &&
        existing.length > 0
      ) {

        continue;
      }

      // ============================================
      // BATAS PEMBAYARAN
      // ============================================

      const batasPembayaran =
        new Date(
          item.tanggal_berakhir_sewa
        );

      batasPembayaran.setDate(
        batasPembayaran.getDate() + 10
      );

      // ============================================
      // INSERT TAGIHAN
      // ============================================

      const {
        error: insertError
      } = await supabase
        .from("tagihan")
        .insert([
          {
            id_sewa:
              item.id_sewa,

            total_tagihan:
              item.kamar
                ?.harga_sewa_kamar,

            batas_pembayaran:
              batasPembayaran,

            status_tagihan:
              "Belum Dibayar",
          },
        ]);

      if (insertError) {

        console.log(
          insertError
        );
      }
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.log(error);

    return NextResponse.json({
      success: false,
    });
  }
}