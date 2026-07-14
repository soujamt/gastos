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

const groups: { label: string; items: NavItem[] }[] = [
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
    <nav className="flex flex-col gap-5 px-2 py-3">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
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
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
