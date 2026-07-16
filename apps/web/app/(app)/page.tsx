import Link from "next/link"
import {
  RiArrowRightLine,
  RiBankCardLine,
  RiCalendar2Line,
  RiCheckboxCircleLine,
  RiFlashlightLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiPulseLine,
} from "@remixicon/react"

import { auth } from "@/auth"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { prisma } from "@/lib/prisma"

import { FormDialog } from "./_components/form-dialog"
import { createPeriod } from "./periodos/actions"
import { PeriodForm } from "./periodos/period-form"

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})

const shortDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
})

export default async function DashboardPage() {
  const session = await auth()

  const [families, services, openPeriods, latestPeriod, recentPayments] =
    await Promise.all([
      prisma.family.count({ where: { active: true } }),
      prisma.service.count({ where: { active: true } }),
      prisma.period.count({ where: { status: "OPEN" } }),
      prisma.period.findFirst({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: { statements: true },
      }),
      prisma.payment.findMany({
        orderBy: { paidAt: "desc" },
        take: 4,
        include: {
          family: { select: { name: true } },
          period: { select: { id: true, label: true } },
        },
      }),
    ])

  const totals = latestPeriod?.statements.reduce(
    (acc, statement) => {
      acc.billed +=
        Number(statement.chargesTotal) + Number(statement.carriedDebt)
      acc.paid += Number(statement.paymentsTotal)
      acc.pending += Math.max(0, Number(statement.balance))
      return acc
    },
    { billed: 0, paid: 0, pending: 0 }
  ) ?? { billed: 0, paid: 0, pending: 0 }

  const collectionRate = totals.billed
    ? Math.min(100, Math.round((totals.paid / totals.billed) * 100))
    : 0
  const displayName =
    session?.user.name ?? session?.user.email?.split("@")[0] ?? "equipo"

  const stats = [
    {
      label: "Familias activas",
      value: families,
      detail: "participan del reparto",
      icon: RiGroupLine,
    },
    {
      label: "Servicios activos",
      value: services,
      detail: "configurados",
      icon: RiFlashlightLine,
    },
    {
      label: "Períodos abiertos",
      value: openPeriods,
      detail:
        openPeriods === 1 ? "requiere seguimiento" : "requieren seguimiento",
      icon: RiCalendar2Line,
    },
  ]

  return (
    <div className="flex flex-col gap-7 lg:gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-[0.13em] text-primary uppercase">
            Resumen financiero
          </span>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] sm:text-[2rem]">
            Hola, {displayName}
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Aquí tienes el estado de los gastos compartidos al día de hoy.
          </p>
        </div>
        <FormDialog
          title="Nuevo período"
          description="Abre un ciclo para registrar consumos, cargos y pagos."
          label="Abrir nuevo período"
        >
          <PeriodForm action={createPeriod} submitLabel="Crear período" modal />
        </FormDialog>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground shadow-[0_24px_60px_rgba(15,105,93,0.18)] sm:p-8">
          <div className="absolute -top-24 -right-16 size-64 rounded-full border border-white/10" />
          <div className="absolute -right-6 -bottom-24 size-52 rounded-full bg-white/[0.06]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-primary-foreground/70 uppercase">
                  {latestPeriod?.label ?? "Sin período registrado"}
                </p>
                <p className="mt-5 text-sm text-primary-foreground/75">
                  Saldo pendiente
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  {soles.format(totals.pending)}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/12 backdrop-blur">
                <RiBankCardLine className="size-5" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs text-primary-foreground/65">
                  Total facturado
                </p>
                <p className="mt-1 font-semibold">
                  {soles.format(totals.billed)}
                </p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/65">
                  Total cobrado
                </p>
                <p className="mt-1 font-semibold">
                  {soles.format(totals.paid)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-primary-foreground/65">Avance</p>
                <p className="mt-1 font-semibold">
                  {collectionRate}% conciliado
                </p>
              </div>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-black/15">
              <div
                className="h-full rounded-full bg-white/85 transition-all"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] text-primary uppercase">
                  En foco
                </p>
                <CardTitle className="mt-1 text-base">Próximos pasos</CardTitle>
              </div>
              <RiPulseLine className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              {
                href: latestPeriod
                  ? `/periodos/${latestPeriod.id}`
                  : "/periodos",
                label: latestPeriod
                  ? `Revisar ${latestPeriod.label}`
                  : "Crear un período",
                detail: latestPeriod
                  ? "Lecturas, cargos y pagos"
                  : "Comienza el control mensual",
              },
              {
                href: "/pagos",
                label: "Conciliar pagos",
                detail: `${recentPayments.length} movimientos recientes`,
              },
              {
                href: "/familias",
                label: "Validar participantes",
                detail: `${families} familias activas`,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:bg-muted"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <RiCheckboxCircleLine className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <RiArrowRightLine className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="gap-3">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-semibold tracking-[-0.04em]">
                  {stat.value}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.detail}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Últimos pagos registrados en el sistema
              </p>
            </div>
            <Link
              href="/pagos"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground"
              )}
            >
              Ver todos
              <RiArrowRightLine />
            </Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length ? (
              <div className="divide-y">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <RiMoneyDollarCircleLine className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {payment.family.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.period.label} ·{" "}
                        {shortDate.format(payment.paidAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {soles.format(Number(payment.amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Los pagos registrados aparecerán aquí.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accesos rápidos</CardTitle>
            <p className="text-xs text-muted-foreground">
              Las tareas más frecuentes, a un clic
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { href: "/periodos", label: "Períodos", icon: RiCalendar2Line },
              { href: "/familias", label: "Familias", icon: RiGroupLine },
              {
                href: "/servicios",
                label: "Servicios",
                icon: RiFlashlightLine,
              },
              { href: "/pagos", label: "Pagos", icon: RiMoneyDollarCircleLine },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col gap-3 rounded-xl border p-3.5 text-sm font-medium transition-colors hover:border-primary/20 hover:bg-primary/5"
                >
                  <Icon className="size-5 text-primary" />
                  {item.label}
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
