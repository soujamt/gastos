import Link from "next/link"
import { RiMoneyDollarCircleLine } from "@remixicon/react"

import { Avatar, AvatarLabel } from "@workspace/ui/components/avatar"
import { EmptyState } from "@workspace/ui/components/empty-state"
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
import { DataPanel } from "../_components/data-panel"
import { MobileList, MobileListItem } from "../_components/mobile-list"
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
        <EmptyState
          icon={RiMoneyDollarCircleLine}
          title="Aún no hay pagos"
          description="Los abonos aparecerán aquí cuando los registres dentro de un período."
        />
      ) : (
        <DataPanel
          meta={[
            {
              icon: RiMoneyDollarCircleLine,
              label: `${payments.length} ${payments.length === 1 ? "movimiento" : "movimientos"}`,
            },
          ]}
        >
          <MobileList>
            {payments.map((p) => (
              <MobileListItem
                key={p.id}
                leading={
                  isAdmin ? <Avatar name={p.family.name} size="sm" /> : null
                }
                title={isAdmin ? p.family.name : p.period.label}
                meta={
                  isAdmin
                    ? `${fullDate.format(p.paidAt)} · ${p.period.label}`
                    : fullDate.format(p.paidAt)
                }
                value={soles.format(Number(p.amount))}
                valueMeta={paymentMethodLabels[p.method]}
                action={
                  isAdmin ? (
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton confirmText="El pago se quitará del historial y el saldo de la familia se recalculará." />
                    </form>
                  ) : null
                }
              />
            ))}
          </MobileList>
          <div className="hidden sm:block">
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
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {fullDate.format(p.paidAt)}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="font-medium">
                        <AvatarLabel name={p.family.name} />
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
        </DataPanel>
      )}
    </div>
  )
}
