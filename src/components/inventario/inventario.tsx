"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable, type InventoryRow } from "@/components/inventario/data-table"
import { fetchInventory } from "@/lib/api/inventory"
import type { ApiInventoryItem } from "@/lib/api/types"

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

export function Inventario() {
  const [productos, setProductos] = React.useState<InventoryRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const loadInventory = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const data = await fetchInventory()
        if (!active) return
        const mapped = data.map((item: ApiInventoryItem) => ({
          id: Number(item.id),
          producto: item.name,
          categoria: item.category,
          codigoBarras: item.barcode ?? "",
          stock: Number(item.stock),
          stockMinimo: Number(item.minStock),
          precio: Number(item.price),
          unidad: item.unit,
        }))
        setProductos(mapped)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar inventario"
        setErrorMessage(message)
        setProductos([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInventory()

    return () => {
      active = false
    }
  }, [])

  const totales = React.useMemo(() => {
    const agotados = productos.filter((item) => item.stock === 0).length
    const bajos = productos.filter((item) => item.stock > 0 && item.stock <= item.stockMinimo).length
    const suficientes = productos.length - agotados - bajos
    const valor = productos.reduce((acc, item) => acc + item.stock * item.precio, 0)

    return {
      agotados,
      bajos,
      suficientes,
      faltantes: agotados + bajos,
      valor,
    }
  }, [productos])

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando inventario...</p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Faltantes para reposicion</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totales.faltantes}
            </CardTitle>
            <CardAction>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                  Bajo: {totales.bajos}
                </Badge>
                <Badge variant="outline" className="border-rose-500/40 text-rose-600">
                  Agotado: {totales.agotados}
                </Badge>
              </div>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">Lista de compras del dueno</div>
            <div className="text-muted-foreground">Usa la pestana Faltantes para ver solo amarillo y rojo.</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Valor de inventario activo</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {currencyFormatter.format(totales.valor)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
                En verde: {totales.suficientes}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">Cambio de precio en 2 clics</div>
            <div className="text-muted-foreground">Toca el precio en la fila y guardalo al instante.</div>
          </CardFooter>
        </Card>
      </div>

      <DataTable data={productos} />
    </div>
  )
}
