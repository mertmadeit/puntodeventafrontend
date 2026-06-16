import type { ApiUser } from "@/lib/api/types"
export { getInitials } from "@/components/shared/user-display-utils"

export type UserRow = {
  id: number
  image?: string
  name: string
  email: string
  role: string
  status: "Activo" | "Inactivo"
}

export type FormValues = {
  image: string
  name: string
  email: string
  password: string
  role: string
  status: "Activo" | "Inactivo"
}

export const EMPTY_FORM: FormValues = {
  image: "",
  name: "",
  email: "",
  password: "",
  role: "vendedor",
  status: "Activo",
}

/** Convierte estados de API a las etiquetas internas de la tabla. */
export function normalizeStatus(status: string): UserRow["status"] {
  return status.toLowerCase() === "inactivo" ? "Inactivo" : "Activo"
}

/** Adapta el usuario de backend al formato visual editable. */
export function mapApiUser(user: ApiUser): UserRow {
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: normalizeStatus(user.status),
    image: user.imageUrl ?? "",
  }
}

/** Sincroniza el usuario editado con el cache usado por el sidebar. */
export function updateSidebarUserCache(user: UserRow) {
  if (typeof window === "undefined") return

  try {
    const stored = localStorage.getItem("auth.sidebarUser")
    const parsed = stored ? JSON.parse(stored) as Record<string, unknown> : null
    const storedEmail = typeof parsed?.email === "string" ? parsed.email : ""
    const storedId = parsed?.id !== undefined && parsed?.id !== null ? String(parsed.id) : ""
    const fallbackName = localStorage.getItem("pos.cashierName") || ""
    const fallbackEmail = fallbackName ? `${fallbackName}@pdv.local` : ""

    if (storedId && storedId !== String(user.id)) return
    if (!storedId && storedEmail && storedEmail !== user.email) return
    if (!storedId && !storedEmail && fallbackEmail !== user.email) return

    const nextUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.image ?? "",
      imageUrl: user.image ?? "",
    }

    localStorage.setItem("auth.sidebarUser", JSON.stringify(nextUser))
    window.dispatchEvent(new CustomEvent("sidebar-user-updated", { detail: nextUser }))
  } catch {
    // Storage can fail in private mode or when quota is exceeded.
  }
}
