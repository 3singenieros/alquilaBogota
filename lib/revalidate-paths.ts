import { revalidatePath } from "next/cache";

/** Rutas que dependen del listado de inmuebles (mock store compartido). */
export function revalidateInmuebleDependents() {
  for (const path of ["/inmuebles", "/contratos", "/servicios", "/mantenimiento", "/"]) {
    revalidatePath(path);
  }
}

/** Rutas que dependen del listado de contratos. */
export function revalidateContratoDependents() {
  for (const path of [
    "/contratos",
    "/pagos",
    "/no-renovacion",
    "/notificaciones",
    "/solicitudes-contrato",
    "/",
  ]) {
    revalidatePath(path);
  }
}

export function revalidateNotificacionDependents() {
  for (const path of ["/notificaciones", "/no-renovacion", "/"]) {
    revalidatePath(path);
  }
}
