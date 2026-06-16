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

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

/** Convierte fechas de API a Date tolerando valores vacios o invalidos. */
export function parseDateTime(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed.replace(" ", "T"))
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }

  const match = trimmed.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:,)?\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
  )
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    const hour = Number(match[4])
    const minute = Number(match[5])

    const parsed = new Date(year, month - 1, day, hour, minute)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

/** Formatea fecha y hora para tablas de reportes. */
export function formatDateTime(value: string) {
  const parsed = parseDateTime(value)
  if (!parsed) return value
  return dateTimeFormatter.format(parsed)
}

/** Formatea solo la fecha para rangos y filtros. */
export function formatDate(value: string) {
  const parsed = parseDateTime(value)
  if (!parsed) return value
  return dateFormatter.format(parsed)
}

/** Valida si una fecha cae dentro del rango elegido por el usuario. */
export function isWithinDateRange(date: Date | null, from: string, to: string) {
  if (!from && !to) return true
  if (!date) return false

  if (from) {
    const start = new Date(`${from}T00:00:00`)
    if (date < start) return false
  }

  if (to) {
    const end = new Date(`${to}T23:59:59`)
    if (date > end) return false
  }

  return true
}
