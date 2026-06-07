"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ChartHistogramIcon,
  LeftToRightListBulletIcon,
  MoreVerticalCircle01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import {
  createVentaReporte,
  fetchVentaReportes,
} from "@/lib/api/reports"
import { fetchSales } from "@/lib/api/sales"
import {
  fetchTesoreriaCortes,
  fetchTesoreriaMovimientos,
} from "@/lib/api/tesoreria"
import { downloadPdfReport } from "@/lib/report-pdf"
import type {
  ApiTesoreriaCorte,
  ApiTesoreriaMovimiento,
  ApiSale,
  ApiVentaReporte,
} from "@/lib/api/types"

type VentaReporteRow = {
  id: number
  nombre: string
  desde: string
  hasta: string
  generadoPor: string
  generadoEn: string
}

type VentaReporteFormValues = {
  nombre: string
  desde: string
  hasta: string
  generadoPor: string
}

type TesoreriaMovimiento = ApiTesoreriaMovimiento
type TesoreriaCorte = ApiTesoreriaCorte

const EMPTY_VENTA_FORM: VentaReporteFormValues = {
  nombre: "",
  desde: "",
  hasta: "",
  generadoPor: "",
}

const VENTAS_TIPOS_REPORTE = [
  "Ventas por día",
  "Ventas por método de pago",
  "Top productos vendidos",
  "Cortes y movimientos",
  "Reporte de Mermas Mensual",
]

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

function parseDateTime(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed.replace(" ", "T"))
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }

  const match = trimmed.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:,)?\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
  )
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    const hour = Number(match[4])
    const minute = Number(match[5])

    const parsed = new Date(year, month - 1, day, hour, minute)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function formatDateTime(value: string) {
  const parsed = parseDateTime(value)
  if (!parsed) return value
  return dateTimeFormatter.format(parsed)
}

function formatDate(value: string) {
  const parsed = parseDateTime(value)
  if (!parsed) return value
  return dateFormatter.format(parsed)
}

function isWithinDateRange(date: Date | null, from: string, to: string) {
  if (!from && !to) return true
  if (!date) return false

  if (from) {
    const start = new Date(`${from}T00:00:00`)
    if (date < start) return false
  }

  if (to) {
    const end = new Date(`${to}T23:59:59`)
    if (date > end) return false
  }

  return true
}

