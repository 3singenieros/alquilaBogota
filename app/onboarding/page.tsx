import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getSession } from "@/services/auth.service";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <OnboardingForm usuario={session.usuario} />
    </div>
  );
}
