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

  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    nama: "",
    telepon: "",
    gender: "true", 
    email: "",
    password: "",
  });
  const [fileKtp, setFileKtp] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "telepon") {

      if (value !== "" && !/^[0-9]+$/.test(value)) {
        return; 
      }
    }

    setForm({ ...form, [name]: value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nama.trim() && !form.email.trim() && !form.password && !form.telepon && !fileKtp) {
      return showToast("Semua field wajib diisi!", "error");
    }

    if (!form.nama.trim()) {
      return showToast("Nama Lengkap tidak boleh kosong!", "error");
    }

    if (!form.email.trim()) {
      return showToast("Email tidak boleh kosong!", "error");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return showToast("Format email tidak valid!", "error");
    }

    if (!form.password) {
      return showToast("Password tidak boleh kosong!", "error");
    }
    if (form.password.length < 6) {
      return showToast("Password harus minimal 6 karakter!", "error");
    }

    if (!form.telepon) {
      return showToast("Nomor telepon tidak boleh kosong!", "error");
    }
    if (!/^[0-9]+$/.test(form.telepon)) {
      return showToast("Nomor telepon hanya boleh berisi angka!", "error");
    }
    if (form.telepon.length < 10) {
      return showToast("Nomor telepon terlalu pendek (min. 10 angka)!", "error");
    }

    if (!fileKtp) {
      return showToast("Foto KTP wajib diunggah!", "error");
    }

    setIsLoading(true);

    try {

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) {

        if (authError.message === "User already registered") {
          throw new Error("Email sudah terdaftar!");
        }

        throw new Error(authError.message);
      }

      const user = authData.user;
      if (!user) throw new Error("Gagal membuat user.");

      if (user.identities && user.identities.length === 0) {
        throw new Error("Email sudah terdaftar!");
      }

      const fileExt = fileKtp.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("ktp")
        .upload(fileName, fileKtp);

      if (uploadError) throw new Error("Gagal mengunggah KTP: " + uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from("ktp")
        .getPublicUrl(fileName);

      const ktpUrl = publicUrlData.publicUrl;

      const isPria = form.gender === "true";

      const { error: insertError } = await supabase
        .from("penyewa")
        .insert([
          {
            id_penyewa: user.id,
            nama_penyewa: form.nama,
            nomor_telepon_penyewa: form.telepon,
            jenis_kelamin_penyewa: isPria,
            ktp_penyewa: ktpUrl,
            status_penyewa: "Aktif",
            email_penyewa: form.email,
            role: 3,
          }
        ]);

      if (insertError) throw insertError;

      // 4. Sukses
      showToast("Registrasi berhasil! Silakan login.", "success");
      setTimeout(() => {
        router.push("/authentication/sign-in");
      }, 1500);

    } catch (error: any) {

      console.error(error);
      showToast(error.message || "Terjadi kesalahan saat registrasi", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">

      {toast.show && (
        <div className={`fixed top-10 right-5 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="font-semibold text-sm">{toast.message}</p>
          <button type="button" onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:opacity-70 transition">
            <X size={18} />
          </button>
        </div>
      )}

      <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSignUp} noValidate>
        <FieldGroup>

          <div className="flex flex-col items-center gap-1 text-center mb-4">
            <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Lengkapi data di bawah ini untuk mendaftar sebagai penyewa.
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="nama">Nama Lengkap</FieldLabel>
            <Input
              id="nama"
              name="nama"
              type="text"
              placeholder="Masukkan nama lengkap Anda"
              value={form.nama}
              onChange={handleChange}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@gmail.com"
              value={form.email}
              onChange={handleChange}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
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

            <Field>
              <FieldLabel htmlFor="telepon">Nomor Telepon</FieldLabel>
              <Input
                id="telepon"
                name="telepon"
                type="text" 
                inputMode="numeric" 
                placeholder="0812..."
                value={form.telepon}
                onChange={handleChange}
              />
            </Field>

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

          <Field>
            <FieldLabel htmlFor="ktp">Foto KTP</FieldLabel>
            <Input
              id="ktp"
              type="file"
              accept="image/*"
              onChange={(e) => setFileKtp(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">Pastikan foto KTP terlihat jelas dan tidak buram.</p>
          </Field>

          <Field className="mt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Memproses Registrasi..." : "Daftar Sekarang"}
            </Button>
          </Field>

          <div className="text-center text-sm text-muted-foreground mt-2">
            Sudah punya akun?{" "}
            <Link href="/authentication/sign-in" className="text-primary hover:underline font-medium">
              Login di sini
            </Link>
          </div>

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