import {
  mapApiProductToCatalogProduct,
  type CatalogProduct,
} from "@/components/shared/product-catalog-utils"
import type { ApiProduct } from "@/lib/api/types"

export type Product = CatalogProduct

export type Provider = {
  id: number
  nombre: string
}

export type CartItem = {
  product: Product
  quantity: number
  costo: number
}

export const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

/** Adapta productos de API al catalogo usado en compras. */
export function mapProductForPurchase(item: ApiProduct): Product {
  return mapApiProductToCatalogProduct(item)
}

/** Calcula el importe total del carrito de compra. */
export function calculatePurchaseTotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.costo * item.quantity, 0)
}

/** Calcula las unidades totales del carrito de compra. */
export function calculateCartCount(cart: Pick<CartItem, "quantity">[]) {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

/** Construye el payload esperado por el backend para registrar compras. */
export function buildPurchasePayload(proveedorId: string, cart: CartItem[]) {
  return {
    proveedorId: Number(proveedorId),
    items: cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      costo: item.costo,
    })),
  }
}

/** Refleja en pantalla el stock agregado por una compra exitosa. */
export function applyPurchasedStock(products: Product[], cart: CartItem[]) {
  return products.map((product) => {
    const inCart = cart.find((item) => item.product.id === product.id)
    if (!inCart) return product
    return { ...product, stock: product.stock + inCart.quantity }
  })
}
