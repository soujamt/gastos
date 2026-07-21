import { ChargeStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { ROUNDING_STEP } from "@/lib/prorrateo"

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/** Redondea a la unidad de cobro (soles enteros por defecto). */
export function roundToStep(n: number, step: number = ROUNDING_STEP) {
  return Number((Math.round(n / step) * step).toFixed(2))
}

export function statusFor(
  balance: number,
  paymentsTotal: number
): ChargeStatus {
  if (balance <= 0.005) return ChargeStatus.PAID
  if (paymentsTotal > 0) return ChargeStatus.PARTIAL
  return ChargeStatus.PENDING
}

/**
 * Recalcula y guarda el estado de cuenta (Statement) de una familia en un
 * período: total de cargos, total pagado, saldo y estado. Conserva la deuda
 * arrastrada (carriedDebt) existente.
 */
export async function recomputeStatement(periodId: number, familyId: number) {
  const [chargeAgg, paymentAgg, existing] = await Promise.all([
    prisma.charge.aggregate({
      where: { periodId, familyId },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { periodId, familyId },
      _sum: { amount: true },
    }),
    prisma.statement.findUnique({
      where: { periodId_familyId: { periodId, familyId } },
    }),
  ])

  const chargesTotal = round2(Number(chargeAgg._sum.amount ?? 0))
  const paymentsTotal = round2(Number(paymentAgg._sum.amount ?? 0))
  const carriedDebt = round2(Number(existing?.carriedDebt ?? 0))
  // El saldo se redondea a soles enteros (unidad de cobro). Así lo que la
  // familia debe queda en cifras redondas y se arrastra redondeado al siguiente
  // mes. Cargos, deuda y pagado se conservan exactos como referencia.
  const balance = roundToStep(carriedDebt + chargesTotal - paymentsTotal)
  const status = statusFor(balance, paymentsTotal)

  await prisma.statement.upsert({
    where: { periodId_familyId: { periodId, familyId } },
    update: { chargesTotal, paymentsTotal, balance, status },
    create: {
      periodId,
      familyId,
      carriedDebt,
      chargesTotal,
      paymentsTotal,
      balance,
      status,
    },
  })
}

/** Recalcula los estados de cuenta de todas las familias del período. */
export async function recomputeAllStatements(periodId: number) {
  const [families, charged] = await Promise.all([
    prisma.family.findMany({ where: { active: true }, select: { id: true } }),
    prisma.charge.findMany({
      where: { periodId },
      select: { familyId: true },
      distinct: ["familyId"],
    }),
  ])
  const ids = new Set<number>([
    ...families.map((f) => f.id),
    ...charged.map((c) => c.familyId),
  ])
  for (const id of ids) {
    await recomputeStatement(periodId, id)
  }
}
