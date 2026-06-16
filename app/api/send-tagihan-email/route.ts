import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // ============================================
    // BODY
    // ============================================
    const body = await req.json();

    // Sesuaikan payload ini saat kamu melakukan fetch dari frontend/webhook
    const {
      emailPenyewa,
      kamar,
      periode, // Contoh: "Bulan Agustus 2026"
      totalTagihan,
      status,
    } = body;

    // ============================================
    // FUNCTION SEND EMAIL (Brevo)
    // ============================================
    const sendEmail = async (to: string, subject: string, html: string) => {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY!,
        },
        body: JSON.stringify({
          sender: {
            name: "Kos 75",
            email: "rumahkos2an@gmail.com",
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      console.log("EMAIL RESPONSE:", data);

      // Proteksi untuk menangkap error dari Brevo
      if (!response.ok) {
        console.error("BREVO REJECTED:", data);
      }
    };

    // ============================================
    // EMAIL PENYEWA
    // ============================================
    if (emailPenyewa) {
      await sendEmail(
        emailPenyewa,
        `Informasi Tagihan Kos 75 - ${status}`,
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1c3163;">Informasi Tagihan Kos 75</h2>
          <p>Halo, berikut adalah rincian tagihan kos Anda:</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Status Tagihan:</strong> <span style="color: #d97706;">${status}</span></li>
            <li><strong>Nomor Kamar:</strong> Kamar ${kamar}</li>
            <li><strong>Periode Tagihan:</strong> ${periode}</li>
            <li style="font-size: 18px; margin-top: 15px;">
              <strong>Total Tagihan:</strong> Rp ${Number(totalTagihan).toLocaleString("id-ID")}
            </li>
          </ul>
          <p>Harap segera melakukan pembayaran sebelum batas waktu yang ditentukan.</p>
          <br>
          <p>Salam,<br>Admin Kos 75</p>
        </div>
        `
      );
    }

    // ============================================
    // EMAIL ADMIN
    // ============================================
    await sendEmail(
      "rumahkos2an@gmail.com",
      `Notifikasi Tagihan Dibuat - Kamar ${kamar}`,
      `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Notifikasi Pembuatan Tagihan</h2>
        <p>Tagihan baru telah diterbitkan untuk sistem Kos 75:</p>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Email Penyewa:</strong> ${emailPenyewa}</li>
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Kamar:</strong> ${kamar}</li>
          <li><strong>Periode:</strong> ${periode}</li>
          <li><strong>Total:</strong> Rp ${Number(totalTagihan).toLocaleString("id-ID")}</li>
        </ul>
      </div>
      `
    );

    // ============================================
    // SUCCESS
    // ============================================
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("EMAIL ERROR:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}