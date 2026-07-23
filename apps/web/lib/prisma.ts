import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "./generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. En Vercel se agrega sola al crear la base en Storage; " +
        "en local va en apps/web/.env"
    )
  }

  const adapter = new PrismaPg({
    connectionString,
    // En serverless cada instancia abre su propio pool: un límite alto agota
    // las conexiones de la base. Pocas conexiones por instancia y cierre
    // rápido de las inactivas.
    max: process.env.VERCEL ? 1 : 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })

  return new PrismaClient({ adapter })
}

function getClient(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient()
  return globalForPrisma.prisma
}

/**
 * Cliente perezoso: se construye en el primer uso real, no al importar el
 * módulo. El build de Next evalúa los módulos para recolectar las rutas, y así
 * no necesita DATABASE_URL para compilar (que es lo que rompía el build).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === "function" ? value.bind(client) : value
  },
})
