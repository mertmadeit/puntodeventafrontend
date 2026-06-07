import { cookies } from "next/headers"

import { AppShell } from "@/components/layout/app-shell"
import { Usuarios } from "@/components/usuarios/usuarios"

export default async function Page() {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const sidebarOpen = sidebarCookie !== "false"

  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <Usuarios />
    </AppShell>
  )
}