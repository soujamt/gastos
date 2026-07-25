import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Estado vacío: una invitación, no una disculpa. El título nombra el espacio y
 * la acción es un verbo.
 */
function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed bg-card p-12 text-center shadow-sm",
        className
      )}
      {...props}
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
      ) : null}
      <h2 className={cn("font-semibold", Icon && "mt-4")}>{title}</h2>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
