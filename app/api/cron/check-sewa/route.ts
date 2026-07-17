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

      batasAkhir.setDate(
        batasAkhir.getDate() + 10
      );

      if (
        today < batasAkhir
      ) {

        continue;
      }

      console.log(
        "SEWA BERAKHIR:",
        sewa.id_sewa
      );

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