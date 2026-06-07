"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { NavSecondary } from "@/components/navigation/nav-secondary"
import { NavUser } from "@/components/navigation/nav-user"
import { fetchMe } from "@/lib/api/auth"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ChartHistogramIcon,
  DashboardSquare01Icon,
  HelpCircleIcon,
  InvestigationIcon,
  LicenseDraftIcon,
  Money03Icon,
  ShoppingBasket03Icon,
  Store02Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"

const data = {
  navMain: [
    {
      title: "Inicio",
      url: "/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    },
  ],
  comercial: [
    {
      name: "Ventas",
      url: "/dashboard/ventas",
      icon: <HugeiconsIcon icon={ShoppingBasket03Icon} strokeWidth={2} />,
    },
    {
      name: "Compras",
      url: "/dashboard/compras",
      icon: <HugeiconsIcon icon={ShoppingBasket03Icon} strokeWidth={2} />,
    },
    {
      name: "Proveedores",
      url: "/dashboard/proveedores",
      icon: <HugeiconsIcon icon={Store02Icon} strokeWidth={2} />,
    },
    {
      name: "Inventario",
      url: "/dashboard/inventario",
      icon: <HugeiconsIcon icon={InvestigationIcon} strokeWidth={2} />,
    },
    {
      name: "Mermas",
      url: "/dashboard/mermas",
      icon: <HugeiconsIcon icon={InvestigationIcon} strokeWidth={2} />,
    },
  ],
  finanzas: [
    {
      name: "Tesorería",
      url: "/dashboard/tesoreria",
      icon: <HugeiconsIcon icon={Money03Icon} strokeWidth={2} />,
    },
  ],
  administracion: [
    {
      name: "Usuarios",
      url: "/dashboard/usuarios",
      icon: <HugeiconsIcon icon={User02Icon} strokeWidth={2} />,
    },
    {
      name: "Reportes",
      url: "/dashboard/reportes",
      icon: <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />,
    },
    {
      name: "Registros",
      url: "/dashboard/registros",
      icon: <HugeiconsIcon icon={LicenseDraftIcon} strokeWidth={2} />,
    },
  ],
  categorias: [
    {
      name: "Categorías",
      url: "/dashboard/categorias",
      icon: <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />,
    },
  ],
  navSecondary: [
    {
      title: "Ayuda",
      url: "#",
      icon: <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />,
    },
  ],
}

type SidebarUser = {
  id?: number | string
  name: string
  email: string
  avatar: string
  role?: string
}

const SIDEBAR_USER_STORAGE_KEY = "auth.sidebarUser"

function normalizeUser(input: unknown): SidebarUser | null {
  if (!input || typeof input !== "object") return null

  const data = input as Record<string, unknown>
  const username = typeof data.username === "string" && data.username.trim()
    ? data.username.trim()
    : "usuario"
  const name = typeof data.name === "string" && data.name.trim()
    ? data.name.trim()
    : username
  const role = typeof data.role === "string" && data.role.trim()
    ? data.role.trim()
    : undefined
  const email = typeof data.email === "string" && data.email.trim()
    ? data.email.trim()
    : `${username}@pdv.local`
  const avatar = typeof data.avatar === "string" && data.avatar.trim()
    ? data.avatar.trim()
    : typeof data.imageUrl === "string" && data.imageUrl.trim()
      ? data.imageUrl.trim()
      : ""
  const id = typeof data.id === "string" || typeof data.id === "number" ? data.id : undefined

  return {
    id,
    name,
    email,
    avatar,
    role,
  }
}

function getStoredSidebarUser(): SidebarUser | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const storedUser = localStorage.getItem(SIDEBAR_USER_STORAGE_KEY)
    const parsedUser = storedUser ? normalizeUser(JSON.parse(storedUser)) : null
    if (parsedUser) {
      return parsedUser
    }
  } catch {
    // ignore stale storage
  }

  return null
}

