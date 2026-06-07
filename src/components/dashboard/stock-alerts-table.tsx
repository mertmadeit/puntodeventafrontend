"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { fetchStockAlerts } from "@/lib/api/catalog"
import { downloadPdfReport } from "@/lib/report-pdf"
import type { ApiProduct } from "@/lib/api/types"

type StockAlertKind = "sin-stock" | "stock-bajo"

type StockAlertRow = {
  id: number
  producto: string
  categoria: string
  stock: number
  stockMinimo: number
  faltante: number
  alerta: StockAlertKind
}

type ExampleProduct = {
  id: number
  producto: string
  categoria: string
  stock: number
  stockMinimo: number
}

function alertLabel(kind: StockAlertKind) {
  return kind === "sin-stock" ? "Sin stock" : "Stock bajo"
}

function buildAlertRows(productos: ExampleProduct[]): StockAlertRow[] {
  const results: StockAlertRow[] = []

  for (const item of productos) {
    if (item.stock <= 0) {
      results.push({
        id: item.id,
        producto: item.producto,
        categoria: item.categoria,
        stock: item.stock,
        stockMinimo: item.stockMinimo,
        faltante: Math.max(item.stockMinimo - item.stock, 0),
        alerta: "sin-stock",
      })
      continue
    }

    if (item.stock <= item.stockMinimo) {
      results.push({
        id: item.id,
        producto: item.producto,
        categoria: item.categoria,
        stock: item.stock,
        stockMinimo: item.stockMinimo,
        faltante: Math.max(item.stockMinimo - item.stock, 0),
        alerta: "stock-bajo",
      })
    }
  }

  results.sort((a, b) => {
    if (a.alerta !== b.alerta) return a.alerta === "sin-stock" ? -1 : 1
    return b.faltante - a.faltante
  })

  return results
}

export function StockAlertsTable() {
  const [products, setProducts] = React.useState<ExampleProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  React.useEffect(() => {
    let active = true

    const loadAlerts = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const data = await fetchStockAlerts()
        if (!active) return
        const mapped = data.map((item: ApiProduct) => ({
          id: Number(item.id),
          producto: item.name,
          categoria: item.category,
          stock: Number(item.stock),
          stockMinimo: Number(item.minStock ?? 0),
        }))
        setProducts(mapped)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar alertas"
        setErrorMessage(message)
        setProducts([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAlerts()

    return () => {
      active = false
    }
  }, [])

  const rows = React.useMemo(() => buildAlertRows(products), [products])

  const paginatedRows = React.useMemo(() => {
    return rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [rows, currentPage, pageSize])

  const sinStock = React.useMemo(
    () => rows.filter((row) => row.alerta === "sin-stock").length,
    [rows]
  )
  const stockBajo = React.useMemo(
    () => rows.filter((row) => row.alerta === "stock-bajo").length,
    [rows]
  )

  function onDownload() {
    downloadPdfReport({
      filename: "reporte-stock-bajo-sin-stock.pdf",
      title: "Stock bajo / Sin stock",
      subtitle: "Productos que requieren reposicion.",
      summary: [
        ["Sin stock", String(sinStock)],
        ["Stock bajo", String(stockBajo)],
        ["Total alertas", String(rows.length)],
      ],
      columns: [
        { header: "Producto", dataKey: "producto" },
        { header: "Categoria", dataKey: "categoria" },
        { header: "Actual", dataKey: "stock" },
        { header: "Minimo", dataKey: "stockMinimo" },
        { header: "Faltante", dataKey: "faltante" },
        { header: "Alerta", dataKey: "alerta" },
      ],
      rows: rows.map((row) => ({
        producto: row.producto,
        categoria: row.categoria,
        stock: row.stock,
        stockMinimo: row.stockMinimo,
        faltante: row.faltante,
        alerta: alertLabel(row.alerta),
      })),
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Stock bajo / Sin stock</h2>
            <p className="text-sm text-muted-foreground">Productos que requieren reposicion.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-10 w-full rounded-full px-4 text-sm font-semibold sm:w-auto sm:min-w-44 sm:self-end"
              onClick={onDownload}
              disabled={rows.length === 0}
            >
              Descargar reporte
            </Button>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Cargando alertas...</p>}
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      </div>

      <div className="overflow-x-auto px-2 pt-1 pb-2 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/70">
              <TableHead className="px-5 py-4 font-semibold">Producto</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Categoria</TableHead>
              <TableHead className="px-5 py-4 text-right font-semibold">Actual</TableHead>
              <TableHead className="px-5 py-4 text-right font-semibold">Minimo</TableHead>
              <TableHead className="px-5 py-4 text-right font-semibold">Faltante</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Alerta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length ? (
              paginatedRows.map((row) => (
                <TableRow key={row.id} className="border-border/60 align-top transition-colors hover:bg-muted/30">
                  <TableCell className="px-5 py-4 font-medium">
                    <div className="space-y-1">
                      <span className="block truncate text-sm font-semibold">{row.producto}</span>
                      <span className="text-xs text-muted-foreground">
                        Reponer {row.faltante} unidad{row.faltante === 1 ? "" : "es"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">{row.categoria}</TableCell>
                  <TableCell className="px-5 py-4 text-right text-sm font-medium text-muted-foreground">
                    {row.stock}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right text-sm text-muted-foreground">
                    {row.stockMinimo}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right text-sm font-semibold">{row.faltante}</TableCell>
                  <TableCell className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                        row.alerta === "sin-stock"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          row.alerta === "sin-stock" ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />
                      {alertLabel(row.alerta)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  No hay productos con stock bajo o sin stock.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(rows.length / pageSize)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
