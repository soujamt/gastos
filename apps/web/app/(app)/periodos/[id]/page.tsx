import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ChargeStatus, ServiceType } from "@/lib/generated/prisma/enums"
import { chargeStatusLabels, paymentMethodLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../../_components/delete-button"
import { FormDialog } from "../../_components/form-dialog"
import {
  addPayment,
  carryForwardDebt,
  deletePayment,
  saveElectricity,
  togglePeriodStatus,
  updatePeriod,
} from "../actions"
import { PeriodForm } from "../period-form"
import { ElectricityForm, type ElectricityInitial } from "./electricity-form"
import { PaymentForm } from "./payment-form"

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})
const shortDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
})

function statusBadge(status: ChargeStatus) {
  if (status === ChargeStatus.PAID)
    return <Badge variant="success">{chargeStatusLabels.PAID}</Badge>
  if (status === ChargeStatus.PARTIAL)
    return <Badge variant="warning">{chargeStatusLabels.PARTIAL}</Badge>
  return <Badge variant="danger">{chargeStatusLabels.PENDING}</Badge>
}

export default async function PeriodoWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const periodId = Number(id)
  if (!Number.isInteger(periodId)) notFound()

  const period = await prisma.period.findUnique({ where: { id: periodId } })
  if (!period) notFound()

  const [service, families, statements, payments] = await Promise.all([
    prisma.service.findFirst({
      where: { type: ServiceType.METERED, active: true },
      orderBy: { id: "asc" },
    }),
    prisma.family.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, hasSubmeter: true },
    }),
    prisma.statement.findMany({
      where: { periodId },
      include: { family: { select: { name: true, order: true } } },
    }),
    prisma.payment.findMany({
      where: { periodId },
      include: { family: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
    }),
  ])

  statements.sort(
    (a, b) =>
      a.family.order - b.family.order ||
      a.family.name.localeCompare(b.family.name)
  )

  const bill = service
    ? await prisma.bill.findUnique({
        where: { periodId_serviceId: { periodId, serviceId: service.id } },
      })
    : null

  const readings = service
    ? await prisma.reading.findMany({
        where: { periodId, serviceId: service.id },
      })
    : []

  const readingsInitial: ElectricityInitial["readings"] = {}
  for (const r of readings) {
    readingsInitial[r.familyId] = {
      previous: String(r.previous),
      current: String(r.current),
    }
  }

  const initial: ElectricityInitial = {
    totalAmount: bill ? bill.totalAmount.toString() : "",
    totalMeterKwh: bill?.totalKwh != null ? String(bill.totalKwh) : "",
    meterPrev: bill?.meterPrev != null ? String(bill.meterPrev) : "",
    meterCurr: bill?.meterCurr != null ? String(bill.meterCurr) : "",
    issueDate: bill?.issueDate ? bill.issueDate.toISOString().slice(0, 10) : "",
    readings: readingsInitial,
  }

  const totals = statements.reduce(
    (acc, s) => {
      acc.porCobrar += Number(s.carriedDebt) + Number(s.chargesTotal)
      acc.pagado += Number(s.paymentsTotal)
      acc.pendiente += Number(s.balance)
      return acc
    },
    { porCobrar: 0, pagado: 0, pendiente: 0 }
  )

  const isOpen = period.status === "OPEN"

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.13em] text-primary uppercase">
            Espacio del período
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[1.75rem]">
              {period.label}
            </h1>
            {isOpen ? (
              <Badge variant="warning">Abierto</Badge>
            ) : (
              <Badge variant="muted">Cerrado</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Consumo de {period.days} días · prorrateo de luz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={togglePeriodStatus.bind(null, periodId)}>
            <Button type="submit" variant="outline" size="sm">
              {isOpen ? "Cerrar período" : "Reabrir período"}
            </Button>
          </form>
          <FormDialog
            title="Editar período"
            description={`Actualiza la configuración de ${period.label}.`}
            label="Editar período"
            mode="custom"
          >
            <PeriodForm
              action={updatePeriod.bind(null, periodId)}
              submitLabel="Guardar cambios"
              modal
              initial={{
                year: period.year,
                month: period.month,
                days: period.days,
                status: period.status,
              }}
            />
          </FormDialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Total a cobrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-medium">
              {soles.format(totals.porCobrar)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-medium text-emerald-600 dark:text-emerald-400">
              {soles.format(totals.pagado)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-medium text-destructive">
              {soles.format(totals.pendiente)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Total kWh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-medium">
              {bill?.totalKwh ?? "—"}
            </span>
          </CardContent>
        </Card>
      </div>

      {!service ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay un servicio medido activo. Crea uno de tipo “Medido (por
          consumo)” en{" "}
          <Link href="/servicios" className="text-primary underline">
            Servicios
          </Link>
          .
        </div>
      ) : families.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay familias activas. Agrégalas en{" "}
          <Link href="/familias" className="text-primary underline">
            Familias
          </Link>
          .
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Prorrateo de {service.name}</h2>
          <ElectricityForm
            action={saveElectricity.bind(null, periodId)}
            serviceId={service.id}
            families={families}
            initial={initial}
          />
        </div>
      )}

      {statements.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Estado de cuenta</h2>
            <form action={carryForwardDebt.bind(null, periodId)}>
              <Button type="submit" variant="outline" size="sm">
                Arrastrar saldo al siguiente mes
              </Button>
            </form>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Familia</TableHead>
                  <TableHead className="text-right">Cargos</TableHead>
                  <TableHead className="text-right">Deuda ant.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((s) => {
                  const cargos = Number(s.chargesTotal)
                  const deuda = Number(s.carriedDebt)
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.family.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {soles.format(cargos)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {soles.format(deuda)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {soles.format(cargos + deuda)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 tabular-nums dark:text-emerald-400">
                        {soles.format(Number(s.paymentsTotal))}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {soles.format(Number(s.balance))}
                      </TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {families.length > 0 ? (
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold">¿Recibiste un abono?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Regístralo sin salir de este período y actualizaremos el saldo.
            </p>
          </div>
          <FormDialog
            title="Registrar pago"
            description={`Agrega un abono al período ${period.label}.`}
            label="Registrar pago"
          >
            <PaymentForm
              action={addPayment.bind(null, periodId)}
              families={families}
              modal
            />
          </FormDialog>
        </div>
      ) : null}

      {payments.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Pagos del período</h2>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Fecha</TableHead>
                  <TableHead>Familia</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">
                      {shortDate.format(p.paidAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.family.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paymentMethodLabels[p.method]}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {soles.format(Number(p.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deletePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <DeleteButton confirmText="El pago se quitará del historial y el saldo de la familia se recalculará." />
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
