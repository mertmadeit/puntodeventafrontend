"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
  ChartLegend,
  ChartLegendContent,
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
type TimeRange = "90d" | "30d" | "7d"

const RANGE_DAYS: Record<TimeRange, number> = {
  "90d": 90,
  "30d": 30,
  "7d": 7,
}

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

/** Interpreta una fecha SQL como fecha local para evitar desfases de un dia. */
function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Devuelve YYYY-MM-DD conservando el dia del calendario local. */
function formatDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Completa el rango con dias en cero y siempre lo entrega en orden cronologico. */
function buildRangeData(series: ApiDashboardSeriesPoint[], timeRange: TimeRange) {
  if (series.length === 0) return []

  const orderedSeries = [...series].sort((a, b) => a.date.localeCompare(b.date))
  const endDate = parseDateKey(orderedSeries[orderedSeries.length - 1].date)
  const days = RANGE_DAYS[timeRange]
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (days - 1))

  const valuesByDate = new Map(orderedSeries.map((item) => [item.date, item]))

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + index)
    const dateKey = formatDateKey(date)
    const point = valuesByDate.get(dateKey)

    return {
      date: dateKey,
      desktop: Number(point?.desktop ?? 0),
      mobile: Number(point?.mobile ?? 0),
    }
  })
}

function isTimeRange(value: string): value is TimeRange {
  return value === "90d" || value === "30d" || value === "7d"
}

/** Grafica interactiva de ventas por metodo de pago en el dashboard. */
export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<TimeRange>(() =>
    isMobile ? "7d" : "90d"
  )
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

  const displayData = React.useMemo(
    () => buildRangeData(series, timeRange),
    [series, timeRange]
  )

  function handleRangeChange(value: string) {
    if (isTimeRange(value)) setTimeRange(value)
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
            onValueChange={handleRangeChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Ultimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Ultimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Ultimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={handleRangeChange}>
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
        {!loading && !errorMessage && displayData.length === 0 ? (
          <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No hay ventas para mostrar.
          </p>
        ) : null}
        {displayData.length > 0 ? (
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
              <YAxis
                tickLine={false}
                axisLine={false}
                width={58}
                domain={[0, "auto"]}
                tickFormatter={(value) => `$${Number(value).toLocaleString("es-MX")}`}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={timeRange === "7d" ? 12 : 32}
                tickFormatter={(value) => {
                  const date = parseDateKey(value)
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
                      return parseDateKey(String(value)).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="mobile"
                type="monotone"
                fill="url(#fillMobile)"
                stroke="var(--color-mobile)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="monotone"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
                strokeWidth={2}
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  )
}
