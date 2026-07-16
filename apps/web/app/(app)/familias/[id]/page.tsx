import { notFound } from "next/navigation"

import { prisma } from "@/lib/prisma"

import { PageHeader } from "../../_components/page-header"
import { updateFamily } from "../actions"
import { FamilyForm } from "../family-form"

export default async function EditarFamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const familyId = Number(id)
  if (!Number.isInteger(familyId)) notFound()

  const family = await prisma.family.findUnique({ where: { id: familyId } })
  if (!family) notFound()

  const action = updateFamily.bind(null, familyId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar familia" description={family.name} />
      <FamilyForm
        action={action}
        submitLabel="Guardar cambios"
        initial={{
          name: family.name,
          order: family.order,
          hasSubmeter: family.hasSubmeter,
          active: family.active,
        }}
      />
    </div>
  )
}
