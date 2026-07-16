import Link from "next/link"
import { notFound } from "next/navigation"
import { RiPencilLine } from "@remixicon/react"

import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ServiceType } from "@/lib/generated/prisma/enums"
import { periodStatusLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { saveElectricity, togglePeriodStatus } from "../actions"
import { ElectricityForm, type ElectricityInitial } from "./electricity-form"

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})

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

  const service = await prisma.service.findFirst({
    where: { type: ServiceType.METERED, active: true },
    orderBy: { id: "asc" },
  })

  const families = await prisma.family.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, hasSubmeter: true },
  })

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
    issueDate: bill?.issueDate
      ? bill.issueDate.toISOString().slice(0, 10)
      : "",
    readings: readingsInitial,
  }

  const isOpen = period.status === "OPEN"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium">{period.label}</h1>
            {isOpen ? (
              <Badge variant="warning">{periodStatusLabels.OPEN}</Badge>
            ) : (
              <Badge variant="muted">{periodStatusLabels.CLOSED}</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Consumo de {period.days} días · prorrateo de luz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={togglePeriodStatus.bind(null, periodId)}>
            <Button type="submit" variant="outline" size="sm">
              {isOpen ? "Cerrar período" : "Reabrir período"}
            </Button>
          </form>
          <Link
            href={`/periodos/${periodId}/editar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <RiPencilLine className="size-4" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-xs font-normal">
              Recibo total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-medium">
              {bill ? soles.format(Number(bill.totalAmount)) : "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-xs font-normal">
              Total kWh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-medium">
              {bill?.totalKwh ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-xs font-normal">
              Familias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-medium">{families.length}</span>
          </CardContent>
        </Card>
      </div>

      {!service ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No hay un servicio medido activo. Crea uno de tipo “Medido (por
          consumo)” en{" "}
          <Link href="/servicios" className="text-primary underline">
            Servicios
          </Link>
          .
        </div>
      ) : families.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
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
    </div>
  )
}
