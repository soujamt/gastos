import Link from "next/link"
import { RiCalendar2Line, RiPulseLine } from "@remixicon/react"

import { EmptyState } from "@workspace/ui/components/empty-state"
import { StatusDot } from "@workspace/ui/components/status-dot"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { periodStatusLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { FormDialog } from "../_components/form-dialog"
import { DataPanel } from "../_components/data-panel"
import { PageHeader } from "../_components/page-header"
import { createPeriod, deletePeriod, updatePeriod } from "./actions"
import { PeriodForm } from "./period-form"
import { requireAdminPage } from "@/lib/viewer"

export default async function PeriodosPage() {
  await requireAdminPage()

  const periods = await prisma.period.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { bills: true, charges: true } } },
  })
  const openCount = periods.filter((period) => period.status === "OPEN").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Períodos"
        description="Organiza cada ciclo de facturación, desde las lecturas hasta la conciliación de pagos."
        eyebrow="Operación mensual"
        action={
          <FormDialog
            title="Nuevo período"
            description="Abre un ciclo para registrar consumos, cargos y pagos."
            label="Nuevo período"
          >
            <PeriodForm
              action={createPeriod}
              submitLabel="Crear período"
              modal
            />
          </FormDialog>
        }
      />

      {periods.length === 0 ? (
        <EmptyState
          icon={RiCalendar2Line}
          title="Abre tu primer período"
          description="Cada período reúne recibos, lecturas, cargos y pagos de un mes."
        />
      ) : (
        <DataPanel
          meta={[
            {
              icon: RiCalendar2Line,
              label: `${periods.length} ${periods.length === 1 ? "período" : "períodos"}`,
            },
            {
              icon: RiPulseLine,
              label: `${openCount} ${openCount === 1 ? "abierto" : "abiertos"}`,
            },
          ]}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="w-20">Días</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24">Cargos</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/periodos/${period.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {period.label}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {period.days}
                  </TableCell>
                  <TableCell>
                    {period.status === "OPEN" ? (
                      <StatusDot tone="warning">
                        {periodStatusLabels.OPEN}
                      </StatusDot>
                    ) : (
                      <StatusDot tone="muted">
                        {periodStatusLabels.CLOSED}
                      </StatusDot>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {period._count.charges}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <FormDialog
                        title="Editar período"
                        description={`Actualiza la configuración de ${period.label}.`}
                        label={`Editar ${period.label}`}
                        mode="edit"
                      >
                        <PeriodForm
                          action={updatePeriod.bind(null, period.id)}
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
                      <form action={deletePeriod}>
                        <input type="hidden" name="id" value={period.id} />
                        <DeleteButton />
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataPanel>
      )}
    </div>
  )
}
