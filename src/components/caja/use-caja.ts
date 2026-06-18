import * as React from "react"

import { fetchProducts } from "@/lib/api/catalog"
import { createSale, fetchSalesTodaySummary } from "@/lib/api/sales"
import { createTesoreriaTurno } from "@/lib/api/tesoreria"
import {
  DEFAULT_CLIENT,
  PAYMENT_METHOD_MAP,
  TAX_RATE,
  buildSalePayloadItems,
  calculateCartCount,
  calculateSubtotal,
  filterManualCatalog,
  findProductByBarcode,
  formatTicketTime,
  getCatalogCategories,
  getManualProducts,
  mapProduct,
  type CartItem,
  type PaymentMethod,
  type Product,
  type SaleTicket,
} from "@/components/caja/caja-utils"

/** Agrupa estado, datos remotos y acciones principales del punto de venta. */
export function useCaja() {
  const [search, setSearch] = React.useState("")
  const [isSearchFocused, setIsSearchFocused] = React.useState(false)
  const [categoryFilter, setCategoryFilter] = React.useState("Todos")
  const [products, setProducts] = React.useState<Product[]>([])
  const [productsLoading, setProductsLoading] = React.useState(true)
  const [productsError, setProductsError] = React.useState<string | null>(null)
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("Efectivo")
  const [cashGiven, setCashGiven] = React.useState("")
  const [clientName, setClientName] = React.useState(DEFAULT_CLIENT)
  const [ticketOpen, setTicketOpen] = React.useState(false)
  const [lastTicket, setLastTicket] = React.useState<SaleTicket | null>(null)
  const [salesCount, setSalesCount] = React.useState(0)
  const [salesToday, setSalesToday] = React.useState(0)
  const [cashierName] = React.useState(() => {
    if (typeof window === "undefined") return "Vendedor"
    try {
      return localStorage.getItem("pos.cashierName") || "Vendedor"
    } catch {
      return "Vendedor"
    }
  })
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

  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
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
        const summary = await fetchSalesTodaySummary()
        if (!active) return
        setSalesCount(summary.count)
        setSalesToday(summary.total)
      } catch {
        // keep defaults if summary endpoint is unavailable
      }
    }

    loadSalesSummary()

    return () => {
      active = false
    }
  }, [])

  const manualProducts = React.useMemo(() => getManualProducts(products), [products])
  const categories = React.useMemo(() => getCatalogCategories(manualProducts), [manualProducts])
  const filteredProducts = React.useMemo(
    () => filterManualCatalog(manualProducts, categoryFilter, deferredSearch),
    [deferredSearch, categoryFilter, manualProducts]
  )

  const subtotal = React.useMemo(() => calculateSubtotal(cart), [cart])
  const igv = subtotal * TAX_RATE
  const total = subtotal + igv
  const cartCount = calculateCartCount(cart)
  const cashNum = Number.parseFloat(cashGiven) || 0
  const change = cashNum - total
  const canPay = cart.length > 0 && (paymentMethod !== "Efectivo" || cashNum >= total)

  const addToCart = React.useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const updateQty = React.useCallback((id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== id) return item
          const next = item.quantity + delta
          if (next <= 0 || next > item.product.stock) return item
          return { ...item, quantity: next }
        })
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const removeItem = React.useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id))
  }, [])

  const handleSearchKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return

    const product = findProductByBarcode(products, search)
    if (!product) return

    event.preventDefault()
    addToCart(product)
    setSearch("")
  }, [addToCart, products, search])

  const checkout = React.useCallback(async () => {
    if (!canPay) return

    try {
      const created = await createSale({
        items: buildSalePayloadItems(cart),
        paymentMethod: PAYMENT_METHOD_MAP[paymentMethod],
        client: clientName || DEFAULT_CLIENT,
        cashGiven: paymentMethod === "Efectivo" ? cashNum : undefined,
      })

      setLastTicket({
        id: created.ticketId,
        items: [...cart],
        subtotal: created.subtotal ?? subtotal,
        iva: created.iva ?? igv,
        total: created.total ?? total,
        method: paymentMethod,
        change: paymentMethod === "Efectivo" ? cashNum - (created.total ?? total) : 0,
        client: clientName || DEFAULT_CLIENT,
        date: formatTicketTime(created.dateTime),
      })
      setSalesCount((count) => count + 1)
      setSalesToday((amount) => amount + (created.total ?? total))
      setTicketOpen(true)
      setCart([])
      setCashGiven("")
      setClientName(DEFAULT_CLIENT)
    } catch {
      // keep local state as-is if backend sale fails
    }
  }, [canPay, cart, paymentMethod, clientName, cashNum, subtotal, igv, total])

  const closeShift = React.useCallback(() => {
    try {
      localStorage.removeItem("pos.cashierName")
      localStorage.removeItem("auth.token")
      localStorage.removeItem("auth.role")
      localStorage.removeItem("pos.turnoId")
      localStorage.removeItem("pos.openingAmount")
      localStorage.removeItem("pos.openingAt")
      document.cookie = "pos_cashier_name=; Path=/; Max-Age=0; SameSite=Lax"
      document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax"
      document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax"
    } catch {
      // ignore storage cleanup errors
    }
    window.location.href = "/login"
  }, [])

  const confirmOpeningCash = React.useCallback(async () => {
    const parsed = Number.parseFloat(openingAmount.replace(",", "."))
    if (Number.isNaN(parsed) || parsed < 0) {
      setOpeningError("Ingresa un monto valido para apertura")
      return
    }

    const normalized = Number(parsed.toFixed(2))
    try {
      const turno = await createTesoreriaTurno({ montoInicial: normalized })
      const montoInicial = Number(turno.montoInicial) || normalized
      localStorage.setItem("pos.turnoId", turno.id)
      localStorage.setItem("pos.openingAmount", String(montoInicial))
      localStorage.setItem("pos.openingAt", turno.horaApertura)
      setOpeningAmount(montoInicial.toFixed(2))
      setOpeningError("")
      setOpeningDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo abrir el turno"
      setOpeningError(message)
    }
  }, [openingAmount])

  React.useEffect(() => {
    if (openingDialogOpen) return
    if (typeof window === "undefined") return

    const storedTurno = localStorage.getItem("pos.turnoId")
    const storedOpening = localStorage.getItem("pos.openingAmount")
    const parsedOpening = Number.parseFloat(storedOpening ?? "")
    if (storedTurno || !Number.isFinite(parsedOpening)) return

    let active = true
    createTesoreriaTurno({ montoInicial: Number(parsedOpening.toFixed(2)) })
      .then((turno) => {
        if (!active) return
        localStorage.setItem("pos.turnoId", turno.id)
        localStorage.setItem("pos.openingAt", turno.horaApertura)
      })
      .catch(() => {
        // La siguiente operacion de caja mostrara el error real si la API sigue fallando.
      })

    return () => {
      active = false
    }
  }, [openingDialogOpen])

  const closeTicket = React.useCallback(() => {
    setTicketOpen(false)
    setLastTicket(null)
  }, [])

  return {
    search,
    setSearch,
    isSearchFocused,
    setIsSearchFocused,
    categoryFilter,
    setCategoryFilter,
    products,
    productsLoading,
    productsError,
    filteredProducts,
    categories,
    cart,
    cartCount,
    subtotal,
    igv,
    total,
    paymentMethod,
    setPaymentMethod,
    cashGiven,
    setCashGiven,
    clientName,
    setClientName,
    cashNum,
    change,
    canPay,
    ticketOpen,
    setTicketOpen,
    lastTicket,
    salesCount,
    salesToday,
    cashierName,
    currentTime,
    openingDialogOpen,
    openingAmount,
    setOpeningAmount,
    openingError,
    setOpeningError,
    addToCart,
    updateQty,
    removeItem,
    handleSearchKeyDown,
    checkout,
    closeShift,
    confirmOpeningCash,
    closeTicket,
  }
}
