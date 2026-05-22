import type { Rol, Usuario } from "@/types";

export const MOCK_USERS: Record<Rol, Usuario> = {
  ADMIN: {
    id: "u-admin",
    nombre: "Ana Administradora",
    email: "admin@demo.edu",
    rol: "ADMIN",
    telefono: "3001110001",
    activo: true,
    creadoEn: "2025-01-10",
  },
  ARRENDADOR: {
    id: "u-arrendador",
    nombre: "Carlos Arrendador",
    email: "arrendador@demo.edu",
    rol: "ARRENDADOR",
    telefono: "3001110002",
    activo: true,
    creadoEn: "2025-01-10",
  },
  ARRENDATARIO: {
    id: "u-arrendatario",
    nombre: "María Arrendataria",
    email: "arrendatario@demo.edu",
    rol: "ARRENDATARIO",
    telefono: "3001110003",
    activo: true,
    creadoEn: "2025-02-01",
  },
};

export function getMockCurrentUser(rol: Rol = "ADMIN"): Usuario {
  return MOCK_USERS[rol];
}
