"use client"

import { RiPrinterLine } from "@remixicon/react"

import { Button } from "@workspace/ui/components/button"

export function PrintButton() {
  return (
    <Button type="button" size="sm" onClick={() => window.print()}>
      <RiPrinterLine className="size-4" />
      Imprimir o guardar PDF
    </Button>
  )
}
