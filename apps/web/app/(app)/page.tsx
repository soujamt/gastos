import {
  RiCalendar2Line,
  RiFlashlightLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react"

import { auth } from "@/auth"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { prisma } from "@/lib/prisma"

const stats = [
  { key: "families", label: "Familias", icon: RiGroupLine },
  { key: "services", label: "Servicios", icon: RiFlashlightLine },
  { key: "periods", label: "Períodos", icon: RiCalendar2Line },
  { key: "payments", label: "Pagos", icon: RiMoneyDollarCircleLine },
] as const

export default async function DashboardPage() {
  const session = await auth()

  const [families, services, periods, payments] = await Promise.all([
    prisma.family.count(),
    prisma.service.count(),
    prisma.period.count(),
    prisma.payment.count(),
  ])
  const counts = { families, services, periods, payments }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Hola, {session?.user.email}. Este es el resumen de tu control de
          gastos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.key}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-muted-foreground text-xs font-normal">
                  {stat.label}
                </CardTitle>
                <Icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-medium">
                  {counts[stat.key]}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        Los gráficos de consumo y el detalle de pendientes por familia llegan en
        la fase de reportes.
      </div>
    </div>
  )
}
