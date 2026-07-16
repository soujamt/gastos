import Link from "next/link"
import { RiAddLine } from "@remixicon/react"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={cn(buttonVariants({ size: "sm" }), "gap-1")}
        >
          <RiAddLine className="size-4" />
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
