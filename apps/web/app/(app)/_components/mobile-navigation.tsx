"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiMenu2Line, RiWallet3Line } from "@remixicon/react"

import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

import { visibleNavGroups } from "./sidebar-nav"

export function MobileNavigation({ isAdmin = true }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const groups = visibleNavGroups(isAdmin)

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Abrir navegación"
        className="flex size-10 items-center justify-center rounded-xl outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <RiMenu2Line className="size-5" />
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="top-0 left-0 h-dvh max-h-dvh w-[min(88vw,320px)] max-w-none translate-x-0 translate-y-0 rounded-none rounded-r-3xl border-y-0 border-l-0 bg-sidebar text-sidebar-foreground data-ending-style:translate-x-[-16px] data-ending-style:translate-y-0 data-ending-style:scale-100 data-starting-style:translate-x-[-16px] data-starting-style:translate-y-0 data-starting-style:scale-100">
          <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/15">
              <RiWallet3Line className="size-5" />
            </div>
            <div>
              <div className="font-semibold tracking-[-0.02em]">GastosFam</div>
              <div className="text-[11px] text-sidebar-foreground/45">
                Finanzas compartidas
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
            {groups.map((group) => (
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
                    <DialogClose
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          className={cn(
                            "flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                            active
                              ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                          )}
                        />
                      }
                    >
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-lg",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/50"
                        )}
                      >
                        <Icon className="size-[17px]" />
                      </span>
                      {item.label}
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
