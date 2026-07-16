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
import { serviceTypeLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { PageHeader } from "../_components/page-header"
import { deleteService } from "./actions"

export default async function ServiciosPage() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Servicios"
        description="Luz, agua y otros gastos, con su forma de reparto."
        action={{ href: "/servicios/nuevo", label: "Nuevo servicio" }}
      />

      {services.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Aún no hay servicios. Crea el primero.
        </div>
      ) : (
        <div className="rounded-lg border">
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
                      <Link
                        href={`/servicios/${service.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                          "text-muted-foreground"
                        )}
                        aria-label="Editar"
                      >
                        <RiEditLine />
                      </Link>
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
