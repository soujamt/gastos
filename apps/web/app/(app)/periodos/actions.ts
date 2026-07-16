"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-guards"
import { ChargeStatus, PeriodStatus } from "@/lib/generated/prisma/enums"
import { monthLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"
import { computeShares, restoKwh } from "@/lib/prorrateo"

export type FormState = { error?: string } | undefined
export type ElectricityState = { error?: string; ok?: boolean } | undefined

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

  revalidatePath(`/periodos/${periodId}`)
  return { ok: true }
}
