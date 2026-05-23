import { FirebaseAuthProvider } from "@/components/providers/firebase-auth-provider";
import { requireSession } from "@/services/auth.service";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <FirebaseAuthProvider>
      <div className="min-h-screen bg-[var(--background)]">{children}</div>
    </FirebaseAuthProvider>
  );
}
