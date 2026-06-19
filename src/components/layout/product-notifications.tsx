"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bell,
  CheckCircle2,
  LoaderCircle,
  PackageX,
  TriangleAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { fetchStockAlerts } from "@/lib/api/catalog"
import type { ApiProduct } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type NotificationKind = "agotado" | "stock-bajo"

type ProductNotification = {
  id: string
  productName: string
  kind: NotificationKind
  title: string
  description: string
  priority: number
}

const NOTIFICATION_STYLES: Record<
  NotificationKind,
  { icon: React.ElementType; iconClassName: string; containerClassName: string }
> = {
  agotado: {
    icon: PackageX,
    iconClassName: "text-rose-600",
    containerClassName: "bg-rose-500/10",
  },
  "stock-bajo": {
    icon: TriangleAlert,
    iconClassName: "text-amber-600",
    containerClassName: "bg-amber-500/10",
  },
}

/** Convierte los productos con existencias criticas en avisos accionables. */
function buildNotifications(inventory: ApiProduct[]): ProductNotification[] {
  const notifications: ProductNotification[] = []

  for (const item of inventory) {
    const stock = Number(item.stock)
    const minStock = Number(item.minStock ?? 0)

    if (stock <= 0) {
      notifications.push({
        id: `${item.id}-agotado`,
        productName: item.name,
        kind: "agotado",
        title: "Producto agotado",
        description: `Sin existencias · mínimo configurado: ${minStock}`,
        priority: 0,
      })
    } else if (stock <= minStock) {
      notifications.push({
        id: `${item.id}-stock-bajo`,
        productName: item.name,
        kind: "stock-bajo",
        title: "Stock bajo",
        description: `${stock} disponible${stock === 1 ? "" : "s"} · mínimo: ${minStock}`,
        priority: 1,
      })
    }
  }

  return notifications.sort((a, b) => a.priority - b.priority)
}

/** Campana del encabezado con las alertas vigentes de productos. */
export function ProductNotifications() {
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<ProductNotification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const loadNotifications = React.useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const inventory = await fetchStockAlerts()
      setNotifications(buildNotifications(inventory))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudieron cargar las notificaciones."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let active = true

    fetchStockAlerts()
      .then((inventory) => {
        if (!active) return
        setNotifications(buildNotifications(inventory))
        setErrorMessage(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setErrorMessage(
          error instanceof Error ? error.message : "No se pudieron cargar las notificaciones."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) void loadNotifications()
  }

  const visibleNotifications = notifications.slice(0, 6)
  const remainingCount = notifications.length - visibleNotifications.length
  const badgeLabel = notifications.length > 99 ? "99+" : String(notifications.length)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            loading
              ? "Cargando notificaciones de productos"
              : `Notificaciones de productos: ${notifications.length} pendiente${
                  notifications.length === 1 ? "" : "s"
                }`
          }
        >
          <Bell className="size-5" />
          {!loading && notifications.length > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white shadow-sm"
            >
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-2rem))] gap-0 p-0">
        <PopoverHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <PopoverTitle className="text-base font-semibold">Notificaciones</PopoverTitle>
            {!loading && notifications.length > 0 ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {notifications.length} pendiente{notifications.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <PopoverDescription>Productos agotados o con existencias bajas.</PopoverDescription>
        </PopoverHeader>

        <div className="max-h-[22rem] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Actualizando notificaciones...
            </div>
          ) : errorMessage ? (
            <div className="space-y-3 px-4 py-6 text-center">
              <p className="text-sm text-destructive">No se pudieron cargar las notificaciones.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadNotifications()}>
                Reintentar
              </Button>
            </div>
          ) : visibleNotifications.length > 0 ? (
            <div className="divide-y">
              {visibleNotifications.map((notification) => {
                const style = NOTIFICATION_STYLES[notification.kind]
                const Icon = style.icon

                return (
                  <div key={notification.id} className="flex gap-3 px-4 py-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                        style.containerClassName
                      )}
                    >
                      <Icon className={cn("size-4.5", style.iconClassName)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{notification.productName}</p>
                      <p className="text-xs font-medium text-foreground/80">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{notification.description}</p>
                    </div>
                  </div>
                )
              })}

              {remainingCount > 0 ? (
                <p className="px-4 py-2 text-center text-xs text-muted-foreground">
                  Y {remainingCount} notificación{remainingCount === 1 ? "" : "es"} más
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center px-4 py-9 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </span>
              <p className="text-sm font-semibold">Todo está en orden</p>
              <p className="mt-1 text-xs text-muted-foreground">No hay alertas de productos pendientes.</p>
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full justify-center">
            <Link href="/dashboard/inventario" onClick={() => setOpen(false)}>
              Ver inventario
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
