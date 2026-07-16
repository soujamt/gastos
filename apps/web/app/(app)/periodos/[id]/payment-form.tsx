"use client"

import { useActionState, useEffect, useRef } from "react"

import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { PaymentMethod } from "@/lib/generated/prisma/enums"
import { paymentMethodLabels } from "@/lib/labels"

import type { addPayment, PaymentState } from "../actions"

export function PaymentForm({
  action,
  families,
  modal = false,
}: {
  action: (
    prev: PaymentState,
    formData: FormData
  ) => ReturnType<typeof addPayment>
  families: { id: number; name: string }[]
  modal?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset()
      if (modal) closeRef.current?.click()
    }
  }, [modal, state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className={
        modal
          ? "flex flex-col gap-5"
          : "flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm"
      }
    >
      <div
        className={
          modal
            ? "grid gap-4 sm:grid-cols-2"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="familyId">Familia</Label>
          <Select id="familyId" name="familyId" required>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Monto (S/)</Label>
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
          <Label htmlFor="paidAt">Fecha</Label>
          <Input id="paidAt" name="paidAt" type="date" defaultValue={today} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="method">Método</Label>
          <Select id="method" name="method" defaultValue={PaymentMethod.CASH}>
            {Object.values(PaymentMethod).map((m) => (
              <option key={m} value={m}>
                {paymentMethodLabels[m]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="note">Nota (opcional)</Label>
          <Input id="note" name="note" placeholder="Referencia, observación…" />
        </div>
      </div>

      {state?.error ? (
        <p
          className="rounded-xl bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        {modal ? (
          <DialogClose
            ref={closeRef}
            render={<Button type="button" variant="outline" />}
          >
            Cancelar
          </DialogClose>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Registrar pago"}
        </Button>
      </div>
    </form>
  )
}
