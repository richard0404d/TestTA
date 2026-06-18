"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle, AlertCircle, X, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return showToast("Silakan masukkan email Anda!", "error");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return showToast("Format email tidak valid!", "error");
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/authentication/update-password`,
      });

      if (error) throw new Error(error.message);

      setIsSuccess(true);
      showToast("Link pemulihan telah dikirim ke email Anda!", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal mengirim email pemulihan", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border relative">
        
        {/* Tombol Kembali ke Login */}
        <Link 
          href="/authentication/sign-in" 
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 transition flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>

        {toast.show && (
          <div 
            className={`fixed top-10 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
              toast.type === "success" 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <p className="font-semibold text-sm">{toast.message}</p>
            <button 
              type="button"
              onClick={() => setToast({ ...toast, show: false })} 
              className="ml-4 hover:opacity-70 transition"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <form onSubmit={handleResetPassword} noValidate className="flex flex-col gap-6 mt-8">
          <FieldGroup>
            {/* TITLE */}
            <div className="flex flex-col items-center gap-2 text-center mb-4">
              <h1 className="text-2xl font-bold text-[#1c3163]">
                Lupa Password?
              </h1>
              <p className="text-muted-foreground text-sm text-balance">
                Jangan khawatir. Masukkan email yang terdaftar dan kami akan mengirimkan instruksi untuk mengatur ulang password Anda.
              </p>
            </div>

            {/* EMAIL */}
            {!isSuccess ? (
              <>
                <Field>
                  <FieldLabel htmlFor="email">Alamat Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field className="mt-4">
                  <Button type="submit" disabled={isLoading} className="w-full bg-[#1c3163] hover:bg-[#15254b]">
                    {isLoading ? "Mengirim..." : "Kirim Link Pemulihan"}
                  </Button>
                </Field>
              </>
            ) : (
              <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 text-sm text-center">
                Silakan periksa kotak masuk email Anda <b>({email})</b> untuk langkah selanjutnya. Jika tidak menemukan email, periksa juga folder Spam/Junk.
              </div>
            )}

          </FieldGroup>
        </form>
      </div>
    </div>
  );
}