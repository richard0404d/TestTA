"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle, AlertCircle, X } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // ============================================
  // SUPABASE & ROUTER
  // ============================================
  const supabase = createClient();
  const router = useRouter();

  // ============================================
  // STATE FORM
  // ============================================
  const [form, setForm] = useState({
    nama: "",
    telepon: "",
    gender: "true", // "true" untuk Pria, "false" untuk Wanita
    email: "",
    password: "",
  });
  const [fileKtp, setFileKtp] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // TOAST STATE
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // ============================================
  // HANDLE CHANGE WITH VALIDATION
  // ============================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Pengecekan khusus untuk input nomor telepon (hanya boleh angka)
    if (name === "telepon") {
      // Izinkan jika string kosong (user menghapus teks) atau jika isinya hanya angka
      if (value !== "" && !/^[0-9]+$/.test(value)) {
        return; // Hentikan perubahan jika yang diketik bukan angka
      }
    }

    setForm({ ...form, [name]: value });
  };

  // ============================================
  // HANDLE SIGN UP
  // ============================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Input
    if (!form.nama || !form.telepon || !form.email || !form.password) {
      return showToast("Harap lengkapi semua data wajib!", "error");
    }

    // Validasi akhir untuk memastikan nomor telepon benar-benar angka dan panjangnya masuk akal
    if (!/^[0-9]+$/.test(form.telepon)) {
      return showToast("Nomor telepon hanya boleh berisi angka!", "error");
    }
    if (form.telepon.length < 10) {
      return showToast("Nomor telepon terlalu pendek!", "error");
    }

    if (!fileKtp) {
      return showToast("Foto KTP wajib diunggah!", "error");
    }

    setIsLoading(true);

    try {
      // 2. Registrasi Auth Supabase (Tabel auth.users bawaan)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Gagal membuat user.");

      // 3. Upload Gambar KTP ke Bucket "ktp"
      const fileExt = fileKtp.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("ktp")
        .upload(fileName, fileKtp);

      if (uploadError) throw new Error("Gagal mengunggah KTP: " + uploadError.message);

      // Ambil URL Publik KTP
      const { data: publicUrlData } = supabase.storage
        .from("ktp")
        .getPublicUrl(fileName);

      const ktpUrl = publicUrlData.publicUrl;

      // 4. Insert ke Tabel Penyewa
      // Konversi gender "true"/"false" string menjadi boolean sejati
      const isPria = form.gender === "true";

      const { error: insertError } = await supabase
        .from("penyewa")
        .insert([
          {
            id_penyewa: user.id, // ID diambil dari auth.users
            nama_penyewa: form.nama,
            nomor_telepon_penyewa: form.telepon,
            jenis_kelamin_penyewa: isPria, // boolean
            ktp_penyewa: ktpUrl,
            status_penyewa: "Aktif",
            email_penyewa: form.email,
            role: 3, // Otomatis Role 3 (Penyewa)
          }
        ]);

      if (insertError) throw insertError;

      // 5. Sukses
      showToast("Registrasi berhasil! Silakan login.", "success");
      setTimeout(() => {
        router.push("/authentication/sign-in"); // Sesuaikan route login Anda
      }, 1500);

    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Terjadi kesalahan saat registrasi", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // UI
  // ============================================
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed top-10 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold text-sm">{toast.message}</p>
          <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition">
            <X size={18} />
          </button>
        </div>
      )}

      <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSignUp}>
        <FieldGroup>
          {/* TITLE */}
          <div className="flex flex-col items-center gap-1 text-center mb-4">
            <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Lengkapi data di bawah ini untuk mendaftar sebagai penyewa.
            </p>
          </div>

          {/* NAMA PENYEWA */}
          <Field>
            <FieldLabel htmlFor="nama">Nama Lengkap</FieldLabel>
            <Input
              id="nama"
              name="nama"
              type="text"
              placeholder="Masukkan nama lengkap Anda"
              required
              value={form.nama}
              onChange={handleChange}
            />
          </Field>

          {/* EMAIL */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@gmail.com"
              required
              value={form.email}
              onChange={handleChange}
            />
          </Field>

          {/* PASSWORD */}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                required
                value={form.password}
                onChange={handleChange}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* TELEPON */}
            <Field>
              <FieldLabel htmlFor="telepon">Nomor Telepon</FieldLabel>
              <Input
                id="telepon"
                name="telepon"
                type="text" // Tetap text agar regex bisa membatasi karakter non-angka
                inputMode="numeric" // Memunculkan keyboard numerik di HP
                placeholder="0812..."
                required
                value={form.telepon}
                onChange={handleChange}
              />
            </Field>

            {/* GENDER */}
            <Field>
              <FieldLabel htmlFor="gender">Jenis Kelamin</FieldLabel>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="true">Pria</option>
                <option value="false">Wanita</option>
              </select>
            </Field>
          </div>

          {/* KTP UPLOAD */}
          <Field>
            <FieldLabel htmlFor="ktp">Foto KTP</FieldLabel>
            <Input
              id="ktp"
              type="file"
              accept="image/*"
              required
              onChange={(e) => setFileKtp(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">Pastikan foto KTP terlihat jelas dan tidak buram.</p>
          </Field>

          {/* BUTTON SUBMIT */}
          <Field className="mt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Memproses Registrasi..." : "Daftar Sekarang"}
            </Button>
          </Field>

          {/* LOGIN LINK */}
          <div className="text-center text-sm text-muted-foreground mt-2">
            Sudah punya akun?{" "}
            <Link href="/authentication/sign-in" className="text-primary hover:underline font-medium">
              Login di sini
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
    </div>
  );
}