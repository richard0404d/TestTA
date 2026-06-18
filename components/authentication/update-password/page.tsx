"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle, AlertCircle, X } from "lucide-react";

export default function UpdatePasswordPage() {
  // ============================================
  // STATE
  // ============================================
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Toast Notification
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const router = useRouter();

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // ============================================
  // HANDLE UPDATE PASSWORD
  // ============================================
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDASI INPUT ---
    if (!password || password.length < 6) {
      return showToast("Password baru minimal 6 karakter!", "error");
    }

    if (password !== confirmPassword) {
      return showToast("Konfirmasi password tidak cocok!", "error");
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      // Perintah Supabase untuk memperbarui password user yang sedang aktif
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw new Error(error.message);

      showToast("Password berhasil diubah! Silakan login kembali.", "success");
      
      // Bersihkan sesi dan arahkan ke halaman Sign In setelah 2 detik
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/authentication/sign-in");
      }, 2000);

    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal memperbarui password", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // UI
  // ============================================
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border">
        
        {/* TOAST NOTIFICATION */}
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

        <form onSubmit={handleUpdatePassword} noValidate className="flex flex-col gap-6">
          <FieldGroup>
            {/* TITLE */}
            <div className="flex flex-col items-center gap-1 text-center mb-4">
              <h1 className="text-2xl font-bold text-[#1c3163]">
                Buat Password Baru
              </h1>
              <p className="text-muted-foreground text-sm text-balance">
                Silakan masukkan password baru untuk akun Anda.
              </p>
            </div>

            {/* PASSWORD BARU */}
            <Field>
              <FieldLabel htmlFor="password">Password Baru</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {/* KONFIRMASI PASSWORD BARU */}
            <Field>
              <FieldLabel htmlFor="confirmPassword">Konfirmasi Password Baru</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ketik ulang password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {/* BUTTON SUBMIT */}
            <Field className="mt-4">
              <Button type="submit" disabled={isLoading} className="w-full bg-[#1c3163] hover:bg-[#15254b]">
                {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </Field>

          </FieldGroup>
        </form>
      </div>
    </div>
  );
}