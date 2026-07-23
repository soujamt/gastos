import type { NextConfig } from "next"

/**
 * Cabeceras de seguridad aplicadas a toda la app.
 *
 * No se define Content-Security-Policy: Next inyecta estilos y scripts en
 * línea, y una CSP mal calibrada rompe la aplicación en producción. Conviene
 * añadirla después, midiendo antes en modo `Report-Only`.
 */
const securityHeaders = [
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
