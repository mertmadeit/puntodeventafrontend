"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

type AuditEvent = "LOGIN" | "CANCELACION" | "CAMBIO_DE_PRECIO" | "EDICION" | "MERMA"
type DateFilter = "all" | "ayer" | "semana" | "mes"

export type UserRow = {
  id: number
  timestamp: string
  usuario: string
  evento: AuditEvent
  detalle: string
}

/** Convierte timestamps de auditoria a Date tolerando valores invalidos. */
function parseTimestamp(timestamp: string) {
  return new Date(timestamp.replace(" ", "T"))
}

/** Formatea timestamps de auditoria para lectura humana. */
function formatTimestamp(timestamp: string) {
  const parsed = parseTimestamp(timestamp)

  if (Number.isNaN(parsed.getTime())) return timestamp

  return parsed.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

/** Tabla de registros de auditoria con filtros y paginacion. */
export function DataTable({
  data: initialData,
}: {
  data: UserRow[]
}) {
  const [activeTab, setActiveTab] = React.useState<"todos" | AuditEvent>("todos")
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all")
  const [userFilter, setUserFilter] = React.useState<string>("all")
  const [eventFilter, setEventFilter] = React.useState<"all" | AuditEvent>("all")
  const [search, setSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  const deferredSearch = React.useDeferredValue(search)

  const userOptions = React.useMemo(
    () => Array.from(new Set(initialData.map((row) => row.usuario))),
    [initialData]
  )

  const parsedRows = React.useMemo(
    () =>
      initialData.map((row) => ({
        ...row,
        parsedDate: parseTimestamp(row.timestamp),
      })),
    [initialData]
  )

  function matchesDateFilter(logDate: Date, filter: DateFilter) {
    if (filter === "all") return true

    const now = new Date()

    if (Number.isNaN(logDate.getTime())) return false

    if (filter === "ayer") {
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      return logDate.toDateString() === yesterday.toDateString()
    }

    if (filter === "semana") {
      const start = new Date(now)
      start.setDate(now.getDate() - 7)
      return logDate >= start && logDate <= now
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return logDate >= startOfMonth && logDate <= now
  }

  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const hasActiveFilters =
    activeTab !== "todos" ||
    dateFilter !== "all" ||
    userFilter !== "all" ||
    eventFilter !== "all" ||
    normalizedSearch.length > 0

  const activeFilterCount =
    Number(activeTab !== "todos") +
    Number(dateFilter !== "all") +
    Number(userFilter !== "all") +
    Number(eventFilter !== "all") +
    Number(normalizedSearch.length > 0)

  const filteredRows = React.useMemo(
    () =>
      parsedRows
        .filter((row) => {
          if (activeTab !== "todos" && row.evento !== activeTab) return false
          if (userFilter !== "all" && row.usuario !== userFilter) return false
          if (eventFilter !== "all" && row.evento !== eventFilter) return false
          if (!matchesDateFilter(row.parsedDate, dateFilter)) return false

          if (!normalizedSearch) return true

          const byUsuario = row.usuario.toLowerCase().includes(normalizedSearch)
          const byDetalle = row.detalle.toLowerCase().includes(normalizedSearch)
          const byTimestamp = row.timestamp.toLowerCase().includes(normalizedSearch)

          return byUsuario || byDetalle || byTimestamp
        })
        .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()),
    [activeTab, dateFilter, eventFilter, normalizedSearch, parsedRows, userFilter]
  )

  const paginatedRows = React.useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredRows, currentPage, pageSize])

  function badgeClass(evento: AuditEvent) {
    if (evento === "LOGIN") return "border-sky-500/40 text-sky-600"
    if (evento === "CANCELACION") return "border-rose-500/40 text-rose-600"
    if (evento === "CAMBIO_DE_PRECIO") return "border-amber-500/40 text-amber-600"
    if (evento === "MERMA") return "border-rose-500/40 text-rose-600"
    return "border-emerald-500/40 text-emerald-600"
  }

  function eventLabel(evento: AuditEvent) {
    if (evento === "CAMBIO_DE_PRECIO") return "CAMBIO DE PRECIO"
    if (evento === "MERMA") return "MERMA"
    return evento
  }

  function dateFilterText(value: DateFilter) {
    if (value === "ayer") return "Ayer"
    if (value === "semana") return "Esta semana"
    if (value === "mes") return "Este mes"
    return "Todas"
  }

  function clearFilters() {
    setActiveTab("todos")
    setDateFilter("all")
    setUserFilter("all")
    setEventFilter("all")
    setSearch("")
    setCurrentPage(1)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Registro de auditoria</h2>
          <p className="text-sm text-muted-foreground">
            Trazabilidad de acciones para rastrear cambios y operaciones del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Input
              id="audit-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar usuario o detalle"
              className="h-9 w-[220px] shrink-0 rounded-xl"
            />

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as "todos" | AuditEvent)
                setCurrentPage(1)
              }}
              className="w-auto shrink-0"
            >
              <TabsList className="h-9 rounded-xl bg-muted/40 p-1">
                <TabsTrigger value="todos" className="rounded-lg">Todos</TabsTrigger>
                <TabsTrigger value="LOGIN" className="rounded-lg">Login</TabsTrigger>
                <TabsTrigger value="CANCELACION" className="rounded-lg">Cancelacion</TabsTrigger>
                <TabsTrigger value="CAMBIO_DE_PRECIO" className="rounded-lg">Precio</TabsTrigger>
                <TabsTrigger value="MERMA" className="rounded-lg">Merma</TabsTrigger>
                <TabsTrigger value="EDICION" className="rounded-lg">Edicion</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-xl px-4">
                Filtros
                {activeFilterCount ? ` (${activeFilterCount})` : ""}
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-border/70 p-1">
              <DropdownMenuLabel>Fecha: {dateFilterText(dateFilter)}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={dateFilter}
                onValueChange={(value) => setDateFilter(value as DateFilter)}
              >
                <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ayer">Ayer</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="semana">Esta semana</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="mes">Este mes</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Usuario: {userFilter === "all" ? "Todos" : userFilter}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuRadioGroup value={userFilter} onValueChange={setUserFilter}>
                    <DropdownMenuRadioItem value="all">Todos los usuarios</DropdownMenuRadioItem>
                    {userOptions.map((usuario) => (
                      <DropdownMenuRadioItem key={usuario} value={usuario}>
                        {usuario}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Evento: {eventFilter === "all" ? "Todos" : eventLabel(eventFilter)}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuRadioGroup
                    value={eventFilter}
                    onValueChange={(value) => setEventFilter(value as "all" | AuditEvent)}
                  >
                    <DropdownMenuRadioItem value="all">Todos los eventos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="LOGIN">LOGIN</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="CANCELACION">CANCELACION</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="CAMBIO_DE_PRECIO">CAMBIO DE PRECIO</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="MERMA">MERMA</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="EDICION">EDICION</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                disabled={!hasActiveFilters}
                onSelect={(event) => {
                  event.preventDefault()
                  clearFilters()
                }}
              >
                Limpiar filtros
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

                </div>
      </div>

      <div className="overflow-x-auto px-2 pb-2 pt-1 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/70">
              <TableHead className="px-5 py-4 font-semibold">Timestamp</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Usuario</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Evento</TableHead>
              <TableHead className="px-5 py-4 font-semibold">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length ? (
              paginatedRows.map((row) => (
                <TableRow key={row.id} className="border-border/60 transition-colors hover:bg-muted/30">
                  <TableCell className="px-5 py-4 font-mono text-sm text-muted-foreground">
                    {formatTimestamp(row.timestamp)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm">{row.usuario}</TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge variant="outline" className={badgeClass(row.evento)}>
                      {eventLabel(row.evento)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {row.detalle}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  No hay registros de auditoria.
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

    </div>
  )
}
