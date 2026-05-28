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

export async function POST(
  req: Request
) {

  console.log(
    "WEBHOOK KENA"
  );

  try {

    const body =
      await req.json();

    console.log(body);

    const orderId =
      body.order_id;

    const transactionStatus =
      body.transaction_status;

    // VALIDASI ORDER
    if (
      !orderId.startsWith(
        "TAGIHAN-"
      )
    ) {

      return NextResponse.json({
        success: false,
      });
    }

    // AMBIL ID TAGIHAN
    const tagihanId =
      Number(
        orderId
          .split("-")[1]
      );

    // SUCCESS
    if (
      transactionStatus ===
        "settlement" ||

      transactionStatus ===
        "capture"
    ) {

      // CARI TAGIHAN
      const {
        data: tagihan
      } = await supabase
        .from("tagihan")
        .select("*")
        .eq(
          "id_tagihan",
          tagihanId
        )
        .single();

      if (!tagihan) {

        console.log(
          "TAGIHAN TIDAK ADA"
        );

        return NextResponse.json({
          success: false,
        });
      }

      // INSERT PEMBAYARAN
      await supabase
        .from("pembayaran")
        .insert([
          {
            id_tagihan:
              tagihan.id_tagihan,

            tanggal_pembayaran:
              new Date(),

            status_pembayaran:
              "Berhasil",
          },
        ]);

      // UPDATE TAGIHAN
      await supabase
        .from("tagihan")
        .update({
          status_tagihan:
            "Lunas",
        })
        .eq(
          "id_tagihan",
          tagihan.id_tagihan
        );

      // UPDATE SEWA
      await supabase
        .from("sewa")
        .update({
          status_sewa:
            "Aktif",
        })
        .eq(
          "id_sewa",
          tagihan.id_sewa
        );

      // CARI SEWA
      const {
        data: sewa
      } = await supabase
        .from("sewa")
        .select("*")
        .eq(
          "id_sewa",
          tagihan.id_sewa
        )
        .single();

      // UPDATE RESERVASI
      await supabase
        .from("reservasi")
        .update({
          status_reservasi:
            "Berhasil",
        })
        .eq(
          "id_reservasi",
          sewa.id_reservasi
        );

      // UPDATE KAMAR
      await supabase
        .from("kamar")
        .update({
          status_kamar:
            "Ditempati",
        })
        .eq(
          "id_kamar",
          sewa.id_kamar
        );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(
      "WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}