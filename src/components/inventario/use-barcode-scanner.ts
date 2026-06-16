"use client"

import * as React from "react"

type UseBarcodeScannerOptions = {
  disabled?: boolean
  onScan: (code: string) => void
}

/** Detecta si el foco esta en un campo editable para no interceptar escritura normal. */
function isEditableTarget(target: EventTarget | null) {
  if (!target) return false

  const element = target as HTMLElement
  return (
    element.isContentEditable ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  )
}

/** Captura entradas rapidas de escaner y las convierte en busquedas de codigo de barras. */
export function useBarcodeScanner({ disabled = false, onScan }: UseBarcodeScannerOptions) {
  const scannerBufferRef = React.useRef("")
  const scannerTimeoutRef = React.useRef<number | null>(null)
  const onScanRef = React.useRef(onScan)

  React.useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  React.useEffect(() => {
    if (disabled) return

    function clearScannerBuffer() {
      scannerBufferRef.current = ""

      if (scannerTimeoutRef.current !== null) {
        window.clearTimeout(scannerTimeoutRef.current)
        scannerTimeoutRef.current = null
      }
    }

    function applyBufferedCode(minLength: number) {
      const code = scannerBufferRef.current.trim()
      if (code.length >= minLength) {
        onScanRef.current(code)
      }
      clearScannerBuffer()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isEditableTarget(event.target)) return

      if (event.key === "Enter") {
        applyBufferedCode(4)
        event.preventDefault()
        return
      }

      if (event.key.length !== 1) return

      scannerBufferRef.current += event.key

      if (scannerTimeoutRef.current !== null) {
        window.clearTimeout(scannerTimeoutRef.current)
      }

      // Hardware scanners emit keys in a tight burst; humans usually exceed this pause.
      scannerTimeoutRef.current = window.setTimeout(() => applyBufferedCode(8), 120)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      clearScannerBuffer()
    }
  }, [disabled])
}
