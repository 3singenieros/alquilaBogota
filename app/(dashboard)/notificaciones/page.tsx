import { NotificacionesModule } from "@/components/modules/notificaciones-module";
import { listarNotificaciones } from "@/services/notificaciones.service";

export default async function NotificacionesPage() {
  const notificaciones = await listarNotificaciones();
  return <NotificacionesModule initialData={notificaciones} />;
}
