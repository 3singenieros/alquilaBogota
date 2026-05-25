import { isMockMode } from "@/config/app-mode";
import {
  contratosMockRepository,
  contratosSupabaseRepository,
  type ContratosRepository,
} from "@/repositories/contratos.repository";
import {
  inmueblesMockRepository,
  inmueblesSupabaseRepository,
  type InmueblesRepository,
} from "@/repositories/inmuebles.repository";
import {
  mantenimientoMockRepository,
  mantenimientoSupabaseRepository,
  type MantenimientoRepository,
} from "@/repositories/mantenimiento.repository";
import {
  comentariosMantenimientoMockRepository,
  comentariosMantenimientoSupabaseRepository,
  type ComentariosMantenimientoRepository,
} from "@/repositories/comentarios-mantenimiento.repository";
import {
  noRenovacionMockRepository,
  noRenovacionSupabaseRepository,
  type NoRenovacionRepository,
} from "@/repositories/no-renovacion.repository";
import {
  pagosMockRepository,
  pagosSupabaseRepository,
  type PagosRepository,
} from "@/repositories/pagos.repository";
import {
  serviciosContratoMockRepository,
  serviciosContratoSupabaseRepository,
  type ServiciosContratoRepository,
} from "@/repositories/servicios-contrato.repository";
import {
  pagosServicioMockRepository,
  pagosServicioSupabaseRepository,
  type PagosServicioRepository,
} from "@/repositories/pagos-servicio.repository";
import {
  notificacionesMockRepository,
  notificacionesSupabaseRepository,
  type NotificacionesRepository,
} from "@/repositories/notificaciones.repository";
import {
  invitacionesContratoMockRepository,
  invitacionesContratoSupabaseRepository,
  type InvitacionesContratoRepository,
} from "@/repositories/invitaciones-contrato.repository";
import {
  usuariosMockRepository,
  usuariosSupabaseRepository,
  type UsuariosRepository,
} from "@/repositories/usuarios.repository";
import {
  profileMockRepository,
  profileSupabaseRepository,
  type ProfileRepository,
} from "@/repositories/profile.repository";
import {
  soportePagoMockRepository,
  soportePagoSupabaseRepository,
  type SoportePagoRepository,
} from "@/repositories/soporte-pago.repository";
import {
  fileMockRepository,
  fileSupabaseRepository,
  type FileRepository,
} from "@/repositories/file.repository";
import {
  trazabilidadMockRepository,
  trazabilidadSupabaseRepository,
  type TrazabilidadRepository,
} from "@/repositories/trazabilidad.repository";

function pick<T>(mock: T, supabase: T): T {
  return isMockMode() ? mock : supabase;
}

export function getInmueblesRepository(): InmueblesRepository {
  return pick(inmueblesMockRepository, inmueblesSupabaseRepository);
}

export function getContratosRepository(): ContratosRepository {
  return pick(contratosMockRepository, contratosSupabaseRepository);
}

export function getPagosRepository(): PagosRepository {
  return pick(pagosMockRepository, pagosSupabaseRepository);
}

export function getServiciosContratoRepository(): ServiciosContratoRepository {
  return pick(serviciosContratoMockRepository, serviciosContratoSupabaseRepository);
}

export function getPagosServicioRepository(): PagosServicioRepository {
  return pick(pagosServicioMockRepository, pagosServicioSupabaseRepository);
}

export function getMantenimientoRepository(): MantenimientoRepository {
  return pick(mantenimientoMockRepository, mantenimientoSupabaseRepository);
}

export function getComentariosMantenimientoRepository(): ComentariosMantenimientoRepository {
  return pick(
    comentariosMantenimientoMockRepository,
    comentariosMantenimientoSupabaseRepository
  );
}

export function getNoRenovacionRepository(): NoRenovacionRepository {
  return pick(noRenovacionMockRepository, noRenovacionSupabaseRepository);
}

export function getUsuariosRepository(): UsuariosRepository {
  return pick(usuariosMockRepository, usuariosSupabaseRepository);
}

export function getNotificacionesRepository(): NotificacionesRepository {
  return pick(notificacionesMockRepository, notificacionesSupabaseRepository);
}

export function getInvitacionesContratoRepository(): InvitacionesContratoRepository {
  return pick(invitacionesContratoMockRepository, invitacionesContratoSupabaseRepository);
}

export function getProfileRepository(): ProfileRepository {
  return pick(profileMockRepository, profileSupabaseRepository);
}

export function getSoportePagoRepository(): SoportePagoRepository {
  return pick(soportePagoMockRepository, soportePagoSupabaseRepository);
}

export function getTrazabilidadRepository(): TrazabilidadRepository {
  return pick(trazabilidadMockRepository, trazabilidadSupabaseRepository);
}

export function getFileRepository(): FileRepository {
  return pick(fileMockRepository, fileSupabaseRepository);
}

export { supabaseReportQueries } from "@/repositories/supabase";
