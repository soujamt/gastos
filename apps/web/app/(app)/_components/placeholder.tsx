export function Placeholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-[0.13em] text-primary uppercase">
          Próximamente
        </span>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[1.75rem]">
          {title}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-dashed bg-card p-12 text-center shadow-sm">
        <div className="absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
            ✦
          </div>
          <h2 className="mt-4 font-semibold">
            Estamos preparando este espacio
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Este módulo se integrará manteniendo el mismo diseño y experiencia
            del resto de la aplicación.
          </p>
        </div>
      </div>
    </div>
  )
}
