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
    // GET SEMUA SEWA AKTIF
    // ============================================

    const {
      data: sewaAktif,
      error,
    } = await supabase
      .from("sewa")
      .select("*")
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
      const sewa of sewaAktif || []
    ) {

      if (
        !sewa.tanggal_berakhir_sewa
      ) {

        continue;
      }

      const batasAkhir =
        new Date(
          sewa.tanggal_berakhir_sewa
        );

      // ============================================
      // TOLERANSI 10 HARI
      // ============================================

      batasAkhir.setDate(
        batasAkhir.getDate() + 10
      );

      // ============================================
      // BELUM LEWAT TOLERANSI
      // ============================================

      if (
        today < batasAkhir
      ) {

        continue;
      }

      console.log(
        "SEWA BERAKHIR:",
        sewa.id_sewa
      );

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
          sewa.id_sewa
        );

      // ============================================
      // UPDATE RESERVASI
      // ============================================

      await supabase
        .from("reservasi")
        .update({
          status_reservasi:
            "Selesai",
        })
        .eq(
          "id_reservasi",
          sewa.id_reservasi
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
          sewa.id_kamar
        );

      // ============================================
      // UPDATE TAGIHAN BELUM DIBAYAR
      // ============================================

      await supabase
        .from("tagihan")
        .update({
          status_tagihan:
            "Kadaluarsa",
        })
        .eq(
          "id_sewa",
          sewa.id_sewa
        )
        .eq(
          "status_tagihan",
          "Belum Dibayar"
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