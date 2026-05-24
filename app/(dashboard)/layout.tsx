import { AppShell } from "@/components/layout/app-shell";
import { FirebaseAuthProvider } from "@/components/providers/firebase-auth-provider";
import { requireCompletedProfile } from "@/services/auth.service";
import { getNavAccessSummary } from "@/services/access-control.service";
import { contarInvitacionesPendientesPorEmail } from "@/services/invitaciones-contrato.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCompletedProfile();
  const [pendingInviteCount, navAccess] = await Promise.all([
    contarInvitacionesPendientesPorEmail(session.usuario.email),
    getNavAccessSummary(),
  ]);

  return (
    <FirebaseAuthProvider>
      <AppShell
        usuario={session.usuario}
        pendingInviteCount={pendingInviteCount}
        arrendatarioSinVinculos={navAccess.arrendatarioSinVinculos}
      >
        {children}
      </AppShell>
    </FirebaseAuthProvider>
  );
}
