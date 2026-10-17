"use client"

import { useEffect } from "react"

import { toast } from "@workspace/ui/components/sonner"

import type { Flash } from "@/lib/flash"

const FLASH_COOKIE = "gastosfam-flash"
// Un mismo aviso puede llegar en más de un render: se muestra una sola vez.
const shown = new Set<string>()

export function FlashToast({ flash }: { flash: Flash | null }) {
  useEffect(() => {
    if (!flash || shown.has(flash.id)) return
    shown.add(flash.id)

    document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`

    if (flash.type === "error") {
      // Un error dice cómo resolverlo: se queda hasta que se cierre.
      toast.error(flash.message, {
        description: flash.description,
        duration: Infinity,
        closeButton: true,
      })
    } else {
      toast.success(flash.message, { description: flash.description })
    }
  }, [flash])

  return null
}
