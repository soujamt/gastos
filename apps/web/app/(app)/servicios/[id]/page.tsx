import { notFound } from "next/navigation"

import { prisma } from "@/lib/prisma"

import { PageHeader } from "../../_components/page-header"
import { updateService } from "../actions"
import { ServiceForm } from "../service-form"

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const serviceId = Number(id)
  if (!Number.isInteger(serviceId)) notFound()

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  })
  if (!service) notFound()

  const action = updateService.bind(null, serviceId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar servicio" description={service.name} />
      <ServiceForm
        action={action}
        submitLabel="Guardar cambios"
        initial={{
          name: service.name,
          type: service.type,
          unit: service.unit,
          active: service.active,
        }}
      />
    </div>
  )
}
