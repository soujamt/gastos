import { RiBrush3Line, RiInformationLine } from "@remixicon/react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { PageHeader } from "../_components/page-header"
import { AppearanceSettings } from "./appearance-settings"
import { requireAdminPage } from "@/lib/viewer"

export default async function ConfiguracionPage() {
  await requireAdminPage()

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Configuración"
        description="Adapta el espacio de trabajo a la identidad y preferencias de tu organización."
        eyebrow="Personalización"
      />

      <Card>
        <CardHeader className="flex-row items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiBrush3Line className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Apariencia</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Estas preferencias se guardan en este dispositivo.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <AppearanceSettings />
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border bg-card p-5 text-sm shadow-sm">
        <RiInformationLine className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Una experiencia consistente</p>
          <p className="mt-1 leading-6 text-muted-foreground">
            El color elegido se aplica a navegación, botones, indicadores y
            modales, tanto en modo claro como oscuro.
          </p>
        </div>
      </div>
    </div>
  )
}
