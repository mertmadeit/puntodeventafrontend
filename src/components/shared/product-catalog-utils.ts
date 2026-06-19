import type { ApiProduct } from "@/lib/api/types"

export type ProductAccent = {
  emoji: string
  bg: string
}

export type CatalogProduct = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  barcode: string
  bg: string
  providerId: number
  providerName: string
}

export type VisualCatalogProduct = CatalogProduct & {
  emoji: string
}

const CATEGORY_ACCENTS: Record<string, ProductAccent> = {
  bebidas: { emoji: "🥤", bg: "#f0f9ff" },
  snacks: { emoji: "🍪", bg: "#fff7ed" },
  lacteos: { emoji: "🥛", bg: "#eff6ff" },
  panaderia: { emoji: "🍞", bg: "#fffbeb" },
  limpieza: { emoji: "🧹", bg: "#ecfeff" },
}

const DEFAULT_ACCENT: ProductAccent = {
  emoji: "📦",
  bg: "#f8fafc",
}

/** Normaliza categorias para compartir filtros, colores e iconos entre modulos. */
export function normalizeCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
}

/** Regresa el acento visual asociado a una categoria conocida. */
export function getCategoryAccent(category: string): ProductAccent {
  return CATEGORY_ACCENTS[normalizeCategory(category)] ?? DEFAULT_ACCENT
}

/** Adapta productos de API al modelo ligero usado por catalogos y carritos. */
export function mapApiProductToCatalogProduct(item: ApiProduct): CatalogProduct {
  const category = item.category || "General"
  return {
    id: Number(item.id),
    name: item.name,
    category,
    price: Number(item.price),
    stock: Number(item.stock),
    barcode: item.barcode ?? "",
    bg: getCategoryAccent(category).bg,
    providerId: Number(item.providerId ?? 0),
    providerName: item.providerName ?? "",
  }
}

/** Adapta productos de API al modelo visual completo que usa la caja. */
export function mapApiProductToVisualProduct(item: ApiProduct): VisualCatalogProduct {
  const product = mapApiProductToCatalogProduct(item)
  return {
    ...product,
    emoji: getCategoryAccent(product.category).emoji,
  }
}

/** Filtra productos por nombre, codigo de barras o categoria. */
export function filterCatalogProducts<T extends CatalogProduct>(products: T[], search: string) {
  const term = search.trim().toLowerCase()
  if (!term) return products

  return products.filter((product) =>
    product.name.toLowerCase().includes(term) ||
    product.barcode.toLowerCase().includes(term) ||
    product.category.toLowerCase().includes(term)
  )
}
