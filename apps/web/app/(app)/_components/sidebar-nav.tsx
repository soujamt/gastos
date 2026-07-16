"use client"

import type { RemixiconComponentType } from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiBarChartLine,
  RiCalendar2Line,
  RiDashboardLine,
  RiFlashlightLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiSettings3Line,
  RiSpeedUpLine,
  RiUserSettingsLine,
} from "@remixicon/react"

import { cn } from "@workspace/ui/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: RemixiconComponentType
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Control",
    items: [
      { href: "/", label: "Dashboard", icon: RiDashboardLine },
      { href: "/periodos", label: "Períodos", icon: RiCalendar2Line },
      { href: "/familias", label: "Familias", icon: RiGroupLine },
      { href: "/servicios", label: "Servicios", icon: RiFlashlightLine },
      { href: "/lecturas", label: "Lecturas", icon: RiSpeedUpLine },
      { href: "/pagos", label: "Pagos", icon: RiMoneyDollarCircleLine },
      { href: "/reportes", label: "Reportes", icon: RiBarChartLine },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/usuarios", label: "Usuarios", icon: RiUserSettingsLine },
      { href: "/configuracion", label: "Configuración", icon: RiSettings3Line },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="px-2 pb-2 text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/40 uppercase">
            {group.label}
          </span>
          {group.items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-200",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.055),0_8px_20px_rgba(0,0,0,0.08)]"
                    : "text-sidebar-foreground/58 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg transition-all",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/48 group-hover:bg-white/5 group-hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="size-[17px]" />
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
