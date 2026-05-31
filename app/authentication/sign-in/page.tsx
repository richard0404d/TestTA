import Image from "next/image"

import { LoginForm } from "@/components/authentication/sign-in-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/authentication/sign-in" className="flex items-center gap-3 font-semibold text-lg">
            
            {/* CONTAINER LOGO DIPERBARUI DI SINI */}
            <div className="bg-black flex size-9 items-center justify-center rounded-xl shadow-sm">
              <Image
                src="/images/LogoKos.png"
                width={22}
                height={22}
                alt="Logo Kos 75"
                className="object-contain"
              />
            </div>
            {/* ================================= */}
            
            Kos 75
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/hero-3.jpg"
          fill
          alt="Image" 
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}