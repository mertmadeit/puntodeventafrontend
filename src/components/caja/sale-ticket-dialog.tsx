import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { SaleTicket } from "@/components/caja/caja-utils"

type SaleTicketDialogProps = {
  open: boolean
  onOpenChange: (value: boolean) => void
  ticket: SaleTicket | null
  cashierName: string
  onAccept: () => void
}

/** Muestra el resumen de una venta confirmada. */
export function SaleTicketDialog({
  open,
  onOpenChange,
  ticket,
  cashierName,
  onAccept,
}: SaleTicketDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-5" />
            </span>
            Venta completada
          </DialogTitle>
          <DialogDescription>Se genero el ticket de venta exitosamente.</DialogDescription>
        </DialogHeader>

        {ticket && (
          <div className="grid gap-3">
            <div className="rounded-xl border bg-muted/30 p-4 text-sm">
              {[
                ["Ticket", ticket.id],
                ["Fecha", ticket.date],
                ["Cliente", ticket.client],
                ["Cajero", cashierName],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between py-0.5">
                  <span className="font-medium">{key}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-0.5">
                <span className="font-medium">Metodo</span>
                <Badge variant="outline">{ticket.method}</Badge>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 text-sm">
              <p className="mb-2 font-medium">Productos</p>
              {ticket.items.map((item) => (
                <div key={item.product.id} className="flex justify-between py-0.5 text-muted-foreground">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span className="tabular-nums">
                    $ {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between py-0.5 text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">$ {ticket.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-muted-foreground">
                <span>IVA (16%)</span>
                <span className="tabular-nums">$ {ticket.iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="tabular-nums">$ {ticket.total.toFixed(2)}</span>
              </div>
              {ticket.method === "Efectivo" && ticket.change > 0 && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Cambio</span>
                  <span className="font-semibold tabular-nums text-emerald-600">
                    $ {ticket.change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onAccept}>Aceptar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
