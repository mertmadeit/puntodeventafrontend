import { apiFetch } from "@/lib/api/client"
import type { ApiInventoryItem } from "@/lib/api/types"

export type ProductPayload = {
  nombre: string
  codigo_barras: string
  categoria_id: number | string | null
  proveedor_id: number
  stock: number
  stock_minimo: number
  precio: number
  unidad: string
}

export async function fetchInventory() {
  return apiFetch<ApiInventoryItem[]>("/api/inventory")
}

export async function createProduct(payload: ProductPayload) {
  return apiFetch<{ id: number | string }>("/api/products", {
    method: "POST",
    body: payload,
  })
}

export async function updateProduct(id: number | string, payload: ProductPayload) {
  return apiFetch<void>(`/api/products/${id}`, {
    method: "PUT",
    body: payload,
  })
}

export async function deleteProduct(id: number | string) {
  return apiFetch<void>(`/api/products/${id}`, {
    method: "DELETE",
  })
}
