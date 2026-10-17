import Link from "next/link"
import {
  RiArrowRightLine,
  RiBankCardLine,
  RiBarChartLine,
  RiCalendar2Line,
  RiFileList3Line,
  RiFlashlightLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiPulseLine,
} from "@remixicon/react"

import { auth } from "@/auth"
import { Avatar } from "@workspace/ui/components/avatar"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Stat } from "@workspace/ui/components/stat"
import { cn } from "@workspace/ui/lib/utils"
import { prisma } from "@/lib/prisma"
import { familyFilter, getViewer } from "@/lib/viewer"

import { ChargeStatusDot } from "./_components/charge-status"
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
  const { familyScope, isAdmin, isFamily } = await getViewer()

  const [families, services, openPeriods, latestPeriod, recentPayments] =
    await Promise.all([
      prisma.family.count({ where: { active: true } }),
      prisma.service.count({ where: { active: true } }),
      prisma.period.count({ where: { status: "OPEN" } }),
      prisma.period.findFirst({
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: {
          // Rol FAMILY: el resumen se limita a su propio estado de cuenta.
          statements: {
            where: familyFilter(familyScope),
            include: { family: { select: { name: true, order: true } } },
          },
        },
      }),
      prisma.payment.findMany({
        where: familyFilter(familyScope),
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

  // Quién debe qué en el período más reciente, en el orden de las familias.
  const balances = [...(latestPeriod?.statements ?? [])].sort(
    (a, b) =>
      a.family.order - b.family.order ||
      a.family.name.localeCompare(b.family.name)
  )

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

  // Períodos, familias y servicios son rutas de gestión (requireAdminPage):
  // a los demás roles solo se les ofrece lo que pueden abrir.
  const ownStatement = isFamily ? latestPeriod?.statements[0] : undefined
  const nextSteps = isAdmin
    ? [
        {
          href: latestPeriod ? `/periodos/${latestPeriod.id}` : "/periodos",
          label: latestPeriod
            ? `Revisar ${latestPeriod.label}`
            : "Crear un período",
          detail: latestPeriod
            ? "Lecturas, cargos y pagos"
            : "Comienza el control mensual",
          icon: RiCalendar2Line,
        },
        {
          href: "/pagos",
          label: "Conciliar pagos",
          detail: `${recentPayments.length} movimientos recientes`,
          icon: RiMoneyDollarCircleLine,
        },
        {
          href: "/familias",
          label: "Validar participantes",
          detail: `${families} familias activas`,
          icon: RiGroupLine,
        },
      ]
    : [
        ...(latestPeriod && ownStatement
          ? [
              {
                href: `/estado/${latestPeriod.id}/${ownStatement.familyId}`,
                label: "Ver mi estado de cuenta",
                detail:
                  Number(ownStatement.balance) > 0
                    ? `${latestPeriod.label} · saldo ${soles.format(Number(ownStatement.balance))}`
                    : `${latestPeriod.label} · al día`,
                icon: RiFileList3Line,
              },
            ]
          : []),
        {
          href: "/pagos",
          label: isFamily ? "Ver mis pagos" : "Ver pagos",
          detail: `${recentPayments.length} movimientos recientes`,
          icon: RiMoneyDollarCircleLine,
        },
        {
          href: "/reportes",
          label: "Ver reportes",
          detail: "Consumo y saldos por período",
          icon: RiBarChartLine,
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
        {isAdmin ? (
          <FormDialog
            title="Nuevo período"
            description="Abre un ciclo para registrar consumos, cargos y pagos."
            label="Abrir nuevo período"
          >
            <PeriodForm
              action={createPeriod}
              submitLabel="Crear período"
              modal
            />
          </FormDialog>
        ) : null}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="relative isolate overflow-hidden rounded-2xl bg-hero p-6 text-white shadow-hero sm:p-8">
          {/* Luz suave desde la esquina y un filo claro arriba: profundidad sin
              adornos que compitan con la cifra. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,oklch(1_0_0/0.14),transparent_60%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] shadow-[inset_0_1px_0_oklch(1_0_0/0.12)]"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-white/65 uppercase">
                  {latestPeriod?.label ?? "Sin período registrado"}
                </p>
                <p className="mt-5 text-sm text-white/70">Saldo pendiente</p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums sm:text-4xl">
                  {soles.format(totals.pending)}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 ring-inset">
                <RiBankCardLine className="size-5" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs text-white/60">Total facturado</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {soles.format(totals.billed)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60">Total cobrado</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {soles.format(totals.paid)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-white/60">Avance</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {collectionRate}% conciliado
                </p>
              </div>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Próximos pasos</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lo que conviene revisar ahora
                </p>
              </div>
              <RiPulseLine className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {nextSteps.map(({ icon: Icon, ...item }) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <RiArrowRightLine className="size-4 text-muted-foreground transition-[translate,color] duration-150 ease-out group-hover:text-foreground motion-safe:group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Stat
            key={stat.label}
            label={stat.label}
            value={stat.value}
            hint={stat.detail}
            icon={stat.icon}
          />
        ))}
      </section>

      <section
        className={cn("grid gap-4", isAdmin && "xl:grid-cols-[1.4fr_1fr]")}
      >
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

        {/* Saldo por familia: el total pendiente de arriba, desglosado. Solo
            para administración; cada familia ya ve su propio estado de cuenta
            en "Próximos pasos". */}
        {isAdmin && latestPeriod ? (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Saldo por familia</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {latestPeriod.label}
                </p>
              </div>
              <Link
                href={`/periodos/${latestPeriod.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground"
                )}
              >
                Ver período
                <RiArrowRightLine />
              </Link>
            </CardHeader>
            <CardContent>
              {balances.length ? (
                <div className="-mx-2 flex flex-col gap-1">
                  {balances.map((statement) => {
                    const balance = Number(statement.balance)
                    return (
                      <Link
                        key={statement.id}
                        href={`/estado/${latestPeriod.id}/${statement.familyId}`}
                        aria-label={`Estado de cuenta de ${statement.family.name}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted"
                      >
                        <Avatar name={statement.family.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {statement.family.name}
                          </span>
                          <ChargeStatusDot
                            status={statement.status}
                            className="text-xs text-muted-foreground"
                          />
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            balance <= 0 && "text-muted-foreground"
                          )}
                        >
                          {soles.format(Math.max(0, balance))}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Aún no hay cargos en {latestPeriod.label}. Regístralos en el
                  período para ver el saldo de cada familia.
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  )
}
