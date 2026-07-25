import Link from "next/link"
import { notFound } from "next/navigation"
import { RiArrowLeftLine, RiWallet3Line } from "@remixicon/react"

import { buttonVariants } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { chargeStatusLabels, paymentMethodLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"
import { getViewer } from "@/lib/viewer"

import { PrintButton } from "./print-button"

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})
const longDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

export default async function EstadoDeCuentaPage({
  params,
}: {
  params: Promise<{ periodId: string; familyId: string }>
}) {
  const { periodId: rawPeriod, familyId: rawFamily } = await params
  const periodId = Number(rawPeriod)
  const familyId = Number(rawFamily)
  if (!Number.isInteger(periodId) || !Number.isInteger(familyId)) notFound()

  // Una familia solo puede abrir su propio estado de cuenta.
  const { familyScope, isAdmin } = await getViewer()
  if (familyScope !== null && familyScope !== familyId) notFound()

  const [period, family, statement, charges, payments] = await Promise.all([
    prisma.period.findUnique({ where: { id: periodId } }),
    prisma.family.findUnique({ where: { id: familyId } }),
    prisma.statement.findUnique({
      where: { periodId_familyId: { periodId, familyId } },
    }),
    prisma.charge.findMany({
      where: { periodId, familyId },
      include: { service: { select: { name: true, unit: true } } },
      orderBy: { serviceId: "asc" },
    }),
    prisma.payment.findMany({
      where: { periodId, familyId },
      orderBy: { paidAt: "asc" },
    }),
  ])

  if (!period || !family) notFound()

  const carriedDebt = Number(statement?.carriedDebt ?? 0)
  const chargesTotal = charges.reduce((sum, c) => sum + Number(c.amount), 0)
  const paymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const balance = Number(statement?.balance ?? 0)
  const status = statement?.status ?? "PENDING"

  return (
    <div className="flex flex-col gap-6">
      {/* La barra de acciones no se imprime: solo el documento va al papel. */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={isAdmin ? `/periodos/${periodId}` : "/"}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <RiArrowLeftLine className="size-4" />
          Volver
        </Link>
        <PrintButton />
      </div>

      <article className="flex flex-col gap-7 rounded-2xl border bg-card p-6 shadow-soft sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <RiWallet3Line className="size-5" />
            </span>
            <div>
              <p className="font-semibold tracking-[-0.02em]">GastosFam</p>
              <p className="text-xs text-muted-foreground">
                Estado de cuenta · {period.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Familia
            </p>
            <p className="text-lg font-semibold tracking-[-0.02em]">
              {family.name}
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Detalle del período</h2>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="text-right">Participación</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.service.name}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {c.kwh != null ? `${c.kwh} ${c.service.unit ?? ""}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {c.percentage != null
                        ? `${(Number(c.percentage) * 100).toFixed(1)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {soles.format(Number(c.amount))}
                    </TableCell>
                  </TableRow>
                ))}
                {charges.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Sin cargos registrados en este período.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </section>

        {payments.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Pagos recibidos</h2>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {longDate.format(p.paidAt)}
                      </TableCell>
                      <TableCell>{paymentMethodLabels[p.method]}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.note ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {soles.format(Number(p.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-2 rounded-xl bg-muted/50 p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cargos del período</span>
            <span className="tabular-nums">{soles.format(chargesTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deuda anterior</span>
            <span className="tabular-nums">{soles.format(carriedDebt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pagos recibidos</span>
            <span className="tabular-nums">
              − {soles.format(paymentsTotal)}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t pt-3">
            <span className="font-semibold">Saldo a pagar</span>
            <span className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
              {soles.format(balance)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Estado: {chargeStatusLabels[status]}. El saldo se cobra redondeado a
            soles enteros.
          </p>
        </section>

        <footer className="border-t pt-4 text-xs text-muted-foreground">
          Documento generado el {longDate.format(new Date())} · Consumo de{" "}
          {period.days} días.
        </footer>
      </article>
    </div>
  )
}
