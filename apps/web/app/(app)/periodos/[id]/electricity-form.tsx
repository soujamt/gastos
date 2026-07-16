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

  function setReading(id: number, field: "previous" | "current", value: string) {
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

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="serviceId" value={serviceId} />

      <div className="grid gap-3 sm:grid-cols-3">
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

      <div className="rounded-lg border">
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
                      className="h-8"
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
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {share?.kwh ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
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
                  <span className="text-muted-foreground ml-2 text-xs">
                    (resto)
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs" colSpan={2}>
                  Consumo restante del medidor
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {restoConsumption}
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">
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

      <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          Total kWh: <span className="text-foreground">{totalKwh}</span>
        </span>
        <span>
          Suma repartida:{" "}
          <span className="text-foreground">
            {soles.format(shares.reduce((s, x) => s + x.amount, 0))}
          </span>
        </span>
      </div>

      {resto && !num(totalMeterKwh) ? (
        <p className="text-muted-foreground text-sm">
          Ingresa el consumo total del medidor para repartir el consumo de{" "}
          {nameById.get(resto.id)}.
        </p>
      ) : null}

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Cargos guardados correctamente.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Calcular y guardar cargos"}
        </Button>
      </div>
    </form>
  )
}
