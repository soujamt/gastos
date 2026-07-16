import { redirect } from "next/navigation"
import { RiWallet3Line } from "@remixicon/react"

import { auth } from "@/auth"

import { SidebarNav } from "./_components/sidebar-nav"
import { CurrentSection } from "./_components/current-section"
import { MobileNavigation } from "./_components/mobile-navigation"
import { ThemeToggle } from "./_components/theme-toggle"
import { UserMenu } from "./_components/user-menu"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-[272px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/15">
            <RiWallet3Line className="size-5" />
          </div>
          <div>
            <div className="font-semibold tracking-[-0.02em] text-sidebar-foreground">
              GastosFam
            </div>
            <div className="text-[11px] text-sidebar-foreground/45">
              Finanzas compartidas
            </div>
          </div>
        </div>
        <SidebarNav />
        <div className="m-4 mt-auto rounded-2xl border border-sidebar-border bg-white/[0.035] p-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/45 uppercase">
            Estado del sistema
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-sidebar-foreground/75">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]" />
            Todo al día
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-20 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <MobileNavigation />
          <div className="md:hidden">
            <div className="text-sm font-semibold tracking-[-0.02em]">
              GastosFam
            </div>
            <div className="text-[10px] text-muted-foreground">
              Control familiar
            </div>
          </div>
          <CurrentSection />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu
              email={session.user.email ?? ""}
              role={session.user.role}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
