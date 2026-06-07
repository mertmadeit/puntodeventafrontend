import { cookies } from "next/headers"

import { AppShell } from "@/components/layout/app-shell"
import { Mermas } from "@/components/mermas/mermas"

export default async function MermasPage() {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const sidebarOpen = sidebarCookie !== "false"

  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <Mermas />
    </AppShell>
  )
}
