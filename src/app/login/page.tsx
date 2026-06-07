"use client"

import Image from "next/image"

import { LoginForm } from "@/components/auth/login-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Store02Icon } from "@hugeicons/core-free-icons"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-4" />
            </div>
            Abarrotes Loyde
          </a>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 items-center">
          <div className="w-full space-y-6">
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
              <p className="text-sm text-muted-foreground">
                Accede al panel con tu usuario de caja o administración.
              </p>
            </div>
            <div className="rounded-xl border p-5 md:p-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/login.jpg"
          alt="Image"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
