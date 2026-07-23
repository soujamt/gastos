import bcrypt from "bcryptjs"
import NextAuth, { type NextAuthResult } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { Role } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/** Fallos seguidos que bloquean el correo, y por cuánto tiempo. */
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

/** Debe coincidir con el coste usado al crear usuarios. */
const BCRYPT_ROUNDS = 12

/**
 * Hash señuelo usado cuando el correo no existe, para que comparar tarde lo
 * mismo que con un usuario real y no se pueda enumerar quién está registrado.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$p0zaa2XbImQRO3rDLrMB9uMwUEb2jJdz7rSV1NkpAu66r0VW4CBqG"

const credentialsSchema = z.object({
  // Los correos se guardan en minúsculas al crear el usuario, así que el login
  // debe normalizar igual. Sin esto el acceso depende de que el motor compare
  // texto sin distinguir mayúsculas (MySQL sí, PostgreSQL no).
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

const nextAuth = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        // 1) Freno de fuerza bruta: tras varios fallos seguidos, el correo
        // queda bloqueado durante la ventana, aunque la clave sea correcta.
        const since = new Date(Date.now() - LOCKOUT_MINUTES * 60_000)
        const recentFailures = await prisma.loginAttempt.count({
          where: { email, success: false, createdAt: { gte: since } },
        })
        if (recentFailures >= MAX_FAILED_ATTEMPTS) return null

        const user = await prisma.user.findUnique({ where: { email } })

        // 2) Tiempo constante: si el correo no existe se compara igual contra
        // un hash señuelo, para que la respuesta tarde lo mismo y no se pueda
        // deducir qué correos están registrados.
        const passwordMatches = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH
        )
        const valid = passwordMatches && !!user && user.active

        await prisma.loginAttempt.create({ data: { email, success: valid } })

        if (!valid || !user) return null

        // Al entrar bien se limpia el historial de fallos del correo.
        await prisma.loginAttempt.deleteMany({ where: { email, success: false } })

        // 3) Re-hash progresivo: si la clave quedó guardada con un coste menor
        // al actual, se regenera aprovechando que aquí sí tenemos el texto
        // plano. Así los hashes antiguos se endurecen solos y, de paso, el
        // tiempo de comparación iguala al del hash señuelo.
        if (bcrypt.getRounds(user.passwordHash) < BCRYPT_ROUNDS) {
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) },
          })
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          familyId: user.familyId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.familyId = user.familyId ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.role = (token.role as Role) ?? Role.VIEWER
        session.user.familyId = (token.familyId as number | null) ?? null
      }
      return session
    },
  },
})

export const handlers = nextAuth.handlers
export const auth: NextAuthResult["auth"] = nextAuth.auth
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut
