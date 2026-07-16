"use client"

import { useActionState } from "react"
import { RiArrowRightLine } from "@remixicon/react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { login } from "../actions"

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, undefined)

  return (
    <div className="w-full max-w-md">
      <div>
        <p className="text-[11px] font-bold tracking-[0.13em] text-primary uppercase">
          Bienvenido de nuevo
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
          Ingresa a tu cuenta
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Usa tus credenciales para continuar al panel de administración.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-5 shadow-[0_18px_50px_rgba(20,45,40,0.07)] sm:p-7">
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@ejemplo.com"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? (
            <p
              className="rounded-xl bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            className="mt-1 w-full"
            size="lg"
          >
            {pending ? "Ingresando…" : "Ingresar"}
            {!pending ? <RiArrowRightLine /> : null}
          </Button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Tu sesión está protegida y es exclusiva para usuarios autorizados.
      </p>
    </div>
  )
}
