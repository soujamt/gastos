"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { auth } from "@/auth"
import { requireAdmin } from "@/lib/auth-guards"
import { Role } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/** Coste de bcrypt y longitud minima: la app es publica, conviene endurecer. */
const BCRYPT_ROUNDS = 12
const MIN_PASSWORD_LENGTH = 8

export type FormState = { error?: string } | undefined

const baseSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  name: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  role: z.enum(Role),
  familyId: z.number().int().positive().nullable(),
  active: z.boolean(),
})

function parseBase(formData: FormData) {
  const rawFamily = formData.get("familyId")
  return baseSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? undefined,
    role: formData.get("role"),
    familyId: rawFamily ? Number(rawFamily) : null,
    active: formData.get("active") === "on",
  })
}

/** FAMILY users are tied to a family; other roles never are. */
function normalizeFamily(role: Role, familyId: number | null) {
  return role === Role.FAMILY ? familyId : null
}

export async function createUser(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parseBase(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const password = String(formData.get("password") ?? "")
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: "La contraseña debe tener al menos 8 caracteres" }
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })
  if (exists) return { error: "Ya existe un usuario con ese correo" }

  const { email, name, role, familyId, active } = parsed.data
  await prisma.user.create({
    data: {
      email,
      name,
      role,
      active,
      familyId: normalizeFamily(role, familyId),
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    },
  })
  revalidatePath("/usuarios")
  redirect("/usuarios")
}

export async function updateUser(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin()
  const parsed = parseBase(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const clash = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id } },
  })
  if (clash) return { error: "Ya existe un usuario con ese correo" }

  const { email, name, role, familyId, active } = parsed.data
  const password = String(formData.get("password") ?? "")
  if (password && password.length < MIN_PASSWORD_LENGTH) {
    return { error: "La contraseña debe tener al menos 8 caracteres" }
  }

  await prisma.user.update({
    where: { id },
    data: {
      email,
      name,
      role,
      active,
      familyId: normalizeFamily(role, familyId),
      ...(password ? { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) } : {}),
    },
  })
  revalidatePath("/usuarios")
  redirect("/usuarios")
}

export async function deleteUser(formData: FormData) {
  await requireAdmin()
  const id = Number(formData.get("id"))
  if (!Number.isInteger(id)) return

  const session = await auth()
  if (session?.user.id === String(id)) {
    // No permitir que un admin se elimine a sí mismo
    return
  }

  try {
    await prisma.user.delete({ where: { id } })
  } catch {
    // El usuario tiene datos asociados
  }
  revalidatePath("/usuarios")
}
