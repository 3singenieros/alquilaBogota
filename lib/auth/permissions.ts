import type { Rol } from "@/types";

export type AppModule =
  | "dashboard"
  | "inmuebles"
  | "contratos"
  | "pagos"
  | "servicios"
  | "mantenimiento"
  | "no-renovacion"
  | "notificaciones"
  | "solicitudes-contrato"
  | "usuarios";

export type ModulePermissions = {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

const MODULE_ACCESS: Record<AppModule, Rol[]> = {
  dashboard: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"],
  inmuebles: ["ADMIN", "ARRENDADOR"],
  contratos: ["ADMIN", "ARRENDADOR"],
  pagos: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"],
  servicios: ["ADMIN", "ARRENDADOR"],
  mantenimiento: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"],
  "no-renovacion": ["ADMIN", "ARRENDADOR", "ARRENDATARIO"],
  notificaciones: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"],
  "solicitudes-contrato": ["ADMIN", "ARRENDATARIO"],
  usuarios: ["ADMIN"],
};

const PATH_MODULE: Record<string, AppModule> = {
  "/": "dashboard",
  "/inmuebles": "inmuebles",
  "/contratos": "contratos",
  "/pagos": "pagos",
  "/servicios": "servicios",
  "/mantenimiento": "mantenimiento",
  "/no-renovacion": "no-renovacion",
  "/notificaciones": "notificaciones",
  "/solicitudes-contrato": "solicitudes-contrato",
  "/usuarios": "usuarios",
};

export const NAV_ITEMS: {
  href: string;
  label: string;
  module: AppModule;
  roles: Rol[];
}[] = [
  { href: "/", label: "Dashboard", module: "dashboard", roles: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"] },
  { href: "/inmuebles", label: "Inmuebles", module: "inmuebles", roles: ["ADMIN", "ARRENDADOR"] },
  { href: "/contratos", label: "Contratos", module: "contratos", roles: ["ADMIN", "ARRENDADOR"] },
  { href: "/pagos", label: "Pagos reportados", module: "pagos", roles: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"] },
  { href: "/servicios", label: "Servicios públicos", module: "servicios", roles: ["ADMIN", "ARRENDADOR"] },
  { href: "/mantenimiento", label: "Mantenimiento", module: "mantenimiento", roles: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"] },
  { href: "/no-renovacion", label: "No renovación", module: "no-renovacion", roles: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"] },
  { href: "/notificaciones", label: "Notificaciones", module: "notificaciones", roles: ["ADMIN", "ARRENDADOR", "ARRENDATARIO"] },
  { href: "/solicitudes-contrato", label: "Solicitudes contrato", module: "solicitudes-contrato", roles: ["ADMIN", "ARRENDATARIO"] },
  { href: "/usuarios", label: "Usuarios y roles", module: "usuarios", roles: ["ADMIN"] },
];

export function canAccessModule(rol: Rol, module: AppModule): boolean {
  return MODULE_ACCESS[module].includes(rol);
}

export function canAccessPath(rol: Rol, pathname: string): boolean {
  if (pathname === "/sin-acceso") return true;
  const module = PATH_MODULE[pathname];
  if (!module) return false;
  return canAccessModule(rol, module);
}

export function getModulePermissions(rol: Rol, module: AppModule): ModulePermissions {
  if (!canAccessModule(rol, module)) {
    return { canCreate: false, canEdit: false, canDelete: false };
  }

  if (rol === "ADMIN") {
    return { canCreate: true, canEdit: true, canDelete: true };
  }

  if (rol === "ARRENDADOR") {
    return {
      canCreate: module !== "usuarios",
      canEdit: true,
      canDelete: module !== "usuarios" && module !== "no-renovacion",
    };
  }

  // ARRENDATARIO
  return {
    canCreate: ["pagos", "mantenimiento", "no-renovacion"].includes(module),
    canEdit:
      module === "mantenimiento" ||
      module === "no-renovacion" ||
      module === "solicitudes-contrato",
    canDelete: false,
  };
}
