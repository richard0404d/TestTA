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

import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  // ============================================
  // STATE
  // ============================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  // HYDRATION FIX
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();

  // ============================================
  // HANDLE LOGIN
  // ============================================

  const handleLogin = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);

    setError(null);

    try {

      // ============================================
      // LOGIN AUTH
      // ============================================

      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;

      if (!user) {

        throw new Error(
          "User tidak ditemukan"
        );
      }

      // ============================================
      // CEK TABEL PENYEWA
      // ============================================

      const {
        data: penyewa,
        error: penyewaError,
      } = await supabase
        .from("penyewa")
        .select("*")
        .eq(
          "id_penyewa",
          user.id
        )
        .maybeSingle();

      // DEBUG
      console.log(
        "Penyewa:",
        penyewa
      );

      // ============================================
      // JIKA PENYEWA
      // ============================================

      if (
        penyewa &&
        !penyewaError
      ) {

        // ROLE PENYEWA
        localStorage.setItem(
          "role",
          "3"
        );

        router.push("/");

        return;
      }

      // ============================================
      // CEK TABEL PEGAWAI
      // ============================================

      const {
        data: pegawai,
        error: pegawaiError,
      } = await supabase
        .from("pegawai")
        .select("id_role")
        .eq("id_pegawai", user.id)
        .maybeSingle();

      // DEBUG ERROR
      console.log(
        "Pegawai Error:",
        pegawaiError
      );

      console.log(
        "Pegawai:",
        pegawai
      );

            // ============================================
      // JIKA PEGAWAI
      // ============================================

      if (
        pegawai &&
        !pegawaiError
      ) {

        // ============================================
        // CEK ROLE
        // ============================================

        if (
          pegawai.id_role === 1 ||
          pegawai.id_role === 2
        ) {

          // SIMPAN ROLE
          localStorage.setItem(
            "role",
            String(
              pegawai.id_role
            )
          );

          // REDIRECT
          router.push(
            "/admin/dashboardAdmin"
          );

          return;
        }
      }
      
      // ============================================
      // ROLE TIDAK DITEMUKAN
      // ============================================

      throw new Error(
        "Role tidak ditemukan"
      );

    } catch (error: unknown) {

      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan"
      );

    } finally {

      setIsLoading(false);

    }
  };

  // ============================================
  // UI
  // ============================================

  return (
    <form
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
      onSubmit={handleLogin}
    >

      <FieldGroup>

        {/* TITLE */}
        <div className="flex flex-col items-center gap-1 text-center">

          <h1 className="text-2xl font-bold">
            Login to your account
          </h1>

          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below
            to login to your account
          </p>

        </div>

        {/* EMAIL */}
        <Field>

          <FieldLabel htmlFor="email">
            Email
          </FieldLabel>

          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

        </Field>

        {/* PASSWORD */}
        <Field>

          <div className="flex items-center">

            <FieldLabel htmlFor="password">
              Password
            </FieldLabel>

          </div>

          <InputGroup>

            <InputGroupInput
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              required
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            <InputGroupAddon align="inline-end">

              <InputGroupButton
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >

                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}

              </InputGroupButton>

            </InputGroupAddon>

          </InputGroup>

        </Field>

        {/* ERROR */}
        {error && (

          <p className="text-sm text-red-500">

            {error}

          </p>

        )}

        {/* BUTTON */}
        <Field>

          <Button
            type="submit"
            disabled={isLoading}
          >

            {isLoading
              ? "Logging in..."
              : "Login"}

          </Button>

        </Field>

        {/* COPYRIGHT */}
        <FieldDescription className="text-center">

          Copyright ©{" "}

          {mounted
            ? new Date().getFullYear()
            : ""}

          <br />

          All rights reserved.

        </FieldDescription>

      </FieldGroup>

    </form>
  );
}