import type { ReactNode } from "react"
import Link from "next/link"
import { RiAddLine } from "@remixicon/react"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string
  description?: string
  action?: { href: string; label: string } | ReactNode
  eyebrow?: string
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-1.5">
        {eyebrow ? (
          <span className="text-[11px] font-bold tracking-[0.13em] text-primary uppercase">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0">
          {typeof action === "object" &&
          action !== null &&
          "href" in action &&
          "label" in action ? (
            <Link
              href={action.href}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <RiAddLine className="size-4" />
              {action.label}
            </Link>
          ) : (
            action
          )}
        </div>
      ) : null}
    </div>
  )
}
