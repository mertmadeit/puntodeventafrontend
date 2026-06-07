"use client"
import { AlertCircleIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { useState } from "react" // 1. Importamos estados
import { useRouter } from "next/navigation" // 2. Para navegar al entrar
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { login } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { fetchInventory } from "@/lib/api/inventory"
import { toast } from "sonner"
import { ApiConfigDialog } from "@/components/api-config-dialog"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // Estados para los inputs
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorTitle, setErrorTitle] = useState("Error")
  const [apiConfigOpen, setApiConfigOpen] = useState(false)
  const router = useRouter()

  type UserRole = "admin" | "supervisor" | "vendedor" | null

  const getProp = (obj: unknown, key: string): unknown => {
    if (!obj || typeof obj !== "object") return undefined
    return (obj as Record<string, unknown>)[key]
  }

  const getNested = (obj: unknown, keys: string[]): unknown => {
    return keys.reduce<unknown>((acc, key) => getProp(acc, key), obj)
  }

  const normalizeRole = (value: unknown): UserRole => {
    if (typeof value !== "string") return null
    const role = value.trim().toLowerCase()
    if (role === "admin" || role === "administrador" || role === "role_admin") return "admin"
    if (role === "vendedor" || role === "seller" || role === "role_vendedor") return "vendedor"
    if (role === "supervisor" || role === "manager" || role === "role_supervisor") return "supervisor"
    return null
  }

  const decodeJwtPayload = (token: string): unknown => {
    const parts = token.split(".")
    if (parts.length < 2) return null
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
      const json = atob(padded)
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  const extractRoleFromResponse = (payload: unknown): UserRole => {
    if (!payload || typeof payload !== "object") return null
    const data = payload as Record<string, unknown>

    const directCandidates: unknown[] = [
      data.role,
      data.rol,
      data.perfil,
      data.profile,
      getNested(data, ["data", "role"]),
      getNested(data, ["data", "rol"]),
      getNested(data, ["data", "perfil"]),
      getNested(data, ["data", "profile"]),
      getNested(data, ["user", "role"]),
      getNested(data, ["user", "rol"]),
      getNested(data, ["user", "perfil"]),
      getNested(data, ["data", "user", "role"]),
      getNested(data, ["data", "user", "rol"]),
      getNested(data, ["data", "user", "perfil"]),
      getNested(data, ["usuario", "role"]),
      getNested(data, ["usuario", "rol"]),
      getNested(data, ["usuario", "perfil"]),
      getNested(data, ["data", "usuario", "role"]),
      getNested(data, ["data", "usuario", "rol"]),
      getNested(data, ["data", "usuario", "perfil"]),
    ]

    for (const candidate of directCandidates) {
      const normalized = normalizeRole(candidate)
      if (normalized) return normalized
    }

    const roles =
      (data.roles as unknown) ??
      (data.authorities as unknown) ??
      getNested(data, ["user", "roles"]) ??
      getNested(data, ["data", "roles"]) ??
      getNested(data, ["data", "authorities"]) ??
      getNested(data, ["data", "user", "roles"])
    if (Array.isArray(roles)) {
      for (const item of roles) {
        const normalized = normalizeRole(item)
        if (normalized) return normalized
        const authority = normalizeRole(getProp(item, "authority"))
        if (authority) return authority
        const name = normalizeRole(getProp(item, "name"))
        if (name) return name
      }
    }

    const token = (data.token as unknown) ?? (data.accessToken as unknown) ?? (data.jwt as unknown)
    if (typeof token === "string") {
      const jwtPayload = decodeJwtPayload(token)
      const fromJwt: UserRole = extractRoleFromResponse(jwtPayload)
      if (fromJwt) return fromJwt
    }

    return null
  }

  // Función que conecta con tu Java 25
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setErrorTitle("Error")

    try {
      const payload = await login({ username, password })
      const guessedRole: UserRole = username.trim().toLowerCase() === "admin" ? "admin" : "vendedor"
      const role = extractRoleFromResponse(payload) ?? guessedRole
      const token = payload.token ?? payload.accessToken ?? payload.jwt

      try {
        const cashier = username.trim()
        if (cashier) {
          localStorage.setItem("pos.cashierName", cashier)
          document.cookie = `pos_cashier_name=${encodeURIComponent(cashier)}; Path=/; Max-Age=2592000; SameSite=Lax`
        }
        if (role) {
          const normalizedRole = role.trim().toLowerCase()
          localStorage.setItem("auth.role", normalizedRole)
          document.cookie = `auth_role=${encodeURIComponent(normalizedRole)}; Path=/; Max-Age=2592000; SameSite=Lax`
        }
        if (token) {
          localStorage.setItem("auth.token", token)
          document.cookie = `auth_token=${encodeURIComponent(token)}; Path=/; Max-Age=28800; SameSite=Lax`
        }
      } catch {
        // ignore
      }

      try {
        const inventory = await fetchInventory()
        let lowStockCount = 0
        let expiringCount = 0

        inventory.forEach((item) => {
          if (item.stock <= item.minStock) {
            lowStockCount++
          }
          if (item.fechaCaducidad) {
            const today = new Date()
            const expiryDate = new Date(item.fechaCaducidad)
            const diffTime = expiryDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            if (diffDays >= 0 && diffDays <= 7) {
              expiringCount++
            }
          }
        })

        if (lowStockCount > 0) {
          toast.warning(`Atención: Hay ${lowStockCount} producto(s) con stock bajo.`, {
            duration: 8000,
          })
        }
        
        if (expiringCount > 0) {
          toast.warning(`Atención: Hay ${expiringCount} producto(s) próximos a caducar.`, {
            duration: 8000,
          })
        }
      } catch (e) {
        console.error("Error al obtener alertas de inventario", e)
      }

      if (role === "admin" || role === "supervisor") {
        router.replace("/dashboard")
        return
      }
      if (role === "vendedor") {
        router.replace("/caja")
        return
      }

      router.replace("/dashboard")
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setErrorTitle("Credenciales incorrectas")
          setErrorMessage("Usuario o contraseña inválidos. Intenta de nuevo.")
          setPassword("")
          return
        }
        if (error.status === 403) {
          setErrorTitle("Acceso denegado")
          setErrorMessage("Tu usuario no tiene permisos para entrar al sistema.")
          return
        }
        if (error.status >= 500) {
          setErrorTitle("Error del servidor")
          setErrorMessage(`La API respondió con ${error.status}. Revisa los logs de Spring en /api/auth/login.`)
          return
        }

        setErrorTitle("No se pudo iniciar sesión")
        setErrorMessage(error.message || `La API respondió con ${error.status}.`)
        return
      }
      setErrorTitle("Error de conexión")
      setErrorMessage("No se pudo conectar con el servidor. Verifica la API de Spring.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit} // 3. Conectamos el envío
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        {errorMessage && (
          <Alert variant="destructive" className="max-w-md border-red-300 bg-red-50/80 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100">
            <AlertCircleIcon />
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="username"
            required
            className="bg-background"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input
            id="password"
            type="password"
            required
            className="bg-background"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Login"}
          </Button>
        </Field>

      </FieldGroup>

      {/* Botón flotante de configuración de red */}
      <Button 
        type="button" 
        variant="secondary" 
        size="icon"
        onClick={() => setApiConfigOpen(true)}
        className="fixed bottom-4 left-4 z-50 shadow-xl shadow-black/10 rounded-full size-12 bg-background/60 backdrop-blur-md hover:bg-background/90 text-muted-foreground border-border/60 hover:text-foreground transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </Button>

      <ApiConfigDialog open={apiConfigOpen} onOpenChange={setApiConfigOpen} />
    </form>
  )
}
