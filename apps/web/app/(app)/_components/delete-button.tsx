"use client"

import { useRef } from "react"
import { RiAlertLine, RiDeleteBinLine } from "@remixicon/react"

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button, buttonVariants } from "@workspace/ui/components/button"

export function DeleteButton({
  confirmText = "Esta acción no se puede deshacer y el registro dejará de estar disponible.",
}: {
  confirmText?: string
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  function confirmDelete() {
    triggerRef.current?.closest("form")?.requestSubmit()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        ref={triggerRef}
        type="button"
        aria-label="Eliminar"
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <RiDeleteBinLine className="text-muted-foreground hover:text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <RiAlertLine className="size-5" />
          </div>
          <AlertDialogTitle className="mt-4 text-lg font-semibold tracking-[-0.02em]">
            ¿Eliminar registro?
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
            {confirmText}
          </AlertDialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogClose
              render={<Button variant="outline" type="button" />}
            >
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
                />
              }
            >
              Sí, eliminar
            </AlertDialogClose>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
