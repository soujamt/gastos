import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Versión para celular de una tabla ancha. Debajo de `sm` cada fila se vuelve
 * un renglón con lo esencial (quién, cuándo y cuánto) y el monto siempre a la
 * vista, en vez de esconderlo tras un desplazamiento horizontal. La tabla
 * completa se muestra desde `sm` envuelta en `hidden sm:block`.
 */
export function MobileList({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <ul className={cn("divide-y divide-border/70 sm:hidden", className)}>
      {children}
    </ul>
  )
}

export function MobileListItem({
  leading,
  title,
  meta,
  value,
  valueMeta,
  action,
}: {
  leading?: ReactNode
  title: ReactNode
  meta?: ReactNode
  value: ReactNode
  valueMeta?: ReactNode
  action?: ReactNode
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        {meta ? (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="text-sm font-semibold tabular-nums">{value}</div>
        {valueMeta ? (
          <div className="text-xs text-muted-foreground">{valueMeta}</div>
        ) : null}
      </div>
      {action ? <div className="-mr-1.5 shrink-0">{action}</div> : null}
    </li>
  )
}
