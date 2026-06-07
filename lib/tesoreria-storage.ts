export type TesoreriaMovimientoTipo = "entrada" | "retiro"
export type TesoreriaMovimientoCategoria = "operativo" | "proveedor" | "otro"

export type TesoreriaMovimiento = {
  id: number
  timestamp: string
  tipo: TesoreriaMovimientoTipo
  categoria: TesoreriaMovimientoCategoria
  concepto: string
  monto: number
}

export type TesoreriaCorte = {
  id: number
  timestamp: string
  turnoId: string
  cajero: string
  horaApertura: string
  montoInicial: number
  esperado: number
  contado: number
  diferencia: number
}

export const TESORERIA_STORAGE_KEYS = {
  movimientos: "pdv.tesoreria.movimientos.v1",
  cortes: "pdv.tesoreria.cortes.v1",
} as const

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadTesoreriaMovimientos(
  fallback: TesoreriaMovimiento[] = []
): TesoreriaMovimiento[] {
  if (typeof window === "undefined") return fallback
  return safeParseJson<TesoreriaMovimiento[]>(
    window.localStorage.getItem(TESORERIA_STORAGE_KEYS.movimientos),
    fallback
  )
}

export function saveTesoreriaMovimientos(movimientos: TesoreriaMovimiento[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    TESORERIA_STORAGE_KEYS.movimientos,
    JSON.stringify(movimientos)
  )
}

export function loadTesoreriaCortes(
  fallback: TesoreriaCorte[] = []
): TesoreriaCorte[] {
  if (typeof window === "undefined") return fallback
  return safeParseJson<TesoreriaCorte[]>(
    window.localStorage.getItem(TESORERIA_STORAGE_KEYS.cortes),
    fallback
  )
}

export function saveTesoreriaCortes(cortes: TesoreriaCorte[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TESORERIA_STORAGE_KEYS.cortes, JSON.stringify(cortes))
}
