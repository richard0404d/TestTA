import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const today = new Date();

    // ============================================
    // 1. GET SEWA AKTIF + KAMAR + EMAIL PENGGUNA
    // ============================================
    // PERHATIAN: Sesuaikan "pengguna (email)" dengan nama tabel dan kolom di database kamu
    const { data: sewa, error } = await supabase
      .from("sewa")
      .select(`
        *,
        kamar (*),
        pengguna (email) 
      `)
      .eq("status_sewa", "Aktif");

    if (error) {
      console.log(error);
      return NextResponse.json({ success: false });
    }

    // ============================================
    // LOOP SEWA
    // ============================================
    for (const item of sewa || []) {
      if (!item.tanggal_berakhir_sewa) continue;

      // ============================================
      // 10 HARI SEBELUM BERAKHIR
      // ============================================
      const tanggalTagihan = new Date(item.tanggal_berakhir_sewa);
      tanggalTagihan.setDate(tanggalTagihan.getDate() - 10);

      const isSameDate = tanggalTagihan.toDateString() === today.toDateString();

      if (!isSameDate) continue;

      // ============================================
      // CEK TAGIHAN AKTIF
      // ============================================
      const { data: existing } = await supabase
        .from("tagihan")
        .select("*")
        .eq("id_sewa", item.id_sewa)
        .eq("status_tagihan", "Belum Dibayar");

      if (existing && existing.length > 0) continue;

      // ============================================
      // BATAS PEMBAYARAN
      // ============================================
      const batasPembayaran = new Date(item.tanggal_berakhir_sewa);
      batasPembayaran.setDate(batasPembayaran.getDate() + 10);

      // ============================================
      // INSERT TAGIHAN
      // ============================================
      const { error: insertError } = await supabase
        .from("tagihan")
        .insert([
          {
            id_sewa: item.id_sewa,
            total_tagihan: item.kamar?.harga_sewa_kamar,
            batas_pembayaran: batasPembayaran,
            status_tagihan: "Belum Dibayar",
          },
        ]);

      if (insertError) {
        console.log("INSERT ERROR:", insertError);
      } else {
        // ============================================
        // 2. JIKA INSERT BERHASIL, KIRIM EMAIL
        // ============================================
        try {
          // Karena ini berjalan di server (backend), kita butuh URL penuh.
          // Gunakan env variable untuk domain web kamu (misal: https://kos75.com), 
          // atau fallback ke localhost jika sedang didevelop.
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

          // Format periode untuk ditampilkan di email
          const bulanTagihan = batasPembayaran.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric"
          });

          await fetch(`${baseUrl}/api/send-tagihan-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              // Sesuaikan item.pengguna.email dengan struktur response Supabase-mu
              emailPenyewa: item.pengguna?.email, 
              // Sesuaikan item.kamar.nomor_kamar dengan kolom di database
              kamar: item.kamar?.nomor_kamar || "N/A", 
              periode: `Bulan ${bulanTagihan} (Batas: ${batasPembayaran.toLocaleDateString('id-ID')})`,
              totalTagihan: item.kamar?.harga_sewa_kamar,
              status: "Belum Dibayar",
            }),
          });
          
          console.log(`Email tagihan terkirim untuk kamar ${item.kamar?.nomor_kamar}`);
        } catch (emailError) {
          console.log("GAGAL MENGIRIM EMAIL:", emailError);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false });
  }
}