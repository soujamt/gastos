import {
  RiBarChartLine,
  RiFlashlightLine,
  RiMoneyDollarCircleLine,
  RiPieChartLine,
  RiTimeLine,
} from "@remixicon/react"

import { EmptyState } from "@workspace/ui/components/empty-state"
import { Stat } from "@workspace/ui/components/stat"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ServiceType } from "@/lib/generated/prisma/enums"
import { monthLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"
import { getViewer } from "@/lib/viewer"

import { ChargeStatusDot } from "../_components/charge-status"
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
    <section className="overflow-hidden rounded-2xl border bg-card shadow-panel">
      <h2 className="flex items-center gap-2 border-b px-5 py-4 text-sm font-medium sm:px-6">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

export default async function ReportesPage() {
  const { familyScope } = await getViewer()

  const [periods, allFamilies] = await Promise.all([
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

  // Rol FAMILY: el reporte se reduce a su propia familia.
  const families =
    familyScope === null
      ? allFamilies
      : allFamilies.filter((f) => f.id === familyScope)
  const visibleFamilyIds = new Set(families.map((f) => f.id))

  if (periods.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Reportes"
          eyebrow="Análisis"
          description="Consumo, morosidad y estados de cuenta por familia."
        />
        <EmptyState
          icon={RiBarChartLine}
          title="Aún no hay datos"
          description="Registra al menos un período con su consumo para ver los reportes."
        />
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
    let totalKwhPeriod = 0
    for (const c of p.charges) {
      if (c.service.type !== ServiceType.METERED) continue
      // El total del período es agregado (da contexto al recibo compartido).
      totalKwhPeriod += c.kwh ?? 0
      if (!visibleFamilyIds.has(c.familyId)) continue
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
      totalKwh: totalKwhPeriod,
      receipt,
    }
  })

  const totalBilled = periods.reduce(
    (sum, p) =>
      sum +
      p.charges
        .filter((c) => visibleFamilyIds.has(c.familyId))
        .reduce((s, c) => s + Number(c.amount), 0),
    0
  )
  const totalPaid = periods.reduce(
    (sum, p) =>
      sum +
      p.statements
        .filter((st) => visibleFamilyIds.has(st.familyId))
        .reduce((s, st) => s + Number(st.paymentsTotal), 0),
    0
  )
  const latest = periods[periods.length - 1]
  const latestStatements = [
    ...(latest?.statements ?? []).filter((st) =>
      visibleFamilyIds.has(st.familyId)
    ),
  ].sort(
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
  const totalKwh = rows.reduce(
    (sum, r) =>
      sum + Object.values(r.kwhByFamily).reduce((a, b) => a + b, 0),
    0
  )

  // Variación del último período contra el anterior, para dar contexto al dato.
  const previous = periods[periods.length - 2]
  const previousPending = (previous?.statements ?? [])
    .filter((st) => visibleFamilyIds.has(st.familyId))
    .reduce((sum, st) => sum + Math.max(0, Number(st.balance)), 0)

  const sumKwh = (row?: (typeof rows)[number]) =>
    row ? Object.values(row.kwhByFamily).reduce((a, b) => a + b, 0) : 0
  const lastKwh = sumKwh(rows[rows.length - 1])
  const previousKwh = sumKwh(rows[rows.length - 2])

  /**
   * Variación contra el período anterior.
   *
   * El dinero se compara en valor absoluto y el consumo en porcentaje: cuando
   * la base es pequeña el porcentaje se dispara y deja de informar (pasar de
   * S/23 a S/268 es "+1065%", que no dice nada; "+S/245" sí).
   */
  function variation(
    current: number,
    before: number,
    unit: "pen" | "kwh"
  ) {
    if (before === 0 && current === 0) return null
    const diff = current - before
    const direction = (diff > 0 ? "up" : diff < 0 ? "down" : "flat") as
      | "up"
      | "down"
      | "flat"
    if (unit === "pen") {
      return { value: soles.format(Math.abs(diff)), direction, diff }
    }
    if (!before) return null
    const pct = (diff / before) * 100
    return { value: `${Math.abs(pct).toFixed(1)}%`, direction, diff }
  }

  const pendingVar = variation(pending, previousPending, "pen")
  const kwhVar = variation(lastKwh, previousKwh, "kwh")

  const kpis = [
    {
      label: "Cargos del histórico",
      value: soles.format(totalBilled),
      icon: RiBarChartLine,
      hint: `${periods.length} períodos registrados`,
    },
    {
      label: "Cobrado",
      value: soles.format(totalPaid),
      icon: RiMoneyDollarCircleLine,
      hint: "Suma de todos los abonos",
    },
    {
      label: `Pendiente · ${latest?.label ?? "—"}`,
      value: soles.format(pending),
      icon: RiTimeLine,
      hint: previous ? `vs ${previous.label}` : undefined,
      // Que suba lo pendiente es una mala señal.
      delta: pendingVar
        ? {
            value: pendingVar.value,
            direction: pendingVar.direction,
            tone:
              pendingVar.direction === "flat"
                ? ("neutral" as const)
                : pendingVar.diff > 0
                  ? ("negative" as const)
                  : ("positive" as const),
          }
        : undefined,
    },
    {
      label: `Consumo · ${latest?.label ?? "—"}`,
      value: `${lastKwh} kWh`,
      icon: RiFlashlightLine,
      hint: previous ? `vs ${previous.label}` : undefined,
      // Consumir menos luz también es una buena señal.
      delta: kwhVar
        ? {
            value: kwhVar.value,
            direction: kwhVar.direction,
            tone:
              kwhVar.direction === "flat"
                ? ("neutral" as const)
                : kwhVar.diff > 0
                  ? ("negative" as const)
                  : ("positive" as const),
          }
        : undefined,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        eyebrow="Análisis"
        description="Evolución del consumo, recibos y morosidad por familia."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Stat
            key={k.label}
            label={k.label}
            value={k.value}
            hint={k.hint}
            delta={k.delta}
            icon={k.icon}
          />
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
                  <TableCell><ChargeStatusDot status={st.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  )
}
