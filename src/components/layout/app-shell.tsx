"use client"

import * as React from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { ChartAreaInteractive } from "@/components/shared/chart-area-interactive"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PageTransition } from "@/components/motion/page-transition"

export function AppShell({
  children,
  sidebarOpen,
  showChart = false,
}: {
  children: React.ReactNode
  sidebarOpen: boolean
  showChart?: boolean
}) {
  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 relative min-h-[calc(100vh-var(--header-height))]">
              <PageTransition>
                {children}
              </PageTransition>
              {showChart ? (
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
