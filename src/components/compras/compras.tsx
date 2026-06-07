"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  ShoppingBasket03Icon,
  Store02Icon,
  Delete02Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { apiFetch } from "@/lib/api/client"
import { toast } from "sonner"

type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  barcode: string
  bg: string
}

type Provider = {
  id: number
  nombre: string
}

type CartItem = { product: Product; quantity: number; costo: number }

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})

const CATEGORY_ACCENTS: Record<string, string> = {
  bebidas: "#f0f9ff",
  snacks: "#fff7ed",
  lacteos: "#eff6ff",
  panaderia: "#fffbeb",
  limpieza: "#ecfeff",
}

function normalizeCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
}

export function Compras() {
  const [proveedores, setProveedores] = React.useState<Provider[]>([])
  const [productos, setProductos] = React.useState<Product[]>([])
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [selectedProveedorId, setSelectedProveedorId] = React.useState<string>("")
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const deferredSearch = React.useDeferredValue(search)

  React.useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        setLoading(true)
        
        const [provData, prodData] = await Promise.all([
          apiFetch<Provider[]>("/api/proveedores"),
          apiFetch<any[]>("/api/products") 
        ])
        
        if (active) {
          setProveedores(provData)
          setProductos(prodData.map(item => {
            const normalizedCategory = normalizeCategory(item.category || "")
            const bg = CATEGORY_ACCENTS[normalizedCategory] ?? "#f8fafc"
            return {
              id: Number(item.id),
              name: item.name,
              category: item.category || "General",
              price: Number(item.price),
              stock: Number(item.stock),
              barcode: item.barcode ?? "",
              bg
            }
          }))
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [])

  const filteredProducts = React.useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    if (!term) return productos
    return productos.filter((p) => 
      p.name.toLowerCase().includes(term) || 
      p.barcode.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    )
  }, [deferredSearch, productos])

  const total = React.useMemo(() => cart.reduce((s, i) => s + i.costo * i.quantity, 0), [cart])
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  function addToCart(p: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === p.id)
      if (ex) {
        return prev.map((i) => (i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { product: p, quantity: 1, costo: parseFloat((p.price * 0.8).toFixed(2)) }]
    })
    setSearch("")
  }

  function updateQty(id: number, d: number) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== id) return i
        const next = i.quantity + d
        return { ...i, quantity: Math.max(1, next) }
      })
    )
  }

  function updateCosto(id: number, val: string) {
    const numeric = parseFloat(val)
    if (isNaN(numeric) || numeric < 0) return
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== id) return i
        return { ...i, costo: numeric }
      })
    )
  }

  function remove(id: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== id))
  }

  async function procesarCompra() {
    if (!selectedProveedorId || cart.length === 0) return
    setIsSubmitting(true)
    try {
      const payload = {
        proveedorId: Number(selectedProveedorId),
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          costo: item.costo
        }))
      }
      
      await apiFetch("/api/compras", {
        method: "POST",
        body: payload
      })
      
      toast.success("Compra registrada correctamente y stock actualizado.")
      setCart([])
      setSelectedProveedorId("")
      setSearch("")

      // Update local stock immediately for better UX
      setProductos(prev => prev.map(p => {
        const inCart = cart.find(c => c.product.id === p.id)
        if (inCart) return { ...p, stock: p.stock + inCart.quantity }
        return p
      }))

    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background md:flex-row p-4 lg:p-6 gap-6 w-full max-w-[1600px] mx-auto">
      
      {/* ────────── LEFT: CATALOG & SUPPLIER ────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Registro de Entrada (Compras)</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa mercancía al inventario registrando facturas de proveedores.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="text-sm font-semibold mb-2 block">Proveedor origen</label>
            <div className="flex items-center gap-2">
              <Select value={selectedProveedorId} onValueChange={setSelectedProveedorId}>
                <SelectTrigger className="h-11 bg-card border-border/60">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Store02Icon} className="text-muted-foreground size-4" />
                    <SelectValue placeholder="Seleccione un proveedor..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm font-semibold mb-2 block">Buscar Producto</label>
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-5"
              />
              <Input
                placeholder="Nombre o código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-card border-border/60 text-base"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] rounded-xl border border-border/50 bg-muted/10 p-3">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(178px, 1fr))" }}
          >
            {filteredProducts.length ? (
              filteredProducts.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className={`group relative flex min-h-[140px] flex-col items-start rounded-lg border bg-card p-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                      inCart
                        ? "border-primary/55 ring-2 ring-primary/15 shadow-md"
                        : "border-border/60 shadow-sm"
                    }`}
                  >
                    {inCart && (
                      <span className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="flex w-full items-start gap-3">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                        style={{ backgroundColor: p.bg }}
                      >
                        <span className="text-sm font-bold tracking-wide text-slate-700">
                          {p.name.trim().slice(0, 2).toUpperCase() || "P"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pr-5">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{p.category}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex w-full items-end justify-between gap-3 pt-3">
                      <div className="text-xs text-muted-foreground">
                        Stock disp: <span className="font-semibold text-foreground">{p.stock}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-muted-foreground">Cargando catálogo...</p>
              </div>
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-muted-foreground">No hay resultados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────── RIGHT: CART PANEL ────────── */}
      <aside className="flex min-h-[430px] shrink-0 flex-col overflow-hidden rounded-lg border bg-card shadow-sm lg:w-[400px]">
        
        {/* Ticket header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-5">
          <div>
            <h2 className="text-base font-semibold">Entrada de Mercancía</h2>
            <p className="text-xs text-muted-foreground">Cantidades y costos a registrar</p>
          </div>
          <Badge variant="outline" className="h-8 rounded-lg px-3 tabular-nums">{cartCount} items</Badge>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length > 0 ? (
            <div className="divide-y px-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex flex-col gap-2 py-4">
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: item.product.bg }}
                      >
                        <span className="text-xs font-bold text-slate-700">
                          {item.product.name.trim().slice(0, 2).toUpperCase() || "P"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-snug line-clamp-2">{item.product.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(item.product.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-2">
                    {/* Quantity Selector */}
                    <div className="flex h-8 w-[100px] items-center rounded-md border bg-background overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, -1)}
                        className="flex h-full flex-1 items-center justify-center bg-muted/30 transition hover:bg-muted active:bg-muted/80"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} className="size-3.5" />
                      </button>
                      <div className="flex h-full flex-1 items-center justify-center font-medium tabular-nums text-sm">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, 1)}
                        className="flex h-full flex-1 items-center justify-center bg-muted/30 transition hover:bg-muted active:bg-muted/80"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5" />
                      </button>
                    </div>

                    {/* Unit Cost */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Costo: $</span>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-8 w-24 text-right font-medium px-2 bg-muted/20"
                        value={item.costo}
                        onChange={(e) => updateCosto(item.product.id, e.target.value)}
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <HugeiconsIcon icon={ShoppingBasket03Icon} strokeWidth={1} className="mb-4 size-14 text-muted-foreground/30" />
              <p className="font-medium text-foreground">El lote está vacío</p>
              <p className="mt-1 text-sm text-muted-foreground">Busca y selecciona productos para ingresarlos al sistema.</p>
            </div>
          )}
        </div>

        {/* Totals & Submit */}
        <div className="shrink-0 bg-muted/10 p-5 border-t">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Unidades totales</span>
              <span className="font-semibold tabular-nums">{cartCount}</span>
            </div>
            <Separator />
            <div className="flex items-end justify-between">
              <span className="font-semibold">Monto Total</span>
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {currencyFormatter.format(total)}
              </span>
            </div>
          </div>
          
          <Button
            size="lg"
            disabled={cart.length === 0 || !selectedProveedorId || isSubmitting}
            onClick={procesarCompra}
            className="w-full h-14 text-base font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            {isSubmitting ? "Procesando..." : "Ingresar Inventario"}
          </Button>
          {!selectedProveedorId && cart.length > 0 && (
            <p className="text-xs text-destructive mt-3 text-center font-medium">Seleccione un proveedor para continuar</p>
          )}
        </div>

      </aside>
    </div>
  )
}
