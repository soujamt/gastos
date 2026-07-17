"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-guards"
import {
  ChargeStatus,
  PaymentMethod,
  PeriodStatus,
  ServiceType,
} from "@/lib/generated/prisma/enums"
import { monthLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"
import { computeShares, restoKwh } from "@/lib/prorrateo"
import { recomputeAllStatements, recomputeStatement } from "@/lib/statements"

export type FormState = { error?: string } | undefined
export type ElectricityState = { error?: string; ok?: boolean } | undefined
export type PaymentState = { error?: string; ok?: boolean } | undefined
export type OtherChargesState = { error?: string; ok?: boolean } | undefined

const schema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  days: z.coerce.number().int().min(1).max(31),
  status: z.enum(PeriodStatus),
})

function parse(formData: FormData) {
  return schema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
    days: formData.get("days") || 30,
    status: formData.get("status"),
  })
}

function labelFor(year: number, month: number) {
  return `${monthLabels[month - 1]} ${year}`
}

export async function createPeriod(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const { year, month, days, status } = parsed.data

  const exists = await prisma.period.findUnique({
    where: { year_month: { year, month } },
  })
  if (exists) return { error: "Ya existe ese período" }

  await prisma.period.create({
    data: { year, month, days, status, label: labelFor(year, month) },
  })
  revalidatePath("/periodos")
  redirect("/periodos")
}

export async function updatePeriod(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const { year, month, days, status } = parsed.data

  const clash = await prisma.period.findFirst({
    where: { year, month, NOT: { id } },
  })
  if (clash) return { error: "Ya existe ese período" }

  await prisma.period.update({
    where: { id },
    data: { year, month, days, status, label: labelFor(year, month) },
  })
  revalidatePath("/periodos")
  redirect("/periodos")
}

export async function deletePeriod(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (!Number.isInteger(id)) return

  try {
    await prisma.period.delete({ where: { id } })
  } catch {
    // El período tiene datos asociados
  }
  revalidatePath("/periodos")
}

export async function togglePeriodStatus(periodId: number) {
  await requireAdmin()
  const period = await prisma.period.findUnique({ where: { id: periodId } })
  if (!period) return

  await prisma.period.update({
    where: { id: periodId },
    data: {
      status:
        period.status === PeriodStatus.OPEN
          ? PeriodStatus.CLOSED
          : PeriodStatus.OPEN,
    },
  })
  revalidatePath(`/periodos/${periodId}`)
  revalidatePath("/periodos")
}

