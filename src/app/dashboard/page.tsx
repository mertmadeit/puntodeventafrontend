import { SectionCards } from "@/components/shared/section-cards"
import { cookies } from "next/headers"

import { AppShell } from "@/components/layout/app-shell"
import { ChartAreaInteractive } from "@/components/shared/chart-area-interactive"
import { StockAlertsTable } from "@/components/dashboard/stock-alerts-table"

export default async function Page() {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const sidebarOpen = sidebarCookie !== "false"

  return (
    <AppShell sidebarOpen={sidebarOpen}>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="px-4 lg:px-6">
        <StockAlertsTable />
      </div>
    </AppShell>
  )
}
