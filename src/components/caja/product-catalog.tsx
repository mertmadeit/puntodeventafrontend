import type { KeyboardEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BarCode02Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { findAutocompleteMatches, getCategoryIcon, type CartItem, type Product } from "@/components/caja/caja-utils"

type ProductCatalogProps = {
  search: string
  onSearchChange: (value: string) => void
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  isSearchFocused: boolean
  onSearchFocusChange: (value: boolean) => void
  categories: string[]
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  products: Product[]
  filteredProducts: Product[]
  productsLoading: boolean
  productsError: string | null
  cart: CartItem[]
  onAddToCart: (product: Product) => void
}

/** Catalogo manual y buscador con soporte para escaneo por codigo de barras. */
export function ProductCatalog({
  search,
  onSearchChange,
  onSearchKeyDown,
  isSearchFocused,
  onSearchFocusChange,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  products,
  filteredProducts,
  productsLoading,
  productsError,
  cart,
  onAddToCart,
}: ProductCatalogProps) {
  const matches = findAutocompleteMatches(products, search)

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="shrink-0 border-b bg-card px-4 pb-3 pt-4 md:px-5">
        <div className="relative mb-3 z-30">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75"
          />
          <Input
            id="pos-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            onFocus={() => onSearchFocusChange(true)}
            onBlur={() => setTimeout(() => onSearchFocusChange(false), 200)}
            autoComplete="off"
            placeholder="Escanear codigo o buscar producto manual..."
            className="h-11 rounded-lg border-border/70 bg-background pl-10 pr-12 text-[15px] placeholder:text-muted-foreground/70 shadow-none focus-visible:ring-primary/50"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md bg-muted/65">
            <HugeiconsIcon icon={BarCode02Icon} strokeWidth={1.9} className="size-4 text-muted-foreground/70" />
          </span>

          {search.trim() && isSearchFocused && (
            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg shadow-black/5 animate-in fade-in-0 zoom-in-95">
              {matches.length === 0 ? (
                <div className="p-4 text-sm text-center text-muted-foreground">
                  No se encontraron productos coincidentes.
                </div>
              ) : (
                <div className="flex flex-col py-1">
                  {matches.map((product) => (
                    <button
                      key={product.id}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        onAddToCart(product)
                        onSearchChange("")
                        onSearchFocusChange(false)
                      }}
                      className="flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none border-b border-border/40 last:border-0"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs">
                          {product.emoji}
                        </span>
                        <span className="truncate font-medium">{product.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {product.barcode && (
                          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 border-transparent bg-muted/50">
                            {product.barcode}
                          </Badge>
                        )}
                        <span className="font-bold tabular-nums text-emerald-600">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryFilterChange(category)}
              className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition-all ${
                categoryFilter === category
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-transparent bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{getCategoryIcon(category)}</span>
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/20 px-4 py-4 md:px-5">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(178px, 1fr))" }}
        >
          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id)
              const out = product.stock <= 0

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={out}
                  onClick={() => onAddToCart(product)}
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
                      style={{ backgroundColor: product.bg }}
                    >
                      <span className="text-sm font-bold tracking-wide text-slate-700">
                        {product.name.trim().slice(0, 2).toUpperCase() || "P"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pr-7">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex w-full items-end justify-between gap-3 pt-4">
                    <div>
                      <p className="text-[11px] uppercase text-muted-foreground">Precio</p>
                      <p className="text-lg font-bold tabular-nums">$ {product.price.toFixed(2)}</p>
                    </div>
                    <Badge variant={product.stock <= 5 ? "destructive" : "secondary"} className="tabular-nums">
                      {product.stock} disp.
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
  )
}
