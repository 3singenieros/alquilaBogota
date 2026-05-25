"use client";

import { useFirebaseAuth } from "@/components/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const {
    loginWithGoogle,
    loginWithEmailPassword,
    registerWithEmailPassword,
    loading,
    authError,
    clearError,
  } = useFirebaseAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [e2eError, setE2eError] = useState<string | null>(null);

  async function afterAuth(redirectTo: string) {
    const dest =
      redirectTo === "/" && nextPath?.startsWith("/") && nextPath !== "/login"
        ? nextPath
        : redirectTo;
    router.push(dest);
    router.refresh();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      const redirectTo =
        mode === "login"
          ? await loginWithEmailPassword(email, password)
          : await registerWithEmailPassword(email, password);
      await afterAuth(redirectTo);
    } catch {
      /* authError set in provider */
    }
  }

  async function handleGoogle() {
    clearError();
    try {
      const redirectTo = await loginWithGoogle();
      await afterAuth(redirectTo);
    } catch {
      /* handled */
    }
  }

  const e2eAuth =
    process.env.NEXT_PUBLIC_E2E_MODE === "true" ||
    process.env.NEXT_PUBLIC_E2E_MODE === "1" ||
    process.env.NEXT_PUBLIC_E2E_AUTH === "true" ||
    process.env.NEXT_PUBLIC_E2E_AUTH === "1";

  async function handleE2eLogin(role: "ADMIN" | "ARRENDADOR" | "ARRENDATARIO") {
    clearError();
    setE2eError(null);
    try {
      const res = await fetch("/api/e2e/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "No se pudo iniciar sesión E2E");
      }
      const dest = nextPath?.startsWith("/") && nextPath !== "/login" ? nextPath : "/";
      window.location.assign(dest);
    } catch (err) {
      setE2eError(err instanceof Error ? err.message : "Error de acceso E2E");
    }
  }

  return (
    <div
      data-testid="login-form"
      className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm"
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">AlquilaBogotá</h1>
        <p className="mt-1 text-sm text-slate-500">
          Acceso con Firebase — Google o correo electrónico
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mb-4 w-full"
        disabled={loading}
        onClick={handleGoogle}
      >
        Continuar con Google
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--border)]" />
        </div>
        <span className="relative mx-auto block w-fit bg-white px-2 text-xs text-slate-400">
          o con correo
        </span>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <FormField label="Correo electrónico">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </FormField>
        <FormField label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </FormField>
        {authError || e2eError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {authError ?? e2eError}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          data-testid="login-submit"
        >
          {loading
            ? "Procesando..."
            : mode === "login"
              ? "Ingresar"
              : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
        <button
          type="button"
          className="font-medium text-indigo-600 hover:underline"
          onClick={() => {
            clearError();
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login" ? "Regístrate" : "Inicia sesión"}
        </button>
      </p>

      {e2eAuth ? (
        <div
          data-testid="e2e-demo-login"
          className="mt-6 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-3"
        >
          <p className="mb-2 text-xs font-medium text-indigo-900">
            Acceso rápido E2E (sin Firebase)
          </p>
          <div className="flex flex-wrap gap-2">
            {(["ADMIN", "ARRENDADOR", "ARRENDATARIO"] as const).map((role) => (
              <Button
                key={role}
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading}
                data-testid={`e2e-login-${role.toLowerCase()}`}
                onClick={() => void handleE2eLogin(role)}
              >
                {role}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <details className="mt-6 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600">
          Cuentas demo (perfil ya configurado)
        </summary>
        <ul className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 leading-relaxed">
          <li>admin@demo.edu → ADMIN</li>
          <li>arrendador@demo.edu → solo arrendador</li>
          <li>arrendatario@demo.edu → solo arrendatario</li>
          <li>dual@demo.edu → ambos roles</li>
          <li>Cuenta nueva → onboarding de roles</li>
        </ul>
      </details>
    </div>
  );
}
