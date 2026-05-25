import type { Rol } from "@/types";

export type E2eDemoRole = "ADMIN" | "ARRENDADOR" | "ARRENDATARIO";

/** Perfiles alineados con `data/mock/seed-profiles.ts` para sesión sin Firebase. */
export const E2E_DEMO_USERS: Record<
  E2eDemoRole,
  {
    userId: string;
    email: string;
    displayName: string;
    firebaseUid: string;
    roles: Rol[];
    rolActivo: Rol;
  }
> = {
  ADMIN: {
    userId: "u-admin",
    email: "admin@demo.edu",
    displayName: "Ana Administradora",
    firebaseUid: "seed-firebase-admin",
    roles: ["ADMIN"],
    rolActivo: "ADMIN",
  },
  ARRENDADOR: {
    userId: "u-arrendador",
    email: "arrendador@demo.edu",
    displayName: "Carlos Arrendador",
    firebaseUid: "seed-firebase-arrendador",
    roles: ["ARRENDADOR"],
    rolActivo: "ARRENDADOR",
  },
  ARRENDATARIO: {
    userId: "u-arrendatario",
    email: "arrendatario@demo.edu",
    displayName: "María Arrendataria",
    firebaseUid: "seed-firebase-arrendatario",
    roles: ["ARRENDATARIO"],
    rolActivo: "ARRENDATARIO",
  },
};
