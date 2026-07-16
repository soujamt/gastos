import { auth } from "@/auth"
import { Role } from "@/lib/generated/prisma/enums"

/** Ensures the current session belongs to an admin. Throws otherwise. */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("No autorizado: se requiere rol de administrador")
  }
  return session
}
