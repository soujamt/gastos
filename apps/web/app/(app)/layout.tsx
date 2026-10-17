import { redirect } from "next/navigation"
import { RiLogoutBoxRLine } from "@remixicon/react"

import { Avatar } from "@workspace/ui/components/avatar"

import { auth } from "@/auth"
import { Toaster } from "@workspace/ui/components/sonner"
import { BrandLogo } from "@/components/brand-logo"
import { logout } from "@/app/(auth)/actions"
import { readFlash } from "@/lib/flash"
import { roleLabels } from "@/lib/labels"
import { prisma } from "@/lib/prisma"

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
  const [flashMessage, openPeriods] = await Promise.all([
    readFlash(),
    isAdmin ? prisma.period.count({ where: { status: "OPEN" } }) : 0,
  ])

  return (
    // En escritorio la app es un lienzo (la barra lateral) con un panel de
    // contenido encima que se desplaza por dentro; en celular, una página normal.
    <div className="min-h-svh md:flex md:h-svh md:overflow-hidden md:bg-sidebar">
      <a
        href="#contenido"
        className="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium shadow-overlay focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Saltar al contenido
      </a>

      <aside className="hidden w-[248px] shrink-0 flex-col md:flex">
        <div className="flex h-18 items-center gap-3 px-5">
          <BrandLogo size={32} />
          <div className="min-w-0 leading-tight">
            <div className="font-semibold tracking-[-0.02em] text-sidebar-foreground">
              GastosFam
            </div>
            <div className="truncate text-xs text-sidebar-foreground/55">
              Finanzas compartidas
            </div>
          </div>
        </div>
        <SidebarNav
          isAdmin={isAdmin}
          counts={openPeriods ? { "/periodos": openPeriods } : undefined}
        />
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar name={displayName} />
            <div className="min-w-0 flex-1 leading-tight" title={email}>
              <div className="truncate text-sm font-medium text-sidebar-foreground">
                {displayName}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/55">
                {roleLabels[session.user.role]}
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RiLogoutBoxRLine className="size-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="flex min-h-0 flex-1 flex-col md:overflow-hidden md:rounded-xl md:border md:border-transparent md:bg-background md:shadow-surface">
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 md:static md:bg-transparent md:backdrop-blur-none lg:px-8 [@media(prefers-reduced-transparency:reduce)]:bg-background">
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
          <main
            id="contenido"
            tabIndex={-1}
            className="flex-1 outline-none md:min-h-0 md:overflow-y-auto md:overscroll-contain"
          >
            <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
      <FlashToast flash={flashMessage} />
    </div>
  )
}
