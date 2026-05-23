import { getSession } from "@/services/auth.service";
import type { RolAuditoria } from "@/types/trazabilidad";
import type { Usuario } from "@/types";

export type AuditActor = {
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRol: RolAuditoria;
};

export const SYSTEM_ACTOR: AuditActor = {
  usuarioId: "system",
  usuarioNombre: "Sistema",
  usuarioEmail: "system@app.local",
  usuarioRol: "SISTEMA",
};

export function auditActorFromUsuario(usuario: Usuario): AuditActor {
  const rol = (usuario.rolActivo ?? usuario.rol) as RolAuditoria;
  return {
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre,
    usuarioEmail: usuario.email,
    usuarioRol: rol,
  };
}

export async function getAuditActor(): Promise<AuditActor> {
  const session = await getSession();
  if (session?.usuario) {
    return auditActorFromUsuario(session.usuario);
  }
  return SYSTEM_ACTOR;
}
