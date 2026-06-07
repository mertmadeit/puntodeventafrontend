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
import { DataTable, type UserRow } from "@/components/ventas/data-table"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartUpIcon } from "@hugeicons/core-free-icons"
import { fetchSales } from "@/lib/api/sales"
import type { ApiSale } from "@/lib/api/types"

export function Ventas() {
    const [ventas, setVentas] = React.useState<UserRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

    React.useEffect(() => {
      let active = true

      const loadSales = async () => {
        try {
          setLoading(true)
          setErrorMessage(null)
          const data = await fetchSales()
          if (!active) return
          const mapped = data.map((sale: ApiSale) => ({
            id: Number(sale.id),
            ticketId: sale.ticketId,
            dateTime: sale.dateTime,
            cashier: sale.cashier,
            client: sale.client,
            total: Number(sale.total),
            paymentMethod: sale.paymentMethod as UserRow["paymentMethod"],
            status: sale.status as UserRow["status"],
            items: sale.items ?? [],
            cancellationReason: sale.cancellationReason,
          }))
          setVentas(mapped)
        } catch (error) {
          if (!active) return
          const message = error instanceof Error ? error.message : "No se pudo cargar ventas"
          setErrorMessage(message)
          setVentas([])
        } finally {
          if (active) setLoading(false)
        }
      }

      loadSales()

      return () => {
        active = false
      }
    }, [])

    const totalVentas = ventas.length
    const ventasPagadas = ventas.filter((venta) => venta.status === "Pagado").length
    const ventasCanceladas = ventas.filter((venta) => venta.status === "Cancelado").length
    const ventasDevueltas = ventas.filter((venta) => venta.status === "Devuelto").length


    return (
        //<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 @5xl/main:grid-cols-4"></div>
            <div className="flex flex-col gap-4 px-4 lg:px-6">
              {loading && (
                <p className="text-sm text-muted-foreground">Cargando ventas...</p>
              )}
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Total ventas</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalVentas}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
                        Pagado: {ventasPagadas}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Ventas registradas{" "}
                      <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                      {ventasPagadas} pagadas, {ventasCanceladas} canceladas, {ventasDevueltas} devueltas
                    </div>
                  </CardFooter>
                </Card>
        
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Estados clave</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {ventasPagadas + ventasCanceladas}
                    </CardTitle>
                    <CardAction>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">
                          Pagados: {ventasPagadas}
                        </Badge>
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                          Cancelados: {ventasCanceladas}
                        </Badge>
                      </div>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Pagados y cancelados en un solo bloque
                    </div>
                    <div className="text-muted-foreground">Devueltas: {ventasDevueltas}</div>
                  </CardFooter>
                </Card>
              </div>

              <DataTable data={ventas} />
            </div>
    )
}