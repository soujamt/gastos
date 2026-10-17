"use client"

import { useSyncExternalStore } from "react"
import { RiCheckLine, RiMoonLine, RiSunLine } from "@remixicon/react"
import { useTheme } from "next-themes"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Cada vista previa es una miniatura de la app en ese modo: lienzo, barra
 * lateral, panel y el verde de la marca. Usa valores fijos porque debe verse
 * en su propio modo aunque la página esté en el otro.
 */
const modes = [
  {
    id: "light",
    label: "Claro",
    icon: RiSunLine,
    canvas: "bg-[oklch(0.962_0_0)]",
    panel: "bg-white",
    line: "bg-[oklch(0.88_0_0)]",
  },
  {
    id: "dark",
    label: "Oscuro",
    icon: RiMoonLine,
    canvas: "bg-[oklch(0.145_0_0)]",
    panel: "bg-[oklch(0.2_0_0)]",
    line: "bg-[oklch(0.32_0_0)]",
  },
] as const

// El tema solo se conoce en el cliente: hasta montar, nada aparece elegido.
const noopSubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

export function AppearanceSettings() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const current = mounted ? resolvedTheme : undefined

  return (
    <div className="max-w-xl">
      <h3 className="text-sm font-semibold">Modo de visualización</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        El color de la marca es el mismo en ambos modos.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon
          const selected = current === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(mode.id)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-2.5 text-left text-sm font-medium transition-[background-color,border-color,box-shadow] duration-150 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                selected && "border-primary bg-primary/10 ring-1 ring-primary"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-20 gap-1.5 rounded-lg p-1.5",
                  mode.canvas
                )}
              >
                <span className="flex w-1/4 flex-col gap-1 pt-1">
                  <span className={cn("h-1.5 w-3/4 rounded-full", mode.line)} />
                  <span className="h-1.5 w-full rounded-full bg-[#89F051]" />
                  <span className={cn("h-1.5 w-2/3 rounded-full", mode.line)} />
                </span>
                <span
                  className={cn(
                    "flex flex-1 flex-col gap-1.5 rounded-md p-2",
                    mode.panel
                  )}
                >
                  <span className={cn("h-1.5 w-1/2 rounded-full", mode.line)} />
                  <span className="mt-auto h-4 w-1/3 rounded-sm bg-[#89F051]" />
                </span>
              </span>
              <span className="flex items-center gap-2 px-0.5">
                <Icon className="size-4" />
                {mode.label}
                {selected ? (
                  <RiCheckLine className="ml-auto size-4 text-primary-text" />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
