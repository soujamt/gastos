"use client"

import type { ReactNode } from "react"
import { RiAddLine, RiEditLine } from "@remixicon/react"

import { buttonVariants } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

export function FormDialog({
  title,
  description,
  children,
  mode = "create",
  label,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  mode?: "create" | "edit" | "custom"
  label: string
  className?: string
}) {
  const Icon = mode === "create" ? RiAddLine : RiEditLine

  return (
    <Dialog>
      <DialogTrigger
        aria-label={mode === "edit" ? label : undefined}
        className={cn(
          buttonVariants({
            variant:
              mode === "edit"
                ? "ghost"
                : mode === "custom"
                  ? "outline"
                  : "default",
            size: mode === "edit" ? "icon-sm" : "sm",
          }),
          mode === "edit" && "text-muted-foreground",
          className
        )}
      >
        <Icon className="size-4" />
        {mode === "edit" ? <span className="sr-only">{label}</span> : label}
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>{children}</DialogBody>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  )
}