// Calcula el prorrateo de un servicio medido (luz) y guarda recibo, lecturas
// y cargos por familia para el período.
export async function saveElectricity(
  periodId: number,
  _prev: ElectricityState,
  formData: FormData
): Promise<ElectricityState> {
  await requireAdmin()

  const serviceId = Number(formData.get("serviceId"))
  const totalAmount = Number(formData.get("totalAmount"))
  const meterPrev = formData.get("meterPrev")
    ? Number(formData.get("meterPrev"))
    : null
  const meterCurr = formData.get("meterCurr")
    ? Number(formData.get("meterCurr"))
    : null
  const totalMeterKwhRaw = formData.get("totalMeterKwh")
  const totalMeterKwh = totalMeterKwhRaw ? Number(totalMeterKwhRaw) : null
  const issueDateRaw = formData.get("issueDate")
  const issueDate = issueDateRaw ? new Date(String(issueDateRaw)) : null

  if (!Number.isInteger(serviceId)) return { error: "Servicio inválido" }
  if (!(totalAmount > 0)) {
    return { error: "El monto del recibo debe ser mayor a 0" }
  }

  const families = await prisma.family.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })
  const submetered = families.filter((f) => f.hasSubmeter)
  const resto = families.find((f) => !f.hasSubmeter)

  const readings: {
    familyId: number
    previous: number
    current: number
    kwh: number
  }[] = []
  for (const fam of submetered) {
    const previous = Number(formData.get(`prev_${fam.id}`) ?? 0)
    const current = Number(formData.get(`curr_${fam.id}`) ?? 0)
    if (current < previous) {
      return {
        error: `En ${fam.name} la lectura actual no puede ser menor a la anterior`,
      }
    }
    readings.push({
      familyId: fam.id,
      previous,
      current,
      kwh: current - previous,
    })
  }

  const submeteredKwh = readings.reduce((sum, r) => sum + r.kwh, 0)

  const kwhByFamily = new Map<number, number>()
  for (const r of readings) kwhByFamily.set(r.familyId, r.kwh)
  if (resto) {
    if (totalMeterKwh == null) {
      return {
        error:
          "Ingresa el consumo total del medidor para calcular la familia resto",
      }
    }
    kwhByFamily.set(resto.id, restoKwh(totalMeterKwh, submeteredKwh))
  }

  const shareInput = families
    .filter((f) => kwhByFamily.has(f.id))
    .map((f) => ({ id: f.id, kwh: kwhByFamily.get(f.id) ?? 0 }))

  const { totalKwh, shares } = computeShares(totalAmount, shareInput)
  const billKwh = totalMeterKwh ?? totalKwh

  await prisma.$transaction(async (tx) => {
    await tx.bill.upsert({
      where: { periodId_serviceId: { periodId, serviceId } },
      update: { totalAmount, totalKwh: billKwh, meterPrev, meterCurr, issueDate },
      create: {
        periodId,
        serviceId,
        totalAmount,
        totalKwh: billKwh,
        meterPrev,
        meterCurr,
        issueDate,
      },
    })

    for (const r of readings) {
      await tx.reading.upsert({
        where: {
          periodId_familyId_serviceId: {
            periodId,
            familyId: r.familyId,
            serviceId,
          },
        },
        update: { previous: r.previous, current: r.current, kwh: r.kwh },
        create: {
          periodId,
          familyId: r.familyId,
          serviceId,
          previous: r.previous,
          current: r.current,
          kwh: r.kwh,
        },
      })
    }

    for (const s of shares) {
      await tx.charge.upsert({
        where: {
          periodId_familyId_serviceId: {
            periodId,
            familyId: s.id,
            serviceId,
          },
        },
        update: { kwh: s.kwh, percentage: s.percentage, amount: s.amount },
        create: {
          periodId,
          familyId: s.id,
          serviceId,
          kwh: s.kwh,
          percentage: s.percentage,
          amount: s.amount,
          status: ChargeStatus.PENDING,
        },
      })
    }
  })

  await recomputeAllStatements(periodId)

  revalidatePath(`/periodos/${periodId}`)
  return { ok: true }
}

/**
 * Guarda los cargos de servicios no medidos (agua, otros) y la deuda anterior
 * de cada familia para el período. Un monto vacío o 0 elimina el cargo.
 */
