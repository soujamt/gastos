import "dotenv/config"

import bcrypt from "bcryptjs"

import { Role, ServiceType } from "../lib/generated/prisma/enums"
import { prisma } from "../lib/prisma"

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error("Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD en .env")
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, active: true },
    create: { email, name: "Administrador", role: Role.ADMIN, passwordHash },
  })
  console.log("✓ Admin:", admin.email)

  // Servicios base
  const services: { name: string; type: ServiceType; unit?: string }[] = [
    { name: "Luz", type: ServiceType.METERED, unit: "kWh" },
    { name: "Agua", type: ServiceType.FIXED },
  ]
  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name, type: s.type, unit: s.unit ?? null },
    })
    console.log("✓ Servicio:", s.name)
  }

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
