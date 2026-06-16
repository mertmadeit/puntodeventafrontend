"use client"

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
import { ChartUpIcon, Package02Icon } from "@hugeicons/core-free-icons"
import {
  currencyFormatter,
  type CategorySummary,
} from "@/components/categoria/category-utils"

type CategorySummaryCardsProps = {
  summary: CategorySummary
}

/** Tarjetas superiores con indicadores agregados del catalogo de categorias. */
export function CategorySummaryCards({ summary }: CategorySummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Categorias activas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.totalCategories}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <HugeiconsIcon icon={Package02Icon} strokeWidth={2} className="size-4 shrink-0" />
              Productos: {summary.totalProducts}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Catalogo organizado por categoria
            <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {summary.mostUsedCategory?.nombre ?? "Sin datos"} es la categoria con mas productos.
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Valor total del catalogo</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {currencyFormatter.format(summary.totalInventoryValue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
              Unidades: {summary.totalUnits}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Resumen financiero del surtido
            <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Promedio por categoria:{" "}
            {currencyFormatter.format(
              summary.totalInventoryValue / Math.max(summary.totalCategories, 1)
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
