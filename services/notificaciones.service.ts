import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { getNotificacionesRepository } from "@/repositories";
import type { CreateInput, Notificacion, Rol } from "@/types";

export function filtroNotificacionesPorRol(
  items: Notificacion[],
  rol: Rol,
  usuarioEmail: string
): Notificacion[] {
  if (rol === "ADMIN") return items;
  return items.filter(
    (n) =>
      n.destinatarioEmail === usuarioEmail ||
      n.rolDestinatario === rol
  );
}

export async function listarNotificaciones() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "notificaciones");
  const items = await getNotificacionesRepository().findAll();
  return filtroNotificacionesPorRol(
    items.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
    usuario.rol,
    usuario.email
  );
}

type NotificacionInput = Omit<Notificacion, "id" | "estado" | "fechaCreacion"> &
  Partial<Pick<Notificacion, "estado" | "fechaCreacion" | "contratoId" | "fechaEnvioSimulado">>;

export async function registrarNotificacion(data: NotificacionInput) {
  return getNotificacionesRepository().create({
    ...data,
    estado: data.estado ?? "PENDIENTE",
    fechaCreacion: data.fechaCreacion ?? new Date().toISOString().slice(0, 10),
  } as CreateInput<Notificacion>);
}

export async function simularEnvioNotificacion(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "notificaciones");
  const now = new Date().toISOString();
  return getNotificacionesRepository().update(id, {
    estado: "SIMULADA",
    fechaEnvioSimulado: now,
  });
}

export async function crearNotificacionReajusteCanon(params: {
  contratoId: string;
  contratoCode: string;
  canonAnterior: number;
  canonActual: number;
  porcentaje: number;
  arrendador: { nombre: string; email: string };
  arrendatario: { nombre: string; email: string };
}) {
  const base = `Reajuste del ${params.porcentaje}% aplicado al contrato ${params.contratoCode}. Canon: ${params.canonAnterior} → ${params.canonActual}.`;
  await Promise.all([
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "REAJUSTE_CANON",
      destinatarioNombre: params.arrendador.nombre,
      destinatarioEmail: params.arrendador.email,
      rolDestinatario: "ARRENDADOR",
      asunto: `Reajuste de canon — ${params.contratoCode}`,
      mensaje: base,
      referenciaModulo: "Contratos",
    }),
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "REAJUSTE_CANON",
      destinatarioNombre: params.arrendatario.nombre,
      destinatarioEmail: params.arrendatario.email,
      rolDestinatario: "ARRENDATARIO",
      asunto: `Reajuste de canon — ${params.contratoCode}`,
      mensaje: base,
      referenciaModulo: "Contratos",
    }),
  ]);
}

export async function crearNotificacionesNoRenovacion(params: {
  contratoId: string;
  solicitudCode: string;
  arrendadorEmail: string;
  arrendatarioEmail: string;
  arrendadorNombre: string;
  arrendatarioNombre: string;
}) {
  const mensaje = `Notificación simulada de no renovación (${params.solicitudCode}).`;
  await Promise.all([
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "NO_RENOVACION",
      destinatarioNombre: params.arrendadorNombre,
      destinatarioEmail: params.arrendadorEmail,
      rolDestinatario: "ARRENDADOR",
      asunto: `Aviso de no renovación — ${params.solicitudCode}`,
      mensaje,
      referenciaModulo: "No renovación",
    }),
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "NO_RENOVACION",
      destinatarioNombre: params.arrendatarioNombre,
      destinatarioEmail: params.arrendatarioEmail,
      rolDestinatario: "ARRENDATARIO",
      asunto: `Aviso de no renovación — ${params.solicitudCode}`,
      mensaje,
      referenciaModulo: "No renovación",
    }),
  ]);
}
