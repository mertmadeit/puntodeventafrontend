import type { ApiCategory, ApiProduct } from "@/lib/api/types"

export type CategoryRow = {
  id: number
  nombre: string
  slug: string
}

export type CategoryFormValues = {
  nombre: string
  slug: string
}

export type CategoryMetricsRow = CategoryRow & {
  metrics: {
    productsCount: number
    totalUnits: number
    totalValue: number
    averagePrice: number
  }
}

export type CategorySummary = {
  totalCategories: number
  totalProducts: number
  totalInventoryValue: number
  totalUnits: number
  mostUsedCategory?: CategoryMetricsRow
}

export const EMPTY_FORM: CategoryFormValues = {
  nombre: "",
  slug: "",
}

export const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

/** Convierte el nombre visible de una categoria en un slug estable para la API. */
export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

/** Adapta la categoria de backend al formato que usa la pantalla. */
export function mapApiCategoryToRow(category: ApiCategory): CategoryRow {
  return {
    id: Number(category.id),
    nombre: category.name,
    slug: category.slug ?? slugify(category.name),
  }
}

/** Calcula metricas de inventario agrupadas por categoria. */
export function buildCategoryRows(rows: CategoryRow[], products: ApiProduct[]): CategoryMetricsRow[] {
  return rows.map((category) => {
    const categoryProducts = products.filter(
      (product) => product.category === category.slug || product.category === category.nombre
    )
    const totalUnits = categoryProducts.reduce((total, product) => total + product.stock, 0)
    const totalValue = categoryProducts.reduce((total, product) => total + product.stock * product.price, 0)
    const averagePrice =
      categoryProducts.length > 0
        ? categoryProducts.reduce((total, product) => total + product.price, 0) /
          categoryProducts.length
        : 0

    return {
      ...category,
      metrics: {
        productsCount: categoryProducts.length,
        totalUnits,
        totalValue,
        averagePrice,
      },
    }
  })
}

/** Resume el catalogo completo para las tarjetas superiores. */
export function buildCategorySummary(categoryRows: CategoryMetricsRow[], products: ApiProduct[]): CategorySummary {
  const mostUsedCategory = categoryRows.reduce<CategoryMetricsRow | undefined>((best, current) => {
    if (!best) return current
    return current.metrics.productsCount > best.metrics.productsCount ? current : best
  }, undefined)

  return {
    totalCategories: categoryRows.length,
    totalProducts: products.length,
    totalInventoryValue: products.reduce((total, product) => total + product.stock * product.price, 0),
    totalUnits: products.reduce((total, product) => total + product.stock, 0),
    mostUsedCategory,
  }
}
