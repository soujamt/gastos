import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type Tone = "success" | "warning" | "danger" | "info" | "muted" | "accent"

const dotTones: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
  info: "bg-blue-500",
  muted: "bg-muted-foreground/50",
  accent: "bg-primary",
}

/**
 * Estado en tablas: un punto de color y el texto en tinta normal. Deja el color
 * como señal secundaria y mantiene la etiqueta legible, en vez de teñir todo.
 */
function StatusDot({
  tone = "muted",
  children,
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      data-slot="status-dot"
      className={cn(
        "inline-flex items-center gap-2 text-sm whitespace-nowrap",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", dotTones[tone])}
      />
      {children}
    </span>
  )
}

export { StatusDot }
