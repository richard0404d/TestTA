// app/api/send-pembayaran-email/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      emailPenyewa,
      idKamar,
      totalPembayaran,
      status,
      tanggalPembayaran
    } = body;

    // ============================================
    // FUNCTION SEND EMAIL (Brevo)
    // ============================================
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
            email: "rumahkos2an@gmail.com", // PASTIKAN EMAIL INI SUDAH DIVERIFIKASI DI BREVO
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();

      // PERBAIKAN: Tangkap error jika Brevo menolak request
      if (!response.ok) {
        console.error("BREVO REJECTED:", data);
        throw new Error(data.message || "Gagal mengirim email via Brevo");
      }

      return data;
    };

    // ============================================
    // HTML TEMPLATE
    // ============================================
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #1c3163;">Konfirmasi Pembayaran Kos 75</h2>
        <p>Halo, berikut adalah rincian pembayaran Anda:</p>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Nomor Kamar:</strong> Kamar ${idKamar}</li>
          <li><strong>Tanggal Pembayaran:</strong> ${tanggalPembayaran}</li>
          <li style="font-size: 18px; margin-top: 10px;"><strong>Total Pembayaran:</strong> Rp ${Number(totalPembayaran).toLocaleString("id-ID")}</li>
        </ul>
        <p>Terima kasih telah melakukan pembayaran.</p>
        <br>
        <p>Salam,<br>Admin Kos 75</p>
      </div>
    `;

    // ============================================
    // KIRIM KE PENYEWA
    // ============================================
    if (emailPenyewa) {
      await sendEmail(
        emailPenyewa,
        `Konfirmasi Pembayaran Kos 75 - ${status}`,
        htmlTemplate
      );
    }

    // ============================================
    // KIRIM KE ADMIN
    // ============================================
    await sendEmail(
      "rumahkos2an@gmail.com",
      `Notifikasi Pembayaran Baru - Kamar ${idKamar}`,
      `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Notifikasi Pembayaran Baru</h2>
        <p>Telah diterima pembayaran dari:</p>
        <p><strong>Email Penyewa:</strong> ${emailPenyewa}</p>
        <p><strong>Nomor Kamar:</strong> Kamar ${idKamar}</p>
        <p><strong>Jumlah:</strong> Rp ${Number(totalPembayaran).toLocaleString("id-ID")}</p>
        <p><strong>Status:</strong> ${status}</p>
      </div>
      `
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // PERBAIKAN: Tampilkan pesan error spesifik di terminal
    console.error("EMAIL ERROR:", error.message || error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}