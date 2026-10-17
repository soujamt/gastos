import { redirect } from "next/navigation"
import { RiLogoutBoxRLine } from "@remixicon/react"

import { Avatar } from "@workspace/ui/components/avatar"

import { auth } from "@/auth"
import { Toaster } from "@workspace/ui/components/sonner"
import { BrandLogo } from "@/components/brand-logo"
import { logout } from "@/app/(auth)/actions"
import { readFlash } from "@/lib/flash"
import { roleLabels } from "@/lib/labels"

import { SidebarNav } from "./_components/sidebar-nav"
import { CurrentSection } from "./_components/current-section"
import { FlashToast } from "./_components/flash-toast"
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
  const isAdmin = session.user.role === "ADMIN"
  const email = session.user.email ?? ""
  const displayName = session.user.name ?? email.split("@")[0] ?? "Usuario"
  const flashMessage = await readFlash()

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-[264px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <BrandLogo size={36} />
          <div className="leading-tight">
            <div className="font-semibold tracking-[-0.02em] text-sidebar-foreground">
              GastosFam
            </div>
            <div className="text-[11px] text-sidebar-foreground/45">
              Finanzas compartidas
            </div>
          </div>
        </div>
        <SidebarNav isAdmin={isAdmin} />
        {/* Quién está dentro y la salida: antes aquí había un "Todo al día"
            fijo, que decía lo mismo aunque hubiera saldos pendientes. */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <Avatar
              name={displayName}
              className="bg-sidebar-accent text-sidebar-foreground"
            />
            <div className="min-w-0 flex-1 leading-tight" title={email}>
              <div className="truncate text-sm font-medium text-sidebar-foreground">
                {displayName}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/50">
                {roleLabels[session.user.role]}
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/55 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <RiLogoutBoxRLine className="size-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <MobileNavigation isAdmin={isAdmin} />
          <div className="flex items-center gap-2.5 md:hidden">
            <BrandLogo size={30} />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-[-0.02em]">
                GastosFam
              </div>
              <div className="text-[10px] text-muted-foreground">
                Control familiar
              </div>
            </div>
          </div>
          <CurrentSection />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {/* En escritorio la identidad vive al pie de la barra lateral. */}
            <div className="md:hidden">
              <UserMenu email={email} role={session.user.role} />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
      <Toaster />
      <FlashToast flash={flashMessage} />
    </div>
  )
}
