"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchProducts,
  updateCategory,
} from "@/lib/api/catalog"
import type { ApiProduct } from "@/lib/api/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ChartUpIcon,
  MoreVerticalCircle01Icon,
  Package02Icon,
} from "@hugeicons/core-free-icons"

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

type CategoryRow = {
  id: number
  nombre: string
  slug: string
}

type CategoryFormValues = {
  nombre: string
  slug: string
}

const EMPTY_FORM: CategoryFormValues = {
  nombre: "",
  slug: "",
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function Categoria() {
  const [rows, setRows] = React.useState<CategoryRow[]>([])
  const [catalogProducts, setCatalogProducts] = React.useState<ApiProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState<CategoryFormValues>(EMPTY_FORM)

  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  const categoryRows = React.useMemo(() => {
    return rows.map((category) => {
      const categoryProducts = catalogProducts.filter(
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
  }, [catalogProducts, rows])

  const paginatedRows = React.useMemo(() => {
    return categoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [categoryRows, currentPage, pageSize])

  const totalCategories = categoryRows.length
  const totalProducts = catalogProducts.length
  const totalInventoryValue = catalogProducts.reduce((total, product) => total + product.stock * product.price, 0)
  const mostUsedCategory = categoryRows.reduce((best, current) => {
    if (!best) return current
    return current.metrics.productsCount > best.metrics.productsCount ? current : best
  }, categoryRows[0])

  React.useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const [categoriesData, productsData] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
        ])

        if (!active) return

        setRows(
          categoriesData.map((category) => ({
            id: Number(category.id),
            nombre: category.name,
            slug: category.slug ?? slugify(category.name),
          }))
        )
        setCatalogProducts(productsData)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar categorias"
        setErrorMessage(message)
        setRows([])
        setCatalogProducts([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function closeSheet() {
    setOpen(false)
    resetForm()
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setOpen(true)
  }

  function openEdit(row: CategoryRow) {
    setEditingId(row.id)
    setForm({
      nombre: row.nombre,
      slug: row.slug,
    })
    setOpen(true)
  }

  async function saveRow() {
    if (!form.nombre.trim()) return

    const nextSlug = form.slug.trim() ? slugify(form.slug) : slugify(form.nombre)
    if (!nextSlug) return

    try {
      setErrorMessage(null)
      if (editingId) {
        const updated = await updateCategory(editingId, {
          name: form.nombre.trim(),
          slug: nextSlug,
        })
        setRows((prev) =>
          prev.map((row) =>
            row.id === editingId
              ? {
                  ...row,
                  nombre: updated.name,
                  slug: updated.slug ?? nextSlug,
                }
              : row
          )
        )
      } else {
        const created = await createCategory({
          name: form.nombre.trim(),
          slug: nextSlug,
        })
        const nextRow: CategoryRow = {
          id: Number(created.id),
          nombre: created.name,
          slug: created.slug ?? nextSlug,
        }
        setRows((prev) => [nextRow, ...prev])
      }

      closeSheet()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la categoria"
      setErrorMessage(message)
    }
  }

  async function onDelete(id: number) {
    try {
      setErrorMessage(null)
      await deleteCategory(id)
      setRows((prev) => prev.filter((row) => row.id !== id))
      if (editingId === id) {
        closeSheet()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la categoria"
      setErrorMessage(message)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando categorias...</p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Categorías activas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalCategories}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-4 shrink-0" />
                Productos: {totalProducts}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Catálogo organizado por categoría
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {mostUsedCategory?.nombre ?? "Sin datos"} es la categoría con más productos.
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Valor total del catálogo</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {currencyFormatter.format(totalInventoryValue)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
                Unidades: {catalogProducts.reduce((total, product) => total + product.stock, 0)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Resumen financiero del surtido
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Promedio por categoría: {currencyFormatter.format(totalInventoryValue / Math.max(totalCategories, 1))}
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Categorías</h2>
            <p className="text-sm text-muted-foreground">
              Administra el catálogo de categorías y su distribución.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{totalCategories} categorías</Badge>
            <Button
              variant="default"
              size="sm"
              className="h-10 rounded-full px-4"
              onClick={openCreate}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Agregar categoría
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto px-2 pt-1 pb-2 sm:px-4 sm:pb-4">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border/70">
                <TableHead className="px-5 py-4 font-semibold">Nombre</TableHead>
                <TableHead className="px-5 py-4 font-semibold">Slug</TableHead>
                <TableHead className="px-5 py-4 font-semibold">Productos</TableHead>
                <TableHead className="px-5 py-4 font-semibold">Unidades</TableHead>
                <TableHead className="px-5 py-4 font-semibold">Precio promedio</TableHead>
                <TableHead className="px-5 py-4 text-right font-semibold">Valor total</TableHead>
                <TableHead className="w-24 px-5 py-4 text-center font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length ? (
                paginatedRows.map((category) => (
                  <TableRow
                    key={category.id}
                    className="border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="px-5 py-4 font-medium">
                      <span className="truncate text-sm font-medium">
                        {category.nombre}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {category.metrics.productsCount}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {category.metrics.totalUnits}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {currencyFormatter.format(category.metrics.averagePrice)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right text-sm text-muted-foreground">
                      {currencyFormatter.format(category.metrics.totalValue)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
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
                          className="w-44 rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
                        >
                          <DropdownMenuItem
                            className="rounded-lg px-3 py-2"
                            onClick={() => openEdit(category)}
                          >
                            Modificar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            className="rounded-lg px-3 py-2"
                            onClick={() => onDelete(category.id)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No hay categorias registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={currentPage}
            totalPages={Math.ceil(categoryRows.length / pageSize)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : closeSheet())}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>{editingId ? "Modificar categoría" : "Agregar categoría"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Actualiza el nombre y el ícono de la categoría."
                : "Completa los datos para registrar una nueva categoría."}
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex flex-1 flex-col px-4 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              saveRow()
            }}
          >
            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <p className="text-sm font-medium text-foreground">Datos básicos</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="categoria-nombre">Nombre</Label>
                  <Input
                    id="categoria-nombre"
                    value={form.nombre}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, nombre: event.target.value }))
                    }
                    placeholder="Ej. Bebidas"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="categoria-slug">Slug</Label>
                  <Input
                    id="categoria-slug"
                    value={form.slug}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, slug: event.target.value }))
                    }
                    placeholder="Ej. bebidas"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="mt-auto grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeSheet}>
                Cancelar
              </Button>
              <Button type="submit">{editingId ? "Guardar" : "Agregar"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

