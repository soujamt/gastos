import { redirect } from "next/navigation"
import { RiWallet3Line } from "@remixicon/react"

import { auth } from "@/auth"

import { SidebarNav } from "./_components/sidebar-nav"
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
      <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
            <RiWallet3Line className="size-4" />
          </div>
          <span className="font-medium">GastosFam</span>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <span className="font-medium md:hidden">GastosFam</span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu
              email={session.user.email ?? ""}
              role={session.user.role}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-5">{children}</main>
      </div>
    </div>
  )
}
