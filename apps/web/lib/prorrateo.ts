// Motor de prorrateo de un servicio medido (ej. luz) entre familias.
// Reparte el monto total del recibo proporcionalmente al consumo (kWh) de
// cada familia, usando el método del mayor residuo (Hamilton) para que la
// suma de los montos redondeados sea exactamente igual al total.

export type ShareInput = {
  id: number
  kwh: number
}

export type ShareResult = {
  id: number
  kwh: number
  percentage: number // 0-1
  amount: number // soles con 2 decimales
}

export type ProrrateoResult = {
  totalKwh: number
  shares: ShareResult[]
}

/**
 * Reparte `totalAmount` entre las familias según sus kWh.
 * Si el total de kWh es 0, todos los montos son 0.
 */
export function computeShares(
  totalAmount: number,
  families: ShareInput[]
): ProrrateoResult {
  const totalKwh = families.reduce((sum, f) => sum + f.kwh, 0)

  if (totalKwh <= 0 || totalAmount <= 0) {
    return {
      totalKwh,
      shares: families.map((f) => ({
        id: f.id,
        kwh: f.kwh,
        percentage: 0,
        amount: 0,
      })),
    }
  }

  const totalCents = Math.round(totalAmount * 100)

  const rows = families.map((f) => {
    const percentage = f.kwh / totalKwh
    const exactCents = percentage * totalCents
    return {
      id: f.id,
      kwh: f.kwh,
      percentage,
      floorCents: Math.floor(exactCents),
      frac: exactCents - Math.floor(exactCents),
    }
  })

  const assigned = rows.reduce((sum, r) => sum + r.floorCents, 0)
  let remainder = totalCents - assigned

  // Reparte los centavos sobrantes a las familias con mayor parte fraccionaria.
  const order = [...rows].sort((a, b) => b.frac - a.frac)
  const bonus = new Map<number, number>()
  for (let i = 0; i < remainder && order.length > 0; i++) {
    const target = order[i % order.length]
    if (!target) break
    bonus.set(target.id, (bonus.get(target.id) ?? 0) + 1)
  }

  return {
    totalKwh,
    shares: rows.map((r) => ({
      id: r.id,
      kwh: r.kwh,
      percentage: r.percentage,
      amount: (r.floorCents + (bonus.get(r.id) ?? 0)) / 100,
    })),
  }
}

/**
 * Consumo de la familia "resto" (sin sub-medidor): lo que marca el medidor
 * principal menos lo medido por las demás. Nunca negativo.
 */
export function restoKwh(totalMeterKwh: number, submeteredKwh: number) {
  return Math.max(0, totalMeterKwh - submeteredKwh)
}
