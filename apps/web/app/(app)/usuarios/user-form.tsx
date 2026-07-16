"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
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
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial?: Initial
  families: { id: number; name: string }[]
  submitLabel: string
  isEdit?: boolean
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <Card className="max-w-lg">
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Input id="name" name="name" defaultValue={initial?.name ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                id="role"
                name="role"
                defaultValue={initial?.role ?? Role.FAMILY}
              >
                {Object.values(Role).map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="familyId">Familia</Label>
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
          <p className="text-muted-foreground -mt-2 text-xs">
            La familia solo aplica a usuarios con rol “Familia”.
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">
              {isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={isEdit ? "Dejar en blanco para no cambiar" : ""}
              required={!isEdit}
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
              href="/usuarios"
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
