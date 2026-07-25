import { RiShieldUserLine, RiUserSettingsLine } from "@remixicon/react"

import { AvatarLabel } from "@workspace/ui/components/avatar"
import { StatusDot } from "@workspace/ui/components/status-dot"
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

import { DataPanel } from "../_components/data-panel"
import { DeleteButton } from "../_components/delete-button"
import { FormDialog } from "../_components/form-dialog"
import { PageHeader } from "../_components/page-header"
import { createUser, deleteUser, updateUser } from "./actions"
import { UserForm } from "./user-form"
import { requireAdminPage } from "@/lib/viewer"

export default async function UsuariosPage() {
  await requireAdminPage()

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

      <DataPanel
        meta={[
          {
            icon: RiUserSettingsLine,
            label: `${users.length} ${users.length === 1 ? "usuario" : "usuarios"}`,
          },
          {
            icon: RiShieldUserLine,
            label: `${adminCount} ${adminCount === 1 ? "administrador" : "administradores"}`,
          },
        ]}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Familia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <AvatarLabel
                    name={user.name ?? user.email}
                    hint={user.name ? user.email : undefined}
                  />
                </TableCell>
                <TableCell>{roleLabels[user.role]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.family?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusDot tone={user.active ? "success" : "muted"}>
                    {user.active ? "Activo" : "Inactivo"}
                  </StatusDot>
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
      </DataPanel>
    </div>
  )
}
