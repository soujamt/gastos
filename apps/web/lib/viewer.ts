import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Role } from "@/lib/generated/prisma/enums"

/**
 * Contexto del usuario que mira la página.
 *
 * `familyScope` es el candado de privacidad: para el rol FAMILY vale su propia
 * familia y toda consulta debe filtrarse por él. Para ADMIN y VIEWER es null
 * (ven el consolidado). Un FAMILY sin familia asignada no ve datos de nadie.
 */
export async function getViewer() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === Role.ADMIN
  const isFamily = session.user.role === Role.FAMILY

  return {
    user: session.user,
    isAdmin,
    isFamily,
    familyScope: isFamily ? (session.user.familyId ?? -1) : null,
  }
}

/** Páginas de administración: cualquier otro rol vuelve al inicio. */
export async function requireAdminPage() {
  const viewer = await getViewer()
  if (!viewer.isAdmin) redirect("/")
  return viewer
}

/** Filtro Prisma por familia según el rol. */
export function familyFilter(familyScope: number | null) {
  return familyScope === null ? {} : { familyId: familyScope }
}