function VentasReportesTable() {
  const [rows, setRows] = React.useState<VentaReporteRow[]>([])
  const [sales, setSales] = React.useState<ApiSale[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [currentUser, setCurrentUser] = React.useState("Sistema")
  const [search, setSearch] = React.useState("")
  const deferredSearch = React.useDeferredValue(search)

  const [visibleColumns, setVisibleColumns] = React.useState({
    rango: true,
    generadoPor: true,
    generadoEn: true,
  })

  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  const [open, setOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [form, setForm] = React.useState<VentaReporteFormValues>(
    EMPTY_VENTA_FORM
  )
  const [selectedRow, setSelectedRow] = React.useState<VentaReporteRow | null>(null)

  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  React.useEffect(() => {
    let active = true

    const loadReports = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const [data, salesData] = await Promise.all([
          fetchVentaReportes(),
          fetchSales(),
        ])
        if (!active) return
        const mapped = data.map((row: ApiVentaReporte) => ({
          id: Number(row.id),
          nombre: row.nombre,
          desde: row.desde,
          hasta: row.hasta,
          generadoPor: row.generadoPor,
          generadoEn: row.generadoEn,
        }))
        setRows(mapped)
        setSales(salesData)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar reportes"
        setErrorMessage(message)
        setRows([])
        setSales([])
      } finally {
        if (active) setLoading(false)
      }
    }

    const loadUser = () => {
      try {
        const stored = localStorage.getItem("pos.cashierName")
        if (stored) setCurrentUser(stored)
      } catch {
        // ignore
      }
    }

    loadReports()
    loadUser()

    return () => {
      active = false
    }
  }, [])

  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const generatedAt = parseDateTime(row.generadoEn)
      if (!isWithinDateRange(generatedAt, dateFrom, dateTo)) return false

      if (!normalizedSearch) return true
      return row.nombre.toLowerCase().includes(normalizedSearch)
    })
  }, [dateFrom, dateTo, normalizedSearch, rows])

  const paginatedRows = React.useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredRows, currentPage, pageSize])

  function openDetails(row: VentaReporteRow) {
    setSelectedRow(row)
    setDetailOpen(true)
  }

  function closeDetails() {
    setDetailOpen(false)
    setSelectedRow(null)
  }

  function rangeText(row: VentaReporteRow) {
    return row.desde && row.hasta ? `${row.desde} - ${row.hasta}` : "-"
  }

  function normalizeReportName(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ã.|Ã./g, "")
      .toLowerCase()
  }

  function salesForReport(row: VentaReporteRow) {
    return sales.filter((sale) => {
      if (sale.status !== "completada") return false
      return isWithinDateRange(parseDateTime(sale.dateTime), row.desde, row.hasta)
    })
  }

  function buildVentasPdfTable(row: VentaReporteRow, sourceSales: ApiSale[]) {
    const reportName = normalizeReportName(row.nombre)

    if (reportName.includes("ventas por dia") || reportName.includes("ventas por da")) {
      const grouped = new Map<string, { tickets: number; total: number }>()

      for (const sale of sourceSales) {
        const key = formatDate(sale.dateTime)
        const current = grouped.get(key) ?? { tickets: 0, total: 0 }
        current.tickets += 1
        current.total += Number(sale.total)
        grouped.set(key, current)
      }

      return {
        columns: [
          { header: "Fecha", dataKey: "fecha" },
          { header: "Tickets", dataKey: "tickets" },
          { header: "Total", dataKey: "total" },
        ],
        rows: Array.from(grouped.entries()).map(([fecha, item]) => ({
          fecha,
          tickets: item.tickets,
          total: currencyFormatter.format(item.total),
        })),
      }
    }

    if (reportName.includes("metodo de pago") || reportName.includes("mtodo de pago")) {
      const grouped = new Map<string, { tickets: number; total: number }>()

      for (const sale of sourceSales) {
        const key = sale.paymentMethod
        const current = grouped.get(key) ?? { tickets: 0, total: 0 }
        current.tickets += 1
        current.total += Number(sale.total)
        grouped.set(key, current)
      }

      return {
        columns: [
          { header: "Metodo de pago", dataKey: "metodo" },
          { header: "Tickets", dataKey: "tickets" },
          { header: "Total", dataKey: "total" },
        ],
        rows: Array.from(grouped.entries()).map(([metodo, item]) => ({
          metodo,
          tickets: item.tickets,
          total: currencyFormatter.format(item.total),
        })),
      }
    }

    if (reportName.includes("top productos vendidos")) {
      const grouped = new Map<string, number>()

      for (const sale of sourceSales) {
        for (const item of sale.items) {
          grouped.set(item.name, (grouped.get(item.name) ?? 0) + Number(item.quantity))
        }
      }

      return {
        columns: [
          { header: "Producto", dataKey: "producto" },
          { header: "Cantidad vendida", dataKey: "cantidad" },
        ],
        rows: Array.from(grouped.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([producto, cantidad]) => ({
            producto,
            cantidad,
          })),
      }
    }

    return {
      columns: [
        { header: "Ticket", dataKey: "ticket" },
        { header: "Fecha", dataKey: "fecha" },
        { header: "Cajero", dataKey: "cajero" },
        { header: "Cliente", dataKey: "cliente" },
        { header: "Metodo", dataKey: "metodo" },
        { header: "Total", dataKey: "total" },
      ],
      rows: sourceSales.map((sale) => ({
        ticket: sale.ticketId,
        fecha: formatDateTime(sale.dateTime),
        cajero: sale.cashier,
        cliente: sale.client,
        metodo: sale.paymentMethod,
        total: currencyFormatter.format(Number(sale.total)),
      })),
    }
  }

  function downloadReport(row: VentaReporteRow) {
    const reportSales = salesForReport(row)
    const table = buildVentasPdfTable(row, reportSales)
    const total = reportSales.reduce((sum, sale) => sum + Number(sale.total), 0)

    downloadPdfReport({
      filename: `reporte-ventas-${row.id}.pdf`,
      title: row.nombre,
      subtitle: "Reporte de ventas generado con datos de la base de datos",
      summary: [
        ["Rango", rangeText(row)],
        ["Generado por", row.generadoPor],
        ["Generado en", formatDateTime(row.generadoEn)],
        ["Tickets", String(reportSales.length)],
        ["Total ventas", currencyFormatter.format(total)],
      ],
      columns: table.columns,
      rows: table.rows,
    })
  }

  function clearDateFilters() {
    setDateFrom("")
    setDateTo("")
    setCurrentPage(1)
  }

  function resetForm() {
    setForm(EMPTY_VENTA_FORM)
  }

  function closeSheet() {
    setOpen(false)
    resetForm()
  }

  function openCreate() {
    resetForm()
    setForm((prev) => ({ ...prev, generadoPor: currentUser }))
    setOpen(true)
  }

  async function saveRow() {
    if (!form.nombre.trim()) return

    try {
      setErrorMessage(null)
      const created = await createVentaReporte({
        nombre: form.nombre.trim(),
        desde: form.desde,
        hasta: form.hasta,
        generadoPor: form.generadoPor.trim() || "Sistema",
      })

      const nextRow: VentaReporteRow = {
        id: Number(created.id),
        nombre: created.nombre,
        desde: created.desde,
        hasta: created.hasta,
        generadoPor: created.generadoPor,
        generadoEn: created.generadoEn,
      }

      setRows((prev) => [nextRow, ...prev])
      closeSheet()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el reporte"
      setErrorMessage(message)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Reportes</h2>
          <p className="text-sm text-muted-foreground">
            Genera y administra reportes listos para auditoría y exportación.
          </p>
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">Cargando reportes...</p>
        )}
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[220px] shrink-0">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="size-4 text-muted-foreground"
                  strokeWidth={2}
                />
              </div>
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Buscar reporte..."
                className="h-9 w-full rounded-xl bg-muted/40 pl-9 transition-colors hover:bg-muted/60 focus:bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-[130px] shrink-0 rounded-xl bg-muted/40 transition-colors hover:bg-muted/60 focus:bg-background"
              />
              <span className="text-muted-foreground text-sm font-medium">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-[130px] shrink-0 rounded-xl bg-muted/40 transition-colors hover:bg-muted/60 focus:bg-background"
              />
            </div>

            {dateFrom || dateTo ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 rounded-xl text-muted-foreground"
                onClick={clearDateFilters}
              >
                Limpiar
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 rounded-xl bg-background shadow-sm"
                >
                  <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border-border/70 p-1"
              >
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.rango}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({ ...prev, rango: !!checked }))
                  }
                >
                  Rango
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.generadoPor}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) =>
                      ({ ...prev, generadoPor: !!checked })
                    )
                  }
                >
                  Generado por
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.generadoEn}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) =>
                      ({ ...prev, generadoEn: !!checked })
                    )
                  }
                >
                  Generado en
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="default"
              size="sm"
              className="h-9 shrink-0 rounded-full px-4 shadow-sm"
              onClick={openCreate}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Generar reporte
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pt-1 pb-2 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/70">
              <TableHead className="px-5 py-4 font-semibold">Reporte</TableHead>
              {visibleColumns.rango ? (
                <TableHead className="px-5 py-4 font-semibold">Rango</TableHead>
              ) : null}
              {visibleColumns.generadoPor ? (
                <TableHead className="px-5 py-4 font-semibold">Generado por</TableHead>
              ) : null}
              {visibleColumns.generadoEn ? (
                <TableHead className="px-5 py-4 font-semibold">Generado en</TableHead>
              ) : null}
              <TableHead className="w-24 px-5 py-4 text-center font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length ? (
              paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/60 transition-colors hover:bg-muted/30"
                >
                  <TableCell className="px-5 py-4 font-medium">
                    <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                      <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} className="size-4" />
                      <span className="truncate text-sm font-medium">{row.nombre}</span>
                    </a>
                  </TableCell>
                  {visibleColumns.rango ? (
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {rangeText(row)}
                    </TableCell>
                  ) : null}
                  {visibleColumns.generadoPor ? (
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {row.generadoPor}
                    </TableCell>
                  ) : null}
                  {visibleColumns.generadoEn ? (
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDateTime(row.generadoEn)}
                    </TableCell>
                  ) : null}
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
                          onClick={() => openDetails(row)}
                        >
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg px-3 py-2"
                          onClick={() => downloadReport(row)}
                        >
                          Descargar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    2 +
                    (visibleColumns.rango ? 1 : 0) +
                    (visibleColumns.generadoPor ? 1 : 0) +
                    (visibleColumns.generadoEn ? 1 : 0)
                  }
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No hay reportes de ventas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(filteredRows.length / pageSize)}
          onPageChange={setCurrentPage}
        />
      </div>

      <Sheet
        open={detailOpen}
        onOpenChange={(next) => (next ? setDetailOpen(true) : closeDetails())}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>Detalles del reporte</SheetTitle>
            <SheetDescription>
              {selectedRow ? selectedRow.nombre : "Selecciona"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4 py-5">
            {selectedRow ? (
              <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                <div className="grid gap-1">
                  <p className="text-xs text-muted-foreground">Rango</p>
                  <p className="text-sm font-medium">
                    {rangeText(selectedRow)}
                  </p>
                </div>

                <div className="grid gap-1">
                  <p className="text-xs text-muted-foreground">Generado por</p>
                  <p className="text-sm font-medium">{selectedRow.generadoPor}</p>
                </div>

                <div className="grid gap-1">
                  <p className="text-xs text-muted-foreground">Generado en</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedRow.generadoEn)}</p>
                </div>
              </div>
            ) : null}

            <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeDetails}>
                Cerrar
              </Button>
              {selectedRow ? (
                <Button type="button" onClick={() => downloadReport(selectedRow)}>
                  Descargar
                </Button>
              ) : null}
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : closeSheet())}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>Generar reporte</SheetTitle>
            <SheetDescription>Define el rango para crear un nuevo reporte.</SheetDescription>
          </SheetHeader>

          <form
            className="flex min-h-0 flex-1 flex-col gap-5 px-4 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              saveRow()
            }}
          >
            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <p className="text-sm font-medium text-foreground">Parámetros</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="ventas-reporte-tipo">Tipo de reporte</Label>
                  <Select
                    value={form.nombre}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, nombre: value }))
                    }
                  >
                    <SelectTrigger id="ventas-reporte-tipo" className="h-10 w-full rounded-lg">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENTAS_TIPOS_REPORTE.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ventas-reporte-desde">Desde</Label>
                  <Input
                    id="ventas-reporte-desde"
                    type="date"
                    value={form.desde}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, desde: event.target.value }))
                    }
                    className="h-10 rounded-lg"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ventas-reporte-hasta">Hasta</Label>
                  <Input
                    id="ventas-reporte-hasta"
                    type="date"
                    value={form.hasta}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, hasta: event.target.value }))
                    }
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <p className="text-sm font-medium text-foreground">Control</p>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ventas-reporte-generado-por">Generado por</Label>
                  <Input
                    id="ventas-reporte-generado-por"
                    placeholder="Usuario"
                    value={form.generadoPor}
                    readOnly
                    disabled
                    className="h-10 rounded-lg bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="mt-auto grid gap-2 border-t bg-background pt-4 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
                onClick={closeSheet}
              >
                Cancelar
              </Button>
              <Button type="submit" className="h-10 rounded-lg">Generar reporte</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TesoreriaReportesTable() {
  const [movimientos, setMovimientos] = React.useState<TesoreriaMovimiento[]>([])
  const [cortes, setCortes] = React.useState<TesoreriaCorte[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const [search, setSearch] = React.useState("")
  const deferredSearch = React.useDeferredValue(search)

  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<
    | { kind: "movimiento"; item: TesoreriaMovimiento }
    | { kind: "corte"; item: TesoreriaCorte }
    | null
  >(null)

  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const [cortesPage, setCortesPage] = React.useState(1)
  const [movimientosPage, setMovimientosPage] = React.useState(1)
  const pageSize = 10

  React.useEffect(() => {
    let active = true

    const loadTesoreria = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const [movimientosData, cortesData] = await Promise.all([
          fetchTesoreriaMovimientos(),
          fetchTesoreriaCortes(),
        ])
        if (!active) return
        setMovimientos(movimientosData)
        setCortes(cortesData)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar tesoreria"
        setErrorMessage(message)
        setMovimientos([])
        setCortes([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTesoreria()

    return () => {
      active = false
    }
  }, [])

  const filteredMovimientos = React.useMemo(() => {
    return movimientos.filter((mov) => {
      if (!normalizedSearch) return true
      return (
        mov.concepto.toLowerCase().includes(normalizedSearch) ||
        mov.tipo.toLowerCase().includes(normalizedSearch) ||
        mov.categoria.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [movimientos, normalizedSearch])

  const filteredCortes = React.useMemo(() => {
    return cortes.filter((corte) => {
      if (!normalizedSearch) return true
      return (
        corte.turnoId.toLowerCase().includes(normalizedSearch) ||
        corte.cajero.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [cortes, normalizedSearch])

  const paginatedCortes = React.useMemo(() => {
    return filteredCortes.slice((cortesPage - 1) * pageSize, cortesPage * pageSize)
  }, [filteredCortes, cortesPage, pageSize])

  const paginatedMovimientos = React.useMemo(() => {
    return filteredMovimientos.slice((movimientosPage - 1) * pageSize, movimientosPage * pageSize)
  }, [filteredMovimientos, movimientosPage, pageSize])

  function differenceClass(value: number) {
    if (value > 0) return "text-emerald-600"
    if (value < 0) return "text-rose-600"
    return "text-muted-foreground"
  }

  function openMovimientoDetails(item: TesoreriaMovimiento) {
    setSelectedItem({ kind: "movimiento", item })
    setDetailOpen(true)
  }

  function openCorteDetails(item: TesoreriaCorte) {
    setSelectedItem({ kind: "corte", item })
    setDetailOpen(true)
  }

  function closeDetails() {
    setDetailOpen(false)
    setSelectedItem(null)
  }

  function downloadMovimientoReport(item: TesoreriaMovimiento) {
    downloadPdfReport({
      filename: `tesoreria-movimiento-${item.id}.pdf`,
      title: "Movimiento de tesoreria",
      subtitle: item.concepto,
      summary: [
        ["Fecha", formatDateTime(item.timestamp)],
        ["Tipo", item.tipo],
        ["Categoria", item.categoria],
        ["Monto", currencyFormatter.format(item.monto)],
      ],
      columns: [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Tipo", dataKey: "tipo" },
        { header: "Categoria", dataKey: "categoria" },
        { header: "Concepto", dataKey: "concepto" },
        { header: "Monto", dataKey: "monto" },
      ],
      rows: [
        {
          fecha: formatDateTime(item.timestamp),
          tipo: item.tipo,
          categoria: item.categoria,
          concepto: item.concepto,
          monto: currencyFormatter.format(item.monto),
        },
      ],
    })
  }

  function downloadCorteReport(item: TesoreriaCorte) {
    downloadPdfReport({
      filename: `tesoreria-corte-${item.id}.pdf`,
      title: "Corte de caja",
      subtitle: item.turnoId,
      summary: [
        ["Fecha", formatDateTime(item.timestamp)],
        ["Cajero", item.cajero],
        ["Esperado", currencyFormatter.format(item.esperado)],
        ["Contado", currencyFormatter.format(item.contado)],
        ["Diferencia", currencyFormatter.format(item.diferencia)],
      ],
      columns: [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Turno", dataKey: "turno" },
        { header: "Cajero", dataKey: "cajero" },
        { header: "Esperado", dataKey: "esperado" },
        { header: "Contado", dataKey: "contado" },
        { header: "Diferencia", dataKey: "diferencia" },
      ],
      rows: [
        {
          fecha: formatDateTime(item.timestamp),
          turno: item.turnoId,
          cajero: item.cajero,
          esperado: currencyFormatter.format(item.esperado),
          contado: currencyFormatter.format(item.contado),
          diferencia: currencyFormatter.format(item.diferencia),
        },
      ],
    })
  }

  function downloadSelected() {
    if (!selectedItem) return
    if (selectedItem.kind === "movimiento") {
      downloadMovimientoReport(selectedItem.item)
      return
    }

    downloadCorteReport(selectedItem.item)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Tesorería</h2>
          <p className="text-sm text-muted-foreground">
            Cortes de caja y movimientos registrados en Tesorería.
          </p>
        </div>
        {loading && (
          <p className="text-sm text-muted-foreground">Cargando tesorería...</p>
        )}
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCortesPage(1)
              setMovimientosPage(1)
            }}
            placeholder="Buscar por concepto, tipo, cajero o turno"
            className="h-9 w-[240px] shrink-0 rounded-xl"
          />
        </div>
      </div>

      <div className="overflow-x-auto px-2 pt-1 pb-2 sm:px-4 sm:pb-4">
        <div className="grid gap-6">
          <div className="space-y-3">
            <h3 className="px-1 text-sm font-semibold text-foreground">Cortes de caja</h3>
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="border-border/70">
                  <TableHead className="px-5 py-4 font-semibold">Fecha</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Turno</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Cajero</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Esperado</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Contado</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Diferencia</TableHead>
                  <TableHead className="w-24 px-5 py-4 text-center font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCortes.length ? (
                  paginatedCortes.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-border/60 transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {formatDateTime(row.timestamp)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {row.turnoId}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {row.cajero}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {currencyFormatter.format(row.esperado)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {currencyFormatter.format(row.contado)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm">
                        <span className={differenceClass(row.diferencia)}>
                          {currencyFormatter.format(row.diferencia)}
                        </span>
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
                              onClick={() => openCorteDetails(row)}
                            >
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg px-3 py-2"
                              onClick={() => downloadCorteReport(row)}
                            >
                              Descargar
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
                      No hay cortes de caja.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationControls
              currentPage={cortesPage}
              totalPages={Math.ceil(filteredCortes.length / pageSize)}
              onPageChange={setCortesPage}
            />
          </div>

          <div className="space-y-3">
            <h3 className="px-1 text-sm font-semibold text-foreground">Movimientos</h3>
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="border-border/70">
                  <TableHead className="px-5 py-4 font-semibold">Fecha</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Tipo</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Categoría</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Concepto</TableHead>
                  <TableHead className="px-5 py-4 font-semibold">Monto</TableHead>
                  <TableHead className="w-24 px-5 py-4 text-center font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMovimientos.length ? (
                  paginatedMovimientos.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-border/60 transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {formatDateTime(row.timestamp)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm">
                        <span
                          className={
                            row.tipo === "entrada"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }
                        >
                          {row.tipo}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {row.categoria}
                      </TableCell>
                      <TableCell className="px-5 py-4 font-medium">
                        <span className="truncate text-sm font-medium">{row.concepto}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                        {currencyFormatter.format(row.monto)}
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
                              onClick={() => openMovimientoDetails(row)}
                            >
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg px-3 py-2"
                              onClick={() => downloadMovimientoReport(row)}
                            >
                              Descargar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No hay movimientos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationControls
              currentPage={movimientosPage}
              totalPages={Math.ceil(filteredMovimientos.length / pageSize)}
              onPageChange={setMovimientosPage}
            />
          </div>
        </div>
      </div>

      <Sheet
        open={detailOpen}
        onOpenChange={(next) => (next ? setDetailOpen(true) : closeDetails())}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>
              {selectedItem?.kind === "corte"
                ? "Detalle del corte"
                : "Detalle del movimiento"}
            </SheetTitle>
            <SheetDescription>
              {selectedItem?.kind === "corte"
                ? selectedItem.item.turnoId
                : selectedItem?.kind === "movimiento"
                  ? selectedItem.item.concepto
                  : "Selecciona"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4 py-5">
            {selectedItem ? (
              <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                {selectedItem.kind === "movimiento" ? (
                  <>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedItem.item.timestamp)}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-sm font-medium">{selectedItem.item.tipo}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Categoría</p>
                      <p className="text-sm font-medium">{selectedItem.item.categoria}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Concepto</p>
                      <p className="text-sm font-medium">{selectedItem.item.concepto}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Monto</p>
                      <p className="text-sm font-medium">{currencyFormatter.format(selectedItem.item.monto)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedItem.item.timestamp)}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Turno</p>
                      <p className="text-sm font-medium">{selectedItem.item.turnoId}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Cajero</p>
                      <p className="text-sm font-medium">{selectedItem.item.cajero}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Esperado</p>
                      <p className="text-sm font-medium">{currencyFormatter.format(selectedItem.item.esperado)}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Contado</p>
                      <p className="text-sm font-medium">{currencyFormatter.format(selectedItem.item.contado)}</p>
                    </div>
                    <div className="grid gap-1">
                      <p className="text-xs text-muted-foreground">Diferencia</p>
                      <p className="text-sm font-medium">{currencyFormatter.format(selectedItem.item.diferencia)}</p>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeDetails}>
                Cerrar
              </Button>
              {selectedItem ? (
                <Button type="button" onClick={downloadSelected}>
                  Descargar
                </Button>
              ) : null}
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function ReportesTables() {
  return (
    <div className="flex flex-col gap-4">
      <VentasReportesTable />
      <TesoreriaReportesTable />
    </div>
  )
}

