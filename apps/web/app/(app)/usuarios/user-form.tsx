"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { DialogClose } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { Role } from "@/lib/generated/prisma/enums"
import { roleLabels } from "@/lib/labels"

import type { FormState } from "./actions"

type Initial = {
  email: string
  name: string | null
  role: string
  familyId: number | null
  active: boolean
}

export function UserForm({
  action,
  initial,
  families,
  submitLabel,
  isEdit = false,
  modal = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial?: Initial
  families: { id: number; name: string }[]
  submitLabel: string
  isEdit?: boolean
  modal?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  const form = (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initial?.name ?? ""}
            placeholder="Ej. Ana Silva"
            autoFocus={modal}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initial?.email}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Rol de acceso</Label>
          <Select
            id="role"
            name="role"
            defaultValue={initial?.role ?? Role.FAMILY}
          >
            {Object.values(Role).map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="familyId">Familia vinculada</Label>
          <Select
            id="familyId"
            name="familyId"
            defaultValue={initial?.familyId ?? ""}
          >
            <option value="">Ninguna</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="-mt-2 text-xs leading-5 text-muted-foreground">
        La familia vinculada solo se utiliza para cuentas con rol “Familia”.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">
          {isEdit ? "Nueva contraseña" : "Contraseña temporal"}
          {isEdit ? (
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          ) : null}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={
            isEdit
              ? "Déjala vacía para conservar la actual"
              : "Mínimo 6 caracteres"
          }
          required={!isEdit}
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="size-4 accent-primary"
        />
        <span>
          <span className="font-medium">Acceso habilitado</span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            puede iniciar sesión
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
            href="/usuarios"
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
    <Card className="max-w-2xl">
      <CardContent>{form}</CardContent>
    </Card>
  )
}
