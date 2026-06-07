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
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartUpIcon, ChartDownIcon } from "@hugeicons/core-free-icons"
import { fetchDashboardSummary } from "@/lib/api/dashboard"
import type { ApiDashboardSummary } from "@/lib/api/types"

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

export function SectionCards() {
  const [summary, setSummary] = React.useState<ApiDashboardSummary | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const loadSummary = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const data = await fetchDashboardSummary()
        if (!active) return
        setSummary(data)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar resumen"
        setErrorMessage(message)
        setSummary(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSummary()

    return () => {
      active = false
    }
  }, [])

  const ventasHoy = summary?.ventasHoy ?? 0
  const tickets = summary?.tickets ?? 0
  const ticketPromedio = summary?.ticketPromedio ?? 0
  const ivaCobrado = summary?.margenNeto ?? 0
  const variacionVentas = summary?.variacionVentas ?? 0
  const variacionTickets = summary?.variacionTickets ?? 0
  const variacionTicketPromedio = summary?.variacionTicketPromedio ?? 0
  const variacionMargen = summary?.variacionMargen ?? 0
  const businessDate = summary?.businessDate
    ? new Date(`${summary.businessDate}T00:00:00`).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin ventas"

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card *:data-[slot=card]:transition-transform *:data-[slot=card]:duration-300 hover:*:data-[slot=card]:scale-[1.02]">
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando resumen...</p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ventas del dia</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currencyFormatter.format(ventasHoy)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
              {variacionVentas.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sobre ayer{" "}
            <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">Dia operativo: {businessDate}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tickets</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {tickets}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
              {variacionTickets.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Operaciones del dia{" "}
            <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">Tickets pagados del dia</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ticket promedio</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currencyFormatter.format(ticketPromedio)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <HugeiconsIcon icon={ChartDownIcon} strokeWidth={2} className="size-4 shrink-0" />
              {variacionTicketPromedio.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sobre ayer{" "}
            <HugeiconsIcon icon={ChartDownIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">Total dividido entre tickets pagados</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>IVA cobrado</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {ivaCobrado.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
              {variacionMargen.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Proporcion sobre ventas{" "}
            <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">Calculado desde ventas pagadas</div>
        </CardFooter>
      </Card>
    </div>
  )
}
