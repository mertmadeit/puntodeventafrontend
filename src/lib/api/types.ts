export type ApiCategory = {
  id: number | string
  name: string
  slug?: string
}

export type ApiProduct = {
  id: number | string
  name: string
  category: string
  price: number
  stock: number
  minStock?: number
  barcode?: string
  unit?: string
  imageUrl?: string
  providerId?: number | string
  providerName?: string
  unitsSold30Days?: number
  averageDailySales?: number
  projectionBaseDate?: string
  estimatedDaysRemaining?: number
  estimatedStockoutDate?: string
}

export type ApiInventoryItem = {
  id: number | string
  name: string
  category: string
  barcode?: string
  stock: number
  minStock: number
  price: number
  unit: string
  fechaCaducidad?: string
  providerId?: number | string
  providerName?: string
}

export type ApiSaleItem = {
  name: string
  quantity: number
}

export type ApiSale = {
  id: number | string
  ticketId: string
  dateTime: string
  cashier: string
  client: string
  subtotal?: number
  iva?: number
  total: number
  paymentMethod: string
  status: string
  items: ApiSaleItem[]
  cancellationReason?: string
}

export type ApiUser = {
  id: number | string
  name: string
  email: string
  role: string
  status: string
  imageUrl?: string
}

export type ApiAuditLog = {
  id: number | string
  timestamp: string
  usuario: string
  evento: string
  detalle: string
}

export type ApiStockAlert = {
  id: number | string
  producto: string
  categoria: string
  stock: number
  stockMinimo: number
}

export type ApiDashboardSummary = {
  ventasHoy: number
  tickets: number
  ticketPromedio: number
  margenNeto: number
  businessDate?: string
  variacionVentas?: number
  variacionTickets?: number
  variacionTicketPromedio?: number
  variacionMargen?: number
}

export type ApiDashboardSeriesPoint = {
  date: string
  desktop: number
  mobile: number
}

export type ApiTesoreriaMovimiento = {
  id: number | string
  timestamp: string
  tipo: "entrada" | "retiro"
  categoria: "operativo" | "proveedor" | "otro"
  concepto: string
  proveedorNombre?: string
  monto: number
}

export type ApiTesoreriaCorte = {
  id: number | string
  timestamp: string
  turnoId: string
  cajero: string
  horaApertura: string
  montoInicial: number
  esperado: number
  contado: number
  diferencia: number
}

export type ApiTesoreriaTurno = {
  id: string
  cajero: string
  horaApertura: string
  montoInicial: number
  ventasEfectivo: number
  movimientosNeto: number
}

export type ApiTesoreriaResumen = {
  fondoCaja: number
  ventasEfectivo: number
  ventasTarjeta: number
  transferencias: number
}

export type ApiVentaReporte = {
  id: number | string
  nombre: string
  desde: string
  hasta: string
  generadoPor: string
  generadoEn: string
}
