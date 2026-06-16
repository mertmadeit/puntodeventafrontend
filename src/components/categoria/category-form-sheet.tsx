"use client"

import { Button } from "@/components/ui/button"
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
import type { CategoryFormValues } from "@/components/categoria/category-utils"

type CategoryFormSheetProps = {
  open: boolean
  editing: boolean
  form: CategoryFormValues
  onOpenChange: (open: boolean) => void
  onFormChange: (form: CategoryFormValues) => void
  onSubmit: () => void
  onCancel: () => void
}

/** Panel lateral para crear o editar una categoria. */
export function CategoryFormSheet({
  open,
  editing,
  form,
  onOpenChange,
  onFormChange,
  onSubmit,
  onCancel,
}: CategoryFormSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : onCancel())}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
          <SheetTitle>{editing ? "Modificar categoria" : "Agregar categoria"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "Actualiza el nombre y slug de la categoria."
              : "Completa los datos para registrar una nueva categoria."}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col px-4 py-5"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
            <p className="text-sm font-medium text-foreground">Datos basicos</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="categoria-nombre">Nombre</Label>
                <Input
                  id="categoria-nombre"
                  value={form.nombre}
                  onChange={(event) =>
                    onFormChange({ ...form, nombre: event.target.value })
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
                    onFormChange({ ...form, slug: event.target.value })
                  }
                  placeholder="Ej. bebidas"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="mt-auto grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar" : "Agregar"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
