import { RiFlashlightLine, RiPulseLine } from "@remixicon/react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { serviceTypeLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { FormDialog } from "../_components/form-dialog"
import { PageHeader } from "../_components/page-header"
import { createService, deleteService, updateService } from "./actions"
import { ServiceForm } from "./service-form"

export default async function ServiciosPage() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } })
  const activeCount = services.filter((service) => service.active).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Servicios"
        description="Configura luz, agua y otros gastos con reglas de reparto claras para todos."
        eyebrow="Catálogo"
        action={
          <FormDialog
            title="Nuevo servicio"
            description="Define el servicio y la regla que se utilizará para repartirlo."
            label="Nuevo servicio"
          >
            <ServiceForm
              action={createService}
              submitLabel="Crear servicio"
              modal
            />
          </FormDialog>
        }
      />

      {services.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card p-12 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <RiFlashlightLine className="size-6" />
          </div>
          <h2 className="mt-4 font-semibold">Agrega tu primer servicio</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Define si se repartirá por consumo, en partes iguales o con un monto
            fijo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(20,45,40,0.035)]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-5 py-4 text-sm sm:px-6">
            <div className="flex items-center gap-2 font-medium">
              <RiFlashlightLine className="size-4 text-primary" />
              {services.length}{" "}
              {services.length === 1 ? "servicio" : "servicios"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiPulseLine className="size-4" />
              {activeCount} activos
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Reparto</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{serviceTypeLabels[service.type]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {service.unit ?? "—"}
                  </TableCell>
                  <TableCell>
                    {service.active ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="muted">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <FormDialog
                        title="Editar servicio"
                        description={`Actualiza la configuración de ${service.name}.`}
                        label={`Editar ${service.name}`}
                        mode="edit"
                      >
                        <ServiceForm
                          action={updateService.bind(null, service.id)}
                          submitLabel="Guardar cambios"
                          modal
                          initial={{
                            name: service.name,
                            type: service.type,
                            unit: service.unit,
                            active: service.active,
                          }}
                        />
                      </FormDialog>
                      <form action={deleteService}>
                        <input type="hidden" name="id" value={service.id} />
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
