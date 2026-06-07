import { apiFetch } from "@/lib/api/client"
import type { ApiVentaReporte } from "@/lib/api/types"

type VentaReportePayload = {
  nombre: string
  desde: string
  hasta: string
  generadoPor: string
}

export async function fetchVentaReportes() {
  return apiFetch<ApiVentaReporte[]>("/api/reportes/ventas")
}

export async function createVentaReporte(payload: VentaReportePayload) {
  return apiFetch<ApiVentaReporte>("/api/reportes/ventas", {
    method: "POST",
    body: payload,
  })
}
