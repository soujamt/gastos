"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import type { FormState } from "./actions"

type Initial = {
  name: string
  order: number
  hasSubmeter: boolean
  active: boolean
}

export function FamilyForm({
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
              placeholder="Fam. Silva"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="order">Orden</Label>
            <Input
              id="order"
              name="order"
              type="number"
              min={0}
              defaultValue={initial?.order ?? 0}
            />
            <p className="text-muted-foreground text-xs">
              Define el orden en que aparece en las tablas.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hasSubmeter"
              defaultChecked={initial?.hasSubmeter ?? true}
              className="size-4"
            />
            Tiene sub-medidor
          </label>
          <p className="text-muted-foreground -mt-2 text-xs">
            Desmárcalo para la familia “resto”, que absorbe el consumo restante
            del medidor principal.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={initial?.active ?? true}
              className="size-4"
            />
            Activa
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
              href="/familias"
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
