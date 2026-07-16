import "dotenv/config"

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { PaymentMethod, ServiceType } from "../lib/generated/prisma/enums"
import { prisma } from "../lib/prisma"
import { recomputeAllStatements } from "../lib/statements"

type Family = {
  name: string
  hasSubmeter: boolean
  previous: number | null
  current: number | null
  kwh: number
  percentage: number
  luz: number
  agua: number
  paid: number
  deudaPrev: number
}

type PeriodData = {
  sheet: string
  year: number
  month: number
  days: number
  receiptLuz: number
  totalKwh: number
  families: Family[]
}

const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const familyConfig = [
  { name: "Fam. Silva", order: 1, hasSubmeter: true },
  { name: "Fam. Mendoza", order: 2, hasSubmeter: true },
  { name: "Fam. Julón", order: 3, hasSubmeter: false },
]

async function main() {
  const here = dirname(fileURLToPath(import.meta.url))
  const file = process.env.IMPORT_FILE ?? join(here, "data", "gastos-2026.json")
  const periods: PeriodData[] = JSON.parse(readFileSync(file, "utf8"))
  periods.sort((a, b) => a.year - b.year || a.month - b.month)
  const latestMonth = Math.max(...periods.map((p) => p.month))

  // Familias
  const familyId: Record<string, number> = {}
  for (const f of familyConfig) {
    const fam = await prisma.family.upsert({
      where: { name: f.name },
      update: { order: f.order, hasSubmeter: f.hasSubmeter, active: true },
      create: f,
    })
    familyId[f.name] = fam.id
  }

  // Servicios
  const luz = await prisma.service.upsert({
    where: { name: "Luz" },
    update: { type: ServiceType.METERED, unit: "kWh", active: true },
    create: { name: "Luz", type: ServiceType.METERED, unit: "kWh" },
  })
  const agua = await prisma.service.upsert({
    where: { name: "Agua" },
    update: { type: ServiceType.FIXED, active: true },
    create: { name: "Agua", type: ServiceType.FIXED },
  })

  // Reinicio de períodos (cascada limpia recibos, lecturas, cargos, pagos, statements)
  await prisma.period.deleteMany({})

  for (const p of periods) {
    const label = `${monthLabels[p.month - 1]} ${p.year}`
    const period = await prisma.period.create({
      data: {
        year: p.year,
        month: p.month,
        days: p.days,
        label,
        status: p.month === latestMonth ? "OPEN" : "CLOSED",
      },
    })

    await prisma.bill.create({
      data: {
        periodId: period.id,
        serviceId: luz.id,
        totalAmount: p.receiptLuz,
        totalKwh: p.totalKwh,
      },
    })

    for (const f of p.families) {
      const fid = familyId[f.name]
      if (fid == null) continue

      if (f.hasSubmeter && f.previous != null && f.current != null) {
        await prisma.reading.create({
          data: {
            periodId: period.id,
            familyId: fid,
            serviceId: luz.id,
            previous: f.previous,
            current: f.current,
            kwh: f.kwh,
          },
        })
      }

      await prisma.charge.create({
        data: {
          periodId: period.id,
          familyId: fid,
          serviceId: luz.id,
          kwh: f.kwh,
          percentage: f.percentage,
          amount: f.luz,
        },
      })

      if (f.agua > 0) {
        await prisma.charge.create({
          data: {
            periodId: period.id,
            familyId: fid,
            serviceId: agua.id,
            amount: f.agua,
          },
        })
      }

      // Deuda arrastrada del Excel (columna DEUDAS)
      await prisma.statement.upsert({
        where: { periodId_familyId: { periodId: period.id, familyId: fid } },
        update: { carriedDebt: f.deudaPrev },
        create: { periodId: period.id, familyId: fid, carriedDebt: f.deudaPrev },
      })

      if (f.paid > 0) {
        await prisma.payment.create({
          data: {
            periodId: period.id,
            familyId: fid,
            amount: f.paid,
            paidAt: new Date(Date.UTC(p.year, p.month - 1, 15)),
            method: PaymentMethod.CASH,
            note: "Importado del Excel",
          },
        })
      }
    }

    await recomputeAllStatements(period.id)
    console.log(`✓ ${label} importado`)
  }

  // Resumen
  console.log("\nResumen de saldos:")
  for (const p of periods) {
    const period = await prisma.period.findFirst({
      where: { year: p.year, month: p.month },
    })
    if (!period) continue
    const sts = await prisma.statement.findMany({
      where: { periodId: period.id },
      include: { family: { select: { name: true, order: true } } },
    })
    sts.sort((a, b) => a.family.order - b.family.order)
    const linea = sts
      .map((s) => `${s.family.name.replace("Fam. ", "")} S/${Number(s.balance)}`)
      .join("  ")
    console.log(`  ${period.label}: ${linea}`)
  }

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
