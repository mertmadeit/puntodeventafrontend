"use client"

import { CajaHeader } from "@/components/caja/caja-header"
import { OpeningCashDialog } from "@/components/caja/opening-cash-dialog"
import { ProductCatalog } from "@/components/caja/product-catalog"
import { SaleTicketDialog } from "@/components/caja/sale-ticket-dialog"
import { TicketPanel } from "@/components/caja/ticket-panel"
import { useCaja } from "@/components/caja/use-caja"

/** Punto de venta principal: coordina catalogo, carrito, apertura y ticket. */
export function Caja() {
  const caja = useCaja()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f6f7f9] text-foreground dark:bg-background">
      <CajaHeader
        cashierName={caja.cashierName}
        currentTime={caja.currentTime}
        salesCount={caja.salesCount}
        salesToday={caja.salesToday}
        onCloseShift={caja.closeShift}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        <ProductCatalog
          search={caja.search}
          onSearchChange={caja.setSearch}
          onSearchKeyDown={caja.handleSearchKeyDown}
          isSearchFocused={caja.isSearchFocused}
          onSearchFocusChange={caja.setIsSearchFocused}
          categories={caja.categories}
          categoryFilter={caja.categoryFilter}
          onCategoryFilterChange={caja.setCategoryFilter}
          products={caja.products}
          filteredProducts={caja.filteredProducts}
          productsLoading={caja.productsLoading}
          productsError={caja.productsError}
          cart={caja.cart}
          onAddToCart={caja.addToCart}
        />

        <TicketPanel
          cart={caja.cart}
          cartCount={caja.cartCount}
          subtotal={caja.subtotal}
          igv={caja.igv}
          total={caja.total}
          paymentMethod={caja.paymentMethod}
          onPaymentMethodChange={caja.setPaymentMethod}
          cashGiven={caja.cashGiven}
          onCashGivenChange={caja.setCashGiven}
          clientName={caja.clientName}
          onClientNameChange={caja.setClientName}
          cashNum={caja.cashNum}
          change={caja.change}
          canPay={caja.canPay}
          onCheckout={caja.checkout}
          onUpdateQty={caja.updateQty}
          onRemoveItem={caja.removeItem}
        />
      </div>

      <OpeningCashDialog
        open={caja.openingDialogOpen}
        openingAmount={caja.openingAmount}
        onOpeningAmountChange={caja.setOpeningAmount}
        openingError={caja.openingError}
        onOpeningErrorChange={caja.setOpeningError}
        onConfirm={caja.confirmOpeningCash}
      />

      <SaleTicketDialog
        open={caja.ticketOpen}
        onOpenChange={caja.setTicketOpen}
        ticket={caja.lastTicket}
        cashierName={caja.cashierName}
        onAccept={caja.closeTicket}
      />
    </div>
  )
}
