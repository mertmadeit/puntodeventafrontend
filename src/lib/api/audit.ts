import { apiFetch } from "@/lib/api/client"
import type { ApiAuditLog } from "@/lib/api/types"

export async function fetchAuditLogs() {
  return apiFetch<ApiAuditLog[]>("/api/audit")
}
