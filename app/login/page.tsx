import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/app/login/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  await redirectIfAuthenticated(nextPath);

  return (
    <div
      data-testid="page-login"
      className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4"
    >
      <LoginForm nextPath={nextPath} />
    </div>
  );
}
