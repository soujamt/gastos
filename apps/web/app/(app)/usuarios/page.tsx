import Link from "next/link"
import { RiEditLine } from "@remixicon/react"

import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { roleLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { PageHeader } from "../_components/page-header"
import { deleteUser } from "./actions"

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    include: { family: { select: { name: true } } },
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso y sus roles (admin, familia, solo lectura)."
        action={{ href: "/usuarios/nuevo", label: "Nuevo usuario" }}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Correo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Familia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.name ?? "—"}
                </TableCell>
                <TableCell>{roleLabels[user.role]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.family?.name ?? "—"}
                </TableCell>
                <TableCell>
                  {user.active ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="muted">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/usuarios/${user.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "text-muted-foreground"
                      )}
                      aria-label="Editar"
                    >
                      <RiEditLine />
                    </Link>
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={user.id} />
                      <DeleteButton confirmText="¿Eliminar este usuario?" />
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
