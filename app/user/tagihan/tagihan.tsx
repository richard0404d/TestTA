"use client";

import Link from "next/link";
import {
  Home,
  Calendar,
  Wrench,
  CreditCard,
  ReceiptText,
  User,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function TagihanPage() {
  const tagihan = [
    {
      nama: "Pembayaran Kos Kamar 4 Bulan Mei",
      tunggakan: "Rp. 600.000",
      batas: "12 Mei 2026",
    },
    {
      nama: "Pembayaran Kos Kamar 4 Bulan Juni",
      tunggakan: "Rp. 600.000",
      batas: "12 Juni 2026",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">

      {/* ================= CONTENT ================= */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">

        <div className="p-5 md:p-10 min-h-[500px]">

          {/* TITLE */}
          <h1 className="text-4xl md:text-6xl font-bold mb-10 md:mb-16">
            Tagihan
          </h1>

          {/* TABLE HEADER DESKTOP */}
          <div className="hidden md:grid grid-cols-4 gap-4 text-lg font-semibold text-gray-700 border-b pb-6 mb-4">
            <div>Tagihan</div>
            <div>Tunggakan</div>
            <div>Batas Pembayaran</div>
            <div></div>
          </div>

          {/* ================= DATA ================= */}
          <div className="space-y-5">

            {tagihan.map((item, index) => (
              <div
                key={index}
                className="
                  border rounded-2xl p-5 bg-gray-50
                  flex flex-col gap-5
                  md:grid md:grid-cols-4 md:items-center
                "
              >

                {/* TAGIHAN */}
                <div>
                  <p className="text-sm text-gray-500 mb-1 md:hidden">
                    Tagihan
                  </p>

                  <p className="font-medium text-base md:text-lg">
                    {item.nama}
                  </p>
                </div>

                {/* TUNGGAKAN */}
                <div>
                  <p className="text-sm text-gray-500 mb-1 md:hidden">
                    Tunggakan
                  </p>

                  <p className="font-semibold text-lg">
                    {item.tunggakan}
                  </p>
                </div>

                {/* BATAS */}
                <div>
                  <p className="text-sm text-gray-500 mb-1 md:hidden">
                    Batas Pembayaran
                  </p>

                  <p className="text-base md:text-lg">
                    {item.batas}
                  </p>
                </div>

                {/* BUTTON */}
                <div className="md:flex md:justify-end">
                  <Button className="w-full md:w-auto px-8 py-6 rounded-xl text-base bg-[#2C5EBF] hover:bg-[#244ea0]">
                    Bayar
                  </Button>
                </div>

              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}