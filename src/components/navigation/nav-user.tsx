"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { logoutApi } from "@/lib/api/auth"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { LinkCircleIcon, Logout01Icon, MoreVerticalCircle01Icon } from "@hugeicons/core-free-icons"
import { ApiConfigDialog } from "@/components/api-config-dialog"
import { formatRole, getInitials } from "@/components/shared/user-display-utils"

/** Menu de usuario con acciones de configuracion y cierre de sesion. */
function NavUserComponent({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    role?: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const initials = React.useMemo(() => getInitials(user.name), [user.name])
  const roleLabel = React.useMemo(() => formatRole(user.role), [user.role])

  const [apiConfigOpen, setApiConfigOpen] = React.useState(false)

  const logout = React.useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // ignore network/logout race
    }
    try {
      localStorage.removeItem("auth.token")
      localStorage.removeItem("auth.role")
      localStorage.removeItem("pos.cashierName")
      localStorage.removeItem("auth.sidebarUser")
    } catch {
      // ignore
    }
    document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax"
    document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax"
    document.cookie = "pos_cashier_name=; Path=/; Max-Age=0; SameSite=Lax"
    router.replace("/login")
  }, [router])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
              <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {roleLabel} - {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setTimeout(() => setApiConfigOpen(true), 100)}>
              <HugeiconsIcon icon={LinkCircleIcon} strokeWidth={2} />
              Conexión API
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ApiConfigDialog open={apiConfigOpen} onOpenChange={setApiConfigOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}


export const NavUser = React.memo(NavUserComponent);
