import { AuthError } from "@/lib/auth/errors";
import {
  filterInmueblesSinContratoActivo,
  inmuebleTieneContratoActivo,
} from "@/lib/contrato-inmueble";
import { BusinessRuleError } from "@/lib/errors";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  canAccessContrato,
  filterContratos,
} from "@/lib/auth/scopes";
import { buildContratoCreateInput, calcularCanonReajustado } from "@/lib/contrato-form";
import {
  getContratosRepository,
  getInvitacionesContratoRepository,
  getUsuariosRepository,
} from "@/repositories";
import { registrarNotificacion } from "@/services/notificaciones.service";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import { crearNotificacionReajusteCanon } from "@/services/notificaciones.service";
import type { Contrato, CreateInput, EstadoContrato, UpdateInput } from "@/types";

function generarTokenInvitacion(): string {
  return `inv-${crypto.randomUUID()}`;
}

async function assertUnSoloContratoActivoPorInmueble(
  inmuebleId: string,
  estado: EstadoContrato,
  excludeContratoId?: string
) {
  if (estado !== "CONFIRMADO" && estado !== "PENDIENTE_CONFIRMACION") return;
  const contratos = await getContratosRepository().findAll();
  if (inmuebleTieneContratoActivo(contratos, inmuebleId, excludeContratoId)) {
    throw new BusinessRuleError(
      "Este inmueble ya tiene un contrato activo. Cambia el estado del contrato actual o elige otro inmueble."
    );
  }
}

export async function listarContratos() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  const items = await getContratosRepository().findAll();
  return filterContratos(items, usuario);
}

/** Contratos visibles para formularios de pagos o no renovación sin abrir el módulo Contratos. */
export async function listarContratosReferencia() {
  const { usuario } = await requireSession();
  const items = await getContratosRepository().findAll();
  return filterContratos(items, usuario);
}

/** Inmuebles elegibles en el formulario de contrato (sin otro contrato ACTIVO). */
export async function listarInmueblesParaContrato(contratoIdExcluir?: string) {
  await requireSession();
  const [inmuebles, contratos] = await Promise.all([
    listarInmueblesReferencia(),
    listarContratosReferencia(),
  ]);
  return filterInmueblesSinContratoActivo(inmuebles, contratos, contratoIdExcluir);
}

export async function crearContrato(data: CreateInput<Contrato>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  if (usuario.rol === "ARRENDADOR") {
    data = { ...data, arrendadorId: usuario.id };
  }
  if (usuario.rol !== "ADMIN" && usuario.rol !== "ARRENDADOR") {
    throw new AuthError("No puedes crear contratos", "FORBIDDEN");
  }
  const emailArrendatario = (data.emailArrendatario ?? "").trim().toLowerCase();
  if (!emailArrendatario) {
    throw new BusinessRuleError("El email del arrendatario es obligatorio.");
  }

  const payload = buildContratoCreateInput({
    ...data,
    emailArrendatario,
    arrendatarioId: data.arrendatarioId || "",
    estado: "PENDIENTE_CONFIRMACION",
  });

  await assertUnSoloContratoActivoPorInmueble(
    payload.inmuebleId,
    "PENDIENTE_CONFIRMACION"
  );

  const contrato = await getContratosRepository().create(payload);

  await getInvitacionesContratoRepository().create({
    contratoId: contrato.id,
    emailInvitado: emailArrendatario,
    nombreInvitado: data.nombreArrendatario,
    estado: "PENDIENTE",
    tokenInvitacion: generarTokenInvitacion(),
    fechaCreacion: new Date().toISOString().slice(0, 10),
  });

  const arrendador = (await getUsuariosRepository().findAll()).find(
    (u) => u.id === contrato.arrendadorId
  );

  await registrarNotificacion({
    tipo: "INVITACION_CONTRATO",
    contratoId: contrato.id,
    destinatarioNombre: data.nombreArrendatario ?? emailArrendatario,
    destinatarioEmail: emailArrendatario,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Invitación a contrato ${contrato.code}`,
    mensaje: `El arrendador ${arrendador?.nombre ?? ""} te invitó a revisar un contrato de arrendamiento.`,
    referenciaModulo: "Solicitudes contrato",
  });

  return contrato;
}

export async function aplicarReajusteCanon(contratoId: string, porcentaje: number) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  if (porcentaje <= 0 || porcentaje > 100) {
    throw new BusinessRuleError("El porcentaje de reajuste debe estar entre 0 y 100.");
  }
  const existing = await getContratosRepository().findById(contratoId);
  if (!existing || !canAccessContrato(existing, usuario)) {
    throw new AuthError("Contrato no encontrado o sin permiso", "FORBIDDEN");
  }
  if (existing.estado !== "CONFIRMADO") {
    throw new BusinessRuleError("Solo se puede reajustar un contrato confirmado.");
  }
  const canonAnterior = existing.canonActual;
  const canonActual = calcularCanonReajustado(canonAnterior, porcentaje);
  const fechaUltimoReajuste = new Date().toISOString().slice(0, 10);
  const updated = await getContratosRepository().update(contratoId, {
    canonAnterior,
    canonActual,
    porcentajeReajuste: porcentaje,
    fechaUltimoReajuste,
  });
  if (!updated) return null;

  const usuarios = await getUsuariosRepository().findAll();
  const arrendador = usuarios.find((u) => u.id === updated.arrendadorId);
  const arrendatario = usuarios.find((u) => u.id === updated.arrendatarioId);
  if (arrendador && arrendatario) {
    await crearNotificacionReajusteCanon({
      contratoId: updated.id,
      contratoCode: updated.code,
      canonAnterior,
      canonActual,
      porcentaje,
      arrendador: { nombre: arrendador.nombre, email: arrendador.email },
      arrendatario: { nombre: arrendatario.nombre, email: arrendatario.email },
    });
  }
  return updated;
}

export async function actualizarContrato(id: string, data: UpdateInput<Contrato>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  const existing = await getContratosRepository().findById(id);
  if (!existing || !canAccessContrato(existing, usuario)) {
    throw new AuthError("Contrato no encontrado o sin permiso", "FORBIDDEN");
  }
  if (usuario.rol === "ARRENDADOR") {
    data = { ...data, arrendadorId: usuario.id };
  }
  const finalEstado = data.estado ?? existing.estado;
  const finalInmuebleId = data.inmuebleId ?? existing.inmuebleId;
  if (finalEstado === "CONFIRMADO" || finalEstado === "PENDIENTE_CONFIRMACION") {
    await assertUnSoloContratoActivoPorInmueble(finalInmuebleId, finalEstado, id);
  }
  return getContratosRepository().update(id, data);
}

export async function eliminarContrato(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "contratos");
  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("No puedes eliminar contratos", "FORBIDDEN");
  }
  const existing = await getContratosRepository().findById(id);
  if (!existing || !canAccessContrato(existing, usuario)) {
    throw new AuthError("Contrato no encontrado o sin permiso", "FORBIDDEN");
  }
  return getContratosRepository().delete(id);
}
