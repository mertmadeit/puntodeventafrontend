"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  MoreVerticalCircle01Icon,
} from "@hugeicons/core-free-icons"
import {
  currencyFormatter,
  type CategoryMetricsRow,
} from "@/components/categoria/category-utils"

type CategoryTableProps = {
  rows: CategoryMetricsRow[]
  paginatedRows: CategoryMetricsRow[]
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onCreate: () => void
  onEdit: (row: CategoryMetricsRow) => void
  onDelete: (id: number) => void
}

/** Tabla principal de categorias con metricas por fila y acciones de mantenimiento. */
export function CategoryTable({
  rows,
  paginatedRows,
  currentPage,
  pageSize,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Categorias</h2>
          <p className="text-sm text-muted-foreground">
            Administra el catalogo de categorias y su distribucion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{rows.length} categorias</Badge>
          <Button
            variant="default"
            size="sm"
            className="h-10 rounded-full px-4"
            onClick={onCreate}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Agregar categoria
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-2 pt-1 sm:px-4 sm:pb-4">
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
                          onClick={() => onEdit(category)}
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
          totalPages={Math.ceil(rows.length / pageSize)}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  )
}