export async function saveOtherCharges(
  periodId: number,
  _prev: OtherChargesState,
  formData: FormData
): Promise<OtherChargesState> {
  await requireAdmin()

  const [families, services] = await Promise.all([
    prisma.family.findMany({ where: { active: true }, select: { id: true, name: true } }),
    prisma.service.findMany({
      where: { active: true, type: { not: ServiceType.METERED } },
      select: { id: true, name: true },
    }),
  ])

  // Se valida todo antes de escribir, para no dejar el período a medias.
  const debts: { familyId: number; carriedDebt: number }[] = []
  const charges: { familyId: number; serviceId: number; amount: number }[] = []

  for (const fam of families) {
    const rawDebt = formData.get(`debt_${fam.id}`)
    const carriedDebt = rawDebt ? Number(rawDebt) : 0
    if (!Number.isFinite(carriedDebt)) {
      return { error: `La deuda anterior de ${fam.name} no es un número válido` }
    }
    debts.push({ familyId: fam.id, carriedDebt })

    for (const svc of services) {
      const raw = formData.get(`charge_${svc.id}_${fam.id}`)
      const amount = raw ? Number(raw) : 0
      if (!Number.isFinite(amount) || amount < 0) {
        return {
          error: `El monto de ${svc.name} para ${fam.name} debe ser 0 o mayor`,
        }
      }
      charges.push({ familyId: fam.id, serviceId: svc.id, amount })
    }
  }

  for (const d of debts) {
    await prisma.statement.upsert({
      where: { periodId_familyId: { periodId, familyId: d.familyId } },
      update: { carriedDebt: d.carriedDebt },
      create: {
        periodId,
        familyId: d.familyId,
        carriedDebt: d.carriedDebt,
      },
    })
  }

  for (const c of charges) {
    const where = {
      periodId_familyId_serviceId: {
        periodId,
        familyId: c.familyId,
        serviceId: c.serviceId,
      },
    }
    if (c.amount > 0) {
      await prisma.charge.upsert({
        where,
        update: { amount: c.amount },
        create: {
          periodId,
          familyId: c.familyId,
          serviceId: c.serviceId,
          amount: c.amount,
          status: ChargeStatus.PENDING,
        },
      })
    } else {
      await prisma.charge.deleteMany({
        where: {
          periodId,
          familyId: c.familyId,
          serviceId: c.serviceId,
        },
      })
    }
  }

  await recomputeAllStatements(periodId)
  revalidatePath(`/periodos/${periodId}`)
  return { ok: true }
}

export async function addPayment(
  periodId: number,
  _prev: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  await requireAdmin()

  const familyId = Number(formData.get("familyId"))
  const amount = Number(formData.get("amount"))
  const methodRaw = String(formData.get("method") ?? "")
  const paidAtRaw = formData.get("paidAt")
  const note = String(formData.get("note") ?? "").trim() || null

  if (!Number.isInteger(familyId)) return { error: "Selecciona una familia" }
  if (!(amount > 0)) return { error: "El monto debe ser mayor a 0" }

  const method = (
    Object.values(PaymentMethod) as string[]
  ).includes(methodRaw)
    ? (methodRaw as PaymentMethod)
    : PaymentMethod.CASH
  const paidAt = paidAtRaw ? new Date(String(paidAtRaw)) : new Date()

  await prisma.payment.create({
    data: { periodId, familyId, amount, method, paidAt, note },
  })
  await recomputeStatement(periodId, familyId)

  revalidatePath(`/periodos/${periodId}`)
  revalidatePath("/pagos")
  return { ok: true }
}

export async function deletePayment(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (!Number.isInteger(id)) return

  const payment = await prisma.payment.findUnique({ where: { id } })
  if (!payment) return

  await prisma.payment.delete({ where: { id } })
  await recomputeStatement(payment.periodId, payment.familyId)

  revalidatePath(`/periodos/${payment.periodId}`)
  revalidatePath("/pagos")
}

// Arrastra el saldo de cada familia como deuda del siguiente período.
export async function carryForwardDebt(periodId: number) {
  await requireAdmin()
  const period = await prisma.period.findUnique({ where: { id: periodId } })
  if (!period) return

  const next = await prisma.period.findFirst({
    where: {
      OR: [
        { year: { gt: period.year } },
        { year: period.year, month: { gt: period.month } },
      ],
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  })
  if (!next) return

  const statements = await prisma.statement.findMany({ where: { periodId } })
  for (const st of statements) {
    await prisma.statement.upsert({
      where: {
        periodId_familyId: { periodId: next.id, familyId: st.familyId },
      },
      update: { carriedDebt: Number(st.balance) },
      create: {
        periodId: next.id,
        familyId: st.familyId,
        carriedDebt: Number(st.balance),
      },
    })
    await recomputeStatement(next.id, st.familyId)
  }

  revalidatePath(`/periodos/${next.id}`)
  revalidatePath("/periodos")
}
