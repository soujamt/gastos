"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { PaymentMethod } from "@/lib/generated/prisma/enums"
import { paymentMethodLabels } from "@/lib/labels"

import type { addPayment, PaymentState } from "../actions"

export function PaymentForm({
  action,
  families,
}: {
  action: (
    prev: PaymentState,
    formData: FormData
  ) => ReturnType<typeof addPayment>
  families: { id: number; name: string }[]
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="familyId" className="text-xs">
            Familia
          </Label>
          <Select id="familyId" name="familyId" required>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount" className="text-xs">
            Monto (S/)
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paidAt" className="text-xs">
            Fecha
          </Label>
          <Input id="paidAt" name="paidAt" type="date" defaultValue={today} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="method" className="text-xs">
            Método
          </Label>
          <Select id="method" name="method" defaultValue={PaymentMethod.CASH}>
            {Object.values(PaymentMethod).map((m) => (
              <option key={m} value={m}>
                {paymentMethodLabels[m]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="note" className="text-xs">
            Nota (opcional)
          </Label>
          <Input id="note" name="note" placeholder="Referencia, observación…" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Registrar pago"}
        </Button>
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
