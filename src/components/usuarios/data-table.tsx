"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  MoreVerticalCircle01Icon,
} from "@hugeicons/core-free-icons"
import {
  createUser,
  deleteUser,
  updateUser,
} from "@/lib/api/users"
import {
  EMPTY_FORM,
  getInitials,
  mapApiUser,
  updateSidebarUserCache,
  type FormValues,
  type UserRow,
} from "@/components/usuarios/user-utils"
export type { UserRow } from "@/components/usuarios/user-utils"

/** Tabla de administracion de usuarios con alta, edicion y baja logica. */
export function DataTable({ data: initialData }: { data: UserRow[] }) {
  const [rows, setRows] = React.useState<UserRow[]>(initialData)
  const [form, setForm] = React.useState<FormValues>(EMPTY_FORM)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("usuarios")
  const [visibleColumns, setVisibleColumns] = React.useState({
    email: true,
    role: true,
    status: true,
  })
  const imageInputRef = React.useRef<HTMLInputElement | null>(null)

  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  const isEditing = editingId !== null
  const filteredRows = rows.filter((row) => {
    if (activeTab === "activos") return row.status === "Activo"
    if (activeTab === "inactivos") return row.status === "Inactivo"
    return true
  })

  const paginatedRows = React.useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredRows, currentPage, pageSize])

  const resetForm = React.useCallback(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }, [])

  const closeSheet = React.useCallback(() => {
    setOpen(false)
    resetForm()
    setErrorMessage(null)
  }, [resetForm])

  const openCreate = React.useCallback(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setOpen(true)
  }, [])

  const openEdit = React.useCallback((row: UserRow) => {
    setEditingId(row.id)
    setForm({
      image: row.image ?? "",
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
    })
    setOpen(true)
  }, [])

  const handleImageFile = React.useCallback((file: File | null) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: String(reader.result ?? "") }))
    }
    reader.readAsDataURL(file)
  }, [])

  const openImagePicker = React.useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const clearImage = React.useCallback(() => {
    setForm((prev) => ({ ...prev, image: "" }))
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }, [])

  async function saveRow() {
    if (!form.name.trim() || !form.email.trim()) return

    const payload = {
      imageUrl: form.image.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
    }

    try {
      setSaving(true)
      setErrorMessage(null)

      if (isEditing && editingId !== null) {
        const updated = mapApiUser(await updateUser(editingId, payload))
        setRows((prev) =>
          prev.map((row) => (row.id === editingId ? updated : row))
        )
        updateSidebarUserCache(updated)
      } else {
        const created = mapApiUser(await createUser(payload))
        setRows((prev) => [created, ...prev])
      }

      closeSheet()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el usuario"
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = React.useCallback(async (id: number) => {
    try {
      setErrorMessage(null)
      await deleteUser(id)
      setRows((prev) => prev.filter((row) => row.id !== id))
      if (editingId === id) {
        closeSheet()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar el usuario"
      setErrorMessage(message)
    }
  }, [editingId, closeSheet])

  const tableRows = React.useMemo(() => {
    if (!filteredRows.length) {
      return (
        <TableRow>
          <TableCell
            colSpan={
              2 +
              (visibleColumns.email ? 1 : 0) +
              (visibleColumns.role ? 1 : 0) +
              (visibleColumns.status ? 1 : 0)
            }
            className="h-24 text-center text-sm text-muted-foreground"
          >
            No hay usuarios registrados.
          </TableCell>
        </TableRow>
      )
    }

    return paginatedRows.map((row) => (
      <TableRow
        key={row.id}
        className="border-border/60 transition-colors hover:bg-muted/30"
      >
        <TableCell className="px-5 py-4 font-medium">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 ring-1 ring-border/60">
              <AvatarImage src={row.image || undefined} alt={row.name} />
              <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{row.name}</span>
          </div>
        </TableCell>
        {visibleColumns.email ? (
          <TableCell className="px-5 py-4 text-sm text-muted-foreground">
            {row.email}
          </TableCell>
        ) : null}
        {visibleColumns.role ? (
          <TableCell className="px-5 py-4 text-sm text-muted-foreground">
            {row.role}
          </TableCell>
        ) : null}
        {visibleColumns.status ? (
          <TableCell className="px-5 py-4">
            <Badge
              variant="outline"
              className={
                row.status === "Activo"
                  ? "border-emerald-500/40 text-emerald-600"
                  : "border-muted-foreground/30 text-muted-foreground"
              }
            >
              {row.status}
            </Badge>
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
              <DropdownMenuItem className="rounded-lg px-3 py-2" onClick={() => openEdit(row)}>
                Modificar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="rounded-lg px-3 py-2"
                onClick={() => onDelete(row.id)}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }, [paginatedRows, filteredRows.length, visibleColumns, openEdit, onDelete])

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Controla accesos, roles e imagen de perfil en un solo lugar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val)
              setCurrentPage(1)
            }}
            className="w-auto shrink-0"
          >
            <TabsList className="h-9 rounded-xl bg-muted/40 p-1">
              <TabsTrigger value="todos" className="rounded-lg">
                Todos
              </TabsTrigger>
              <TabsTrigger value="activos" className="rounded-lg">
                Activos
              </TabsTrigger>
              <TabsTrigger value="inactivos" className="rounded-lg">
                Inactivos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border-border/70 p-1"
            >
              <DropdownMenuCheckboxItem
                checked={visibleColumns.email}
                onCheckedChange={(checked) =>
                  setVisibleColumns((prev) => ({ ...prev, email: !!checked }))
                }
              >
                Correo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.role}
                onCheckedChange={(checked) =>
                  setVisibleColumns((prev) => ({ ...prev, role: !!checked }))
                }
              >
                Rol
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={(checked) =>
                  setVisibleColumns((prev) => ({ ...prev, status: !!checked }))
                }
              >
                Estado
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="default"
            size="sm"
            className="h-10 rounded-full px-4"
            onClick={openCreate}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Agregar usuario
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pt-1 pb-2 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/70">
              <TableHead className="px-5 py-4 font-semibold">Usuario</TableHead>
              {visibleColumns.email ? (
                <TableHead className="px-5 py-4 font-semibold">
                  Correo
                </TableHead>
              ) : null}
              {visibleColumns.role ? (
                <TableHead className="px-5 py-4 font-semibold">Rol</TableHead>
              ) : null}
              {visibleColumns.status ? (
                <TableHead className="px-5 py-4 font-semibold">
                  Estado
                </TableHead>
              ) : null}
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

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : closeSheet())}
      >
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
            <SheetTitle>
              {isEditing ? "Modificar usuario" : "Agregar usuario"}
            </SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Actualiza los datos del usuario seleccionado."
                : "Completa los datos para crear un nuevo usuario."}
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex flex-1 flex-col gap-5 px-4 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              saveRow()
            }}
          >
            {errorMessage ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <p className="text-sm font-medium text-foreground">
                Datos básicos
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="user-name">Nombre completo</Label>
                  <Input
                    id="user-name"
                    placeholder="Nombre"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-email">Correo electrónico</Label>
                  <Input
                    id="user-email"
                    placeholder="Correo"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <p className="text-sm font-medium text-foreground">
                Imagen de perfil
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="size-14 shrink-0">
                  <AvatarImage
                    src={form.image || undefined}
                    alt={form.name || "Usuario"}
                  />
                  <AvatarFallback>
                    {getInitials(form.name || "U")}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-medium">Vista previa</p>
                    <p className="text-xs text-muted-foreground">
                      Sube una imagen desde tu laptop para verla aquí.
                    </p>
                  </div>

                  <input
                    ref={imageInputRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageFile(event.target.files?.[0] ?? null)
                    }
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openImagePicker}
                    >
                      Elegir imagen
                    </Button>

                    {form.image ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={clearImage}
                      >
                        Quitar imagen
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <p className="text-sm font-medium text-foreground">
                Acceso y estado
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="user-role">Rol</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger id="user-role">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-status">Estado</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value: "Activo" | "Inactivo") =>
                      setForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger id="user-status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeSheet}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : isEditing ? "Guardar" : "Agregar"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
