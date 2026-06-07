import { cookies } from "next/headers"

import { AppShell } from "@/components/layout/app-shell"
import { Compras } from "@/components/compras/compras"

export default async function Page() {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const sidebarOpen = sidebarCookie !== "false"

  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <Compras />
    </AppShell>
  )
}
