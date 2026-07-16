import { PrismaMariaDb } from "@prisma/adapter-mariadb"

import { PrismaClient } from "./generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL as string)
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    // MySQL 8 usa caching_sha2_password; permitir el intercambio de clave
    // pública para autenticar sin SSL en conexiones locales.
    allowPublicKeyRetrieval: true,
    connectionLimit: 10,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
