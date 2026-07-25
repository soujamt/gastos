import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

export type FilterChip = {
  label: string
  href: string
  active: boolean
  count?: number
}

/**
 * Filtros como enlaces: el estado vive en la URL, así el filtro se puede
 * compartir y sobrevive a una recarga sin necesidad de estado en el cliente.
 */
export function FilterChips({
  chips,
  label,
}: {
  chips: FilterChip[]
  label?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label ? (
        <span className="mr-1 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </span>
      ) : null}
      {chips.map((chip) => (
        <Link
          key={chip.href}
          href={chip.href}
          aria-current={chip.active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            chip.active
              ? "border-primary/30 bg-primary/10 text-primary"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {chip.label}
          {chip.count != null ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                chip.active ? "bg-primary/15" : "bg-muted"
              )}
            >
              {chip.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
