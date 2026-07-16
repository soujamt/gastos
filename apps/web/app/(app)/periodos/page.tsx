import Link from "next/link"
import { RiCalendar2Line, RiPulseLine } from "@remixicon/react"

import { Badge } from "@workspace/ui/components/badge"
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
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card p-12 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <RiCalendar2Line className="size-6" />
          </div>
          <h2 className="mt-4 font-semibold">Abre tu primer período</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Cada período reúne recibos, lecturas, cargos y pagos de un mes.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(20,45,40,0.035)]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-5 py-4 text-sm sm:px-6">
            <div className="flex items-center gap-2 font-medium">
              <RiCalendar2Line className="size-4 text-primary" />
              {periods.length} {periods.length === 1 ? "período" : "períodos"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiPulseLine className="size-4" />
              {openCount} {openCount === 1 ? "abierto" : "abiertos"}
            </div>
          </div>
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
                      <Badge variant="warning">{periodStatusLabels.OPEN}</Badge>
                    ) : (
                      <Badge variant="muted">{periodStatusLabels.CLOSED}</Badge>
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
        </div>
      )}
    </div>
  )
}
