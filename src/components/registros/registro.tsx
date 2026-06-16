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
import { DataTable, type UserRow } from "@/components/registros/data-table"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartUpIcon } from "@hugeicons/core-free-icons"
import { fetchAuditLogs } from "@/lib/api/audit"
import type { ApiAuditLog } from "@/lib/api/types"

/** Pantalla de auditoria que carga y muestra eventos recientes del sistema. */
export function Registro() {
	const [registrosAuditoria, setRegistrosAuditoria] = React.useState<UserRow[]>([])
	const [loading, setLoading] = React.useState(true)
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

	React.useEffect(() => {
		let active = true

		const loadLogs = async () => {
			try {
				setLoading(true)
				setErrorMessage(null)
				const data = await fetchAuditLogs()
				if (!active) return
				const mapped = data.map((log: ApiAuditLog) => ({
					id: Number(log.id),
					timestamp: log.timestamp,
					usuario: log.usuario,
					evento: log.evento as UserRow["evento"],
					detalle: log.detalle,
				}))
				setRegistrosAuditoria(mapped)
			} catch (error) {
				if (!active) return
				const message = error instanceof Error ? error.message : "No se pudo cargar registros"
				setErrorMessage(message)
				setRegistrosAuditoria([])
			} finally {
				if (active) setLoading(false)
			}
		}

		loadLogs()

		return () => {
			active = false
		}
	}, [])


	const totalEventos = registrosAuditoria.length
	const totalUsuarios = new Set(registrosAuditoria.map((registro) => registro.usuario)).size
	const totalLogins = registrosAuditoria.filter((registro) => registro.evento === "LOGIN").length
	const totalCancelaciones = registrosAuditoria.filter((registro) => registro.evento === "CANCELACION").length
	const totalCambiosPrecio = registrosAuditoria.filter((registro) => registro.evento === "CAMBIO_DE_PRECIO").length
	const totalEdiciones = registrosAuditoria.filter((registro) => registro.evento === "EDICION").length

	return (
		<div className="flex flex-col gap-4 px-4 lg:px-6">
			{loading && (
				<p className="text-sm text-muted-foreground">Cargando registros...</p>
			)}
			{errorMessage && (
				<p className="text-sm text-destructive">{errorMessage}</p>
			)}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card className="@container/card">
					<CardHeader>
						<CardDescription>Total eventos</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							{totalEventos}
						</CardTitle>
						<CardAction>
							<Badge variant="outline">
								<HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4 shrink-0" />
								Logins: {totalLogins}
							</Badge>
						</CardAction>
					</CardHeader>
					<CardFooter className="flex-col items-start gap-1.5 text-sm">
						<div className="line-clamp-1 flex gap-2 font-medium">
							Registros capturados
							<HugeiconsIcon icon={ChartUpIcon} strokeWidth={2} className="size-4" />
						</div>
						<div className="text-muted-foreground">
							{totalLogins} logins, {totalCancelaciones} cancelaciones, {totalEdiciones} ediciones
						</div>
					</CardFooter>
				</Card>

				<Card className="@container/card">
					<CardHeader>
						<CardDescription>Supervision activa</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							{totalUsuarios}
						</CardTitle>
						<CardAction>
							<Badge variant="outline">Usuarios con actividad</Badge>
						</CardAction>
					</CardHeader>
					<CardFooter className="flex-col items-start gap-1.5 text-sm">
						<div className="line-clamp-1 flex gap-2 font-medium">Cambios de precio detectados</div>
						<div className="text-muted-foreground">{totalCambiosPrecio} ajustes registrados hoy</div>
					</CardFooter>
				</Card>
			</div>

			<DataTable data={registrosAuditoria} />
		</div>
	)
}
