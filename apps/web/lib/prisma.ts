import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "./generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL as string

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

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
