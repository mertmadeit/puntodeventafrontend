"use client"

import * as React from "react"

import {
	createTesoreriaCorte,
	createTesoreriaMovimiento,
	fetchTesoreriaCortes,
	fetchTesoreriaMovimientos,
	fetchTesoreriaResumen,
	fetchTesoreriaTurnos,
} from "@/lib/api/tesoreria"
import type {
	ApiTesoreriaCorte,
	ApiTesoreriaMovimiento,
	ApiTesoreriaTurno,
} from "@/lib/api/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import {
	currencyFormatter,
	formatDateTime,
	formatTime,
	moneyClass,
} from "@/components/tesoreria/treasury-utils"

type MovimientoTipo = "entrada" | "retiro"
type MovimientoCategoria = "operativo" | "proveedor" | "otro"

type MovimientoCaja = ApiTesoreriaMovimiento

type TurnoActivo = ApiTesoreriaTurno

type GastoDia = {
	id: number
	timestamp: string
	proveedor: string
	concepto: string
	monto: number
}

type CorteCaja = ApiTesoreriaCorte

/** Modulo de tesoreria: resume caja, movimientos, cortes y turnos activos. */
export function Tesoreria() {
	const [fondoCaja, setFondoCaja] = React.useState(0)
	const [ventasEfectivo, setVentasEfectivo] = React.useState(0)
	const [ventasTarjeta, setVentasTarjeta] = React.useState(0)
	const [transferencias, setTransferencias] = React.useState(0)
	const [movimientos, setMovimientos] = React.useState<MovimientoCaja[]>([])
	const [cortes, setCortes] = React.useState<CorteCaja[]>([])
	const [turnosActivos, setTurnosActivos] = React.useState<TurnoActivo[]>([])
	const [loading, setLoading] = React.useState(true)
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

	const [movimientoOpen, setMovimientoOpen] = React.useState(false)
	const [corteOpen, setCorteOpen] = React.useState(false)

	const [movimientoTipo, setMovimientoTipo] = React.useState<MovimientoTipo>("retiro")
	const [movimientoCategoria, setMovimientoCategoria] = React.useState<MovimientoCategoria>("operativo")
	const [movimientoConcepto, setMovimientoConcepto] = React.useState("")
	const [movimientoMonto, setMovimientoMonto] = React.useState("")
	const [movimientoProveedor, setMovimientoProveedor] = React.useState("")

	const [turnoCorteId, setTurnoCorteId] = React.useState("")
	const [corteContado, setCorteContado] = React.useState("")
	const [savingMovimiento, setSavingMovimiento] = React.useState(false)
	const [savingCorte, setSavingCorte] = React.useState(false)

	React.useEffect(() => {
		let active = true

		const loadTesoreria = async () => {
			try {
				setLoading(true)
				setErrorMessage(null)
				const [resumen, movimientosData, cortesData, turnosData] = await Promise.all([
					fetchTesoreriaResumen(),
					fetchTesoreriaMovimientos(),
					fetchTesoreriaCortes(),
					fetchTesoreriaTurnos(),
				])
				if (!active) return
				setFondoCaja(Number(resumen.fondoCaja) || 0)
				setVentasEfectivo(Number(resumen.ventasEfectivo) || 0)
				setVentasTarjeta(Number(resumen.ventasTarjeta) || 0)
				setTransferencias(Number(resumen.transferencias) || 0)
				setMovimientos(movimientosData)
				setCortes(cortesData)
				setTurnosActivos(turnosData)
				if (turnosData.length > 0) {
					setTurnoCorteId(turnosData[0].id)
				}
			} catch (error) {
				if (!active) return
				const message = error instanceof Error ? error.message : "No se pudo cargar tesoreria"
				setErrorMessage(message)
			} finally {
				if (active) setLoading(false)
			}
		}

		loadTesoreria()

		return () => {
			active = false
		}
	}, [])

	const turnoCorteSeleccionado = React.useMemo(
		() => turnosActivos.find((item) => item.id === turnoCorteId) ?? null,
		[turnoCorteId, turnosActivos]
	)

	const efectivoEsperadoCorte = React.useMemo(() => {
		if (!turnoCorteSeleccionado) return 0
		return turnoCorteSeleccionado.montoInicial + turnoCorteSeleccionado.ventasEfectivo + turnoCorteSeleccionado.movimientosNeto
	}, [turnoCorteSeleccionado])

	const totalEntradas = React.useMemo(
		() => movimientos.filter((item) => item.tipo === "entrada").reduce((acc, item) => acc + item.monto, 0),
		[movimientos]
	)

	const totalRetiros = React.useMemo(
		() => movimientos.filter((item) => item.tipo === "retiro").reduce((acc, item) => acc + item.monto, 0),
		[movimientos]
	)

	const netoMovimientos = totalEntradas - totalRetiros

	const efectivoEsperado = React.useMemo(
		() => fondoCaja + ventasEfectivo + netoMovimientos,
		[fondoCaja, ventasEfectivo, netoMovimientos]
	)

	const dineroDigital = ventasTarjeta + transferencias

	const gastosDia = React.useMemo<GastoDia[]>(
		() =>
			movimientos
				.filter((item) => item.tipo === "retiro" && item.categoria === "proveedor")
				.map((item) => ({
					id: Number(item.id),
					timestamp: item.timestamp,
					proveedor: item.proveedorNombre?.trim() || "Proveedor",
					concepto: item.concepto,
					monto: item.monto,
				})),
		[movimientos]
	)

	const totalGastosDia = React.useMemo(
		() => gastosDia.reduce((acc, item) => acc + item.monto, 0),
		[gastosDia]
	)

	const ultimoCorte = cortes[0] ?? null

	const corteContadoParsed = Number.parseFloat(corteContado)
	const diferenciaPreview = Number.isFinite(corteContadoParsed)
		? corteContadoParsed - efectivoEsperadoCorte
		: null

	function resetMovimientoForm() {
		setMovimientoTipo("retiro")
		setMovimientoCategoria("operativo")
		setMovimientoConcepto("")
		setMovimientoMonto("")
		setMovimientoProveedor("")
	}

	async function guardarMovimientoCaja() {
		const concepto = movimientoConcepto.trim()
		const monto = Number.parseFloat(movimientoMonto)
		const proveedor = movimientoProveedor.trim()

		if (!concepto) return
		if (!Number.isFinite(monto) || monto <= 0) return
		if (movimientoTipo === "retiro" && movimientoCategoria === "proveedor" && !proveedor) return
		if (savingMovimiento) return

		try {
			setSavingMovimiento(true)
			setErrorMessage(null)
			const created = await createTesoreriaMovimiento({
				tipo: movimientoTipo,
				categoria: movimientoCategoria,
				concepto,
				proveedorNombre: movimientoTipo === "retiro" && movimientoCategoria === "proveedor" ? proveedor : undefined,
				monto: Number(monto.toFixed(2)),
			})
			setMovimientos((prev) => [created, ...prev].slice(0, 30))

			setMovimientoOpen(false)
			resetMovimientoForm()
		} catch (error) {
			const message = error instanceof Error ? error.message : "No se pudo guardar el movimiento"
			setErrorMessage(message)
		} finally {
			setSavingMovimiento(false)
		}
	}

	async function guardarCorteCaja() {
		if (!turnoCorteSeleccionado) return

		const contado = Number.parseFloat(corteContado)
		if (!Number.isFinite(contado) || contado < 0) return
		if (savingCorte) return

		const expected = Number(efectivoEsperadoCorte.toFixed(2))
		const counted = Number(contado.toFixed(2))
		const diff = Number((counted - expected).toFixed(2))

		try {
			setSavingCorte(true)
			setErrorMessage(null)
			const created = await createTesoreriaCorte({
				turnoId: turnoCorteSeleccionado.id,
				cajero: turnoCorteSeleccionado.cajero,
				horaApertura: turnoCorteSeleccionado.horaApertura,
				montoInicial: turnoCorteSeleccionado.montoInicial,
				esperado: expected,
				contado: counted,
				diferencia: diff,
			})
			setCortes((prev) => [created, ...prev].slice(0, 30))

			setCorteContado("")
			setCorteOpen(false)
		} catch (error) {
			const message = error instanceof Error ? error.message : "No se pudo guardar el corte"
			setErrorMessage(message)
		} finally {
			setSavingCorte(false)
		}
	}

	return (
		<div className="flex flex-col gap-4 px-4 lg:px-6">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				<Card size="sm" className="@container/card border border-border/60 py-4 shadow-none">
					<CardHeader className="pb-2">
						<CardDescription>Estado de caja (cajon)</CardDescription>
						<CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
							{currencyFormatter.format(efectivoEsperado)}
						</CardTitle>
						<CardAction>
							<Badge variant="outline" className={`text-xs ${moneyClass(netoMovimientos)}`}>
								Retiros/Entradas: {currencyFormatter.format(netoMovimientos)}
							</Badge>
						</CardAction>
					</CardHeader>
					<CardContent className="pt-0 text-xs text-muted-foreground">
						Fondo {currencyFormatter.format(fondoCaja)} · Efectivo ventas {currencyFormatter.format(ventasEfectivo)}
					</CardContent>
				</Card>

				<Card size="sm" className="@container/card border border-border/60 py-4 shadow-none">
					<CardHeader className="pb-2">
						<CardDescription>Dinero digital</CardDescription>
						<CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
							{currencyFormatter.format(dineroDigital)}
						</CardTitle>
						<CardAction>
							<Badge variant="outline" className="border-sky-500/40 text-xs text-sky-600">
								Tarjeta + transferencias
							</Badge>
						</CardAction>
					</CardHeader>
					<CardContent className="pt-0 text-xs text-muted-foreground">
						Tarjeta {currencyFormatter.format(ventasTarjeta)} · Transferencias {currencyFormatter.format(transferencias)}
					</CardContent>
				</Card>

				<Card size="sm" className="@container/card border border-border/60 py-4 shadow-none md:col-span-2 xl:col-span-1">
					<CardHeader className="pb-2">
						<CardDescription>Gastos del dia</CardDescription>
						<CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
							{currencyFormatter.format(totalGastosDia)}
						</CardTitle>
						<CardAction>
							<Badge variant="outline" className="border-amber-500/40 text-xs text-amber-600">
								{gastosDia.length} pagos a proveedores
							</Badge>
						</CardAction>
					</CardHeader>
					<CardContent className="pt-0 text-xs text-muted-foreground">
						Solo pagos en efectivo del turno.
					</CardContent>
				</Card>
			</div>

			<div className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-sm">
				<div className="flex flex-col gap-4 border-b border-border/60 bg-background/50 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-1">
						<h2 className="text-xl font-semibold">Tesoreria</h2>
						<p className="text-sm text-muted-foreground">
							Movimientos y corte de caja para controlar efectivo y dinero digital.
						</p>
						{loading && <p className="text-sm text-muted-foreground">Cargando tesoreria...</p>}
						{errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button type="button" variant="outline" size="sm" className="h-10 rounded-xl px-4" onClick={() => setMovimientoOpen(true)}>
							Movimiento de caja
						</Button>
						<Button type="button" size="sm" className="h-10 rounded-xl px-4" onClick={() => setCorteOpen(true)}>
							Corte de caja
						</Button>
					</div>
				</div>

				<div className="grid gap-4 p-4 lg:grid-cols-2">
					<Card className="border border-border/60 py-4 shadow-none">
						<CardHeader className="border-b pb-3">
							<CardTitle>Estado de caja</CardTitle>
							<CardDescription>Resumen del cajon del turno actual.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 pt-4 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Fondo de caja</span>
								<span className="font-medium tabular-nums">{currencyFormatter.format(fondoCaja)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Ventas en efectivo</span>
								<span className="font-medium tabular-nums">{currencyFormatter.format(ventasEfectivo)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Retiros/Entradas</span>
								<span className={`font-medium tabular-nums ${moneyClass(netoMovimientos)}`}>
									{currencyFormatter.format(netoMovimientos)}
								</span>
							</div>
							<div className="h-px bg-border/70" />
							<div className="flex items-center justify-between text-base font-semibold">
								<span>Efectivo esperado</span>
								<span className="tabular-nums">{currencyFormatter.format(efectivoEsperado)}</span>
							</div>
						</CardContent>
					</Card>

					<Card className="border border-border/60 py-4 shadow-none">
						<CardHeader className="border-b pb-3">
							<CardTitle>Dinero digital</CardTitle>
							<CardDescription>Entradas que no estan en el cajon fisico.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 pt-4 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Ventas con tarjeta</span>
								<span className="font-medium tabular-nums">{currencyFormatter.format(ventasTarjeta)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Transferencias (CoDi/SPEI)</span>
								<span className="font-medium tabular-nums">{currencyFormatter.format(transferencias)}</span>
							</div>
							<div className="h-px bg-border/70" />
							<div className="flex items-center justify-between text-base font-semibold">
								<span>Total digital</span>
								<span className="tabular-nums">{currencyFormatter.format(dineroDigital)}</span>
							</div>
							<div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
								<span>Ultimo corte</span>
								<span>
									{ultimoCorte
										? `${currencyFormatter.format(ultimoCorte.contado)} contado`
										: "Aun sin corte registrado"}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-4 px-4 pb-4 lg:grid-cols-2">
					<Card className="border border-border/60 py-4 shadow-none">
						<CardHeader className="border-b pb-3">
							<CardTitle>Movimientos de caja</CardTitle>
							<CardDescription>Entradas y salidas rapidas del turno.</CardDescription>
						</CardHeader>
						<CardContent className="px-0 pt-3">
							<Table>
								<TableHeader className="bg-muted/20">
									<TableRow className="border-border/70">
										<TableHead className="px-5 py-4 font-semibold">Hora</TableHead>
										<TableHead className="px-5 py-4 font-semibold">Concepto</TableHead>
										<TableHead className="px-5 py-4 font-semibold">Tipo</TableHead>
										<TableHead className="px-5 py-4 text-right font-semibold">Monto</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{movimientos.length ? (
										movimientos.map((item) => (
											<TableRow key={item.id} className="border-border/60 transition-colors hover:bg-muted/30">
												<TableCell className="px-5 py-4 text-xs text-muted-foreground">{formatTime(item.timestamp)}</TableCell>
												<TableCell className="px-5 py-4 text-sm">{item.concepto}</TableCell>
												<TableCell className="px-5 py-4">
													<Badge
														variant="outline"
														className={item.tipo === "entrada" ? "border-emerald-500/40 text-emerald-600" : "border-rose-500/40 text-rose-600"}
													>
														{item.tipo === "entrada" ? "Entrada" : "Retiro"}
													</Badge>
												</TableCell>
												<TableCell className={`px-5 py-4 text-right font-medium tabular-nums ${item.tipo === "entrada" ? "text-emerald-600" : "text-rose-600"}`}>
													{item.tipo === "entrada" ? "+" : "-"}{currencyFormatter.format(item.monto)}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow className="border-border/70">
											<TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
												Aun no hay movimientos.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					<Card className="border border-border/60 py-4 shadow-none">
						<CardHeader className="border-b pb-3">
							<CardTitle>Gastos del dia</CardTitle>
							<CardDescription>Pagos a proveedores realizados en efectivo.</CardDescription>
						</CardHeader>
						<CardContent className="px-0 pt-3">
							<Table>
								<TableHeader className="bg-muted/20">
									<TableRow className="border-border/70">
										<TableHead className="px-5 py-4 font-semibold">Hora</TableHead>
										<TableHead className="px-5 py-4 font-semibold">Proveedor</TableHead>
										<TableHead className="px-5 py-4 font-semibold">Concepto</TableHead>
										<TableHead className="px-5 py-4 text-right font-semibold">Monto</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{gastosDia.length ? (
										gastosDia.map((item) => (
											<TableRow key={item.id} className="border-border/60 transition-colors hover:bg-muted/30">
												<TableCell className="px-5 py-4 text-xs text-muted-foreground">{formatTime(item.timestamp)}</TableCell>
												<TableCell className="px-5 py-4 text-sm">{item.proveedor}</TableCell>
												<TableCell className="px-5 py-4 text-sm text-muted-foreground">{item.concepto}</TableCell>
												<TableCell className="px-5 py-4 text-right font-medium tabular-nums text-rose-600">
													-{currencyFormatter.format(item.monto)}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow className="border-border/70">
											<TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
												Aun no hay gastos a proveedores.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>

				<div className="px-4 pb-4">
					<Card className="border border-border/60 py-4 shadow-none">
						<CardHeader className="border-b pb-3">
							<CardTitle>Cortes de caja</CardTitle>
							<CardDescription>Comparativo entre efectivo esperado y contado.</CardDescription>
						</CardHeader>
						<CardContent className="px-0 pt-3">
							<Table>
								<TableHeader className="bg-muted/20">
									<TableRow className="border-border/70">
										<TableHead className="px-5 py-4 font-semibold">Fecha</TableHead>
										<TableHead className="px-5 py-4 font-semibold">Cajero / apertura</TableHead>
										<TableHead className="px-5 py-4 text-right font-semibold">Esperado</TableHead>
										<TableHead className="px-5 py-4 text-right font-semibold">Contado</TableHead>
										<TableHead className="px-5 py-4 text-right font-semibold">Diferencia</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{cortes.length ? (
										cortes.map((item) => (
											<TableRow key={item.id} className="border-border/60 transition-colors hover:bg-muted/30">
												<TableCell className="px-5 py-4 text-sm text-muted-foreground">{formatDateTime(item.timestamp)}</TableCell>
												<TableCell className="px-5 py-4 text-sm">
													<div className="flex flex-col gap-0.5">
														<span className="font-medium">{item.cajero}</span>
														<span className="text-xs text-muted-foreground">
															{formatDateTime(item.horaApertura)} · Fondo {currencyFormatter.format(item.montoInicial)}
														</span>
													</div>
												</TableCell>
												<TableCell className="px-5 py-4 text-right font-medium tabular-nums">{currencyFormatter.format(item.esperado)}</TableCell>
												<TableCell className="px-5 py-4 text-right font-medium tabular-nums">{currencyFormatter.format(item.contado)}</TableCell>
												<TableCell className={`px-5 py-4 text-right font-semibold tabular-nums ${moneyClass(item.diferencia)}`}>
													{currencyFormatter.format(item.diferencia)}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow className="border-border/70">
											<TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
												Aun no se registro un corte de caja.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			</div>

			<Sheet
				open={movimientoOpen}
				onOpenChange={(nextOpen) => {
					setMovimientoOpen(nextOpen)
					if (!nextOpen) resetMovimientoForm()
				}}
			>
				<SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
					<SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
						<SheetTitle className="text-lg font-semibold tracking-tight">Movimiento de caja</SheetTitle>
						<SheetDescription className="text-sm leading-5">Registra entradas o salidas rapidas del cajon.</SheetDescription>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto px-5 py-5">
						<div className="grid gap-4">
						<div className="grid gap-2">
							<Label>Tipo de movimiento</Label>
							<Select
								value={movimientoTipo}
								onValueChange={(value) => setMovimientoTipo(value as MovimientoTipo)}
							>
								<SelectTrigger className="h-11 rounded-lg bg-background">
									<SelectValue placeholder="Selecciona tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="entrada">Entrada</SelectItem>
									<SelectItem value="retiro">Retiro</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label>Categoria</Label>
							<Select
								value={movimientoCategoria}
								onValueChange={(value) => setMovimientoCategoria(value as MovimientoCategoria)}
							>
								<SelectTrigger className="h-11 rounded-lg bg-background">
									<SelectValue placeholder="Selecciona categoria" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="operativo">Operativo</SelectItem>
									<SelectItem value="proveedor">Pago a proveedor</SelectItem>
									<SelectItem value="otro">Otro</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{movimientoTipo === "retiro" && movimientoCategoria === "proveedor" ? (
							<div className="grid gap-2">
								<Label htmlFor="movimiento-proveedor">Proveedor</Label>
								<Input
									id="movimiento-proveedor"
									value={movimientoProveedor}
									onChange={(event) => setMovimientoProveedor(event.target.value)}
									placeholder="Ej. Panaderia San Pedro"
									className="h-11 rounded-lg"
								/>
							</div>
						) : null}

						<div className="grid gap-2">
							<Label htmlFor="movimiento-concepto">Concepto</Label>
							<Input
								id="movimiento-concepto"
								value={movimientoConcepto}
								onChange={(event) => setMovimientoConcepto(event.target.value)}
								placeholder="Ej. Pago de luz"
								className="h-11 rounded-lg"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="movimiento-monto">Monto</Label>
							<Input
								id="movimiento-monto"
								inputMode="decimal"
								value={movimientoMonto}
								onChange={(event) => setMovimientoMonto(event.target.value)}
								placeholder="Ej. 120"
								className="h-11 rounded-lg text-base tabular-nums"
							/>
						</div>
						</div>
					</div>

					<SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
						<Button type="button" variant="outline" className="h-11 rounded-lg" onClick={() => setMovimientoOpen(false)}>
							Cancelar
						</Button>
						<Button type="button" className="h-11 rounded-lg" onClick={guardarMovimientoCaja} disabled={savingMovimiento}>
							Guardar movimiento
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<Sheet open={corteOpen} onOpenChange={setCorteOpen}>
				<SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
					<SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12 text-left">
						<SheetTitle className="text-lg font-semibold tracking-tight">Corte de caja</SheetTitle>
						<SheetDescription className="text-sm leading-5">
							Primero elige el turno activo y luego captura el conteo real del cajon.
						</SheetDescription>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto px-5 py-5">
						<div className="grid gap-4">
						<div className="grid gap-2">
							<Label>Turno activo</Label>
							<Select value={turnoCorteId} onValueChange={setTurnoCorteId}>
								<SelectTrigger className="h-11 rounded-lg bg-background">
									<SelectValue placeholder="Selecciona cajero/turno" />
								</SelectTrigger>
								<SelectContent>
									{turnosActivos.map((turno) => (
										<SelectItem key={turno.id} value={turno.id}>
											{turno.cajero} · {formatDateTime(turno.horaApertura)} · {currencyFormatter.format(turno.montoInicial)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{turnoCorteSeleccionado ? (
							<div className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
								<span>{turnoCorteSeleccionado.cajero} · Apertura {formatDateTime(turnoCorteSeleccionado.horaApertura)}</span>
								<span>Fondo {currencyFormatter.format(turnoCorteSeleccionado.montoInicial)}</span>
							</div>
						) : null}

						<div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-3 text-sm">
							<span className="text-muted-foreground">Efectivo esperado</span>
							<span className="text-base font-semibold tabular-nums">{currencyFormatter.format(efectivoEsperadoCorte)}</span>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="corte-contado">Efectivo contado</Label>
							<Input
								id="corte-contado"
								inputMode="decimal"
								value={corteContado}
								onChange={(event) => setCorteContado(event.target.value)}
								placeholder="Ej. 3490"
								className="h-11 rounded-lg text-base tabular-nums"
							/>
						</div>

						<div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-3 text-sm">
							<span className="text-muted-foreground">Diferencia estimada</span>
							<span className={`text-base font-semibold tabular-nums ${moneyClass(diferenciaPreview ?? 0)}`}>
								{diferenciaPreview === null
									? "Ingresa un monto"
									: currencyFormatter.format(diferenciaPreview)}
							</span>
						</div>
						</div>
					</div>

					<SheetFooter className="grid gap-2 border-t bg-background px-5 py-4 sm:grid-cols-2">
						<Button type="button" variant="outline" className="h-11 rounded-lg" onClick={() => setCorteOpen(false)}>
							Cancelar
						</Button>
						<Button type="button" className="h-11 rounded-lg" onClick={guardarCorteCaja} disabled={savingCorte}>
							Guardar corte
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	)
}