function getStoredUserFallback(): SidebarUser {
  const storedUser = getStoredSidebarUser()
  if (storedUser) return storedUser

  if (typeof window === "undefined") {
    return {
      name: "Usuario",
      email: "sesion@pdv.local",
      avatar: "",
    }
  }

  const username = localStorage.getItem("pos.cashierName") || "usuario"
  const role = localStorage.getItem("auth.role") || undefined

  return {
    name: username,
    email: `${username}@pdv.local`,
    avatar: "",
    role,
  }
}

function storeSidebarUser(user: SidebarUser) {
  try {
    localStorage.setItem(SIDEBAR_USER_STORAGE_KEY, JSON.stringify(user))
  } catch {
    // ignore storage limits
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [user, setUser] = React.useState<SidebarUser>({
    name: "Usuario",
    email: "sesion@pdv.local",
    avatar: "",
  })
  const isRouteActive = React.useCallback(
    (url: string) => pathname === url || pathname.startsWith(`${url}/`),
    [pathname]
  )

  const sections = React.useMemo(
    () => [
      { key: "comercial", label: "Comercial", items: data.comercial },
      { key: "finanzas", label: "Finanzas", items: data.finanzas },
      { key: "administracion", label: "Administración", items: data.administracion },
      { key: "categorias", label: "Categorías", items: data.categorias },
    ],
    []
  )

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    const activeStates = {
      comercial: data.comercial.some((item) => isRouteActive(item.url)),
      finanzas: data.finanzas.some((item) => isRouteActive(item.url)),
      administracion: data.administracion.some((item) => isRouteActive(item.url)),
      categorias: data.categorias.some((item) => isRouteActive(item.url)),
    }
    const hasAnyActive = Object.values(activeStates).some(Boolean)

    return {
      comercial: activeStates.comercial || !hasAnyActive,
      finanzas: activeStates.finanzas,
      administracion: activeStates.administracion,
      categorias: activeStates.categorias,
    }
  })

  React.useEffect(() => {
    let active = true
    const controller = new AbortController()

    // Immediately set to local storage value after mount to prevent hydration mismatch
    setUser(getStoredUserFallback())

    async function loadUser() {
      try {
        const me = await fetchMe({ signal: controller.signal })
        if (!active) return

        const nextUser = normalizeUser(me)
        if (!nextUser) return
        storeSidebarUser(nextUser)
        setUser(nextUser)
      } catch {
        if (active) {
          setUser(getStoredUserFallback())
        }
      }
    }

    loadUser()

    function handleSidebarUserUpdated(event: Event) {
      const nextUser =
        normalizeUser((event as CustomEvent<unknown>).detail) ??
        getStoredSidebarUser()
      if (nextUser) {
        storeSidebarUser(nextUser)
        setUser(nextUser)
      }
    }

    window.addEventListener("sidebar-user-updated", handleSidebarUserUpdated)

    return () => {
      active = false
      controller.abort()
      window.removeEventListener("sidebar-user-updated", handleSidebarUserUpdated)
    }
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-5!" />
                <span className="text-base font-semibold">Abarrotes Loyde</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Inicio */}
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isRouteActive(item.url)}>
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {sections.map((section) => (
          <SidebarGroup key={section.key} className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() =>
                    setOpenSections((prev) => {
                      const isOpen = prev[section.key]
                      // Close all sections, then toggle the clicked one
                      const next: Record<string, boolean> = {}
                      for (const key of Object.keys(prev)) {
                        next[key] = false
                      }
                      next[section.key] = !isOpen
                      return next
                    })
                  }
                >
                  <span className="text-xs font-medium tracking-wide text-sidebar-foreground/70">
                    {section.label}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                    className={cn(
                      "ml-auto size-4 transition-transform",
                      openSections[section.key] ? "rotate-180" : "rotate-0"
                    )}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <AnimatePresence initial={false}>
              {openSections[section.key] ? (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SidebarMenuSub>
                    {section.items.map((item) => (
                      <SidebarMenuSubItem key={item.name}>
                        <SidebarMenuSubButton asChild isActive={isRouteActive(item.url)}>
                          <Link href={item.url}>
                            {item.icon}
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </SidebarGroup>
        ))}

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
