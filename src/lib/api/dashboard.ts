import { apiFetch } from "@/lib/api/client"
import type {
  ApiDashboardSummary,
  ApiDashboardSeriesPoint,
} from "@/lib/api/types"

export async function fetchDashboardSummary() {
  return apiFetch<ApiDashboardSummary>("/api/dashboard/resumen")
}

export async function fetchDashboardSeries() {
  return apiFetch<ApiDashboardSeriesPoint[]>("/api/dashboard/series")
}
