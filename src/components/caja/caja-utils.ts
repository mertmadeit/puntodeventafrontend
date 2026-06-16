import {
  getCategoryAccent,
  mapApiProductToVisualProduct,
  type VisualCatalogProduct,
} from "@/components/shared/product-catalog-utils"
import type { ApiProduct } from "@/lib/api/types"

export type Product = VisualCatalogProduct
export type CartItem = { product: Product; quantity: number }
export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia"

export type SaleTicket = {
  id: string
  items: CartItem[]
  total: number
  method: PaymentMethod
  change: number
  client: string
  date: string
}

export const DEFAULT_CLIENT = "Publico general"
export const TAX_RATE = 0.16

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
  Efectivo: "efectivo",
  Tarjeta: "tarjeta",
  Transferencia: "transferencia",
}

/** Convierte productos de API al modelo visual de la caja. */
export function mapProduct(item: ApiProduct): Product {
  return mapApiProductToVisualProduct(item)
}

/** Calcula subtotal antes de IVA. */
export function calculateSubtotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}

/** Calcula unidades totales del ticket actual. */
export function calculateCartCount(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

/** Devuelve productos sin codigo para el catalogo manual. */
export function getManualProducts(products: Product[]) {
  return products.filter((product) => !product.barcode.trim())
}

/** Construye las categorias disponibles en el catalogo manual. */
export function getCatalogCategories(products: Product[]) {
  return ["Todos", ...Array.from(new Set(products.map((product) => product.category))).sort()]
}

/** Filtra el catalogo visible por categoria y texto. */
export function filterManualCatalog(products: Product[], categoryFilter: string, search: string) {
  const term = search.trim().toLowerCase()

  return products.filter((product) => {
    if (categoryFilter !== "Todos" && product.category !== categoryFilter) return false
    if (!term) return true
    return (
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    )
  })
}

/** Busca coincidencias para el autocomplete de nombre o codigo de barras. */
export function findAutocompleteMatches(products: Product[], search: string) {
  const term = search.trim().toLowerCase()
  if (!term) return []

  return products
    .filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.barcode.toLowerCase().includes(term)
    )
    .slice(0, 8)
}

/** Busca un producto por codigo exacto de barras. */
export function findProductByBarcode(products: Product[], barcode: string) {
  const code = barcode.trim()
  if (!code) return undefined
  return products.find((product) => product.barcode.trim() === code)
}

/** Regresa icono visual para chips de categoria. */
export function getCategoryIcon(category: string) {
  if (category === "Todos") return "🏪"
  return getCategoryAccent(category).emoji
}

/** Construye items para el payload de venta. */
export function buildSalePayloadItems(cart: CartItem[]) {
  return cart.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
  }))
}

/** Formatea la hora del ticket devuelto por backend. */
export function formatTicketTime(dateTime: string) {
  return new Date(dateTime).toLocaleString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
