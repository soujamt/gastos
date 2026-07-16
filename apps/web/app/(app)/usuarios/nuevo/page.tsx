import { prisma } from "@/lib/prisma"

import { PageHeader } from "../../_components/page-header"
import { createUser } from "../actions"
import { UserForm } from "../user-form"

export default async function NuevoUsuarioPage() {
  const families = await prisma.family.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuevo usuario"
        description="Crea una cuenta de acceso y asigna su rol."
      />
      <UserForm
        action={createUser}
        families={families}
        submitLabel="Crear usuario"
      />
    </div>
  )
}
