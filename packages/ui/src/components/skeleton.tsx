import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Bloque de carga. El tinte sale de la tinta del tema, así se distingue tanto
 * sobre el fondo de la página como sobre una tarjeta, en claro y en oscuro. El
 * pulso solo cambia la opacidad y respeta movimiento reducido.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-lg bg-foreground/[0.07] motion-safe:animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
