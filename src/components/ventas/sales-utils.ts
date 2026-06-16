import type { ApiSale } from "@/lib/api/types"

export type SaleStatus = "Pagado" | "Cancelado" | "Devuelto"
export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia"
export type DateFilter = "all" | "ayer" | "semana" | "mes"

export type SaleItem = {
  name: string
  quantity: number
}

export type UserRow = {
  id: number
  ticketId: string
  dateTime: string
  cashier: string
  client: string
  total: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  items: SaleItem[]
  cancellationReason?: string
}

const saleDateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

/** Adapta ventas de API al modelo editable de la tabla. */
export function mapApiSaleToRow(sale: ApiSale): UserRow {
  return {
    id: Number(sale.id),
    ticketId: sale.ticketId,
    dateTime: sale.dateTime,
    cashier: sale.cashier,
    client: sale.client,
    total: Number(sale.total),
    paymentMethod: sale.paymentMethod as PaymentMethod,
    status: sale.status as SaleStatus,
    items: sale.items ?? [],
    cancellationReason: sale.cancellationReason,
  }
}

/** Formatea la fecha de venta para mostrarla en tabla y detalle. */
export function formatSaleDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return saleDateTimeFormatter.format(parsed)
}

/** Aplica filtros rapidos de fecha usados en la tabla de ventas. */
export function matchesDateFilter(saleDate: Date, filter: DateFilter) {
  if (filter === "all") return true

  const now = new Date()
  if (Number.isNaN(saleDate.getTime())) return false

  if (filter === "ayer") {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    return saleDate.toDateString() === yesterday.toDateString()
  }

  if (filter === "semana") {
    const start = new Date(now)
    start.setDate(now.getDate() - 7)
    return saleDate >= start && saleDate <= now
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return saleDate >= startOfMonth && saleDate <= now
}
