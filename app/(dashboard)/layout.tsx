import { AppShell } from "@/components/layout/app-shell";
import { FirebaseAuthProvider } from "@/components/providers/firebase-auth-provider";
import { requireSession } from "@/services/auth.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <FirebaseAuthProvider>
      <AppShell usuario={session.usuario}>{children}</AppShell>
    </FirebaseAuthProvider>
  );
}
