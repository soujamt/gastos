"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { ServiceType } from "@/lib/generated/prisma/enums"
import { serviceTypeLabels } from "@/lib/labels"

import type { FormState } from "./actions"

type Initial = {
  name: string
  type: string
  unit: string | null
  active: boolean
}

export function ServiceForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial?: Initial
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <Card className="max-w-lg">
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initial?.name}
              placeholder="Luz, Agua, Internet…"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Tipo de reparto</Label>
            <Select
              id="type"
              name="type"
              defaultValue={initial?.type ?? ServiceType.FIXED}
            >
              {Object.values(ServiceType).map((t) => (
                <option key={t} value={t}>
                  {serviceTypeLabels[t]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="unit">Unidad (opcional)</Label>
            <Input
              id="unit"
              name="unit"
              defaultValue={initial?.unit ?? ""}
              placeholder="kWh, m³…"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={initial?.active ?? true}
              className="size-4"
            />
            Activo
          </label>

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
              href="/servicios"
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
