import { PageHeader } from "../../_components/page-header"
import { createService } from "../actions"
import { ServiceForm } from "../service-form"

export default function NuevoServicioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuevo servicio"
        description="Define un servicio y cómo se reparte entre las familias."
      />
      <ServiceForm action={createService} submitLabel="Crear servicio" />
    </div>
  )
}
