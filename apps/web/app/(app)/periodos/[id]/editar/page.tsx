import { notFound } from "next/navigation"

import { prisma } from "@/lib/prisma"

import { PageHeader } from "../../../_components/page-header"
import { updatePeriod } from "../../actions"
import { PeriodForm } from "../../period-form"

export default async function EditarPeriodoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const periodId = Number(id)
  if (!Number.isInteger(periodId)) notFound()

  const period = await prisma.period.findUnique({ where: { id: periodId } })
  if (!period) notFound()

  const action = updatePeriod.bind(null, periodId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar período" description={period.label} />
      <PeriodForm
        action={action}
        submitLabel="Guardar cambios"
        initial={{
          year: period.year,
          month: period.month,
          days: period.days,
          status: period.status,
        }}
      />
    </div>
  )
}
