import "dotenv/config"

import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { prisma } from "../lib/prisma"

/**
 * Exporta toda la base a un JSON, para migrarla entre motores (MySQL -> Postgres)
 * sin perder nada. Se ejecuta con el motor de ORIGEN configurado en DATABASE_URL.
 * Contraparte: import-data.ts
 */
async function main() {
  const here = dirname(fileURLToPath(import.meta.url))
  const file = process.env.EXPORT_FILE ?? join(here, "data", "db-export.json")

  const data = {
    exportedAt: new Date().toISOString(),
    families: await prisma.family.findMany({ orderBy: { id: "asc" } }),
    services: await prisma.service.findMany({ orderBy: { id: "asc" } }),
    users: await prisma.user.findMany({ orderBy: { id: "asc" } }),
    periods: await prisma.period.findMany({ orderBy: { id: "asc" } }),
    bills: await prisma.bill.findMany({ orderBy: { id: "asc" } }),
    readings: await prisma.reading.findMany({ orderBy: { id: "asc" } }),
    charges: await prisma.charge.findMany({ orderBy: { id: "asc" } }),
    payments: await prisma.payment.findMany({ orderBy: { id: "asc" } }),
    statements: await prisma.statement.findMany({ orderBy: { id: "asc" } }),
  }

  // Los Decimal de Prisma se serializan con toString para no perder precisión.
  writeFileSync(
    file,
    JSON.stringify(data, (_key, value) =>
      typeof value === "object" && value !== null && "toFixed" in value
        ? value.toString()
        : value
    , 1)
  )

  console.log(`Exportado a ${file}`)
  for (const [key, rows] of Object.entries(data)) {
    if (Array.isArray(rows)) console.log(`  ${key}: ${rows.length}`)
  }

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
