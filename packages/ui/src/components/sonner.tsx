"use client"

import * as React from "react"
import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

/**
 * Avisos de la app (Sonner) con los colores del tema y los iconos de Remix,
 * la misma librería que el resto de la interfaz.
 */
function Toaster(props: ToasterProps) {
  const { resolvedTheme = "system" } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position="bottom-right"
      containerAriaLabel="Avisos"
      icons={{
        success: (
          <RiCheckboxCircleFill className="size-[18px] text-emerald-600 dark:text-emerald-400" />
        ),
        error: <RiErrorWarningFill className="size-[18px] text-destructive" />,
      }}
      toastOptions={{
        closeButtonAriaLabel: "Cerrar aviso",
        classNames: {
          toast: "!shadow-overlay !border-transparent !rounded-xl !gap-2.5",
          title: "!font-medium",
          description: "!text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, toast }
