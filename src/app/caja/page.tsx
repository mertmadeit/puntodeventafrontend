"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Caja } from "@/components/caja/caja"

function readCookie(name: string) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))

  if (!cookie) return null
  return decodeURIComponent(cookie.slice(name.length + 1))
}

function clearSession() {
  try {
    localStorage.removeItem("auth.token")
    localStorage.removeItem("auth.role")
    localStorage.removeItem("pos.cashierName")
  } catch {
    // ignore
  }
  document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax"
  document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax"
  document.cookie = "pos_cashier_name=; Path=/; Max-Age=0; SameSite=Lax"
}

export default function CajaPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const role = (localStorage.getItem("auth.role") ?? readCookie("auth_role") ?? "")
          .trim()
          .toLowerCase()
        if (role === "admin" || role === "supervisor" || role === "vendedor") {
          setAuthorized(true)
        } else {
          clearSession()
          router.replace("/login")
        }
      } catch {
        clearSession()
        router.replace("/login")
      } finally {
        setChecking(false)
      }
    }
    checkAuth()
  }, [router])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <Caja />
}
