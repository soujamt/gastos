"use client"

import { useActionState, useState } from "react"

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
import { splitEqually } from "@/lib/prorrateo"

import type { OtherChargesState, saveOtherCharges } from "../actions"

type FamilyRow = { id: number; name: string }
type ServiceRow = { id: number; name: string; type: string }

export type OtherChargesInitial = {
  /** familyId -> deuda anterior */
  debts: Record<number, string>
  /** `${serviceId}_${familyId}` -> monto (servicios con monto por familia) */
  charges: Record<string, string>
  /** serviceId -> total a dividir (servicios en partes iguales) */
  equalTotals: Record<number, string>
}

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})

function num(value: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
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

  const perFamily = services.filter((s) => s.type !== "EQUAL")
  const equal = services.filter((s) => s.type === "EQUAL")

  const [debts, setDebts] = useState<Record<number, string>>(initial.debts)
  const [charges, setCharges] = useState<Record<string, string>>(
    initial.charges
  )
  const [equalTotals, setEqualTotals] = useState<Record<number, string>>(
    initial.equalTotals
  )
  // Valor del atajo "aplicar a todas", por servicio.
  const [fill, setFill] = useState<Record<number, string>>({})

  function applyToAll(serviceId: number) {
    const value = fill[serviceId] ?? ""
    setCharges((prev) => {
      const next = { ...prev }
      for (const fam of families) next[`${serviceId}_${fam.id}`] = value
      return next
    })
  }

  // Reparto en vivo de los servicios en partes iguales.
  const equalShares = new Map<string, number>()
  for (const svc of equal) {
    const total = num(equalTotals[svc.id] ?? "")
    if (total <= 0 || families.length === 0) continue
    for (const share of splitEqually(
      total,
      families.map((f) => f.id)
    )) {
      equalShares.set(`${svc.id}_${share.id}`, share.amount)
    }
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
    >
      {equal.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-primary/[0.04] p-4">
          <div>
            <p className="text-sm font-medium">Total a dividir en partes iguales</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ingresa el monto del recibo y se reparte entre las{" "}
              {families.length} familias, sin perder céntimos.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {equal.map((s) => (
              <div key={s.id} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`equal_${s.id}`}
                  className="text-xs text-muted-foreground"
                >
                  {s.name} · total (S/)
                </label>
                <Input
                  id={`equal_${s.id}`}
                  name={`equal_${s.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={equalTotals[s.id] ?? ""}
                  onChange={(e) =>
                    setEqualTotals((prev) => ({
                      ...prev,
                      [s.id]: e.target.value,
                    }))
                  }
                  className="h-9"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {perFamily.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
          <p className="text-sm font-medium">
            Aplicar el mismo monto a todas las familias
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {perFamily.map((s) => (
              <div key={s.id} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label
                    htmlFor={`fill_${s.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    {s.name} (S/)
                  </label>
                  <Input
                    id={`fill_${s.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={fill[s.id] ?? ""}
                    onChange={(e) =>
                      setFill((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyToAll(s.id)}
                >
                  Aplicar a todas
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Familia</TableHead>
              <TableHead className="w-36">Deuda anterior</TableHead>
              {perFamily.map((s) => (
                <TableHead key={s.id} className="w-36">
                  {s.name} (S/)
                </TableHead>
              ))}
              {equal.map((s) => (
                <TableHead key={s.id} className="w-32 text-right">
                  {s.name}
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
                    value={debts[fam.id] ?? ""}
                    onChange={(e) =>
                      setDebts((prev) => ({
                        ...prev,
                        [fam.id]: e.target.value,
                      }))
                    }
                    className="h-9"
                  />
                </TableCell>
                {perFamily.map((s) => {
                  const key = `${s.id}_${fam.id}`
                  return (
                    <TableCell key={s.id}>
                      <Input
                        name={`charge_${key}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={charges[key] ?? ""}
                        onChange={(e) =>
                          setCharges((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="h-9"
                      />
                    </TableCell>
                  )
                })}
                {equal.map((s) => (
                  <TableCell
                    key={s.id}
                    className="text-right font-medium tabular-nums"
                  >
                    {soles.format(equalShares.get(`${s.id}_${fam.id}`) ?? 0)}
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
        {equal.length > 0
          ? " Las columnas en partes iguales se calculan solas a partir del total."
          : ""}
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
