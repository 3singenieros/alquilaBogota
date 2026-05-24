import { PerfilModule } from "@/components/modules/perfil-module";
import { requireCompletedProfile } from "@/services/auth.service";
import { getProfileForSession } from "@/services/profile.service";
import { redirect } from "next/navigation";

export default async function PerfilPage() {
  const { usuario } = await requireCompletedProfile();
  const profile = await getProfileForSession({
    userId: usuario.id,
    email: usuario.email,
    firebaseUid: usuario.firebaseUid,
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return <PerfilModule profile={profile} usuario={usuario} />;
}
