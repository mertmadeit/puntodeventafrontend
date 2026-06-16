"use client"

import * as React from "react"

import { CategoryFormSheet } from "@/components/categoria/category-form-sheet"
import { CategorySummaryCards } from "@/components/categoria/category-summary-cards"
import { CategoryTable } from "@/components/categoria/category-table"
import {
  EMPTY_FORM,
  buildCategoryRows,
  buildCategorySummary,
  type CategoryFormValues,
  type CategoryMetricsRow,
} from "@/components/categoria/category-utils"
import { useCategories } from "@/components/categoria/use-categories"

/** Administra el catalogo de categorias y coordina sus componentes especializados. */
export function Categoria() {
  const {
    rows,
    catalogProducts,
    loading,
    errorMessage,
    saveCategory,
    removeCategory,
  } = useCategories()
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState<CategoryFormValues>(EMPTY_FORM)
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  const categoryRows = React.useMemo(
    () => buildCategoryRows(rows, catalogProducts),
    [catalogProducts, rows]
  )
  const summary = React.useMemo(
    () => buildCategorySummary(categoryRows, catalogProducts),
    [catalogProducts, categoryRows]
  )
  const paginatedRows = React.useMemo(
    () => categoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [categoryRows, currentPage]
  )

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function closeSheet() {
    setOpen(false)
    resetForm()
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(row: CategoryMetricsRow) {
    setEditingId(row.id)
    setForm({
      nombre: row.nombre,
      slug: row.slug,
    })
    setOpen(true)
  }

  async function handleSubmit() {
    const saved = await saveCategory(form, editingId)
    if (saved) closeSheet()
  }

  async function handleDelete(id: number) {
    const removed = await removeCategory(id)
    if (removed && editingId === id) closeSheet()
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando categorias...</p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <CategorySummaryCards summary={summary} />

      <CategoryTable
        rows={categoryRows}
        paginatedRows={paginatedRows}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CategoryFormSheet
        open={open}
        editing={editingId !== null}
        form={form}
        onOpenChange={setOpen}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        onCancel={closeSheet}
      />
    </div>
  )
}
