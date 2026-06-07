"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  MoreVerticalCircle01Icon,
  Store02Icon,
} from "@hugeicons/core-free-icons"

import { apiFetch } from "@/lib/api/client"

type ProveedorRow = {
  id: number
  nombre: string
  contacto: string
  telefono: string
  rfc: string
  activo: boolean
}

type ProveedorFormValues = {
  nombre: string
  contacto: string
  telefono: string
  rfc: string
}

const EMPTY_FORM: ProveedorFormValues = {
  nombre: "",
  contacto: "",
  telefono: "",
  rfc: "",
}

export function Proveedores() {
  const [rows, setRows] = React.useState<ProveedorRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState<ProveedorFormValues>(EMPTY_FORM)

  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  React.useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await apiFetch<ProveedorRow[]>("/api/proveedores")
        if (active) setRows(data)
      } catch (error) {
        if (active) setErrorMessage((error as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [])

  const paginatedRows = React.useMemo(() => {
    return rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [rows, currentPage, pageSize])

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

  function openEdit(row: ProveedorRow) {
    setEditingId(row.id)
    setForm({
      nombre: row.nombre,
      contacto: row.contacto,
      telefono: row.telefono,
      rfc: row.rfc,
    })
    setOpen(true)
  }

  async function saveRow() {
    if (!form.nombre.trim()) return

    try {
      setErrorMessage(null)
      
      if (editingId) {
        const updated = await apiFetch<ProveedorRow>(`/api/proveedores/${editingId}`, {
          method: "PUT",
          body: form,
        })
        setRows(prev => prev.map(r => r.id === editingId ? { ...r, ...updated } : r))
        setOpen(false)
      } else {
        const created = await apiFetch<ProveedorRow>("/api/proveedores", {
          method: "POST",
          body: form,
        })
        setRows(prev => [created, ...prev])
      }
      closeSheet()
    } catch (error) {
      setErrorMessage((error as Error).message)
    }
  }

  async function confirmDelete() {
    if (!deletingId) return

    try {
      setErrorMessage(null)
      await apiFetch(`/api/proveedores/${deletingId}`, {
        method: "DELETE",
      })
      setRows(prev => prev.filter(r => r.id !== deletingId))
      setDeletingId(null)
    } catch (error) {
      setErrorMessage((error as Error).message)
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {loading && <p className="text-sm text-muted-foreground">Cargando proveedores...</p>}
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Proveedores</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {rows.length}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Directorio de proveedores registrados.
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Proveedores</h2>
            <p className="text-sm text-muted-foreground">
              Directorio de empresas o personas que abastecen el inventario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="h-10 rounded-full px-4"
              onClick={openCreate}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Agregar proveedor
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto px-2 pt-1 pb-2 sm:px-4 sm:pb-4">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border/70">
                <TableHead className="px-5 py-4 font-semibold">Nombre de la Empresa</TableHead>
                <TableHead className="px-5 py-4 font-semibold">Contacto (Vendedor)</TableHead>
                <TableHead className="px-5 py-4 font-semibold">Teléfono</TableHead>
                <TableHead className="px-5 py-4 font-semibold">RFC / NIT</TableHead>
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
                    <TableCell className="px-5 py-4 font-medium">{row.nombre}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">{row.contacto}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">{row.telefono}</TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">{row.rfc}</TableCell>
                    <TableCell className="px-5 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="mx-auto size-9 rounded-full">
                            <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(row)}>Modificar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingId(row.id)}>
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    No hay proveedores registrados.
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>{editingId ? "Modificar proveedor" : "Agregar proveedor"}</SheetTitle>
          </SheetHeader>
          <form className="flex flex-1 flex-col px-4 py-5 gap-4" onSubmit={e => { e.preventDefault(); saveRow(); }}>
            <div className="grid gap-2">
              <Label>Nombre / Razón Social</Label>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Contacto</Label>
              <Input value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>RFC / NIT</Label>
              <Input value={form.rfc} onChange={e => setForm(f => ({ ...f, rfc: e.target.value }))} />
            </div>
            <SheetFooter className="mt-auto pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeSheet}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl">Eliminar proveedor</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
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
