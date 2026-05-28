import { NextResponse }
from "next/server";

const midtransClient =
  require("midtrans-client");

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    console.log(
      "BODY:",
      body
    );

    const snap =
      new midtransClient.Snap({

        isProduction:
          process.env
            .MIDTRANS_IS_PRODUCTION ===
          "true",

        serverKey:
          process.env
            .MIDTRANS_SERVER_KEY,
    });

    const parameter = {

      transaction_details: {

        order_id:
          String(
            body.order_id
          ),

        gross_amount:
          Number(
            body.gross_amount
          ),
      },

      customer_details: {

        first_name:
          body.first_name,

        email:
          body.email,
      },
    };

    console.log(
      "PARAMETER:",
      parameter
    );

    const transaction =
      await snap.createTransaction(
        parameter
      );

    console.log(
      "TRANSACTION:",
      transaction
    );

    return NextResponse.json({

      token:
        transaction.token,
    });

  } catch (error: any) {

    console.log(
      "MIDTRANS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}