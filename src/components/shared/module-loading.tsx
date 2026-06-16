import { Skeleton } from "@/components/ui/skeleton"

/** Estado de carga reutilizable para modulos del dashboard. */
export function ModuleLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>

      <div className="rounded-2xl border border-border/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[88%]" />
          <Skeleton className="h-4 w-[84%]" />
          <Skeleton className="h-4 w-[76%]" />
        </div>
      </div>
    </div>
  )
}
