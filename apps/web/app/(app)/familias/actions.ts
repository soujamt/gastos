"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth-guards"
import { prisma } from "@/lib/prisma"

export type FormState = { error?: string } | undefined

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  order: z.coerce.number().int().min(0),
  hasSubmeter: z.boolean(),
  active: z.boolean(),
})

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name"),
    order: formData.get("order") || 0,
    hasSubmeter: formData.get("hasSubmeter") === "on",
    active: formData.get("active") === "on",
  })
}

export async function createFamily(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const exists = await prisma.family.findUnique({
    where: { name: parsed.data.name },
  })
  if (exists) return { error: "Ya existe una familia con ese nombre" }

  await prisma.family.create({ data: parsed.data })
  revalidatePath("/familias")
  redirect("/familias")
}

export async function updateFamily(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const clash = await prisma.family.findFirst({
    where: { name: parsed.data.name, NOT: { id } },
  })
  if (clash) return { error: "Ya existe una familia con ese nombre" }

  await prisma.family.update({ where: { id }, data: parsed.data })
  revalidatePath("/familias")
  redirect("/familias")
}

export async function deleteFamily(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (!Number.isInteger(id)) return

  try {
    await prisma.family.delete({ where: { id } })
  } catch {
    // La familia tiene datos asociados (lecturas, cargos o pagos)
  }
  revalidatePath("/familias")
}
