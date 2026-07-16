"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-guards"
import { PeriodStatus } from "@/lib/generated/prisma/enums"
import { monthLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

export type FormState = { error?: string } | undefined

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
