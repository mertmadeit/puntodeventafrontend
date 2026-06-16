"use client"

import * as React from "react"

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchProducts,
  updateCategory,
} from "@/lib/api/catalog"
import type { ApiProduct } from "@/lib/api/types"
import {
  mapApiCategoryToRow,
  slugify,
  type CategoryFormValues,
  type CategoryRow,
} from "@/components/categoria/category-utils"

/** Centraliza carga y mutaciones del modulo de categorias. */
export function useCategories() {
  const [rows, setRows] = React.useState<CategoryRow[]>([])
  const [catalogProducts, setCatalogProducts] = React.useState<ApiProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

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

        setRows(categoriesData.map(mapApiCategoryToRow))
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

  async function saveCategory(form: CategoryFormValues, editingId: number | null) {
    const nextName = form.nombre.trim()
    if (!nextName) return false

    const nextSlug = form.slug.trim() ? slugify(form.slug) : slugify(nextName)
    if (!nextSlug) return false

    try {
      setErrorMessage(null)
      if (editingId) {
        const updated = await updateCategory(editingId, {
          name: nextName,
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
          name: nextName,
          slug: nextSlug,
        })
        setRows((prev) => [mapApiCategoryToRow(created), ...prev])
      }

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la categoria"
      setErrorMessage(message)
      return false
    }
  }

  async function removeCategory(id: number) {
    try {
      setErrorMessage(null)
      await deleteCategory(id)
      setRows((prev) => prev.filter((row) => row.id !== id))
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la categoria"
      setErrorMessage(message)
      return false
    }
  }

  return {
    rows,
    catalogProducts,
    loading,
    errorMessage,
    saveCategory,
    removeCategory,
  }
}
