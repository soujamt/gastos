import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export type PanelMeta = {
  icon: React.ComponentType<{ className?: string }>
  label: ReactNode
  /** El primer dato va en tinta normal; el resto, atenuado. */
  muted?: boolean
}

/**
 * Contenedor de listados: tarjeta con una barra de resumen arriba y la tabla
 * (o el contenido) debajo. Unifica el patrón que se repetía en cada módulo.
 */
export function DataPanel({
  meta,
  actions,
  children,
  className,
}: {
  meta?: PanelMeta[]
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-panel",
        className
      )}
    >
      {meta?.length || actions ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-5 py-4 text-sm sm:px-6">
          {meta?.map(({ icon: Icon, label, muted }, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2",
                muted ?? i > 0
                  ? "text-muted-foreground"
                  : "font-medium text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  (muted ?? i > 0) ? "" : "text-primary"
                )}
              />
              {label}
            </div>
          ))}
          {actions ? (
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
