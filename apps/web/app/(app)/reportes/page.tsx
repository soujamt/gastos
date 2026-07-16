import {
  RiBarChartLine,
  RiFlashlightLine,
  RiPieChartLine,
} from "@remixicon/react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ChargeStatus, ServiceType } from "@/lib/generated/prisma/enums"
import { chargeStatusLabels, monthLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { PageHeader } from "../_components/page-header"
import { BarChart, type ChartSeries } from "./bar-chart"

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})

// Orden fijo de series: cada familia conserva su color aunque cambie el filtro.
const palette = [
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
]

function statusBadge(status: ChargeStatus) {
  if (status === ChargeStatus.PAID)
    return <Badge variant="success">{chargeStatusLabels.PAID}</Badge>
  if (status === ChargeStatus.PARTIAL)
    return <Badge variant="warning">{chargeStatusLabels.PARTIAL}</Badge>
  return <Badge variant="danger">{chargeStatusLabels.PENDING}</Badge>
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof RiBarChartLine
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(20,45,40,0.035)]">
      <h2 className="flex items-center gap-2 border-b px-5 py-4 text-sm font-medium sm:px-6">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

export default async function ReportesPage() {
  const [periods, families] = await Promise.all([
    prisma.period.findMany({
      orderBy: [{ year: "asc" }, { month: "asc" }],
      include: {
        bills: { include: { service: { select: { type: true } } } },
        charges: { include: { service: { select: { type: true } } } },
        statements: {
          include: { family: { select: { name: true, order: true } } },
        },
      },
    }),
    prisma.family.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ])

  if (periods.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Reportes"
          eyebrow="Análisis"
          description="Consumo, morosidad y estados de cuenta por familia."
        />
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card p-12 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <RiBarChartLine className="size-6" />
          </div>
          <h2 className="mt-4 font-semibold">Aún no hay datos</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Registra al menos un período con su consumo para ver los reportes.
          </p>
        </div>
      </div>
    )
  }

  const series: ChartSeries[] = families.map((f, i) => ({
    key: String(f.id),
    name: f.name,
    color: palette[i % palette.length] ?? palette[0]!,
  }))

  // Consumo (kWh) por familia y recibo de luz, por período
  const rows = periods.map((p) => {
    const kwhByFamily: Record<string, number> = {}
    for (const c of p.charges) {
      if (c.service.type !== ServiceType.METERED) continue
      kwhByFamily[String(c.familyId)] =
        (kwhByFamily[String(c.familyId)] ?? 0) + (c.kwh ?? 0)
    }
    const receipt = p.bills
      .filter((b) => b.service.type === ServiceType.METERED)
      .reduce((sum, b) => sum + Number(b.totalAmount), 0)
    return {
      id: p.id,
      label: p.label,
      short: monthLabels[p.month - 1]?.slice(0, 3) ?? p.label,
      kwhByFamily,
      totalKwh: Object.values(kwhByFamily).reduce((a, b) => a + b, 0),
      receipt,
    }
  })

  const totalBilled = periods.reduce(
    (sum, p) => sum + p.charges.reduce((s, c) => s + Number(c.amount), 0),
    0
  )
  const totalPaid = periods.reduce(
    (sum, p) =>
      sum + p.statements.reduce((s, st) => s + Number(st.paymentsTotal), 0),
    0
  )
  const latest = periods[periods.length - 1]
  const latestStatements = [...(latest?.statements ?? [])].sort(
    (a, b) =>
      a.family.order - b.family.order ||
      a.family.name.localeCompare(b.family.name)
  )
  const pending = latestStatements.reduce(
    (sum, st) => sum + Math.max(0, Number(st.balance)),
    0
  )
  // Nota: no se compara "cobrado" contra "cargos" como tasa de cobranza porque
  // los pagos también cubren deuda arrastrada, que no es un cargo del período.
  const totalKwh = rows.reduce((sum, r) => sum + r.totalKwh, 0)

  const kpis = [
    { label: "Cargos del histórico", value: soles.format(totalBilled) },
    { label: "Cobrado", value: soles.format(totalPaid) },
    {
      label: `Pendiente (${latest?.label ?? "—"})`,
      value: soles.format(pending),
    },
    { label: "Consumo total", value: `${totalKwh} kWh` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        eyebrow="Análisis"
        description="Evolución del consumo, recibos y morosidad por familia."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1.5 text-xl font-semibold tracking-[-0.03em] tabular-nums">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <Panel title="Consumo por familia (kWh)" icon={RiFlashlightLine}>
        <BarChart
          groups={rows.map((r) => ({ label: r.short, values: r.kwhByFamily }))}
          series={series}
          unit="kwh"
        />
      </Panel>

      <Panel title="Recibo mensual de luz" icon={RiBarChartLine}>
        <BarChart
          groups={rows.map((r) => ({
            label: r.short,
            values: { receipt: r.receipt },
          }))}
          series={[
            { key: "receipt", name: "Recibo", color: "var(--chart-2)" },
          ]}
          unit="pen"
        />
      </Panel>

      <Panel title="Detalle por período" icon={RiPieChartLine}>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                {families.map((f) => (
                  <TableHead key={f.id} className="text-right">
                    {f.name.replace("Fam. ", "")}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total kWh</TableHead>
                <TableHead className="text-right">Recibo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  {families.map((f) => (
                    <TableCell key={f.id} className="text-right tabular-nums">
                      {r.kwhByFamily[String(f.id)] ?? 0}
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular-nums">
                    {r.totalKwh}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {soles.format(r.receipt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Panel title={`Morosidad · ${latest?.label ?? ""}`} icon={RiPieChartLine}>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Familia</TableHead>
                <TableHead className="text-right">Cargos</TableHead>
                <TableHead className="text-right">Deuda ant.</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestStatements.map((st) => (
                <TableRow key={st.id}>
                  <TableCell className="font-medium">
                    {st.family.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {soles.format(Number(st.chargesTotal))}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {soles.format(Number(st.carriedDebt))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {soles.format(Number(st.paymentsTotal))}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {soles.format(Number(st.balance))}
                  </TableCell>
                  <TableCell>{statusBadge(st.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  )
}
