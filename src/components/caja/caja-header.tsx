import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock01Icon, Logout01Icon, ShoppingCart01Icon, User02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type CajaHeaderProps = {
  cashierName: string
  currentTime: string
  salesCount: number
  salesToday: number
  onCloseShift: () => void
}

/** Muestra informacion del turno, cajero y resumen rapido de ventas. */
export function CajaHeader({
  cashierName,
  currentTime,
  salesCount,
  salesToday,
  onCloseShift,
}: CajaHeaderProps) {
  return (
    <header className="z-10 flex min-h-16 shrink-0 items-center justify-between border-b bg-card/95 px-4 py-2 shadow-sm backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-sm">
          <HugeiconsIcon icon={ShoppingCart01Icon} strokeWidth={2.5} className="size-5" />
        </div>
        <div className="mr-2 hidden sm:block">
          <h1 className="text-lg font-bold tracking-tight leading-none">Abarrotes Loyde</h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">Terminal de venta</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1 text-sm font-medium text-foreground border border-border/40">
            <HugeiconsIcon icon={User02Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            {cashierName}
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1 text-sm font-medium text-foreground tabular-nums border border-border/40">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            {currentTime}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm">
            <span className="text-muted-foreground">Ventas:</span>
            <Badge variant="secondary" className="tabular-nums">{salesCount}</Badge>
          </div>
          <div className="flex h-9 items-center rounded-lg border bg-background px-3 text-sm font-semibold tabular-nums">
            $ {salesToday.toFixed(2)}
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onCloseShift}>
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
          Cerrar Turno
        </Button>
      </div>
    </header>
  )
}
