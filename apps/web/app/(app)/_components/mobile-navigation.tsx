"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiMenu2Line } from "@remixicon/react"

import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

import { BrandLogo } from "@/components/brand-logo"

import {
  NavGroupLabel,
  NavItemContent,
  isActiveHref,
  navItemClassName,
  visibleNavGroups,
} from "./sidebar-nav"

export function MobileNavigation({ isAdmin = true }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const groups = visibleNavGroups(isAdmin)

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Abrir navegación"
        className="flex size-10 items-center justify-center rounded-xl transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <RiMenu2Line className="size-5" />
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="top-0 left-0 h-dvh max-h-dvh w-[min(88vw,320px)] max-w-none translate-x-0 translate-y-0 rounded-none rounded-r-2xl border-y-0 border-l-0 bg-sidebar text-sidebar-foreground duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:-translate-x-full data-ending-style:translate-y-0 data-ending-style:scale-100 data-ending-style:duration-200 data-starting-style:-translate-x-full data-starting-style:translate-y-0 data-starting-style:scale-100">
          <div className="flex h-16 items-center gap-3 px-5">
            <BrandLogo size={36} />
            <div className="leading-tight">
              <div className="font-semibold tracking-[-0.02em]">GastosFam</div>
              <div className="text-[11px] text-sidebar-foreground/55">
                Finanzas compartidas
              </div>
            </div>
          </div>

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
                    <DialogClose
                      key={item.href}
                      // Renderiza un enlace, no un <button>: Base UI debe saberlo
                      // para no esperar la semántica de botón nativo.
                      nativeButton={false}
                      render={
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={navItemClassName(active, true)}
                        />
                      }
                    >
                      <NavItemContent item={item} active={active} />
                    </DialogClose>
                  )
                })}
              </div>
            ))}
          </nav>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  )
}
