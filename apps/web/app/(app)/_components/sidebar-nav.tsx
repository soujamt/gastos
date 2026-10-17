"use client"

import type { RemixiconComponentType } from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiBarChartFill,
  RiBarChartLine,
  RiCalendar2Fill,
  RiCalendar2Line,
  RiDashboardFill,
  RiDashboardLine,
  RiFlashlightFill,
  RiFlashlightLine,
  RiGroupFill,
  RiGroupLine,
  RiMoneyDollarCircleFill,
  RiMoneyDollarCircleLine,
  RiSettings3Fill,
  RiSettings3Line,
  RiSpeedUpFill,
  RiSpeedUpLine,
  RiUserSettingsFill,
  RiUserSettingsLine,
} from "@remixicon/react"

import { cn } from "@workspace/ui/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: RemixiconComponentType
  /** Variante rellena: marca el módulo activo; el contorno es el reposo. */
  activeIcon: RemixiconComponentType
  adminOnly?: boolean
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Control",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: RiDashboardLine,
        activeIcon: RiDashboardFill,
      },
      {
        href: "/periodos",
        label: "Períodos",
        icon: RiCalendar2Line,
        activeIcon: RiCalendar2Fill,
        adminOnly: true,
      },
      {
        href: "/familias",
        label: "Familias",
        icon: RiGroupLine,
        activeIcon: RiGroupFill,
        adminOnly: true,
      },
      {
        href: "/servicios",
        label: "Servicios",
        icon: RiFlashlightLine,
        activeIcon: RiFlashlightFill,
        adminOnly: true,
      },
      {
        href: "/lecturas",
        label: "Lecturas",
        icon: RiSpeedUpLine,
        activeIcon: RiSpeedUpFill,
        adminOnly: true,
      },
      {
        href: "/pagos",
        label: "Pagos",
        icon: RiMoneyDollarCircleLine,
        activeIcon: RiMoneyDollarCircleFill,
      },
      {
        href: "/reportes",
        label: "Reportes",
        icon: RiBarChartLine,
        activeIcon: RiBarChartFill,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/usuarios",
        label: "Usuarios",
        icon: RiUserSettingsLine,
        activeIcon: RiUserSettingsFill,
        adminOnly: true,
      },
      {
        href: "/configuracion",
        label: "Configuración",
        icon: RiSettings3Line,
        activeIcon: RiSettings3Fill,
        adminOnly: true,
      },
    ],
  },
]

/** Nav visible según el rol: sin admin, los módulos de gestión desaparecen. */
export function visibleNavGroups(isAdmin: boolean) {
  if (isAdmin) return navGroups
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly),
    }))
    .filter((group) => group.items.length > 0)
}

export function isActiveHref(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

/**
 * Estilo único de un módulo en la navegación (barra lateral y cajón móvil).
 * El activo es una píldora sobre el lienzo; el resto, texto atenuado.
 */
export function navItemClassName(active: boolean, touch = false) {
  return cn(
    "group flex items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
    touch ? "h-11" : "h-9",
    active
      ? "bg-sidebar-active font-medium text-sidebar-foreground shadow-surface"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
  )
}

export function NavItemContent({
  item,
  active,
  count,
}: {
  item: NavItem
  active: boolean
  count?: number
}) {
  const Icon = active ? item.activeIcon : item.icon
  return (
    <>
      <Icon
        aria-hidden="true"
        className={cn(
          "size-[18px] shrink-0",
          active
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground"
        )}
      />
      <span className="truncate">{item.label}</span>
      {count ? (
        <span className="ml-auto min-w-5 rounded-md border border-sidebar-border px-1.5 text-center text-[11px] leading-5 font-medium text-sidebar-foreground/70 tabular-nums">
          {count}
        </span>
      ) : null}
    </>
  )
}

export function NavGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 pb-1 text-[11px] font-medium tracking-[0.05em] text-sidebar-foreground/50 uppercase">
      {children}
    </span>
  )
}

export function SidebarNav({
  isAdmin = true,
  counts = {},
}: {
  isAdmin?: boolean
  /** Cifras junto a un módulo, por ruta (p. ej. períodos abiertos). */
  counts?: Record<string, number>
}) {
  const pathname = usePathname()
  const groups = visibleNavGroups(isAdmin)

  return (
    <nav
      aria-label="Principal"
      className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-3 py-2"
    >
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <NavGroupLabel>{group.label}</NavGroupLabel>
          {group.items.map((item) => {
            const active = isActiveHref(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={navItemClassName(active)}
              >
                <NavItemContent
                  item={item}
                  active={active}
                  count={counts[item.href]}
                />
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
