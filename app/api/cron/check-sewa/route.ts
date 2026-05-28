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
    // GET TAGIHAN BELUM DIBAYAR
    // ============================================

    const {
      data: tagihan,
      error,
    } = await supabase
      .from("tagihan")
      .select(`
        *,
        sewa (*)
      `)
      .eq(
        "status_tagihan",
        "Belum Dibayar"
      );

    if (error) {

      console.log(error);

      return NextResponse.json({
        success: false,
      });
    }

    for (const item of tagihan || []) {

      const batasBayar =
        new Date(
          item.batas_pembayaran
        );

      // ============================================
      // SUDAH LEWAT 10 HARI?
      // ============================================

      const diff =
        today.getTime() -
        batasBayar.getTime();

      const diffDays =
        diff /
        (1000 * 60 * 60 * 24);

      if (diffDays < 10)
        continue;

      // ============================================
      // UPDATE SEWA
      // ============================================

      await supabase
        .from("sewa")
        .update({
          status_sewa:
            "Berakhir",
        })
        .eq(
          "id_sewa",
          item.id_sewa
        );

      // ============================================
      // UPDATE KAMAR
      // ============================================

      await supabase
        .from("kamar")
        .update({
          status_kamar:
            "Tersedia",
        })
        .eq(
          "id_kamar",
          item.sewa.id_kamar
        );
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