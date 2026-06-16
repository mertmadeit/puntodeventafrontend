"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  MoreVerticalCircle01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import {
  formatSaleDateTime,
  matchesDateFilter,
  type DateFilter,
  type PaymentMethod,
  type SaleStatus,
  type UserRow,
} from "@/components/ventas/sales-utils"
export type { UserRow } from "@/components/ventas/sales-utils"

/** Tabla de ventas con filtros, detalle de ticket y acciones de cancelacion. */
export function DataTable({
  data: initialData,
}: {
  data: UserRow[]
}) {
  const [rows, setRows] = React.useState<UserRow[]>(initialData)
  const [activeTab, setActiveTab] = React.useState("todos")
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all")
  const [cashierFilter, setCashierFilter] = React.useState<string>("all")
  const [paymentFilter, setPaymentFilter] = React.useState<"all" | PaymentMethod>("all")
  const [search, setSearch] = React.useState("")
  const [selectedRow, setSelectedRow] = React.useState<UserRow | null>(null)
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState("")
  const deferredSearch = React.useDeferredValue(search)

  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  React.useEffect(() => {
    // Local row state supports optimistic cancel updates after the initial server data arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(initialData)
  }, [initialData])

  const cashierOptions = React.useMemo(
    () => Array.from(new Set(rows.map((row) => row.cashier))),
    [rows]
  )

  const parsedRows = React.useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        parsedDate: new Date(row.dateTime),
      })),
    [rows]
  )

  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const hasActiveFilters =
    activeTab !== "todos" ||
    dateFilter !== "all" ||
    cashierFilter !== "all" ||
    paymentFilter !== "all" ||
    normalizedSearch.length > 0

  const activeFilterCount =
    Number(activeTab !== "todos") +
    Number(dateFilter !== "all") +
    Number(cashierFilter !== "all") +
    Number(paymentFilter !== "all") +
    Number(normalizedSearch.length > 0)

  const dateFilterLabel =
    dateFilter === "ayer"
      ? "Ayer"
      : dateFilter === "semana"
        ? "Semana"
        : dateFilter === "mes"
          ? "Mes"
          : "Todas"

  const filteredRows = React.useMemo(
    () =>
      parsedRows.filter((row) => {
        if (activeTab === "pagados" && row.status !== "Pagado") return false
        if (activeTab === "cancelados" && row.status !== "Cancelado") return false
        if (activeTab === "devueltos" && row.status !== "Devuelto") return false
        if (cashierFilter !== "all" && row.cashier !== cashierFilter) return false
        if (paymentFilter !== "all" && row.paymentMethod !== paymentFilter) return false
        if (!matchesDateFilter(row.parsedDate, dateFilter)) return false

        if (!normalizedSearch) return true
        return row.ticketId.toLowerCase().includes(normalizedSearch)
      }),
    [activeTab, cashierFilter, dateFilter, normalizedSearch, parsedRows, paymentFilter]
  )

  const openDetails = React.useCallback((row?: UserRow) => {
    const target = row ?? filteredRows[0]
    if (!target) return

    setSelectedRow(target)
    setDetailOpen(true)
  }, [filteredRows])

  const openCancel = React.useCallback((row: UserRow) => {
    setSelectedRow(row)
    setCancelReason("")
    setCancelOpen(true)
  }, [])

  const reprintTicket = React.useCallback((row: UserRow) => {
    toast.success(`Reimpresion enviada para ticket ${row.ticketId}.`)
  }, [])

  const cancelSale = React.useCallback(async () => {
    if (!selectedRow || !cancelReason.trim()) return

    try {
      // Usamos el cliente API configurado
      const { apiFetch } = await import("@/lib/api/client");
      await apiFetch(`/api/sales/${selectedRow.id}/cancel`, {
        method: "POST",
        body: { reason: cancelReason.trim(), status: "Cancelado" },
      });

      setRows((prev) =>
        prev.map((row) =>
          row.id === selectedRow.id
            ? {
                ...row,
                status: "Cancelado",
                cancellationReason: cancelReason.trim(),
              }
            : row
        )
      )

      setCancelOpen(false)
      setDetailOpen(false)
      setSelectedRow(null)
      setCancelReason("")
      toast.success("Venta cancelada exitosamente y stock devuelto al inventario.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cancelar la venta");
    }
  }, [selectedRow, cancelReason])

  const badgeClass = React.useCallback((status: SaleStatus) => {
    if (status === "Pagado") return "border-emerald-500/40 text-emerald-600"
    if (status === "Cancelado") return "border-amber-500/40 text-amber-600"
    return "border-rose-500/40 text-rose-600"
  }, [])

  const clearFilters = React.useCallback(() => {
    setActiveTab("todos")
    setDateFilter("all")
    setCashierFilter("all")
    setPaymentFilter("all")
    setSearch("")
    setCurrentPage(1)
  }, [])

  const paginatedRows = React.useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredRows, currentPage, pageSize])

  const tableRows = React.useMemo(() => {
    if (!filteredRows.length) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
            No hay ventas registradas.
          </TableCell>
        </TableRow>
      )
    }

    return paginatedRows.map((row) => (
      <TableRow key={row.id} className="border-border/60 transition-colors hover:bg-muted/30">
        <TableCell className="px-5 py-4 text-sm font-medium">{row.ticketId}</TableCell>
        <TableCell className="px-5 py-4 text-sm text-muted-foreground">
          {formatSaleDateTime(row.dateTime)}
        </TableCell>
        <TableCell className="px-5 py-4 text-sm text-muted-foreground">{row.cashier}</TableCell>
        <TableCell className="px-5 py-4 text-sm text-muted-foreground">{row.client}</TableCell>
        <TableCell className="px-5 py-4 text-sm text-muted-foreground">$ {row.total.toFixed(2)}</TableCell>
        <TableCell className="px-5 py-4 text-sm text-muted-foreground">{row.paymentMethod}</TableCell>
        <TableCell className="px-5 py-4">
          <Badge variant="outline" className={badgeClass(row.status)}>
            {row.status}
          </Badge>
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
              className="w-52 rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
            >
              <DropdownMenuItem className="rounded-lg px-3 py-2" onClick={() => openDetails(row)}>
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg px-3 py-2" onClick={() => reprintTicket(row)}>
                Reimprimir ticket
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="rounded-lg px-3 py-2" onClick={() => openCancel(row)}>
                Anular/Cancelar venta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }, [paginatedRows, filteredRows.length, badgeClass, openDetails, reprintTicket, openCancel])

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Historial maestro de ventas</h2>
          <p className="text-sm text-muted-foreground">
            Auditoria completa con trazabilidad por ticket, cajero y metodo de pago.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Input
            id="sales-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCurrentPage(1)
            }}
            placeholder="Buscar N. ticket"
            className="h-9 w-[190px] shrink-0 rounded-xl"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto shrink-0">
            <TabsList className="h-9 rounded-xl bg-muted/40 p-1">
              <TabsTrigger value="todos" className="rounded-lg">Todos</TabsTrigger>
              <TabsTrigger value="pagados" className="rounded-lg">Pagados</TabsTrigger>
              <TabsTrigger value="cancelados" className="rounded-lg">Cancelados</TabsTrigger>
              <TabsTrigger value="devueltos" className="rounded-lg">Devueltos</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm" className="ml-auto h-9 shrink-0 rounded-xl px-4" onClick={() => setFilterOpen(true)}>
            Filtros
            {activeFilterCount ? ` (${activeFilterCount})` : ""}
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" />
          </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-2 pt-1 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/70">
              <TableHead className="px-5 py-4 font-semibold">ID Ticket</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Fecha y Hora</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Cajero</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Cliente</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Total</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Metodo de Pago</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Estado</TableHead>
              <TableHead className="w-24 px-5 py-4 text-center font-semibold">
                Acciones
              </TableHead>
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
            <SheetTitle>Filtros avanzados</SheetTitle>
            <SheetDescription>Refina resultados por fecha, cajero y metodo de pago.</SheetDescription>
          </SheetHeader>

          <div className="flex h-full flex-col">
            <div className="grid gap-4 px-4 py-5">
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Rango de fechas</Label>
                <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Selecciona rango" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ayer">Ayer</SelectItem>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Cajero</Label>
                <Select value={cashierFilter} onValueChange={setCashierFilter}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Todos los cajeros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cajeros</SelectItem>
                    {cashierOptions.map((cashier) => (
                      <SelectItem key={cashier} value={cashier}>
                        {cashier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Metodo de pago</Label>
                <Select
                  value={paymentFilter}
                  onValueChange={(value: "all" | PaymentMethod) => setPaymentFilter(value)}
                >
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Todos los metodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los metodos</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                <span>Estado actual</span>
                <span>{filteredRows.length} resultados · {dateFilterLabel}</span>
              </div>
            </div>

            <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
              <Button type="button" variant="outline" disabled={!hasActiveFilters} onClick={clearFilters}>
                Limpiar filtros
              </Button>
              <Button type="button" onClick={() => setFilterOpen(false)}>
                Aplicar
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>Detalles de venta</SheetTitle>
            <SheetDescription>Desglose del ticket para supervision administrativa.</SheetDescription>
          </SheetHeader>

          {selectedRow ? (
            <div className="flex flex-1 flex-col gap-4 px-4 py-5">
              <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                <p className="text-sm font-medium text-foreground">Resumen del ticket</p>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">ID Ticket:</span> {selectedRow.ticketId}</p>
                  <p>
                    <span className="font-medium text-foreground">Fecha y Hora:</span>{" "}
                    {formatSaleDateTime(selectedRow.dateTime)}
                  </p>
                  <p><span className="font-medium text-foreground">Cajero:</span> {selectedRow.cashier}</p>
                  <p><span className="font-medium text-foreground">Cliente:</span> {selectedRow.client}</p>
                  <p><span className="font-medium text-foreground">Metodo de Pago:</span> {selectedRow.paymentMethod}</p>
                  <p><span className="font-medium text-foreground">Total:</span> $ {selectedRow.total.toFixed(2)}</p>
                  <p>
                    <span className="font-medium text-foreground">Estado:</span>{" "}
                    <Badge variant="outline" className={badgeClass(selectedRow.status)}>
                      {selectedRow.status}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                <p className="text-sm font-medium text-foreground">Detalle de productos</p>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  {selectedRow.items.map((item) => (
                    <p key={`${selectedRow.id}-${item.name}`}>
                      {item.quantity} {item.name}
                    </p>
                  ))}
                </div>
              </div>

              {selectedRow.cancellationReason ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700">
                  Motivo de cancelacion: {selectedRow.cancellationReason}
                </div>
              ) : null}

              <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
                  Cerrar
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={cancelOpen} onOpenChange={setCancelOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>Anular/Cancelar venta</SheetTitle>
            <SheetDescription>Esta accion requiere motivo de cancelacion.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-5 px-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="cancel-reason">Motivo</Label>
              <Input
                id="cancel-reason"
                placeholder="Ejemplo: error de cobro"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </div>

            {selectedRow ? (
              <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                Ticket: {selectedRow.ticketId} | Total: $ {selectedRow.total.toFixed(2)}
              </div>
            ) : null}

            <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
                Cerrar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={cancelSale}
                disabled={!cancelReason.trim()}
              >
                Confirmar cancelacion
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

