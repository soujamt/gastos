"use client"

import { usePathname } from "next/navigation"

import { navGroups } from "./sidebar-nav"

export function CurrentSection() {
  const pathname = usePathname()
  const item = navGroups
    .flatMap((group) => group.items)
    .find((candidate) =>
      candidate.href === "/"
        ? pathname === "/"
        : pathname.startsWith(candidate.href)
    )

  if (!item) {
    return null
  }

  const Icon = item.icon

  return (
    <div className="hidden items-center gap-2.5 text-sm md:flex">
      <span className="flex size-8 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-xs">
        <Icon className="size-4" />
      </span>
      <div>
        <div className="text-[10px] leading-none font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Espacio de administración
        </div>
        <div className="mt-1 leading-none font-medium">{item.label}</div>
      </div>
    </div>
  )
}
