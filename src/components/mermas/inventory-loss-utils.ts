import {
  mapApiProductToCatalogProduct,
  type CatalogProduct,
} from "@/components/shared/product-catalog-utils"
import type { ApiProduct } from "@/lib/api/types"

export type Product = CatalogProduct

export type CartItem = {
  product: Product
  quantity: number
}

export const LOSS_REASONS = [
  "Caducidad",
  "Dañado / Roto",
  "Robo / Pérdida",
  "Consumo Interno",
]

/** Adapta productos de API al catalogo usado para mermas. */
export function mapProductForLoss(item: ApiProduct): Product {
  return mapApiProductToCatalogProduct(item)
}

/** Calcula las unidades totales que se daran de baja. */
export function calculateCartCount(cart: Pick<CartItem, "quantity">[]) {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

/** Construye el payload esperado por el backend para registrar mermas. */
export function buildLossPayload(motivo: string, cart: CartItem[]) {
  return {
    motivo,
    items: cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
  }
}

/** Refleja en pantalla el stock descontado por una merma exitosa. */
export function applyLossStock(products: Product[], cart: CartItem[]) {
  return products.map((product) => {
    const inCart = cart.find((item) => item.product.id === product.id)
    if (!inCart) return product
    return { ...product, stock: Math.max(0, product.stock - inCart.quantity) }
  })
}
