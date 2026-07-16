import { Placeholder } from "../_components/placeholder"
import { requireAdminPage } from "@/lib/viewer"

export default async function LecturasPage() {
  await requireAdminPage()

  return (
    <Placeholder
      title="Lecturas"
      description="Registro de lecturas de sub-medidores y cálculo de consumo."
    />
  )
}
