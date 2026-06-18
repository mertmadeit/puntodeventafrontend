import { apiFetch } from "@/lib/api/client"
import type {
  ApiTesoreriaCorte,
  ApiTesoreriaMovimiento,
  ApiTesoreriaResumen,
  ApiTesoreriaTurno,
} from "@/lib/api/types"

type CreateTesoreriaMovimientoPayload = {
  tipo: "entrada" | "retiro"
  categoria: "operativo" | "proveedor" | "otro"
  concepto: string
  proveedorNombre?: string
  monto: number
}

type CreateTesoreriaCortePayload = {
  turnoId: string
  cajero: string
  horaApertura: string
  montoInicial: number
  esperado: number
  contado: number
  diferencia: number
}

type CreateTesoreriaTurnoPayload = {
  montoInicial: number
}

export async function fetchTesoreriaResumen() {
  return apiFetch<ApiTesoreriaResumen>("/api/tesoreria/resumen")
}

export async function fetchTesoreriaMovimientos() {
  return apiFetch<ApiTesoreriaMovimiento[]>("/api/tesoreria/movimientos")
}

export async function fetchTesoreriaCortes() {
  return apiFetch<ApiTesoreriaCorte[]>("/api/tesoreria/cortes")
}

export async function fetchTesoreriaTurnos() {
  return apiFetch<ApiTesoreriaTurno[]>("/api/tesoreria/turnos")
}

export async function createTesoreriaTurno(payload: CreateTesoreriaTurnoPayload) {
  return apiFetch<ApiTesoreriaTurno>("/api/tesoreria/turnos", {
    method: "POST",
    body: payload,
  })
}

export async function createTesoreriaMovimiento(payload: CreateTesoreriaMovimientoPayload) {
  return apiFetch<ApiTesoreriaMovimiento>("/api/tesoreria/movimientos", {
    method: "POST",
    body: payload,
  })
}

export async function createTesoreriaCorte(payload: CreateTesoreriaCortePayload) {
  return apiFetch<ApiTesoreriaCorte>("/api/tesoreria/cortes", {
    method: "POST",
    body: payload,
  })
}
