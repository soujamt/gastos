export function Placeholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        En construcción — este módulo llega en una próxima fase.
      </div>
    </div>
  )
}
