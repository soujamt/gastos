import Link from "next/link"
import { RiMoneyDollarCircleLine } from "@remixicon/react"

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
import { familyFilter, getViewer } from "@/lib/viewer"

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
  const { familyScope, isAdmin } = await getViewer()

  const payments = await prisma.payment.findMany({
    where: familyFilter(familyScope),
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
        description={
          isAdmin
            ? "Consulta todos los abonos registrados por familia y período."
            : "Tu historial de abonos por período."
        }
        eyebrow="Movimientos"
      />

      {payments.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card p-12 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <RiMoneyDollarCircleLine className="size-6" />
          </div>
          <h2 className="mt-4 font-semibold">Aún no hay pagos</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Los abonos aparecerán aquí cuando los registres dentro de un
            período.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(20,45,40,0.035)]">
          <div className="flex items-center gap-2 border-b px-5 py-4 text-sm font-medium sm:px-6">
            <RiMoneyDollarCircleLine className="size-4 text-primary" />
            {payments.length}{" "}
            {payments.length === 1 ? "movimiento" : "movimientos"}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Fecha</TableHead>
                {isAdmin ? <TableHead>Familia</TableHead> : null}
                <TableHead>Período</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                {isAdmin ? <TableHead className="w-12" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">
                    {fullDate.format(p.paidAt)}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="font-medium">
                      {p.family.name}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    {isAdmin ? (
                      <Link
                        href={`/periodos/${p.period.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {p.period.label}
                      </Link>
                    ) : (
                      p.period.label
                    )}
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
                  {isAdmin ? (
                    <TableCell className="text-right">
                      <form action={deletePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <DeleteButton confirmText="El pago se quitará del historial y el saldo de la familia se recalculará." />
                      </form>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
