import * as React from "react"
import { RiArrowDownLine, RiArrowRightLine, RiArrowUpLine } from "@remixicon/react"

import { cn } from "@workspace/ui/lib/utils"

type Tone = "positive" | "negative" | "neutral"

const toneStyles: Record<Tone, string> = {
  positive: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  negative: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
}

const toneIcons = {
  up: RiArrowUpLine,
  down: RiArrowDownLine,
  flat: RiArrowRightLine,
}

export type StatDelta = {
  /** Texto ya formateado, p. ej. "12.5%" */
  value: string
  direction: keyof typeof toneIcons
  /**
   * El color no se deduce de la dirección: que suba lo pendiente es malo y que
   * suba lo cobrado es bueno, así que cada uso declara su intención.
   */
  tone?: Tone
}

function Stat({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  label: string
  value: React.ReactNode
  hint?: string
  delta?: StatDelta
  icon?: React.ComponentType<{ className?: string }>
}) {
  const DeltaIcon = delta ? toneIcons[delta.direction] : null

  return (
    <div
      data-slot="stat"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </span>
        {Icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
          {value}
        </span>
        {delta && DeltaIcon ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              toneStyles[delta.tone ?? "neutral"]
            )}
          >
            <DeltaIcon className="size-3" />
            {delta.value}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export { Stat }
