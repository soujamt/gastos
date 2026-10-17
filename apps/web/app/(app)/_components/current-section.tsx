"use client"

import { usePathname } from "next/navigation"
import { RiArrowRightSLine } from "@remixicon/react"

import { navGroups } from "./sidebar-nav"

/** Ruta de la sección actual: grupo › módulo, en una sola línea. */
export function CurrentSection() {
  const pathname = usePathname()
  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)
  const group = navGroups.find((candidate) =>
    candidate.items.some((item) => isCurrent(item.href))
  )
  const item = group?.items.find((candidate) => isCurrent(candidate.href))

  if (!group || !item) {
    return null
  }

  return (
    <nav
      aria-label="Ubicación"
      className="hidden items-center gap-1.5 text-sm md:flex"
    >
      <span className="text-muted-foreground">{group.label}</span>
      <RiArrowRightSLine
        aria-hidden="true"
        className="size-4 text-muted-foreground/60"
      />
      <span aria-current="page" className="font-medium">
        {item.label}
      </span>
    </nav>
  )
}
