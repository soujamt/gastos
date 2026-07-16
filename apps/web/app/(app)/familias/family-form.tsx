"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { DialogClose } from "@workspace/ui/components/dialog"
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
        <Label htmlFor="name">Nombre de la familia</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name}
          placeholder="Ej. Familia Silva"
          autoFocus={modal}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="order">Orden de visualización</Label>
        <Input
          id="order"
          name="order"
          type="number"
          min={0}
          defaultValue={initial?.order ?? 0}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          Los números más bajos aparecen primero en tablas y repartos.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-transparent bg-muted/55 p-3.5 text-sm transition-colors hover:bg-muted">
        <input
          type="checkbox"
          name="hasSubmeter"
          defaultChecked={initial?.hasSubmeter ?? true}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          <span className="block font-medium">Tiene sub-medidor</span>
          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
            Registra sus propias lecturas. Desmárcalo para la familia que
            absorbe el consumo restante del medidor principal.
          </span>
        </span>
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="size-4 accent-primary"
        />
        <span>
          <span className="font-medium">Familia activa</span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            visible en nuevos períodos
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
            href="/familias"
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
