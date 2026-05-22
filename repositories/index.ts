import { USE_MOCK_DATA } from "@/lib/config";
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
  serviciosMockRepository,
  serviciosSupabaseRepository,
  type ServiciosRepository,
} from "@/repositories/servicios.repository";
import {
  usuariosMockRepository,
  usuariosSupabaseRepository,
  type UsuariosRepository,
} from "@/repositories/usuarios.repository";

function pick<T>(mock: T, supabase: T): T {
  return USE_MOCK_DATA ? mock : supabase;
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

export function getServiciosRepository(): ServiciosRepository {
  return pick(serviciosMockRepository, serviciosSupabaseRepository);
}

export function getMantenimientoRepository(): MantenimientoRepository {
  return pick(mantenimientoMockRepository, mantenimientoSupabaseRepository);
}

export function getNoRenovacionRepository(): NoRenovacionRepository {
  return pick(noRenovacionMockRepository, noRenovacionSupabaseRepository);
}

export function getUsuariosRepository(): UsuariosRepository {
  return pick(usuariosMockRepository, usuariosSupabaseRepository);
}
