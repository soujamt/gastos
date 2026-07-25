/**
 * Las vistas imprimibles viven fuera del layout de la aplicación: sin sidebar
 * ni cabecera, para que el papel (o el PDF) contenga solo el documento.
 */
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      {children}
    </div>
  )
}
