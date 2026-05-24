import { AppShell } from "@/components/layout/app-shell";
import { FirebaseAuthProvider } from "@/components/providers/firebase-auth-provider";
import { requireCompletedProfile } from "@/services/auth.service";
import { getNavAccessSummary } from "@/services/access-control.service";
import { contarInvitacionesPendientesPorEmail } from "@/services/invitaciones-contrato.service";
import { getProfileForSession } from "@/services/profile.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCompletedProfile();
  const [pendingInviteCount, navAccess, profile] = await Promise.all([
    contarInvitacionesPendientesPorEmail(session.usuario.email),
    getNavAccessSummary(),
    getProfileForSession({
      userId: session.usuario.id,
      email: session.usuario.email,
      firebaseUid: session.usuario.firebaseUid,
    }),
  ]);

  return (
    <FirebaseAuthProvider>
      <AppShell
        usuario={session.usuario}
        profile={profile}
        pendingInviteCount={pendingInviteCount}
        arrendatarioSinVinculos={navAccess.arrendatarioSinVinculos}
        arrendadorSinInmuebles={navAccess.arrendadorSinInmuebles}
      >
        {children}
      </AppShell>
    </FirebaseAuthProvider>
  );
}
