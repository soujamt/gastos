"use client"

import { useFormStatus } from "react-dom"
import { RiDeleteBinLine } from "@remixicon/react"

import { Button } from "@workspace/ui/components/button"

export function DeleteButton({
  confirmText = "¿Eliminar este registro? Esta acción no se puede deshacer.",
}: {
  confirmText?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      aria-label="Eliminar"
      className="text-muted-foreground hover:text-destructive"
      onClick={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault()
        }
      }}
    >
      <RiDeleteBinLine />
    </Button>
  )
}
