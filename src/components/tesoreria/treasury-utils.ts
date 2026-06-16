export const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
})

/** Convierte fechas de API a Date sin romper la vista si llegan vacias o invalidas. */
export function parseDateTime(value: string) {
  const parsed = new Date(value.trim().replace(" ", "T"))
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

/** Formatea fecha y hora para movimientos y cortes de caja. */
export function formatDateTime(value: string) {
  const parsed = parseDateTime(value)
  if (!parsed) return value
  return dateTimeFormatter.format(parsed)
}

/** Muestra solo hora/minuto para turnos activos. */
export function formatTime(value: string) {
  const parsed = parseDateTime(value)
  if (!parsed) return value.slice(11, 16) || value
  return timeFormatter.format(parsed)
}

/** Devuelve color segun si el importe representa diferencia positiva o negativa. */
export function moneyClass(value: number) {
  if (value > 0) return "text-emerald-600"
  if (value < 0) return "text-rose-600"
  return "text-muted-foreground"
}
