"use client"

import { usePathname } from "next/navigation"

import { ProductNotifications } from "@/components/layout/product-notifications"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const ROUTE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/dashboard/reportes", title: "Reportes" },
  { prefix: "/dashboard/inventario", title: "Inventario" },
  { prefix: "/dashboard/registros", title: "Registros" },
  { prefix: "/dashboard/tesoreria", title: "Tesorería" },
  { prefix: "/dashboard/usuarios", title: "Usuarios" },
  { prefix: "/dashboard/ventas", title: "Ventas" },
  { prefix: "/dashboard/compras", title: "Compras" },
  { prefix: "/dashboard/proveedores", title: "Proveedores" },
  { prefix: "/dashboard/mermas", title: "Mermas" },
  { prefix: "/dashboard", title: "Panel" },
]

/** Resuelve el titulo visible del modulo a partir de la ruta actual. */
function titleFromPathname(pathname: string | null) {
  if (!pathname) return "Dashboard"

  const match = ROUTE_TITLES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (match) return match.title

  if (pathname.startsWith("/dashboard/")) {
    const segment = pathname.split("/")[2] ?? ""
    if (!segment) return "Panel"
    return segment
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  return "Dashboard"
}

/** Header superior que muestra el modulo activo y el control del sidebar. */
export function SiteHeader() {
  const pathname = usePathname()
  const title = titleFromPathname(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center">
          <ProductNotifications />
        </div>
      </div>
    </header>
  )
}
