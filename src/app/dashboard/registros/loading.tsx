import { AppShell } from "@/components/layout/app-shell"
import { ModuleLoading } from "@/components/shared/module-loading"

export default function Loading() {
  return (
    <AppShell sidebarOpen={true}>
      <ModuleLoading />
    </AppShell>
  )
}
