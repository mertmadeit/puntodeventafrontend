import type { ApiCategory, ApiInventoryItem } from "@/lib/api/types"
import type { ProductPayload } from "@/lib/api/inventory"

export type StockState = "suficiente" | "bajo" | "agotado"
export type InventoryTab = "todos" | "faltantes" | "agotados"

export type InventoryRow = {
  id: number
  producto: string
  categoria: string
  codigoBarras: string
  stock: number
  stockMinimo: number
  precio: number
  unidad: string
  proveedorId: number
  proveedor: string
}

export type InventoryProvider = {
  id: number
  nombre: string
  activo?: boolean
}

export type ProductFormValues = {
  producto: string
  categoria: string
  codigoBarras: string
  stock: string
  stockMinimo: string
  precio: string
  unidad: string
  proveedorId: string
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  producto: "",
  categoria: "",
  codigoBarras: "",
  stock: "0",
  stockMinimo: "0",
  precio: "0.00",
  unidad: "pzas",
  proveedorId: "",
}

export const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

/** Adapta el producto recibido del backend al formato que consume la tabla de inventario. */
export function mapInventoryItemToRow(item: ApiInventoryItem): InventoryRow {
  return {
    id: Number(item.id),
    producto: item.name,
    categoria: item.category,
    codigoBarras: item.barcode ?? "",
    stock: Number(item.stock),
    stockMinimo: Number(item.minStock),
    precio: Number(item.price),
    unidad: item.unit,
    proveedorId: Number(item.providerId ?? 0),
    proveedor: item.providerName ?? "Sin proveedor",
  }
}

/** Clasifica visualmente el stock segun existencia actual y minimo configurado. */
export function getStockState(row: InventoryRow): StockState {
  if (row.stock <= 0) return "agotado"
  if (row.stock <= row.stockMinimo) return "bajo"
  return "suficiente"
}

/** Devuelve la etiqueta visible para el estado de stock. */
export function stockStateLabel(state: StockState) {
  if (state === "agotado") return "Agotado"
  if (state === "bajo") return "Stock bajo"
  return "Stock suficiente"
}

/** Devuelve las clases de color del badge de stock. */
export function stockBadgeClass(state: StockState) {
  if (state === "suficiente") return "border-emerald-500/40 text-emerald-600"
  if (state === "bajo") return "border-amber-500/40 text-amber-600"
  return "border-rose-500/40 text-rose-600"
}

/** Construye opciones unicas para el selector de categorias. */
export function buildCategoryOptions(categories: ApiCategory[]) {
  return categories
    .map((category) => category.name.trim())
    .filter((name, index, names) => name && names.indexOf(name) === index)
}

/** Busca el id de categoria que corresponde al nombre elegido en el formulario. */
export function findCategoryId(categories: ApiCategory[], categoryName: string) {
  const normalizedName = categoryName.trim().toLowerCase()
  const matchedCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === normalizedName
  )
  return matchedCategory ? matchedCategory.id : null
}

/** Convierte el formulario del producto al payload que espera el backend. */
export function productFormToPayload(values: ProductFormValues, categories: ApiCategory[]): ProductPayload {
  return {
    nombre: values.producto,
    codigo_barras: values.codigoBarras || "",
    categoria_id: findCategoryId(categories, values.categoria),
    proveedor_id: Number(values.proveedorId),
    stock: Number(values.stock),
    stock_minimo: Number(values.stockMinimo),
    precio: Number(values.precio),
    unidad: values.unidad,
  }
}

/** Convierte el formulario a una fila local optimista despues de crear o editar. */
export function productFormToRow(values: ProductFormValues, id: number, providers: InventoryProvider[]): InventoryRow {
  const provider = providers.find((item) => String(item.id) === values.proveedorId)
  return {
    id,
    producto: values.producto,
    categoria: values.categoria,
    codigoBarras: values.codigoBarras || "",
    stock: Number(values.stock),
    stockMinimo: Number(values.stockMinimo),
    precio: Number(values.precio),
    unidad: values.unidad,
    proveedorId: Number(values.proveedorId),
    proveedor: provider?.nombre ?? "Sin proveedor",
  }
}

/** Carga una fila existente dentro del formulario de edicion. */
export function inventoryRowToForm(row: InventoryRow): ProductFormValues {
  return {
    producto: row.producto,
    categoria: row.categoria,
    codigoBarras: row.codigoBarras,
    stock: String(row.stock),
    stockMinimo: String(row.stockMinimo),
    precio: row.precio.toFixed(2),
    unidad: row.unidad,
    proveedorId: row.proveedorId ? String(row.proveedorId) : "",
  }
}

/** Reutiliza una fila de inventario para actualizar solo el precio sin perder datos. */
export function inventoryRowToPayload(row: InventoryRow, categories: ApiCategory[], price = row.precio): ProductPayload {
  return {
    nombre: row.producto,
    codigo_barras: row.codigoBarras || "",
    categoria_id: findCategoryId(categories, row.categoria),
    proveedor_id: row.proveedorId,
    stock: row.stock,
    stock_minimo: row.stockMinimo,
    precio: price,
    unidad: row.unidad,
  }
}
