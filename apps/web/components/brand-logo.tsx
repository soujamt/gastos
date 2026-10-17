import Image from "next/image"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Logo de GastosFam en su teja blanca redondeada, como un ícono de app: sin
 * ella, la casa azul marino se pierde sobre el lienzo oscuro. El anillo de
 * superficie la separa del fondo claro. Siempre va junto al nombre visible,
 * así que es decorativo (alt vacío) y se carga sin esperar.
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
      className={cn(
        "shrink-0 rounded-[22.5%] shadow-surface select-none",
        className
      )}
    />
  )
}
