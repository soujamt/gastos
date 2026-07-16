"use client"

import { useState } from "react"

export type ChartSeries = { key: string; name: string; color: string }
export type ChartGroup = { label: string; values: Record<string, number> }
export type ChartUnit = "kwh" | "pen"

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})

// El formato vive en el cliente: las funciones no cruzan la frontera server/client.
function formatValue(value: number, unit: ChartUnit) {
  return unit === "pen" ? soles.format(value) : `${Math.round(value)} kWh`
}

function niceMax(value: number) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

export function BarChart({
  groups,
  series,
  unit,
  height = 208,
}: {
  groups: ChartGroup[]
  series: ChartSeries[]
  unit: ChartUnit
  height?: number
}) {
  const [hover, setHover] = useState<string | null>(null)

  const rawMax = Math.max(
    0,
    ...groups.flatMap((g) => series.map((s) => g.values[s.key] ?? 0))
  )
  const max = niceMax(rawMax)
  const ticks = [max, max / 2, 0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {/* Eje Y (discreto) */}
        <div
          className="flex shrink-0 flex-col justify-between text-right text-[10px] text-muted-foreground tabular-nums"
          style={{ height }}
          aria-hidden="true"
        >
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {formatValue(t, unit)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Grilla recesiva */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between"
            style={{ height }}
            aria-hidden="true"
          >
            {ticks.map((t) => (
              <div key={t} className="border-t border-border/60" />
            ))}
          </div>

          <div className="flex gap-2">
            {groups.map((group) => (
              <div
                key={group.label}
                className="flex min-w-0 flex-1 flex-col items-center"
              >
                <div
                  className="flex w-full items-end justify-center gap-[2px]"
                  style={{ height }}
                >
                  {series.map((s) => {
                    const value = group.values[s.key] ?? 0
                    const id = `${group.label}-${s.key}`
                    const pct = max > 0 ? (value / max) * 100 : 0
                    return (
                      <div
                        key={s.key}
                        className="relative flex h-full flex-1 items-end"
                        onMouseEnter={() => setHover(id)}
                        onMouseLeave={() => setHover(null)}
                      >
                        <div
                          className="w-full rounded-t-[4px] transition-opacity"
                          style={{
                            height: `${pct}%`,
                            minHeight: value > 0 ? 2 : 0,
                            background: s.color,
                            opacity: hover && hover !== id ? 0.45 : 1,
                          }}
                        />
                        {hover === id ? (
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md">
                            <span className="font-medium">{group.label}</span>
                            <span className="mx-1.5 text-muted-foreground">
                              ·
                            </span>
                            {series.length > 1 ? `${s.name}: ` : ""}
                            <span className="font-medium tabular-nums">
                              {formatValue(value, unit)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
                <span className="mt-2 truncate text-[11px] text-muted-foreground">
                  {group.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {series.length > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {series.map((s) => (
            <span
              key={s.key}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span
                className="size-2.5 rounded-[3px]"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
