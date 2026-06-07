"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  MoreVerticalCircle01Icon,
} from "@hugeicons/core-free-icons"
import { fetchCategories } from "@/lib/api/catalog"
import type { ApiCategory } from "@/lib/api/types"
import { apiFetch } from "@/lib/api/client"
import { toast } from "sonner"

type StockState = "suficiente" | "bajo" | "agotado"
type InventoryTab = "todos" | "faltantes" | "agotados"

export type InventoryRow = {
  id: number
  producto: string
  categoria: string
  codigoBarras: string
  stock: number
  stockMinimo: number
  precio: number
  unidad: string
}

type ProductFormValues = {
  producto: string
  categoria: string
  codigoBarras: string
  stock: string
  stockMinimo: string
  precio: string
  unidad: string
}

const EMPTY_PRODUCT_FORM: ProductFormValues = {
  producto: "",
  categoria: "",
  codigoBarras: "",
  stock: "0",
  stockMinimo: "0",
  precio: "0.00",
  unidad: "pzas",
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

function getStockState(row: InventoryRow): StockState {
  if (row.stock <= 0) return "agotado"
  if (row.stock <= row.stockMinimo) return "bajo"
  return "suficiente"
}

function stockStateLabel(state: StockState) {
  if (state === "agotado") return "Agotado"
  if (state === "bajo") return "Stock bajo"
  return "Stock suficiente"
}

function stockBadgeClass(state: StockState) {
  if (state === "suficiente") return "border-emerald-500/40 text-emerald-600"
  if (state === "bajo") return "border-amber-500/40 text-amber-600"
  return "border-rose-500/40 text-rose-600"
}

export function DataTable({
  data: initialData,
}: {
  data: InventoryRow[]
}) {
  const [rows, setRows] = React.useState<InventoryRow[]>(initialData)
  const [activeTab, setActiveTab] = React.useState<InventoryTab>("todos")
  const [search, setSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  const [filterOpen, setFilterOpen] = React.useState(false)

  const [productOpen, setProductOpen] = React.useState(false)
  const [productEditingId, setProductEditingId] = React.useState<number | null>(null)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [productForm, setProductForm] = React.useState<ProductFormValues>(EMPTY_PRODUCT_FORM)
  const [categories, setCategories] = React.useState<ApiCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = React.useState(true)
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null)

  const [editingPriceId, setEditingPriceId] = React.useState<number | null>(null)
  const [priceDraft, setPriceDraft] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)
  const scannerBufferRef = React.useRef("")
  const scannerTimeoutRef = React.useRef<number | null>(null)

  const deferredSearch = React.useDeferredValue(search)
  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const isEditingProduct = productEditingId !== null
  const categoryOptions = React.useMemo(
    () =>
      categories
        .map((category) => category.name.trim())
        .filter((name, index, names) => name && names.indexOf(name) === index),
    [categories]
  )

  React.useLayoutEffect(() => {
    // eslint-disable-next-line
    setRows(initialData)
  }, [initialData])

  React.useEffect(() => {
    let active = true

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        setCategoriesError(null)
        const data = await fetchCategories()
        if (!active) return
        setCategories(data)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudieron cargar categorias"
        setCategoriesError(message)
        setCategories([])
      } finally {
        if (active) setCategoriesLoading(false)
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [])



  React.useEffect(() => {
    function clearScannerBuffer() {
      scannerBufferRef.current = ""

      if (scannerTimeoutRef.current !== null) {
        window.clearTimeout(scannerTimeoutRef.current)
        scannerTimeoutRef.current = null
      }
    }

    function isEditableTarget(target: EventTarget | null) {
      if (!target) return false

      const element = target as HTMLElement
      return (
        element.isContentEditable ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      )
    }

    function applyBarcodeSearch(code: string) {
      setSearch(code)
      setActiveTab("todos")
      setCurrentPage(1)
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isEditableTarget(event.target)) return

      if (event.key === "Enter") {
        const code = scannerBufferRef.current.trim()
        if (code.length >= 4) {
          applyBarcodeSearch(code)
          event.preventDefault()
        }
        clearScannerBuffer()
        return
      }

      if (event.key.length !== 1) return

      scannerBufferRef.current += event.key

      if (scannerTimeoutRef.current !== null) {
        window.clearTimeout(scannerTimeoutRef.current)
      }

      scannerTimeoutRef.current = window.setTimeout(() => {
        const code = scannerBufferRef.current.trim()

        if (code.length >= 8) {
          applyBarcodeSearch(code)
        }

        clearScannerBuffer()
      }, 120)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      clearScannerBuffer()
    }
  }, [productOpen, filterOpen])

  const filteredRows = React.useMemo(
    () =>
      rows.filter((row) => {
        const stockState = getStockState(row)

        if (activeTab === "faltantes" && stockState === "suficiente") return false
        if (activeTab === "agotados" && stockState !== "agotado") return false

        if (!normalizedSearch) return true

        return (
          row.producto.toLowerCase().includes(normalizedSearch) ||
          row.categoria.toLowerCase().includes(normalizedSearch) ||
          row.codigoBarras.toLowerCase().includes(normalizedSearch)
        )
      }),
    [activeTab, normalizedSearch, rows]
  )

  const paginatedRows = React.useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredRows, currentPage, pageSize])

  function updateProductForm(field: keyof ProductFormValues, value: string) {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function resetProductForm() {
    setProductEditingId(null)
    setProductForm(EMPTY_PRODUCT_FORM)
  }

  function closeProductSheet() {
    setProductOpen(false)
    resetProductForm()
  }

  const openCreateProduct = React.useCallback(() => {
    resetProductForm()
    setProductOpen(true)
  }, [])

  const openEditProduct = React.useCallback((row: InventoryRow) => {
    setProductEditingId(row.id)
    setProductForm({
      producto: row.producto,
      categoria: row.categoria,
      codigoBarras: row.codigoBarras,
      stock: String(row.stock),
      stockMinimo: String(row.stockMinimo),
      precio: row.precio.toFixed(2),
      unidad: row.unidad,
    })
    setProductOpen(true)
  }, [])

  async function saveProduct() {
    if (!productForm.producto.trim()) return

    try {
      // Resolve category name to ID
      const matchedCat = categories.find(
        (c) => c.name.trim().toLowerCase() === productForm.categoria.trim().toLowerCase()
      )
      const categoriaId = matchedCat ? matchedCat.id : null

      // Backend expects snake_case Spanish field names
      const payload: Record<string, unknown> = {
        nombre: productForm.producto,
        codigo_barras: productForm.codigoBarras || "",
        categoria_id: categoriaId,
        stock: Number(productForm.stock),
        stock_minimo: Number(productForm.stockMinimo),
        precio: Number(productForm.precio),
        unidad: productForm.unidad,
      }

      if (productEditingId) {
        await apiFetch(`/api/products/${productEditingId}`, {
          method: "PUT",
          body: payload,
        })
        setRows((prev) =>
          prev.map((r) =>
            r.id === productEditingId
              ? {
                  ...r,
                  producto: productForm.producto,
                  categoria: productForm.categoria,
                  codigoBarras: productForm.codigoBarras ?? "",
                  stock: Number(productForm.stock),
                  stockMinimo: Number(productForm.stockMinimo),
                  precio: Number(productForm.precio),
                  unidad: productForm.unidad,
                }
              : r
          )
        )
      } else {
        const created = await apiFetch<{ id: number }>("/api/products", {
          method: "POST",
          body: payload,
        })
        setRows((prev) => [
          {
            id: Number(created.id),
            producto: productForm.producto,
            categoria: productForm.categoria,
            codigoBarras: productForm.codigoBarras ?? "",
            stock: Number(productForm.stock),
            stockMinimo: Number(productForm.stockMinimo),
            precio: Number(productForm.precio),
            unidad: productForm.unidad,
          },
          ...prev,
        ])
      }
      closeProductSheet()
      toast.success(productEditingId ? "Producto actualizado" : "Producto creado")
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Hubo un error al guardar el producto")
    }
  }

  function deleteProduct() {
    // Obsolete
  }

  async function confirmDelete() {
    if (!deletingId) return

    try {
      await apiFetch(`/api/products/${deletingId}`, {
        method: "DELETE",
      })
      setRows((prev) => prev.filter((r) => r.id !== deletingId))
      setDeletingId(null)
      toast.success("Producto eliminado")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("No se pudo eliminar el producto porque puede tener datos asociados.")
      setDeletingId(null)
    }
  }

  const startEditPrice = React.useCallback((row: InventoryRow) => {
    setEditingPriceId(row.id)
    setPriceDraft(row.precio.toFixed(2))
  }, [])

  const savePrice = React.useCallback(async () => {
    if (editingPriceId === null) return
    const row = rows.find((r) => r.id === editingPriceId)
    if (!row) return

    const newPrice = Number(priceDraft)
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("El precio debe ser un número válido")
      return
    }

    try {
      // Resolve category name to ID
      const matchedCat = categories.find(
        (c) => c.name.trim().toLowerCase() === row.categoria.trim().toLowerCase()
      )

      const payload: Record<string, unknown> = {
        nombre: row.producto,
        codigo_barras: row.codigoBarras || "",
        categoria_id: matchedCat ? matchedCat.id : null,
        stock: row.stock,
        stock_minimo: row.stockMinimo,
        precio: newPrice,
        unidad: row.unidad,
      }

      await apiFetch(`/api/products/${editingPriceId}`, {
        method: "PUT",
        body: payload,
      })

      setRows((prev) =>
        prev.map((r) =>
          r.id === editingPriceId
            ? { ...r, precio: newPrice }
            : r
        )
      )
      toast.success("Precio actualizado")
    } catch (error) {
      console.error("Error updating price:", error)
      toast.error("No se pudo actualizar el precio")
    } finally {
      setEditingPriceId(null)
      setPriceDraft("")
    }
  }, [editingPriceId, priceDraft, rows, categories])

  const cancelPriceEdit = React.useCallback(() => {
    setEditingPriceId(null)
    setPriceDraft("")
  }, [])

  const clearFilters = React.useCallback(() => {
    setSearch("")
    setActiveTab("todos")
    setCurrentPage(1)
  }, [])

  const tableRows = React.useMemo(() => {
    if (!filteredRows.length) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
            No se encontraron productos.
          </TableCell>
        </TableRow>
      )
    }

    return paginatedRows.map((row) => {
      const stockState = getStockState(row)

      return (
        <TableRow
          key={row.id}
          className="border-border/60 transition-colors hover:bg-muted/30"
        >
          <TableCell className="px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{row.producto}</span>
              <span className="text-xs text-muted-foreground">
                {row.categoria} | Cod: {row.codigoBarras}
              </span>
            </div>
          </TableCell>

          <TableCell className="px-5 py-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={stockBadgeClass(stockState)}>
                {stockStateLabel(stockState)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {row.stock} {row.unidad}
              </span>
            </div>
          </TableCell>

          <TableCell className="px-5 py-4 text-right">
            {editingPriceId === row.id ? (
              <div className="flex items-center justify-end gap-2">
                <Input
                  value={priceDraft}
                  onChange={(event) => setPriceDraft(event.target.value)}
                  className="h-8 w-24"
                  inputMode="decimal"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg px-3"
                  onClick={() => savePrice()}
                >
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-2"
                  onClick={cancelPriceEdit}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="rounded-md border border-transparent px-2 py-1 text-right font-mono text-sm font-medium tabular-nums transition-colors hover:border-border hover:bg-muted/40"
                onClick={() => startEditPrice(row)}
              >
                {currencyFormatter.format(row.precio)}
              </button>
            )}
          </TableCell>

          <TableCell className="px-5 py-4 text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mx-auto size-9 rounded-full border border-border/60 bg-background/80 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
                >
                  <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
                  <span className="sr-only">Abrir acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-52 rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
              >
                <DropdownMenuItem className="rounded-lg px-3 py-2" onSelect={() => openEditProduct(row)}>
                  Modificar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="rounded-lg px-3 py-2"
                  onSelect={() => setDeletingId(row.id)}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      )
    })
  }, [
    paginatedRows,
    filteredRows.length,
    editingPriceId,
    priceDraft,
    savePrice,
    cancelPriceEdit,
    startEditPrice,
    openEditProduct,
    setDeletingId,
  ])

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Inventario</h2>
          <p className="text-sm text-muted-foreground">
            Control rapido de faltantes, precio y ajustes en una sola tabla.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            id="inventario-search"
            ref={searchInputRef}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCurrentPage(1)
            }}
            placeholder="Buscar producto o codigo de barras"
            className="h-9 w-full rounded-xl lg:max-w-sm"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-xl px-4"
              onClick={() => setFilterOpen(true)}
            >
              Filtros
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-10 rounded-xl px-4"
              onClick={openCreateProduct}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Agregar producto
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-2 pt-1 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/70">
              <TableHead className="px-5 py-4 font-semibold">Producto</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Stock</TableHead>
              <TableHead className="px-5 py-4 text-right font-semibold">Precio</TableHead>
              <TableHead className="w-24 px-5 py-4 text-center font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(filteredRows.length / pageSize)}
          onPageChange={setCurrentPage}
        />
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>Filtros de inventario</SheetTitle>
            <SheetDescription>Refina por estado y búsqueda.</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="inventario-search-sheet">Buscar</Label>
              <Input
                id="inventario-search-sheet"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Producto o código de barras"
              />
            </div>

            <div className="grid gap-2">
              <Label>Estado</Label>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as InventoryTab)}
                className="w-full"
              >
                <TabsList className="h-10 w-full rounded-xl bg-muted/40 p-1">
                  <TabsTrigger value="todos" className="rounded-lg">
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="faltantes" className="rounded-lg">
                    Faltantes
                  </TabsTrigger>
                  <TabsTrigger value="agotados" className="rounded-lg">
                    Agotados
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
            <Button type="button" onClick={() => setFilterOpen(false)}>
              Aplicar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        open={productOpen}
        onOpenChange={(nextOpen) => {
          setProductOpen(nextOpen)
          if (!nextOpen) {
            resetProductForm()
          }
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>{isEditingProduct ? "Modificar producto" : "Agregar producto"}</SheetTitle>
            <SheetDescription>
              {isEditingProduct
                ? "Actualiza los datos del producto seleccionado."
                : "Completa los datos para registrar un nuevo producto."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="grid flex-1 gap-4 overflow-y-auto px-4 py-5">
              <div className="grid gap-2">
                <Label htmlFor="producto-nombre">Producto</Label>
                <Input
                  id="producto-nombre"
                  value={productForm.producto}
                  onChange={(event) => updateProductForm("producto", event.target.value)}
                  placeholder="Ej. Atun Gloria 170g"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="producto-categoria">Categoria</Label>
                <Select
                  value={productForm.categoria}
                  onValueChange={(value) => updateProductForm("categoria", value)}
                  disabled={categoriesLoading || categoryOptions.length === 0}
                >
                  <SelectTrigger id="producto-categoria" className="h-10 rounded-lg">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? "Cargando categorias..."
                          : "Selecciona categoria"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.length ? (
                      categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="sin-categorias" disabled>
                        Sin categorias registradas
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {categoriesError ? (
                  <p className="text-xs text-destructive">{categoriesError}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="producto-codigo">Codigo de barras</Label>
                <Input
                  id="producto-codigo"
                  value={productForm.codigoBarras}
                  onChange={(event) => updateProductForm("codigoBarras", event.target.value)}
                  inputMode="numeric"
                  placeholder="Ej. 7750123456789"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="producto-stock">Stock actual</Label>
                  <Input
                    id="producto-stock"
                    inputMode="numeric"
                    value={productForm.stock}
                    onChange={(event) => updateProductForm("stock", event.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="producto-stock-minimo">Stock minimo</Label>
                  <Input
                    id="producto-stock-minimo"
                    inputMode="numeric"
                    value={productForm.stockMinimo}
                    onChange={(event) => updateProductForm("stockMinimo", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="producto-precio">Precio</Label>
                  <Input
                    id="producto-precio"
                    inputMode="decimal"
                    value={productForm.precio}
                    onChange={(event) => updateProductForm("precio", event.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Unidad</Label>
                  <Select
                    value={productForm.unidad}
                    onValueChange={(value) => updateProductForm("unidad", value)}
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pzas">Piezas</SelectItem>
                      <SelectItem value="bolsas">Bolsas</SelectItem>
                      <SelectItem value="latas">Latas</SelectItem>
                      <SelectItem value="botellas">Botellas</SelectItem>
                      <SelectItem value="cajas">Cajas</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeProductSheet}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveProduct}>
                {isEditingProduct ? "Guardar cambios" : "Crear producto"}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl">Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este producto del inventario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

