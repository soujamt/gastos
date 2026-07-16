"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-guards"
import { ServiceType } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

export type FormState = { error?: string } | undefined

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  type: z.enum(ServiceType),
  unit: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  active: z.boolean(),
})

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    unit: formData.get("unit") ?? undefined,
    active: formData.get("active") === "on",
  })
}

export async function createService(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const exists = await prisma.service.findUnique({
    where: { name: parsed.data.name },
  })
  if (exists) return { error: "Ya existe un servicio con ese nombre" }

  await prisma.service.create({ data: parsed.data })
  revalidatePath("/servicios")
  redirect("/servicios")
}

export async function updateService(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const clash = await prisma.service.findFirst({
    where: { name: parsed.data.name, NOT: { id } },
  })
  if (clash) return { error: "Ya existe un servicio con ese nombre" }

  await prisma.service.update({ where: { id }, data: parsed.data })
  revalidatePath("/servicios")
  redirect("/servicios")
}

export async function deleteService(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (!Number.isInteger(id)) return

  try {
    await prisma.service.delete({ where: { id } })
  } catch {
    // El servicio tiene datos asociados (recibos, lecturas o cargos)
  }
  revalidatePath("/servicios")
}
