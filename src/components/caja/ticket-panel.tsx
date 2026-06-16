import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Delete02Icon,
  MinusSignIcon,
  PlusSignIcon,
  ShoppingBasket03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { CartItem, PaymentMethod } from "@/components/caja/caja-utils"

type TicketPanelProps = {
  cart: CartItem[]
  cartCount: number
  subtotal: number
  igv: number
  total: number
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (value: PaymentMethod) => void
  cashGiven: string
  onCashGivenChange: (value: string) => void
  clientName: string
  onClientNameChange: (value: string) => void
  cashNum: number
  change: number
  canPay: boolean
  onCheckout: () => void
  onUpdateQty: (id: number, delta: number) => void
  onRemoveItem: (id: number) => void
}

/** Panel de ticket: carrito, datos de pago, totales y accion de cobro. */
export function TicketPanel({
  cart,
  cartCount,
  subtotal,
  igv,
  total,
  paymentMethod,
  onPaymentMethodChange,
  cashGiven,
  onCashGivenChange,
  clientName,
  onClientNameChange,
  cashNum,
  change,
  canPay,
  onCheckout,
  onUpdateQty,
  onRemoveItem,
}: TicketPanelProps) {
  return (
    <aside className="flex min-h-[430px] shrink-0 flex-col overflow-hidden rounded-lg border bg-card shadow-sm lg:w-[390px]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-5">
        <div>
          <h2 className="text-base font-semibold">Ticket de venta</h2>
          <p className="text-xs text-muted-foreground">Productos seleccionados</p>
        </div>
        <Badge variant="outline" className="h-8 rounded-lg px-3 tabular-nums">{cartCount} items</Badge>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length > 0 ? (
          <div className="divide-y px-4">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-start gap-3 py-3.5">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: item.product.bg }}
                >
                  <span className="text-xs font-bold text-slate-700">
                    {item.product.name.trim().slice(0, 2).toUpperCase() || "P"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        $ {item.product.price.toFixed(2)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product.id, -1)}
                        className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2.5} className="size-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.product.stock}
                        onClick={() => onUpdateQty(item.product.id, 1)}
                        className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2.5} className="size-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      $ {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <HugeiconsIcon icon={ShoppingBasket03Icon} strokeWidth={1.5} className="mb-3 size-14 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">El carrito esta vacio</p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">Agrega productos para comenzar</p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-card">
        {cart.length > 0 && (
          <div className="border-b bg-muted/20 px-4 py-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="mb-1 block text-[11px] text-muted-foreground">Cliente</Label>
                <Input
                  id="pos-client"
                  value={clientName}
                  onChange={(event) => onClientNameChange(event.target.value)}
                  className="h-9 rounded-lg bg-background text-sm"
                />
              </div>
              <div className="w-[134px] shrink-0">
                <Label className="mb-1 block text-[11px] text-muted-foreground">Metodo</Label>
                <Select value={paymentMethod} onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}>
                  <SelectTrigger className="h-9 rounded-lg bg-background text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">💵 Efectivo</SelectItem>
                    <SelectItem value="Tarjeta">💳 Tarjeta</SelectItem>
                    <SelectItem value="Transferencia">📱 Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {paymentMethod === "Efectivo" && (
              <div className="mt-2">
                <Label className="mb-1 block text-[11px] text-muted-foreground">Efectivo recibido</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pos-cash"
                    type="number"
                    min={0}
                    step={0.01}
                    value={cashGiven}
                    onChange={(event) => onCashGivenChange(event.target.value)}
                    placeholder="0.00"
                    className="h-9 flex-1 rounded-lg bg-background text-sm tabular-nums"
                  />
                  {cashNum > 0 && (
                    <span className={`rounded-lg px-2.5 py-2 text-xs font-semibold tabular-nums ${change >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"}`}>
                      Cambio: $ {Math.abs(change).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-3">
          <div className="rounded-lg bg-muted/35 p-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>IVA (16%)</span>
              <span className="tabular-nums">$ {igv.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="tabular-nums">$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Button
            className="h-12 w-full rounded-lg text-base font-bold shadow-sm"
            disabled={!canPay}
            onClick={onCheckout}
          >
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="mr-1.5 size-5" />
            Cobrar $ {total.toFixed(2)}
          </Button>
        </div>
      </div>
    </aside>
  )
}
