import { redirect } from "next/navigation"
import {
  RiBarChartGroupedLine,
  RiCheckboxCircleLine,
  RiLock2Line,
  RiWallet3Line,
} from "@remixicon/react"

import { auth } from "@/auth"

import { LoginForm } from "./login-form"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    redirect("/")
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -top-44 -left-28 size-[34rem] rounded-full border border-white/[0.06]" />
        <div className="absolute top-28 -left-32 size-96 rounded-full bg-white/[0.025]" />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
            <RiWallet3Line className="size-5" />
          </div>
          <div>
            <div className="font-semibold tracking-[-0.02em]">GastosFam</div>
            <div className="text-xs text-sidebar-foreground/45">
              Finanzas compartidas
            </div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="text-xs font-bold tracking-[0.14em] text-sidebar-primary uppercase">
            Claridad para todos
          </p>
          <h1 className="mt-4 text-4xl leading-[1.08] font-semibold tracking-[-0.045em] xl:text-5xl">
            Cada consumo claro.
            <br />
            Cada pago en orden.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-sidebar-foreground/60">
            Centraliza recibos, lecturas y abonos en un solo lugar para que el
            reparto familiar sea transparente y fácil de gestionar.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <RiBarChartGroupedLine className="size-5 text-sidebar-primary" />
              <p className="mt-3 text-sm font-medium">Cálculos confiables</p>
              <p className="mt-1 text-xs leading-5 text-sidebar-foreground/45">
                Prorrateos y saldos siempre visibles.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <RiCheckboxCircleLine className="size-5 text-sidebar-primary" />
              <p className="mt-3 text-sm font-medium">Control mensual</p>
              <p className="mt-1 text-xs leading-5 text-sidebar-foreground/45">
                Del recibo al pago, sin perder contexto.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-sidebar-foreground/35">
          <RiLock2Line className="size-4" />
          Acceso privado y protegido
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <RiWallet3Line className="size-4" />
          </div>
          <span className="text-sm font-semibold">GastosFam</span>
        </div>
        <LoginForm />
      </section>
    </div>
  )
}
