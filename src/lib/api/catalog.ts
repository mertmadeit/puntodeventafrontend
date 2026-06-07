import { apiFetch } from "@/lib/api/client"
import type { ApiCategory, ApiProduct } from "@/lib/api/types"

type CategoryPayload = {
  name: string
  slug?: string
}

export async function fetchCategories() {
  return apiFetch<ApiCategory[]>("/api/categories")
}

export async function createCategory(payload: CategoryPayload) {
  return apiFetch<ApiCategory>("/api/categories", {
    method: "POST",
    body: payload,
  })
}

export async function updateCategory(id: number | string, payload: CategoryPayload) {
  return apiFetch<ApiCategory>(`/api/categories/${id}`, {
    method: "PUT",
    body: payload,
  })
}

export async function deleteCategory(id: number | string) {
  return apiFetch<void>(`/api/categories/${id}`, {
    method: "DELETE",
  })
}

export async function fetchProducts() {
  return apiFetch<ApiProduct[]>("/api/products")
}

export async function fetchStockAlerts() {
  return apiFetch<ApiProduct[]>("/api/products/alerts")
}
