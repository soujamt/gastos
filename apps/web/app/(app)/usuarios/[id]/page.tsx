import { notFound } from "next/navigation"

import { prisma } from "@/lib/prisma"

import { PageHeader } from "../../_components/page-header"
import { updateUser } from "../actions"
import { UserForm } from "../user-form"

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = Number(id)
  if (!Number.isInteger(userId)) notFound()

  const [user, families] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.family.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])
  if (!user) notFound()

  const action = updateUser.bind(null, userId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Editar usuario" description={user.email} />
      <UserForm
        action={action}
        families={families}
        submitLabel="Guardar cambios"
        isEdit
        initial={{
          email: user.email,
          name: user.name,
          role: user.role,
          familyId: user.familyId,
          active: user.active,
        }}
      />
    </div>
  )
}
