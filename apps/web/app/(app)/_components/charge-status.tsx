import { StatusDot } from "@workspace/ui/components/status-dot"

import { ChargeStatus } from "@/lib/generated/prisma/enums"
import { chargeStatusLabels } from "@/lib/labels"

const tones = {
  [ChargeStatus.PAID]: "success",
  [ChargeStatus.PARTIAL]: "warning",
  [ChargeStatus.PENDING]: "danger",
} as const

/** Estado de cobro de una familia. Antes estaba duplicado en cada página. */
export function ChargeStatusDot({ status }: { status: ChargeStatus }) {
  return (
    <StatusDot tone={tones[status]}>{chargeStatusLabels[status]}</StatusDot>
  )
}
