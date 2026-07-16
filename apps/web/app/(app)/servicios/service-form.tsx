"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { DialogClose } from "@workspace/ui/components/dialog"
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
  modal = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial?: Initial
  submitLabel: string
  modal?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  const form = (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre del servicio</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name}
          placeholder="Ej. Energía eléctrica"
          autoFocus={modal}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Forma de reparto</Label>
          <Select
            id="type"
            name="type"
            defaultValue={initial?.type ?? ServiceType.FIXED}
          >
            {Object.values(ServiceType).map((type) => (
              <option key={type} value={type}>
                {serviceTypeLabels[type]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="unit">Unidad</Label>
          <Input
            id="unit"
            name="unit"
            defaultValue={initial?.unit ?? ""}
            placeholder="kWh, m³…"
          />
        </div>
      </div>
      <p className="-mt-2 text-xs leading-5 text-muted-foreground">
        La forma de reparto determina cómo se calcula el cargo de cada familia.
      </p>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="size-4 accent-primary"
        />
        <span>
          <span className="font-medium">Servicio activo</span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            disponible en nuevos períodos
          </span>
        </span>
      </label>

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
            href="/servicios"
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
