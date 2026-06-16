import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OpeningCashDialogProps = {
  open: boolean
  openingAmount: string
  onOpeningAmountChange: (value: string) => void
  openingError: string
  onOpeningErrorChange: (value: string) => void
  onConfirm: () => void
}

/** Solicita el fondo inicial antes de habilitar la caja. */
export function OpeningCashDialog({
  open,
  openingAmount,
  onOpeningAmountChange,
  openingError,
  onOpeningErrorChange,
  onConfirm,
}: OpeningCashDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => { /* locked until submit */ }}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Apertura de caja</DialogTitle>
          <DialogDescription>
            Ingresa el monto inicial para comenzar el turno.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="opening-cash">Monto de apertura</Label>
          <Input
            id="opening-cash"
            type="number"
            min={0}
            step={0.01}
            value={openingAmount}
            onChange={(event) => {
              onOpeningAmountChange(event.target.value)
              if (openingError) onOpeningErrorChange("")
            }}
            placeholder="0.00"
            autoFocus
          />
          {openingError && <p className="text-xs text-destructive">{openingError}</p>}
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={onConfirm}>Abrir caja</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
