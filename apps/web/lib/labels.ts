import {
  ChargeStatus,
  PaymentMethod,
  PeriodStatus,
  Role,
  ServiceType,
} from "@/lib/generated/prisma/enums"

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  FAMILY: "Familia",
  VIEWER: "Solo lectura",
}

export const serviceTypeLabels: Record<ServiceType, string> = {
  METERED: "Medido (por consumo)",
  FIXED: "Fijo por familia",
  EQUAL: "Partes iguales",
  MANUAL: "Manual",
}

export const periodStatusLabels: Record<PeriodStatus, string> = {
  OPEN: "Abierto",
  CLOSED: "Cerrado",
}

export const chargeStatusLabels: Record<ChargeStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  YAPE: "Yape",
  PLIN: "Plin",
  OTHER: "Otro",
}

export const monthLabels = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]
