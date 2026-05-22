import { AppShell } from "@/components/layout/app-shell";
import { RoleProvider } from "@/components/providers/role-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <AppShell>{children}</AppShell>
    </RoleProvider>
  );
}
