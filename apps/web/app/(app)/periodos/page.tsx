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
import { periodStatusLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { PageHeader } from "../_components/page-header"
import { deletePeriod } from "./actions"

export default async function PeriodosPage() {
  const periods = await prisma.period.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { bills: true, charges: true } } },
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Períodos"
        description="Los meses de facturación, con su recibo total y estado."
        action={{ href: "/periodos/nuevo", label: "Nuevo período" }}
      />

      {periods.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Aún no hay períodos. Crea el primero.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="w-20">Días</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24">Cargos</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/periodos/${period.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {period.label}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {period.days}
                  </TableCell>
                  <TableCell>
                    {period.status === "OPEN" ? (
                      <Badge variant="warning">
                        {periodStatusLabels.OPEN}
                      </Badge>
                    ) : (
                      <Badge variant="muted">{periodStatusLabels.CLOSED}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {period._count.charges}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/periodos/${period.id}/editar`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                          "text-muted-foreground"
                        )}
                        aria-label="Editar"
                      >
                        <RiEditLine />
                      </Link>
                      <form action={deletePeriod}>
                        <input type="hidden" name="id" value={period.id} />
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
