import type { DefaultSession } from "next-auth"

import type { Role } from "@/lib/generated/prisma/enums"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      familyId: number | null
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    familyId: number | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    familyId: number | null
  }
}
