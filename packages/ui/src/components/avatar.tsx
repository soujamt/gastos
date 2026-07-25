import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

const tints = [
  "bg-primary/12 text-primary",
  "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  "bg-violet-500/12 text-violet-700 dark:text-violet-400",
  "bg-rose-500/12 text-rose-700 dark:text-rose-400",
]

/** Tinte estable por nombre: la misma persona conserva su color entre vistas. */
function tintFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return tints[Math.abs(hash) % tints.length] as string
}

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  // "Fam. Silva" -> SI, "Ana Silva" -> AS
  const meaningful = words.filter((w) => !/^fam\.?$/i.test(w))
  const parts = meaningful.length > 0 ? meaningful : words
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

const sizes = {
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
}

function Avatar({
  name,
  size = "md",
  className,
  ...props
}: React.ComponentProps<"span"> & {
  name: string
  size?: keyof typeof sizes
}) {
  return (
    <span
      data-slot="avatar"
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        sizes[size],
        tintFor(name),
        className
      )}
      {...props}
    >
      {initialsFor(name)}
    </span>
  )
}

/** Avatar junto al nombre, el patrón de la columna "quién" en una tabla. */
function AvatarLabel({
  name,
  hint,
  size = "sm",
  className,
  ...props
}: React.ComponentProps<"span"> & {
  name: string
  hint?: string
  size?: keyof typeof sizes
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      <Avatar name={name} size={size} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-medium">{name}</span>
        {hint ? (
          <span className="truncate text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </span>
  )
}

export { Avatar, AvatarLabel }
