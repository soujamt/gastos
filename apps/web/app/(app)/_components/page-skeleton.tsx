import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

const statColumns = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
} as const

/**
 * Esqueleto de una sección mientras el servidor responde: repite la forma de
 * la página (cabecera, tarjeta principal, indicadores, gráfico, listado) para
 * que el cambio de pantalla se sienta inmediato. Aparece tras 150ms, así una
 * carga rápida no deja un parpadeo.
 */
export function PageSkeleton({
  hero = false,
  stats,
  chart = false,
  rows = 0,
}: {
  hero?: boolean
  stats?: keyof typeof statColumns
  chart?: boolean
  rows?: number
}) {
  return (
    <div
      role="status"
      className="flex [animation:enter-fade_200ms_ease-out_150ms_both] flex-col gap-6"
    >
      <span className="sr-only">Cargando…</span>

      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {hero ? (
        <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : null}

      {stats ? (
        <div className={cn("grid gap-4", statColumns[stats])}>
          {Array.from({ length: stats }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {chart ? <Skeleton className="h-80 rounded-2xl" /> : null}

      {rows > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-transparent bg-card shadow-surface">
          <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="divide-y divide-border/70">
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
              >
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
