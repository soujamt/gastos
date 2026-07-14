"use client"

import { RiLogoutBoxRLine } from "@remixicon/react"

import { Button } from "@workspace/ui/components/button"

import { logout } from "@/app/(auth)/actions"

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  FAMILY: "Familia",
  VIEWER: "Solo lectura",
}

export function UserMenu({ email, role }: { email: string; role: string }) {
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <div className="text-xs leading-tight font-medium">{email}</div>
        <div className="text-muted-foreground text-[11px] leading-tight">
          {roleLabels[role] ?? role}
        </div>
      </div>
      <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium">
        {initials}
      </div>
      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Cerrar sesión"
        >
          <RiLogoutBoxRLine />
        </Button>
      </form>
    </div>
  )
}
