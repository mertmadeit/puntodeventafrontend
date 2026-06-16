"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable, type UserRow } from "@/components/usuarios/data-table"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartUpIcon } from "@hugeicons/core-free-icons"
import { fetchUsers } from "@/lib/api/users"
import { mapApiUser } from "@/components/usuarios/user-utils"

/** Pantalla de usuarios: carga cuentas desde la API y las pasa a la tabla editable. */
export function Usuarios() {
  const [users, setUsers] = React.useState<UserRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    const loadUsers = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const data = await fetchUsers()
        if (!active) return
        setUsers(data.map(mapApiUser))
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : "No se pudo cargar usuarios"
        setErrorMessage(message)
        setUsers([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsers()

    return () => {
      active = false
    }
  }, [])

  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.status === "Activo").length
  const inactiveUsers = totalUsers - activeUsers

  return (
    //<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 @5xl/main:grid-cols-4"></div>
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total usuarios</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalUsers}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
                Activos: {activeUsers}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Usuarios registrados{" "}
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
            </div>
            <div className="text-muted-foreground">{activeUsers} activos, {inactiveUsers} inactivos</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Roles asignados</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              4
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
                Admin / Caja / Ventas / Supervisor
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Distribución por rol{" "}
              <HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
            </div>
            <div className="text-muted-foreground">Información resumida de los usuarios</div>
          </CardFooter>
        </Card>
      </div>

      <DataTable data={users} key={users.map((user) => `${user.id}:${user.image?.length ?? 0}`).join("|")} />
    </div>
  )
}
