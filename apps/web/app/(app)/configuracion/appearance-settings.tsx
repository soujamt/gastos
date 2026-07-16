"use client"

import { useSyncExternalStore } from "react"
import {
  RiCheckLine,
  RiComputerLine,
  RiMoonLine,
  RiSunLine,
} from "@remixicon/react"
import { useTheme } from "next-themes"

import { cn } from "@workspace/ui/lib/utils"

const accents = [
  { id: "teal", label: "Esmeralda", color: "bg-[#148d7c]" },
  { id: "indigo", label: "Índigo", color: "bg-[#635bdb]" },
  { id: "amber", label: "Ámbar", color: "bg-[#b87312]" },
  { id: "rose", label: "Coral", color: "bg-[#c84f62]" },
] as const

const themes = [
  { id: "light", label: "Claro", icon: RiSunLine },
  { id: "dark", label: "Oscuro", icon: RiMoonLine },
  { id: "system", label: "Sistema", icon: RiComputerLine },
] as const

const accentEvent = "gastosfam-accent-change"

function readAccent() {
  return window.localStorage.getItem("gastosfam-accent") ?? "teal"
}

function readServerAccent() {
  return "teal"
}

function subscribeToAccent(callback: () => void) {
  window.addEventListener(accentEvent, callback)
  return () => window.removeEventListener(accentEvent, callback)
}

function applyAccent(nextAccent: string) {
  window.localStorage.setItem("gastosfam-accent", nextAccent)
  if (nextAccent === "teal") {
    document.documentElement.removeAttribute("data-accent")
  } else {
    document.documentElement.setAttribute("data-accent", nextAccent)
  }
  window.dispatchEvent(new Event(accentEvent))
}

export function AppearanceSettings() {
  const accent = useSyncExternalStore(
    subscribeToAccent,
    readAccent,
    readServerAccent
  )
  const { theme, setTheme } = useTheme()

  function updateAccent(nextAccent: string) {
    applyAccent(nextAccent)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold">Color de la marca</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Elige el acento para botones, indicadores y elementos destacados.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {accents.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => updateAccent(option.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition-all hover:bg-muted",
                accent === option.id &&
                  "border-primary bg-primary/5 ring-2 ring-primary/10"
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  option.color
                )}
              >
                {accent === option.id ? (
                  <RiCheckLine className="size-4 text-white" />
                ) : null}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Modo de visualización</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Usa un tema fijo o sigue automáticamente la preferencia del
          dispositivo.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {themes.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all hover:bg-muted",
                  theme === option.id &&
                    "border-primary bg-primary/5 ring-2 ring-primary/10"
                )}
              >
                <Icon className="size-5" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
