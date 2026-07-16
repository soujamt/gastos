import { PageHeader } from "../../_components/page-header"
import { createPeriod } from "../actions"
import { PeriodForm } from "../period-form"

export default function NuevoPeriodoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuevo período"
        description="Un mes de facturación para registrar consumos y pagos."
      />
      <PeriodForm action={createPeriod} submitLabel="Crear período" />
    </div>
  )
}
