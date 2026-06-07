"use client"

import * as React from "react"

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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BarCode02Icon,
  Clock01Icon,
  Delete02Icon,
  Logout01Icon,
  MinusSignIcon,
  PlusSignIcon,
  Search01Icon,
  ShoppingBasket03Icon,
  ShoppingCart01Icon,
  Tick02Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"
import { fetchProducts } from "@/lib/api/catalog"
import { createSale, fetchSales } from "@/lib/api/sales"
import type { ApiProduct } from "@/lib/api/types"

type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  barcode: string
  emoji: string
  bg: string
}

const CATEGORY_ACCENTS: Record<string, { emoji: string; bg: string }> = {
  bebidas: { emoji: "🥤", bg: "#f0f9ff" },
  snacks: { emoji: "🍪", bg: "#fff7ed" },
  lacteos: { emoji: "🥛", bg: "#eff6ff" },
  panaderia: { emoji: "🍞", bg: "#fffbeb" },
  limpieza: { emoji: "🧹", bg: "#ecfeff" },
}

function normalizeCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
}

function mapProduct(item: ApiProduct): Product {
  const normalizedCategory = normalizeCategory(item.category)
  const accent = CATEGORY_ACCENTS[normalizedCategory] ?? {
    emoji: "📦",
    bg: "#f8fafc",
  }

  return {
    id: Number(item.id),
    name: item.name,
    category: item.category,
    price: Number(item.price),
    stock: Number(item.stock),
    barcode: item.barcode ?? "",
    emoji: accent.emoji,
    bg: accent.bg,
  }
}

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type CartItem = { product: Product; quantity: number }
type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia"

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export function Caja() {
  /* ---- state ---- */
  const [search, setSearch] = React.useState("")
  const [isSearchFocused, setIsSearchFocused] = React.useState(false)
  const [categoryFilter, setCategoryFilter] = React.useState("Todos")
  const [products, setProducts] = React.useState<Product[]>([])
  const [productsLoading, setProductsLoading] = React.useState(true)
  const [productsError, setProductsError] = React.useState<string | null>(null)
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("Efectivo")
  const [cashGiven, setCashGiven] = React.useState("")
  const [clientName, setClientName] = React.useState("Publico general")
  const [ticketOpen, setTicketOpen] = React.useState(false)
  const [lastTicket, setLastTicket] = React.useState<{
    id: string; items: CartItem[]; total: number; method: PaymentMethod
    change: number; client: string; date: string
  } | null>(null)
    const [salesCount, setSalesCount] = React.useState(0)
      const [salesToday, setSalesToday] = React.useState(0)
    const [cashierName, setCashierName] = React.useState("Vendedor")
  const [currentTime, setCurrentTime] = React.useState("")
  const [openingDialogOpen, setOpeningDialogOpen] = React.useState(() => {
    const storedOpening = typeof window !== "undefined" ? localStorage.getItem("pos.openingAmount") : null
    return !storedOpening || Number.isNaN(Number.parseFloat(storedOpening))
  })
  const [openingAmount, setOpeningAmount] = React.useState(() => {
    if (typeof window === "undefined") return ""
    const storedOpening = localStorage.getItem("pos.openingAmount")
    return storedOpening && !Number.isNaN(Number.parseFloat(storedOpening))
      ? Number.parseFloat(storedOpening).toFixed(2)
      : ""
  })
  const [openingError, setOpeningError] = React.useState("")

  const deferredSearch = React.useDeferredValue(search)

  /* ---- effects ---- */
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("pos.cashierName")
      // eslint-disable-next-line
      if (stored) setCashierName(stored)
    } catch { /* ignore */ }
  }, [])

  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true })
      )
    }
    updateTime()
    const iv = setInterval(updateTime, 1000)
    return () => clearInterval(iv)
  }, [])

  React.useEffect(() => {
    let active = true

    const loadProducts = async () => {
      try {
        setProductsLoading(true)
        setProductsError(null)
        const data = await fetchProducts()
        if (!active) return
        setProducts(data.map(mapProduct))
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar productos"
        setProductsError(message)
        setProducts([])
      } finally {
        if (active) setProductsLoading(false)
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    let active = true

    const loadSalesSummary = async () => {
      try {
        const { fetchSalesTodaySummary } = await import("@/lib/api/sales")
        const summary = await fetchSalesTodaySummary()
        if (!active) return
        setSalesCount(summary.count)
        setSalesToday(summary.total)
      } catch {
        if (!active) return
      }
    }

    loadSalesSummary()

    return () => {
      active = false
    }
  }, [])

  /* ---- derived ---- */
  const manualProducts = React.useMemo(
    () => products.filter((p) => !p.barcode.trim()),
    [products]
  )

  const categories = React.useMemo(
    () => ["Todos", ...Array.from(new Set(manualProducts.map((p) => p.category))).sort()],
    [manualProducts]
  )

  const filteredProducts = React.useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    return manualProducts.filter((p) => {
      if (categoryFilter !== "Todos" && p.category !== categoryFilter) return false
      if (!term) return true
      return p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
    })
  }, [deferredSearch, categoryFilter, manualProducts])

  const subtotal = React.useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart])
  const igv = subtotal * 0.16
  const total = subtotal + igv
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cashNum = Number.parseFloat(cashGiven) || 0
  const change = cashNum - total

  /* ---- cart ops ---- */
  function addToCart(p: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === p.id)
      if (ex) {
        if (ex.quantity >= p.stock) return prev
        return prev.map((i) => (i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { product: p, quantity: 1 }]
    })
  }

  function updateQty(id: number, d: number) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== id) return i
        const n = i.quantity + d
        if (n <= 0 || n > i.product.stock) return i
        return { ...i, quantity: n }
      }).filter((i) => i.quantity > 0)
    )
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== id))
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return

    const code = search.trim()
    if (!code) return

    const product = products.find((p) => p.barcode.trim() === code)
    if (!product) return

    event.preventDefault()
    addToCart(product)
    setSearch("")
  }

  function canPay() {
    if (!cart.length) return false
    if (paymentMethod === "Efectivo" && cashNum < total) return false
    return true
  }

  async function checkout() {
    if (!canPay()) return

    const paymentMethodMap: Record<PaymentMethod, string> = {
      Efectivo: "efectivo",
      Tarjeta: "tarjeta",
      Transferencia: "transferencia",
    }

    const payloadItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }))

    try {
      const created = await createSale({
        items: payloadItems,
        paymentMethod: paymentMethodMap[paymentMethod],
        client: clientName || "Publico general",
        cashGiven: paymentMethod === "Efectivo" ? cashNum : undefined,
      })

      const ds = new Date(created.dateTime).toLocaleString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })
      setLastTicket({
        id: created.ticketId,
        items: [...cart],
        total,
        method: paymentMethod,
        change: paymentMethod === "Efectivo" ? change : 0,
        client: clientName || "Publico general",
        date: ds,
      })
      setSalesCount((c) => c + 1)
      setSalesToday((s) => s + total)
      setTicketOpen(true)
      setCart([])
      setCashGiven("")
      setClientName("Publico general")
    } catch {
      // keep local state as-is if backend sale fails
    }
  }

  function handleCerrarTurno() {
    try {
      localStorage.removeItem("pos.cashierName")
      localStorage.removeItem("auth.token")
      localStorage.removeItem("auth.role")
      localStorage.removeItem("pos.openingAmount")
      localStorage.removeItem("pos.openingAt")
      document.cookie = "pos_cashier_name=; Path=/; Max-Age=0; SameSite=Lax"
      document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax"
      document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax"
    } catch { /* */ }
    window.location.href = "/login"
  }

  function confirmOpeningCash() {
    const parsed = Number.parseFloat(openingAmount.replace(",", "."))
    if (Number.isNaN(parsed) || parsed < 0) {
      setOpeningError("Ingresa un monto valido para apertura")
      return
    }

    const normalized = Number(parsed.toFixed(2))
    try {
      localStorage.setItem("pos.openingAmount", String(normalized))
      localStorage.setItem("pos.openingAt", new Date().toISOString())
    } catch { /* ignore */ }

    setOpeningAmount(normalized.toFixed(2))
    setOpeningError("")
    setOpeningDialogOpen(false)
  }

  const catIcons: Record<string, string> = { Todos: "🏪" }

  function getCategoryIcon(category: string) {
    return CATEGORY_ACCENTS[normalizeCategory(category)]?.emoji ?? "📦"
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f6f7f9] text-foreground dark:bg-background">

      {/* ══════════════ TOP BAR ══════════════ */}
      <header className="z-10 flex min-h-16 shrink-0 items-center justify-between border-b bg-card/95 px-4 py-2 shadow-sm backdrop-blur md:px-6">
        {/* left */}
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
        {/* right */}
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCerrarTurno}>
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
            Cerrar Turno
          </Button>
        </div>
      </header>

      {/* ══════════════ BODY ══════════════ */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">

        {/* ────────── LEFT: CATALOG ────────── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">

          {/* Search + categories */}
          <div className="shrink-0 border-b bg-card px-4 pb-3 pt-4 md:px-5">
            {/* Search */}
            <div className="relative mb-3 z-30">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={1.9} className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75" />
              <Input
                id="pos-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                autoComplete="off"
                placeholder="Escanear codigo o buscar producto manual..."
                className="h-11 rounded-lg border-border/70 bg-background pl-10 pr-12 text-[15px] placeholder:text-muted-foreground/70 shadow-none focus-visible:ring-primary/50"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md bg-muted/65">
                <HugeiconsIcon icon={BarCode02Icon} strokeWidth={1.9} className="size-4 text-muted-foreground/70" />
              </span>

              {/* Autocomplete Dropdown */}
              {search.trim() && isSearchFocused && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg shadow-black/5 animate-in fade-in-0 zoom-in-95">
                  {(() => {
                    const term = search.trim().toLowerCase()
                    const matches = products.filter((p) => p.name.toLowerCase().includes(term) || p.barcode.toLowerCase().includes(term)).slice(0, 8)
                    
                    if (matches.length === 0) {
                      return <div className="p-4 text-sm text-center text-muted-foreground">No se encontraron productos coincidentes.</div>
                    }
                    
                    return (
                      <div className="flex flex-col py-1">
                        {matches.map((p) => (
                          <button
                            key={p.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              addToCart(p)
                              setSearch("")
                              setIsSearchFocused(false)
                            }}
                            className="flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none border-b border-border/40 last:border-0"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs">{p.emoji}</span>
                              <span className="truncate font-medium">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              {p.barcode && <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 border-transparent bg-muted/50">{p.barcode}</Badge>}
                              <span className="font-bold tabular-nums text-emerald-600">${p.price.toFixed(2)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
            {/* Category chips */}
            <div className="mt-2 flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition-all ${
                    categoryFilter === cat
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-transparent bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{cat === "Todos" ? catIcons.Todos : getCategoryIcon(cat)}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid — scrollable */}
          <div className="flex-1 overflow-y-auto bg-muted/20 px-4 py-4 md:px-5">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(178px, 1fr))" }}
            >
              {filteredProducts.length ? (
                filteredProducts.map((p) => {
                  const inCart = cart.find((i) => i.product.id === p.id)
                  const out = p.stock <= 0
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={out}
                      onClick={() => addToCart(p)}
                      className={`group relative flex min-h-[152px] flex-col items-start rounded-lg border bg-card p-3.5 text-left transition-all ${
                        inCart
                          ? "border-primary/55 ring-2 ring-primary/15 shadow-md"
                          : "border-border/60 shadow-sm hover:-translate-y-0.5 hover:border-border hover:shadow-md"
                      } ${out ? "cursor-not-allowed opacity-45" : "cursor-pointer active:scale-[0.98]"}`}
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
                        <div className="min-w-0 flex-1 pr-7">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{p.category}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex w-full items-end justify-between gap-3 pt-4">
                        <div>
                          <p className="text-[11px] uppercase text-muted-foreground">Precio</p>
                          <p className="text-lg font-bold tabular-nums">$ {p.price.toFixed(2)}</p>
                        </div>
                        <Badge variant={p.stock <= 5 ? "destructive" : "secondary"} className="tabular-nums">
                          {p.stock} disp.
                        </Badge>
                      </div>
                    </button>
                  )
                })
              ) : productsLoading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-sm text-muted-foreground">Cargando productos...</p>
                </div>
              ) : productsError ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-sm text-muted-foreground">{productsError}</p>
                </div>
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="mb-2 size-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* ────────── RIGHT: TICKET PANEL ────────── */}
        <aside className="flex min-h-[430px] shrink-0 flex-col overflow-hidden rounded-lg border bg-card shadow-sm lg:w-[390px]">

          {/* Ticket header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-5">
            <div>
              <h2 className="text-base font-semibold">Ticket de venta</h2>
              <p className="text-xs text-muted-foreground">Productos seleccionados</p>
            </div>
            <Badge variant="outline" className="h-8 rounded-lg px-3 tabular-nums">{cartCount} items</Badge>
          </div>

          {/* Cart items — scrollable middle */}
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

                    {/* info + controls */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-tight">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">$ {item.product.price.toFixed(2)} c/u</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, -1)}
                            className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-muted-foreground transition-colors hover:bg-muted"
                          >
                            <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2.5} className="size-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.product.stock}
                            onClick={() => updateQty(item.product.id, 1)}
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
                <p className="text-sm font-medium text-muted-foreground">El carrito está vacío</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">Agrega productos para comenzar</p>
              </div>
            )}
          </div>

          {/* ── Bottom: payment + totals + button (always visible) ── */}
          <div className="shrink-0 border-t bg-card">
            {/* Client + method row */}
            {cart.length > 0 && (
              <div className="border-b bg-muted/20 px-4 py-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="mb-1 block text-[11px] text-muted-foreground">Cliente</Label>
                    <Input
                      id="pos-client"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-9 rounded-lg bg-background text-sm"
                    />
                  </div>
                  <div className="w-[134px] shrink-0">
                    <Label className="mb-1 block text-[11px] text-muted-foreground">Método</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
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
                        onChange={(e) => setCashGiven(e.target.value)}
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

            {/* Totals */}
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

            {/* Cobrar */}
            <div className="px-4 pb-4">
              <Button
                className="h-12 w-full rounded-lg text-base font-bold shadow-sm"
                disabled={!canPay()}
                onClick={checkout}
              >
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="mr-1.5 size-5" />
                Cobrar $ {total.toFixed(2)}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* ══════════════ TICKET DIALOG ══════════════ */}
      <Dialog open={openingDialogOpen} onOpenChange={() => { /* locked until submit */ }}>
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
              onChange={(e) => {
                setOpeningAmount(e.target.value)
                if (openingError) setOpeningError("")
              }}
              placeholder="0.00"
              autoFocus
            />
            {openingError && <p className="text-xs text-destructive">{openingError}</p>}
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={confirmOpeningCash}>Abrir caja</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-5" />
              </span>
              Venta completada
            </DialogTitle>
            <DialogDescription>Se generó el ticket de venta exitosamente.</DialogDescription>
          </DialogHeader>

          {lastTicket && (
            <div className="grid gap-3">
              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                {[
                  ["Ticket", lastTicket.id],
                  ["Fecha", lastTicket.date],
                  ["Cliente", lastTicket.client],
                  ["Cajero", cashierName],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-0.5">
                    <span className="font-medium">{k}</span>
                    <span className="text-muted-foreground">{v}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-0.5">
                  <span className="font-medium">Método</span>
                  <Badge variant="outline">{lastTicket.method}</Badge>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <p className="mb-2 font-medium">Productos</p>
                {lastTicket.items.map((i) => (
                  <div key={i.product.id} className="flex justify-between py-0.5 text-muted-foreground">
                    <span>{i.quantity}× {i.product.name}</span>
                    <span className="tabular-nums">$ {(i.product.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="tabular-nums">$ {lastTicket.total.toFixed(2)}</span>
                </div>
                {lastTicket.method === "Efectivo" && lastTicket.change > 0 && (
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Cambio</span>
                    <span className="font-semibold tabular-nums text-emerald-600">$ {lastTicket.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => { setTicketOpen(false); setLastTicket(null) }}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
