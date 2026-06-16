"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { fetchDashboardSeries } from "@/lib/api/dashboard"
import type { ApiDashboardSeriesPoint } from "@/lib/api/types"

export const description = "Grafica de ventas por metodo de pago"

const EMPTY_SERIES: ApiDashboardSeriesPoint[] = []

const chartConfig = {
  visitors: {
    label: "Ventas",
  },
  desktop: {
    label: "Efectivo",
    color: "#60a5fa",
  },
  mobile: {
    label: "Tarjeta/transferencia",
    color: "#f59e0b",
  },
} satisfies ChartConfig

/** Grafica interactiva de ventas por metodo de pago en el dashboard. */
export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState(() => (isMobile ? "7d" : "90d"))
  const [series, setSeries] = React.useState<ApiDashboardSeriesPoint[]>(EMPTY_SERIES)
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const loadSeries = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const data = await fetchDashboardSeries()
        if (!active) return
        setSeries(data)
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar la serie"
        setErrorMessage(message)
        setSeries([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSeries()

    return () => {
      active = false
    }
  }, [])

  const referenceDate = series.length
    ? new Date(series[series.length - 1].date)
    : new Date()

  const filteredData = series.filter((item) => {
    const date = new Date(item.date)
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  // Recharts cannot draw an AreaChart with only 1 point.
  // If we only have 1 day of sales (e.g. today), we prepend a mock day before it with 0 sales so the chart draws properly.
  let displayData = filteredData
  if (displayData.length === 1) {
    const singlePoint = displayData[0]
    const prevDate = new Date(singlePoint.date + "T00:00:00") // Force local timezone interpretation
    prevDate.setDate(prevDate.getDate() - 1)
    
    // Format YYYY-MM-DD
    const prevDateString = prevDate.toISOString().split("T")[0]
    
    displayData = [
      {
        date: prevDateString,
        desktop: 0,
        mobile: 0,
      },
      singlePoint,
    ]
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Ventas</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Ventas pagadas por metodo de pago
          </span>
          <span className="@[540px]/card:hidden">Ventas por metodo</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Ultimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Ultimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Ultimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Rango de ventas"
            >
              <SelectValue placeholder="Ultimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Ultimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Ultimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Ultimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading && (
          <p className="mb-3 text-sm text-muted-foreground">Cargando serie...</p>
        )}
        {errorMessage && (
          <p className="mb-3 text-sm text-destructive">{errorMessage}</p>
        )}
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.85}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.18}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.16}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
