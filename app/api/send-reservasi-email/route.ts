import { NextResponse }
from "next/server";

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const {
      emailPenyewa,
      kamar,
      tanggalMasuk,
      totalHarga,
      status,
    } = body;

    const sendEmail =
      async (
        to: string,
        subject: string,
        html: string
      ) => {

        const response =
          await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "api-key":
                  process.env
                    .BREVO_API_KEY!,
              },

              body: JSON.stringify({
                sender: {
                  name:
                    "Kos 75",

                  email:
                    "rumahkos2an@gmail.com",
                },

                to: [
                  {
                    email: to,
                  },
                ],

                subject,

                htmlContent:
                  html,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          "EMAIL RESPONSE:",
          data
        );
      };

    if (emailPenyewa) {

      await sendEmail(

        emailPenyewa,

        `Reservasi Kos 75 - ${status}`,

        `
        <div style="
          font-family: Arial;
          padding: 20px;
        ">

          <h2>
            Reservasi Kos 75
          </h2>

          <p>
            Status Reservasi:
            <b>${status}</b>
          </p>

          <p>
            Nomor Kamar:
            ${kamar}
          </p>

          <p>
            Tanggal Masuk:
            ${tanggalMasuk}
          </p>

          <p>
            Total Harga:
            Rp ${Number(
              totalHarga
            ).toLocaleString(
              "id-ID"
            )}
          </p>

        </div>
        `
      );
    }

    await sendEmail(

      "rumahkos2an@gmail.com",

      `Reservasi ${status}`,

      `
      <div style="
        font-family: Arial;
        padding: 20px;
      ">

        <h2>
          Reservasi Kos
        </h2>

        <p>
          Email Penyewa:
          ${emailPenyewa}
        </p>

        <p>
          Status:
          <b>${status}</b>
        </p>

        <p>
          Kamar:
          ${kamar}
        </p>

        <p>
          Tanggal Masuk:
          ${tanggalMasuk}
        </p>

      </div>
      `
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.log(
      "EMAIL ERROR:",
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