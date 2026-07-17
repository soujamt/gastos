// Motor de prorrateo de un servicio medido (ej. luz) entre familias.
// Reparte el monto total del recibo proporcionalmente al consumo (kWh) de
// cada familia, usando el método del mayor residuo (Hamilton) para que la
// suma de los montos redondeados sea exactamente igual al total repartido.

/**
 * Unidad de redondeo, en soles. Con 1, cada familia paga soles enteros y la
 * suma cuadra con el recibo redondeado (no se pierde ni se inventa dinero).
 * Usar 0.5 para medios soles o 0.01 para céntimos exactos.
 */
export const ROUNDING_STEP = 1

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
 * Reparte `totalAmount` entre las familias según sus kWh, redondeando cada
 * monto a `step` soles. La suma de los montos siempre equivale al total
 * redondeado a esa misma unidad.
 * Si el total de kWh es 0, todos los montos son 0.
 */
export function computeShares(
  totalAmount: number,
  families: ShareInput[],
  step: number = ROUNDING_STEP
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

  // Se trabaja en unidades enteras de `step` para repartir sin perder dinero.
  const totalUnits = Math.round(totalAmount / step)

  const rows = families.map((f) => {
    const percentage = f.kwh / totalKwh
    const exactUnits = percentage * totalUnits
    return {
      id: f.id,
      kwh: f.kwh,
      percentage,
      floorUnits: Math.floor(exactUnits),
      frac: exactUnits - Math.floor(exactUnits),
    }
  })

  const assigned = rows.reduce((sum, r) => sum + r.floorUnits, 0)
  const remainder = totalUnits - assigned

  // Reparte las unidades sobrantes a las familias con mayor parte fraccionaria.
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
      // toFixed evita los artefactos de coma flotante al multiplicar por step.
      amount: Number(
        ((r.floorUnits + (bonus.get(r.id) ?? 0)) * step).toFixed(2)
      ),
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
