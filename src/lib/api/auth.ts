import { apiFetch } from "@/lib/api/client"

type LoginPayload = {
  username: string
  password: string
}

export type LoginResponse = {
  token?: string
  accessToken?: string
  jwt?: string
  data?: unknown
  user?: unknown
  usuario?: unknown
  role?: string
  rol?: string
  perfil?: string
}

export async function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
    auth: false,
  })
}

export async function fetchMe(options?: { signal?: AbortSignal }) {
  return apiFetch<{
    id: number | string
    username: string
    email?: string
    name: string
    role: string
    status: string
    imageUrl?: string
  }>("/api/auth/me", {
    signal: options?.signal,
  })
}

export async function logoutApi() {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
  })
}
