import { cookies } from "next/headers"

export type Flash = {
  id: string
  type: "success" | "error"
  message: string
  description?: string
}

export const FLASH_COOKIE = "gastosfam-flash"

/**
 * Deja un aviso para la próxima pantalla. Las acciones que redirigen, borran o
 * cambian un estado no vuelven al formulario, así que el aviso viaja en una
 * cookie corta: el layout la lee y el cliente la muestra como toast y la borra.
 */
export async function flash(
  type: Flash["type"],
  message: string,
  description?: string
) {
  const value: Flash = { id: crypto.randomUUID(), type, message, description }
  ;(await cookies()).set(
    FLASH_COOKIE,
    encodeURIComponent(JSON.stringify(value)),
    {
      path: "/",
      maxAge: 60,
      sameSite: "lax",
      // Solo lleva el texto de un aviso. El cliente la borra en cuanto lo muestra.
      httpOnly: false,
    }
  )
}

export async function readFlash(): Promise<Flash | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw)) as Flash
  } catch {
    return null
  }
}
