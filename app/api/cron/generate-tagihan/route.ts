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

    const today =
      new Date();

    for (const item of sewa || []) {

      const tanggalSewa =
        new Date(
          item.tanggal_sewa
        );

      // ============================================
      // TAGIHAN MUNCUL
      // 10 HARI SEBELUM
      // ============================================

      const tanggalTagihan =
        new Date(
          tanggalSewa
        );

      tanggalTagihan.setMonth(
        tanggalTagihan.getMonth() + 1
      );

      tanggalTagihan.setDate(
        tanggalTagihan.getDate() - 10
      );

      // HARI INI
      const isSameDate =

        tanggalTagihan
          .toDateString() ===
        today.toDateString();

      if (!isSameDate)
        continue;

      // ============================================
      // CEK SUDAH ADA TAGIHAN?
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
      // INSERT TAGIHAN BARU
      // ============================================

      await supabase
        .from("tagihan")
        .insert([
          {
            id_sewa:
              item.id_sewa,

            total_tagihan:
              item.kamar
                .harga_sewa_kamar,

            batas_pembayaran:
              new Date(
                tanggalSewa.setMonth(
                  tanggalSewa.getMonth() + 1
                )
              ),

            status_tagihan:
              "Belum Dibayar",
          },
        ]);
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