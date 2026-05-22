import {
  getContratosRepository,
  getInmueblesRepository,
} from "@/repositories";
import type { Contrato, Inmueble } from "@/types";

/** Contratos e inmuebles en memoria para filtrar listados por rol. */
export async function loadAuthContext(): Promise<{
  contratos: Contrato[];
  inmuebles: Inmueble[];
}> {
  const [contratos, inmuebles] = await Promise.all([
    getContratosRepository().findAll(),
    getInmueblesRepository().findAll(),
  ]);
  return { contratos, inmuebles };
}
