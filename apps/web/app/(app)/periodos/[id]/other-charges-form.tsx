"use client"

import { useActionState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import type { OtherChargesState, saveOtherCharges } from "../actions"

type FamilyRow = { id: number; name: string }
type ServiceRow = { id: number; name: string }

export type OtherChargesInitial = {
  /** familyId -> deuda anterior */
  debts: Record<number, string>
  /** `${serviceId}_${familyId}` -> monto */
  charges: Record<string, string>
}

export function OtherChargesForm({
  action,
  families,
  services,
  initial,
}: {
  action: (
    prev: OtherChargesState,
    formData: FormData
  ) => ReturnType<typeof saveOtherCharges>
  families: FamilyRow[]
  services: ServiceRow[]
  initial: OtherChargesInitial
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Familia</TableHead>
              <TableHead className="w-36">Deuda anterior</TableHead>
              {services.map((s) => (
                <TableHead key={s.id} className="w-36">
                  {s.name} (S/)
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {families.map((fam) => (
              <TableRow key={fam.id}>
                <TableCell className="font-medium">{fam.name}</TableCell>
                <TableCell>
                  <Input
                    name={`debt_${fam.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={initial.debts[fam.id] ?? ""}
                    className="h-9"
                  />
                </TableCell>
                {services.map((s) => (
                  <TableCell key={s.id}>
                    <Input
                      name={`charge_${s.id}_${fam.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      defaultValue={initial.charges[`${s.id}_${fam.id}`] ?? ""}
                      className="h-9"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        La deuda anterior es lo que la familia arrastra de meses previos. Deja un
        monto vacío o en 0 para no cobrar ese servicio en este período.
      </p>

      {state?.error ? (
        <p
          className="rounded-xl bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Cargos y deuda actualizados.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cargos y deuda"}
        </Button>
      </div>
    </form>
  )
}
