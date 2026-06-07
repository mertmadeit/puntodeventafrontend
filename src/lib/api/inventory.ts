import { apiFetch } from "@/lib/api/client"
import type { ApiInventoryItem } from "@/lib/api/types"

export async function fetchInventory() {
  return apiFetch<ApiInventoryItem[]>("/api/inventory")
}
