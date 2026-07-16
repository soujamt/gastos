import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { paymentMethodLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

import { DeleteButton } from "../_components/delete-button"
import { PageHeader } from "../_components/page-header"
import { deletePayment } from "../periodos/actions"

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})
const fullDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export default async function PagosPage() {
  const payments = await prisma.payment.findMany({
    include: {
      family: { select: { name: true } },
      period: { select: { id: true, label: true } },
    },
    orderBy: { paidAt: "desc" },
    take: 200,
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pagos"
        description="Abonos por familia. Se registran desde cada período."
      />

      {payments.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Aún no hay pagos. Regístralos abriendo un período.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Fecha</TableHead>
                <TableHead>Familia</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">
                    {fullDate.format(p.paidAt)}
                  </TableCell>
                  <TableCell className="font-medium">{p.family.name}</TableCell>
                  <TableCell>
                    <Link
                      href={`/periodos/${p.period.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {p.period.label}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {paymentMethodLabels[p.method]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.note ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {soles.format(Number(p.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton confirmText="¿Eliminar este pago?" />
                    </form>
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
