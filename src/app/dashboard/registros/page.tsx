import { cookies } from "next/headers"

import { AppShell } from "@/components/layout/app-shell"
import { Registro } from "@/components/registros/registro"

export default async function Page() {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const sidebarOpen = sidebarCookie !== "false"

  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <Registro />
    </AppShell>
  )
}
