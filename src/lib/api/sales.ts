import { apiFetch } from "@/lib/api/client"
import type { ApiSale } from "@/lib/api/types"

type CreateSalePayload = {
  items: Array<{ productId: number | string; quantity: number }>
  paymentMethod: string
  client?: string
  cashGiven?: number
}

export async function fetchSales() {
  return apiFetch<ApiSale[]>("/api/sales")
}

export async function createSale(payload: CreateSalePayload) {
  return apiFetch<ApiSale>("/api/sales", {
    method: "POST",
    body: payload,
  })
}

export async function fetchSalesTodaySummary() {
  return apiFetch<{ count: number; total: number }>("/api/sales/today-summary")
}
