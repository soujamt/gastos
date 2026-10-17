import Image from "next/image"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Logo de GastosFam, sobre su disco blanco: sin él, la casa azul marino se
 * pierde en la barra lateral oscura. Siempre va junto al nombre visible, así
 * que es decorativo (alt vacío) y se carga sin esperar.
 */
export function BrandLogo({
  size = 36,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      width={size}
      height={size}
      loading="eager"
      draggable={false}
      className={cn("shrink-0 select-none", className)}
    />
  )
}
