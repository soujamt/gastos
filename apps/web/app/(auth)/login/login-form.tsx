"use client"

import { useActionState } from "react"
import { RiWallet3Line } from "@remixicon/react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { login } from "../actions"

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, undefined)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center gap-3 text-center">
        <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
          <RiWallet3Line className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Control de gastos</CardTitle>
          <CardDescription>Ingresa con tu correo y contraseña</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
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
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending ? "Ingresando…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
