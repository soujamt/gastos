import { PageHeader } from "../../_components/page-header"
import { createFamily } from "../actions"
import { FamilyForm } from "../family-form"

export default function NuevaFamiliaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nueva familia"
        description="Registra una unidad que comparte los gastos."
      />
      <FamilyForm action={createFamily} submitLabel="Crear familia" />
    </div>
  )
}
