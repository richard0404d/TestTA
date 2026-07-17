import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  console.log("WEBHOOK KENA");

  try {
    const body = await req.json();
    console.log(body);

    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;

    if (!orderId.startsWith("TAGIHAN-")) {
      return NextResponse.json({ success: false });
    }

    const tagihanId = Number(orderId.split("-")[1]);

    if (transactionStatus === "settlement" || transactionStatus === "capture") {

      const { data: tagihan } = await supabase
        .from("tagihan")
        .select("*")
        .eq("id_tagihan", tagihanId)
        .single();

      if (!tagihan) {
        console.log("TAGIHAN TIDAK ADA");
        return NextResponse.json({ success: false });
      }

      const { data: sewa } = await supabase
        .from("sewa")
        .select("*")
        .eq("id_sewa", tagihan.id_sewa)
        .single();

      if (!sewa) {
        console.log("DATA SEWA TIDAK ADA");
        return NextResponse.json({ success: false });
      }

      const { data: penyewa } = await supabase
        .from("penyewa")
        .select("email_penyewa")
        .eq("id_penyewa", sewa.id_penyewa)
        .single();

      let tanggalBerakhir = sewa.tanggal_berakhir_sewa;

      if (sewa.status_sewa === "Aktif") {
        const tanggal = new Date(sewa.tanggal_berakhir_sewa);
        tanggal.setMonth(tanggal.getMonth() + 1);
        tanggalBerakhir = tanggal;
      }

      const { data: pembayaranExist } = await supabase
        .from("pembayaran")
        .select("*")
        .eq("id_tagihan", tagihan.id_tagihan)
        .maybeSingle();

      if (!pembayaranExist) {

        await supabase.from("pembayaran").insert([
          {
            id_tagihan: tagihan.id_tagihan,
            tanggal_pembayaran: new Date(),
            status_pembayaran: "Berhasil",
          },
        ]);

        await supabase
          .from("tagihan")
          .update({ status_tagihan: "Lunas" })
          .eq("id_tagihan", tagihan.id_tagihan);

        await supabase
          .from("sewa")
          .update({
            status_sewa: "Aktif",
            tanggal_berakhir_sewa: tanggalBerakhir,
          })
          .eq("id_sewa", tagihan.id_sewa);

        if (sewa.status_sewa === "Menunggu Pembayaran") {
          await supabase
            .from("reservasi")
            .update({ status_reservasi: "Berhasil" })
            .eq("id_reservasi", sewa.id_reservasi);
        }

        await supabase
          .from("kamar")
          .update({ status_kamar: "Ditempati" })
          .eq("id_kamar", sewa.id_kamar);

        if (penyewa && penyewa.email_penyewa) {
          try {
            const sendEmail = async (to: string, subject: string, html: string) => {
              const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                  "accept": "application/json",
                  "content-type": "application/json",
                  "api-key": process.env.BREVO_API_KEY!,
                },
                body: JSON.stringify({
                  sender: {
                    name: "Kos 75",
                    email: "rumahkos2an@gmail.com",
                  },
                  to: [{ email: to }],
                  subject: subject,
                  htmlContent: html,
                }),
              });

              if (!response.ok) {
                const errData = await response.json();
                console.error("Brevo Error Detail:", errData);
              }
            };

            const htmlPenyewa = `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1c3163;">Konfirmasi Pembayaran Kos 75</h2>
                <p>Halo, berikut adalah rincian pembayaran kos Anda yang telah kami terima:</p>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Status:</strong> Pembayaran Berhasil</li>
                  <li><strong>Nomor Kamar:</strong> Kamar ${sewa.id_kamar}</li>
                  <li><strong>Tanggal Pembayaran:</strong> ${new Date().toLocaleDateString("id-ID")}</li>
                  <li style="font-size: 18px; margin-top: 10px;"><strong>Total Pembayaran:</strong> Rp ${Number(tagihan.total_tagihan).toLocaleString("id-ID")}</li>
                </ul>
                <p>Terima kasih telah melakukan pembayaran.</p>
                <br>
                <p>Salam,<br>Admin Kos 75</p>
              </div>
            `;

            const htmlAdmin = `
              <div style="font-family: Arial; padding: 20px;">
                <h2>Notifikasi Pembayaran Baru (M-Web)</h2>
                <p>Telah diterima pembayaran via Midtrans dari:</p>
                <p><strong>Email Penyewa:</strong> ${penyewa.email_penyewa}</p>
                <p><strong>Nomor Kamar:</strong> Kamar ${sewa.id_kamar}</p>
                <p><strong>Jumlah:</strong> Rp ${Number(tagihan.total_tagihan).toLocaleString("id-ID")}</p>
                <p><strong>Status:</strong> Pembayaran Berhasil</p>
              </div>
            `;

            Promise.all([
              sendEmail(penyewa.email_penyewa, "Konfirmasi Pembayaran Kos 75 - Berhasil", htmlPenyewa),
              sendEmail("rumahkos2an@gmail.com", `Notifikasi Pembayaran Baru - Kamar ${sewa.id_kamar}`, htmlAdmin)
            ]).catch(err => console.error("Error saat Promise.all email:", err));

            console.log("PROSES KIRIM EMAIL DIMULAI DI BACKGROUND");
          } catch (emailErr) {
            console.error("Gagal mengirim email di Webhook:", emailErr);
          }
        }
      }

    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}