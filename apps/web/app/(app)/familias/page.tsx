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
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { PageHeader } from "../_components/page-header"
import { deleteFamily } from "./actions"

export default async function FamiliasPage() {
  const families = await prisma.family.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Familias"
        description="Las unidades que comparten los gastos y sus sub-medidores."
        action={{ href: "/familias/nuevo", label: "Nueva familia" }}
      />

      {families.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Aún no hay familias. Crea la primera.
        </div>
      ) : (
        <div className="rounded-lg border">
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
                      <Link
                        href={`/familias/${family.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                          "text-muted-foreground"
                        )}
                        aria-label="Editar"
                      >
                        <RiEditLine />
                      </Link>
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
