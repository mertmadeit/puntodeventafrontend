import { cookies } from "next/headers"

import { AppShell } from "@/components/layout/app-shell"
import { Categoria } from "@/components/categoria/categoria"

export default async function Page() {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const sidebarOpen = sidebarCookie !== "false"

  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <Categoria />
    </AppShell>
  )
}