import Link from "next/link"
import { RiSpeedUpLine } from "@remixicon/react"

import { Avatar } from "@workspace/ui/components/avatar"
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
import { prisma } from "@/lib/prisma"
import { requireAdminPage } from "@/lib/viewer"

import { DataPanel } from "../_components/data-panel"
import { FilterChips } from "../_components/filter-chips"
import { PageHeader } from "../_components/page-header"

export default async function LecturasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  await requireAdminPage()

  const { periodo } = await searchParams
  const periodFilter = Number(periodo)
  const hasFilter = Number.isInteger(periodFilter) && periodFilter > 0

  const [periods, readings] = await Promise.all([
    prisma.period.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { id: true, label: true, _count: { select: { readings: true } } },
    }),
    prisma.reading.findMany({
      where: hasFilter ? { periodId: periodFilter } : {},
      include: {
        family: { select: { name: true, order: true } },
        period: { select: { id: true, label: true, year: true, month: true } },
        service: { select: { name: true, unit: true } },
      },
    }),
  ])

  // Más reciente primero y, dentro del mes, en el orden habitual de familias.
  readings.sort(
    (a, b) =>
      b.period.year - a.period.year ||
      b.period.month - a.period.month ||
      a.family.order - b.family.order ||
      a.family.name.localeCompare(b.family.name)
  )

  const totalKwh = readings.reduce((sum, r) => sum + r.kwh, 0)
  const average = readings.length ? Math.round(totalKwh / readings.length) : 0
  const highest = readings.reduce(
    (top, r) => (top && top.kwh >= r.kwh ? top : r),
    readings[0]
  )

  const chips = [
    {
      label: "Todos",
      href: "/lecturas",
      active: !hasFilter,
      count: periods.reduce((sum, p) => sum + p._count.readings, 0),
    },
    ...periods
      .filter((p) => p._count.readings > 0)
      .map((p) => ({
        label: p.label,
        href: `/lecturas?periodo=${p.id}`,
        active: hasFilter && periodFilter === p.id,
        count: p._count.readings,
      })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lecturas"
        eyebrow="Sub-medidores"
        description="Historial de lecturas y consumo calculado por familia y período."
      />

      {readings.length === 0 && !hasFilter ? (
        <EmptyState
          icon={RiSpeedUpLine}
          title="Aún no hay lecturas"
          description="Las lecturas se registran al calcular el prorrateo de luz dentro de cada período."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Lecturas registradas"
              value={readings.length}
              icon={RiSpeedUpLine}
              hint={hasFilter ? "En el período filtrado" : "En todo el histórico"}
            />
            <Stat
              label="Consumo acumulado"
              value={`${totalKwh} kWh`}
              hint={`Promedio de ${average} kWh por lectura`}
            />
            <Stat
              label="Mayor consumo"
              value={highest ? `${highest.kwh} kWh` : "—"}
              hint={
                highest
                  ? `${highest.family.name} · ${highest.period.label}`
                  : undefined
              }
            />
          </div>

          <FilterChips chips={chips} label="Período" />

          {readings.length === 0 ? (
            <EmptyState
              icon={RiSpeedUpLine}
              title="Sin lecturas en este período"
              description="Registra el prorrateo de luz del período para que aparezcan sus lecturas."
            />
          ) : (
            <DataPanel
              meta={[
                {
                  icon: RiSpeedUpLine,
                  label: `${readings.length} ${readings.length === 1 ? "lectura" : "lecturas"}`,
                },
              ]}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Familia</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">Lect. anterior</TableHead>
                    <TableHead className="text-right">Lect. actual</TableHead>
                    <TableHead className="text-right">Consumo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link
                          href={`/periodos/${r.period.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {r.period.label}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2.5">
                          <Avatar name={r.family.name} size="sm" />
                          {r.family.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.service.name}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {r.previous}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {r.current}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {r.kwh} {r.service.unit ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataPanel>
          )}
        </>
      )}
    </div>
  )
}
