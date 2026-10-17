"use client"

import { RiLogoutBoxRLine } from "@remixicon/react"

import { Avatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"

import { logout } from "@/app/(auth)/actions"
import type { Role } from "@/lib/generated/prisma/enums"
import { roleLabels } from "@/lib/labels"

export function UserMenu({ email, role }: { email: string; role: Role }) {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <div className="text-xs leading-tight font-medium">{email}</div>
        <div className="text-[11px] leading-tight text-muted-foreground">
          {roleLabels[role]}
        </div>
      </div>
      <Avatar name={email.split("@")[0] ?? email} size="sm" />
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
