import { cookies } from "next/headers"

import { AppShell } from "@/components/layout/app-shell"
import { ReportesTables } from "@/components/reportes/reportes-tables"

export default async function Page() {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const sidebarOpen = sidebarCookie !== "false"

  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <ReportesTables />
      </div>
    </AppShell>
  )
}
