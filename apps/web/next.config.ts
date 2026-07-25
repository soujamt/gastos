import type { NextConfig } from "next"

/**
 * Política de contenido en modo medición.
 *
 * Va en `Report-Only` a propósito: el navegador informa lo que se violaría
 * pero no bloquea nada, así se puede afinar sin tumbar la app. Next inyecta
 * estilos y scripts en línea, de ahí los 'unsafe-inline'. Cuando la consola
 * deje de reportar violaciones durante un tiempo, se puede pasar a la
 * cabecera real cambiando el nombre a "Content-Security-Policy".
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' solo hace falta en desarrollo (recarga en caliente).
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  // next/font descarga las fuentes en el build y las sirve desde el propio dominio.
  "font-src 'self' data:",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

/**
 * Cabeceras de seguridad aplicadas a toda la app.
 */
const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  // Impide que la app se embeba en un iframe (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Impide que el navegador adivine el tipo de contenido.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtra la ruta completa al navegar a otros sitios.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La app no usa estos permisos: se niegan explícitamente.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Obliga HTTPS en visitas posteriores (Vercel ya sirve por HTTPS).
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
]

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  // No anunciar la tecnología del servidor.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
