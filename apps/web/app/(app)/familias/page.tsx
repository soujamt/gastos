import { RiGroupLine, RiPulseLine } from "@remixicon/react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { FormDialog } from "../_components/form-dialog"
import { PageHeader } from "../_components/page-header"
import { createFamily, deleteFamily, updateFamily } from "./actions"
import { FamilyForm } from "./family-form"

export default async function FamiliasPage() {
  const families = await prisma.family.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })
  const activeCount = families.filter((family) => family.active).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Familias"
        description="Administra las unidades que comparten gastos y define cómo participa cada una en el consumo."
        eyebrow="Organización"
        action={
          <FormDialog
            title="Nueva familia"
            description="Registra una unidad y define su participación en el reparto mensual."
            label="Nueva familia"
          >
            <FamilyForm
              action={createFamily}
              submitLabel="Crear familia"
              modal
            />
          </FormDialog>
        }
      />

      {families.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card p-12 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <RiGroupLine className="size-6" />
          </div>
          <h2 className="mt-4 font-semibold">Crea tu primera familia</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Las familias son la base para repartir consumos, cargos y registrar
            pagos.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(20,45,40,0.035)]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-5 py-4 text-sm sm:px-6">
            <div className="flex items-center gap-2 font-medium">
              <RiGroupLine className="size-4 text-primary" />
              {families.length} {families.length === 1 ? "familia" : "familias"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiPulseLine className="size-4" />
              {activeCount} activas
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Orden</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Sub-medidor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.map((family) => (
                <TableRow key={family.id}>
                  <TableCell className="text-muted-foreground">
                    {family.order}
                  </TableCell>
                  <TableCell className="font-medium">{family.name}</TableCell>
                  <TableCell>
                    {family.hasSubmeter ? (
                      <Badge variant="default">Con sub-medidor</Badge>
                    ) : (
                      <Badge variant="warning">Resto</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {family.active ? (
                      <Badge variant="success">Activa</Badge>
                    ) : (
                      <Badge variant="muted">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <FormDialog
                        title="Editar familia"
                        description={`Actualiza la configuración de ${family.name}.`}
                        label={`Editar ${family.name}`}
                        mode="edit"
                      >
                        <FamilyForm
                          action={updateFamily.bind(null, family.id)}
                          submitLabel="Guardar cambios"
                          modal
                          initial={{
                            name: family.name,
                            order: family.order,
                            hasSubmeter: family.hasSubmeter,
                            active: family.active,
                          }}
                        />
                      </FormDialog>
                      <form action={deleteFamily}>
                        <input type="hidden" name="id" value={family.id} />
                        <DeleteButton />
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
