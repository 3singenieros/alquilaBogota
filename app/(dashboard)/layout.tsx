import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/services/auth.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return <AppShell usuario={session.usuario}>{children}</AppShell>;
}
