"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  // ============================================
  // STATE
  // ============================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Toast Notification
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", 
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // ============================================
  // HANDLE LOGIN
  // ============================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDASI INPUT ---
    if (!email.trim()) {
      return showToast("Email tidak boleh kosong!", "error");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return showToast("Format email tidak valid!", "error");
    }

    if (!password) {
      return showToast("Password tidak boleh kosong!", "error");
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error("Email atau password yang Anda masukkan salah.");

      const user = data.user;

      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      // CEK TABEL PENYEWA
      const { data: penyewa, error: penyewaError } = await supabase
        .from("penyewa")
        .select("id_penyewa, status_penyewa")
        .eq("id_penyewa", user.id)
        .maybeSingle();

      if (penyewa && !penyewaError) {
        if (penyewa.status_penyewa !== "Aktif") {
          await supabase.auth.signOut();
          throw new Error("Akun penyewa Anda tidak aktif atau sedang ditangguhkan.");
        }
        localStorage.setItem("role", "3");
        showToast("Login berhasil!", "success");
        setTimeout(() => router.push("/user/dashboard"), 1000);
        return;
      }

      // CEK TABEL PEGAWAI
      const { data: pegawai, error: pegawaiError } = await supabase
        .from("pegawai")
        .select("id_role, status_pegawai")
        .eq("id_pegawai", user.id)
        .maybeSingle();

      if (pegawai && !pegawaiError) {
        if (pegawai.status_pegawai !== "Aktif") {
          await supabase.auth.signOut();
          throw new Error("Akun pegawai Anda tidak aktif.");
        }
        if (pegawai.id_role === 1 || pegawai.id_role === 2) {
          localStorage.setItem("role", String(pegawai.id_role));
          showToast("Login admin berhasil!", "success");
          setTimeout(() => router.push("/admin/dashboardAdmin"), 1000);
          return;
        }
      }
      
      await supabase.auth.signOut();
      throw new Error("Role tidak ditemukan atau akun tidak valid");

    } catch (error: unknown) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Terjadi kesalahan", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // UI
  // ============================================
  return (
    <>
      {toast.show && (
        <div 
          className={`fixed top-10 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 ${
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

      <form
        className={cn("flex flex-col gap-6", className)}
        {...props}
        onSubmit={handleLogin}
        noValidate 
      >
        <FieldGroup>
          {/* TITLE */}
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">
              Masuk ke akun Anda
            </h1>
            <p className="text-muted-foreground text-sm text-balance">
              Masukkan email Anda di bawah ini.
            </p>
          </div>

          {/* EMAIL */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {/* PASSWORD */}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password Anda"
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
            
            {/* LUPA PASSWORD - SEKARANG DI BAWAH INPUT & JADI LINK */}
            <div className="flex justify-end mt-1">
              <Link 
                href="/authentication/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Lupa password?
              </Link>
            </div>
          </Field>

          {/* BUTTON */}
          <Field>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </Field>

          {/* REGISTER LINK */}
          <div className="text-center text-sm text-muted-foreground mt-2">
            Belum punya akun?{" "}
            <Link 
              href="/authentication/sign-up" 
              className="text-primary hover:underline font-medium"
            >
              Registrasi
            </Link>
          </div>

          {/* COPYRIGHT */}
          <FieldDescription className="text-center mt-4">
            Copyright © {mounted ? new Date().getFullYear() : ""}
            <br />
            All rights reserved.
          </FieldDescription>
        </FieldGroup>
      </form>
    </>
  );
}