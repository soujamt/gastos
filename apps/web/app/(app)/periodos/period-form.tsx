"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { PeriodStatus } from "@/lib/generated/prisma/enums"
import { monthLabels, periodStatusLabels } from "@/lib/labels"

import type { FormState } from "./actions"

type Initial = {
  year: number
  month: number
  days: number
  status: string
}

export function PeriodForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial?: Initial
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const now = new Date()

  return (
    <Card className="max-w-lg">
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="month">Mes</Label>
              <Select
                id="month"
                name="month"
                defaultValue={initial?.month ?? now.getMonth() + 1}
              >
                {monthLabels.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min={2000}
                max={2100}
                defaultValue={initial?.year ?? now.getFullYear()}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="days">Días del período</Label>
              <Input
                id="days"
                name="days"
                type="number"
                min={1}
                max={31}
                defaultValue={initial?.days ?? 30}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                id="status"
                name="status"
                defaultValue={initial?.status ?? PeriodStatus.OPEN}
              >
                {Object.values(PeriodStatus).map((s) => (
                  <option key={s} value={s}>
                    {periodStatusLabels[s]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {state?.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="mt-1 flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : submitLabel}
            </Button>
            <Link
              href="/periodos"
              className={buttonVariants({ variant: "outline" })}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
