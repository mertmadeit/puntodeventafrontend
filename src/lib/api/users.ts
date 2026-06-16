import { apiFetch } from "@/lib/api/client"
import type { ApiUser } from "@/lib/api/types"

export type UserPayload = {
  name: string
  email: string
  password?: string
  role: string
  status: string
  imageUrl?: string
}

export async function fetchUsers() {
  return apiFetch<ApiUser[]>("/api/users")
}

export async function createUser(payload: UserPayload) {
  return apiFetch<ApiUser>("/api/users", {
    method: "POST",
    body: payload,
  })
}

export async function updateUser(id: number | string, payload: UserPayload) {
  return apiFetch<ApiUser>(`/api/users/${id}`, {
    method: "PUT",
    body: payload,
  })
}

export async function deleteUser(id: number | string) {
  return apiFetch<void>(`/api/users/${id}`, {
    method: "DELETE",
  })
}
