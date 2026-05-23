import { AppShell } from "@/components/layout/app-shell";
import { FirebaseAuthProvider } from "@/components/providers/firebase-auth-provider";
import { requireCompletedProfile } from "@/services/auth.service";
import { contarInvitacionesPendientesPorEmail } from "@/services/invitaciones-contrato.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCompletedProfile();
  const pendingInviteCount = await contarInvitacionesPendientesPorEmail(
    session.usuario.email
  );

  return (
    <FirebaseAuthProvider>
      <AppShell usuario={session.usuario} pendingInviteCount={pendingInviteCount}>
        {children}
      </AppShell>
    </FirebaseAuthProvider>
  );
}
