"use client"

import { useActionState, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { computeShares, restoKwh } from "@/lib/prorrateo"

import type { ElectricityState, saveElectricity } from "../actions"

type FamilyRow = { id: number; name: string; hasSubmeter: boolean }

type ReadingState = Record<number, { previous: string; current: string }>

export type ElectricityInitial = {
  totalAmount: string
  totalMeterKwh: string
  meterPrev: string
  meterCurr: string
  issueDate: string
  readings: ReadingState
}

function num(value: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
})

export function ElectricityForm({
  action,
  serviceId,
  families,
  initial,
}: {
  action: (
    prev: ElectricityState,
    formData: FormData
  ) => ReturnType<typeof saveElectricity>
  serviceId: number
  families: FamilyRow[]
  initial: ElectricityInitial
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  const submetered = families.filter((f) => f.hasSubmeter)
  const resto = families.find((f) => !f.hasSubmeter)

  const [totalAmount, setTotalAmount] = useState(initial.totalAmount)
  const [totalMeterKwh, setTotalMeterKwh] = useState(initial.totalMeterKwh)
  const [readings, setReadings] = useState<ReadingState>(initial.readings)

  function setReading(
    id: number,
    field: "previous" | "current",
    value: string
  ) {
    setReadings((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { previous: "", current: "" }), [field]: value },
    }))
  }

  const submeteredKwh = submetered.reduce((sum, f) => {
    const r = readings[f.id] ?? { previous: "", current: "" }
    return sum + Math.max(0, num(r.current) - num(r.previous))
  }, 0)

  const restoConsumption = resto
    ? restoKwh(num(totalMeterKwh), submeteredKwh)
    : 0

  const shareInput = [
    ...submetered.map((f) => {
      const r = readings[f.id] ?? { previous: "", current: "" }
      return { id: f.id, kwh: Math.max(0, num(r.current) - num(r.previous)) }
    }),
    ...(resto ? [{ id: resto.id, kwh: restoConsumption }] : []),
  ]

  const { totalKwh, shares } = computeShares(num(totalAmount), shareInput)
  const shareById = new Map(shares.map((s) => [s.id, s]))
  const nameById = new Map(families.map((f) => [f.id, f.name]))

  // Los montos se redondean a soles enteros, así que lo repartido puede diferir
  // unos céntimos del recibo. Se muestra en vez de esconderlo.
  const repartido = shares.reduce((sum, s) => sum + s.amount, 0)
  const roundingDiff = num(totalAmount)
    ? Number((repartido - num(totalAmount)).toFixed(2))
    : 0

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <input type="hidden" name="serviceId" value={serviceId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="totalAmount">Recibo total (S/)</Label>
          <Input
            id="totalAmount"
            name="totalAmount"
            type="number"
            step="0.01"
            min="0"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="totalMeterKwh">Consumo total medidor (kWh)</Label>
          <Input
            id="totalMeterKwh"
            name="totalMeterKwh"
            type="number"
            min="0"
            value={totalMeterKwh}
            onChange={(e) => setTotalMeterKwh(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="issueDate">Fecha del recibo</Label>
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            defaultValue={initial.issueDate}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Familia</TableHead>
              <TableHead className="w-28">Lect. anterior</TableHead>
              <TableHead className="w-28">Lect. actual</TableHead>
              <TableHead className="w-20 text-right">kWh</TableHead>
              <TableHead className="w-16 text-right">%</TableHead>
              <TableHead className="w-28 text-right">A pagar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submetered.map((fam) => {
              const r = readings[fam.id] ?? { previous: "", current: "" }
              const share = shareById.get(fam.id)
              return (
                <TableRow key={fam.id}>
                  <TableCell className="font-medium">{fam.name}</TableCell>
                  <TableCell>
                    <Input
                      name={`prev_${fam.id}`}
                      type="number"
                      min="0"
                      value={r.previous}
                      onChange={(e) =>
                        setReading(fam.id, "previous", e.target.value)
                      }
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      name={`curr_${fam.id}`}
                      type="number"
                      min="0"
                      value={r.current}
                      onChange={(e) =>
                        setReading(fam.id, "current", e.target.value)
                      }
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {share?.kwh ?? 0}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {share ? (share.percentage * 100).toFixed(1) : "0.0"}%
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {soles.format(share?.amount ?? 0)}
                  </TableCell>
                </TableRow>
              )
            })}

            {resto ? (
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">
                  {resto.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    (resto)
                  </span>
                </TableCell>
                <TableCell
                  className="text-xs text-muted-foreground"
                  colSpan={2}
                >
                  Consumo restante del medidor
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {restoConsumption}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {shareById.get(resto.id)
                    ? (shareById.get(resto.id)!.percentage * 100).toFixed(1)
                    : "0.0"}
                  %
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {soles.format(shareById.get(resto.id)?.amount ?? 0)}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-muted/55 px-4 py-3 text-sm text-muted-foreground">
        <span>
          Total kWh:{" "}
          <span className="font-semibold text-foreground">{totalKwh}</span>
        </span>
        <span>
          Suma repartida:{" "}
          <span className="font-semibold text-foreground">
            {soles.format(repartido)}
          </span>
        </span>
        {roundingDiff !== 0 ? (
          <span>
            Ajuste por redondeo:{" "}
            <span className="font-semibold text-foreground">
              {roundingDiff > 0 ? "+" : "−"}
              {soles.format(Math.abs(roundingDiff))}
            </span>
          </span>
        ) : null}
      </div>

      {resto && !num(totalMeterKwh) ? (
        <p className="text-sm text-muted-foreground">
          Ingresa el consumo total del medidor para repartir el consumo de{" "}
          {nameById.get(resto.id)}.
        </p>
      ) : null}

      {state?.error ? (
        <p
          className="rounded-xl bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Cargos guardados correctamente.
        </p>
      ) : null}

      <div className="flex justify-end border-t pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Calcular y guardar cargos"}
        </Button>
      </div>
    </form>
  )
}
