"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { DialogClose } from "@workspace/ui/components/dialog"
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
  modal = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial?: Initial
  submitLabel: string
  modal?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const now = new Date()

  const form = (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="month">Mes</Label>
          <Select
            id="month"
            name="month"
            defaultValue={initial?.month ?? now.getMonth() + 1}
            autoFocus={modal}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="days">Días facturados</Label>
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
          <Label htmlFor="status">Estado inicial</Label>
          <Select
            id="status"
            name="status"
            defaultValue={initial?.status ?? PeriodStatus.OPEN}
          >
            {Object.values(PeriodStatus).map((status) => (
              <option key={status} value={status}>
                {periodStatusLabels[status]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-primary/10 bg-primary/6 p-3.5">
        <p className="text-sm font-medium">Consejo</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Mantén el período abierto mientras registras consumos y pagos. Podrás
          cerrarlo cuando todo esté conciliado.
        </p>
      </div>

      {state?.error ? (
        <p
          className="rounded-xl bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="mt-1 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        {modal ? (
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </DialogClose>
        ) : (
          <Link
            href="/periodos"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  )

  return modal ? (
    form
  ) : (
    <Card className="max-w-xl">
      <CardContent>{form}</CardContent>
    </Card>
  )
}
