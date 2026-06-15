"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { LinkCircleIcon } from "@hugeicons/core-free-icons"
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

export function ApiConfigDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
  const [apiUrl, setApiUrl] = React.useState(() => {
    const fallbackApiUrl = process.env.NODE_ENV === "production" ? configuredApiUrl : "http://localhost:8080"
    if (typeof window === "undefined") return configuredApiUrl || fallbackApiUrl
    return localStorage.getItem("pos.apiBaseUrl") || configuredApiUrl || fallbackApiUrl
  })

  const saveApiConfig = () => {
    if (apiUrl.trim()) {
      localStorage.setItem("pos.apiBaseUrl", apiUrl.trim())
    } else {
      localStorage.removeItem("pos.apiBaseUrl")
    }
    onOpenChange(false)
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 bg-popover border border-border/60 shadow-2xl rounded-2xl w-full max-w-md sm:max-w-md overflow-hidden" showCloseButton={false}>
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Configuración de Servidor API
          </DialogTitle>
          <DialogDescription>
            Ingresa la URL base de tu servidor backend.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-5 relative z-10">
          <div className="grid gap-2">
            <Label htmlFor="apiUrl" className="font-medium text-muted-foreground">
              URL Base de la red
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HugeiconsIcon icon={LinkCircleIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
              </div>
              <Input
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="pl-10 h-11 bg-muted/30 border-border/60 transition-colors focus:bg-background"
                placeholder="Ej: http://192.168.1.100:8080"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="relative z-10 sm:justify-between gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button 
            onClick={saveApiConfig} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            Guardar y Recargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
