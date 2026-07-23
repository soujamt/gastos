import "dotenv/config"

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { prisma } from "../lib/prisma"

/**
 * Carga el JSON generado por export-data.ts en la base destino, conservando
 * ids y relaciones. Se ejecuta con el motor de DESTINO en DATABASE_URL.
 *
 * Es idempotente: vacía las tablas antes de insertar, así se puede repetir sin
 * duplicar. Al final reajusta las secuencias de Postgres para que los próximos
 * autoincrementos no choquen con los ids importados.
 */
type Row = Record<string, unknown>

function revive(rows: Row[], dateFields: string[], numberFields: string[]) {
  return rows.map((row) => {
    const out: Row = { ...row }
    for (const f of dateFields) {
      if (out[f] != null) out[f] = new Date(String(out[f]))
    }
    for (const f of numberFields) {
      if (out[f] != null) out[f] = Number(out[f])
    }
    return out
  })
}

const STAMPS = ["createdAt", "updatedAt"]

async function main() {
  const here = dirname(fileURLToPath(import.meta.url))
  const file = process.env.IMPORT_FILE ?? join(here, "data", "db-export.json")
  const data = JSON.parse(readFileSync(file, "utf8"))

  // Orden inverso a las dependencias para poder borrar sin romper claves.
  await prisma.statement.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.charge.deleteMany({})
  await prisma.reading.deleteMany({})
  await prisma.bill.deleteMany({})
  await prisma.period.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.service.deleteMany({})
  await prisma.family.deleteMany({})

  await prisma.family.createMany({ data: revive(data.families, STAMPS, []) as never })
  await prisma.service.createMany({ data: revive(data.services, STAMPS, []) as never })
  await prisma.user.createMany({ data: revive(data.users, STAMPS, []) as never })
  await prisma.period.createMany({ data: revive(data.periods, STAMPS, []) as never })
  await prisma.bill.createMany({
    data: revive(data.bills, [...STAMPS, "issueDate"], ["totalAmount"]) as never,
  })
  await prisma.reading.createMany({
    data: revive(data.readings, [...STAMPS, "readingDate"], []) as never,
  })
  await prisma.charge.createMany({
    data: revive(data.charges, STAMPS, ["percentage", "amount"]) as never,
  })
  await prisma.payment.createMany({
    data: revive(data.payments, [...STAMPS, "paidAt"], ["amount"]) as never,
  })
  await prisma.statement.createMany({
    data: revive(data.statements, STAMPS, [
      "carriedDebt",
      "chargesTotal",
      "paymentsTotal",
      "balance",
    ]) as never,
  })

  // Las secuencias quedan en 1 tras insertar ids explícitos: se reajustan al
  // máximo id de cada tabla para que los próximos inserts no fallen.
  const tables = [
    "Family",
    "Service",
    "User",
    "Period",
    "Bill",
    "Reading",
    "Charge",
    "Payment",
    "Statement",
  ]
  for (const t of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), COALESCE((SELECT MAX(id) FROM "${t}"), 1))`
    )
  }

  const counts = {
    families: await prisma.family.count(),
    services: await prisma.service.count(),
    users: await prisma.user.count(),
    periods: await prisma.period.count(),
    bills: await prisma.bill.count(),
    readings: await prisma.reading.count(),
    charges: await prisma.charge.count(),
    payments: await prisma.payment.count(),
    statements: await prisma.statement.count(),
  }
  console.log("Importado:")
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`)

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
