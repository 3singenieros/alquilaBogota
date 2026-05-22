import type { Rol } from "@/types";

/** Credenciales demo — solo prototipo académico, no usar en producción. */
export const MOCK_CREDENTIALS: Record<
  string,
  { password: string; userId: string; rol: Rol }
> = {
  admin: {
    password: "admin123",
    userId: "u-admin",
    rol: "ADMIN",
  },
  arrendador: {
    password: "arrendador123",
    userId: "u-arrendador",
    rol: "ARRENDADOR",
  },
  arrendatario: {
    password: "arrendatario123",
    userId: "u-arrendatario",
    rol: "ARRENDATARIO",
  },
};
