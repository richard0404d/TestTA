"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Wallet,
  CreditCard,
  BadgeDollarSign,
} from "lucide-react";

export default function PembayaranPage() {
  const [selectedMethod, setSelectedMethod] = useState("QRIS");

  const methods = [
    {
      name: "QRIS",
      icon: <QrCode size={28} />,
    },
    {
      name: "Gopay",
      icon: <Wallet size={28} />,
    },
    {
      name: "Dana",
      icon: <CreditCard size={28} />,
    },
    {
      name: "+10 Lainnya",
      icon: <BadgeDollarSign size={28} />,
    },
  ];

  const histories = [
    {
      date: "2026-04-01",
      amount: "Rp. 600.000",
      status: "Lunas",
    },
    {
      date: "2026-03-01",
      amount: "Rp. 600.000",
      status: "Lunas",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 mb-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= LEFT ================= */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <h1 className="text-2xl font-bold mb-2">
            Pembayaran
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            Pilih metode pembayaran
          </p>

          {/* PAYMENT METHODS */}
          <div className="space-y-4">
            {methods.map((method, index) => (
              <button
                key={index}
                onClick={() => setSelectedMethod(method.name)}
                className={`w-full border rounded-2xl p-5 flex items-center justify-between transition-all hover:shadow-md ${
                  selectedMethod === method.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-blue-500">
                    {method.icon}
                  </div>

                  <span className="font-semibold text-lg">
                    {method.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* DETAIL PEMBAYARAN */}
          <div className="border rounded-2xl p-5 mt-6">
            <h2 className="font-semibold mb-4">
              Detail Pembayaran
            </h2>

            <div className="flex justify-between text-sm border-b pb-3">
              <span>Total Pembayaran</span>
              <span className="font-semibold">
                Rp. 600.000
              </span>
            </div>

            <div className="mt-6 text-center">
              <Button className="px-8 bg-[#2C5EBF] hover:bg-[#244ea0]">
                Bayar
              </Button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <h1 className="text-2xl font-bold mb-6">
            Histori Pembayaran
          </h1>

          <div className="space-y-4">
            {histories.map((item, index) => (
              <div
                key={index}
                className="border rounded-2xl p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">
                    {item.date}
                  </p>

                  <p className="font-semibold mt-1">
                    {item.amount}
                  </p>
                </div>

                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}