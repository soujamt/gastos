import { RiShieldUserLine, RiUserSettingsLine } from "@remixicon/react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { roleLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { FormDialog } from "../_components/form-dialog"
import { PageHeader } from "../_components/page-header"
import { createUser, deleteUser, updateUser } from "./actions"
import { UserForm } from "./user-form"

export default async function UsuariosPage() {
  const [users, families] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: { family: { select: { name: true } } },
    }),
    prisma.family.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])
  const adminCount = users.filter((user) => user.role === "ADMIN").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Controla quién puede acceder, qué puede gestionar y a qué familia pertenece."
        eyebrow="Seguridad"
        action={
          <FormDialog
            title="Nuevo usuario"
            description="Crea una cuenta y asigna el nivel de acceso adecuado."
            label="Nuevo usuario"
          >
            <UserForm
              action={createUser}
              families={families}
              submitLabel="Crear usuario"
              modal
            />
          </FormDialog>
        }
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(20,45,40,0.035)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-5 py-4 text-sm sm:px-6">
          <div className="flex items-center gap-2 font-medium">
            <RiUserSettingsLine className="size-4 text-primary" />
            {users.length} {users.length === 1 ? "usuario" : "usuarios"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RiShieldUserLine className="size-4" />
            {adminCount}{" "}
            {adminCount === 1 ? "administrador" : "administradores"}
          </div>
        </div>
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
                    <FormDialog
                      title="Editar usuario"
                      description={`Actualiza los datos y permisos de ${user.name ?? user.email}.`}
                      label={`Editar ${user.email}`}
                      mode="edit"
                    >
                      <UserForm
                        action={updateUser.bind(null, user.id)}
                        families={families}
                        submitLabel="Guardar cambios"
                        isEdit
                        modal
                        initial={{
                          email: user.email,
                          name: user.name,
                          role: user.role,
                          familyId: user.familyId,
                          active: user.active,
                        }}
                      />
                    </FormDialog>
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={user.id} />
                      <DeleteButton confirmText="La cuenta perderá el acceso al sistema de forma permanente." />
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
