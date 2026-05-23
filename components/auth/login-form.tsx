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
  const { loginWithGoogle, loginWithEmailPassword, registerWithEmailPassword, loading, authError, clearError } =
    useFirebaseAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      if (mode === "login") {
        await loginWithEmailPassword(email, password);
      } else {
        await registerWithEmailPassword(email, password);
      }
      router.push(nextPath ?? "/");
      router.refresh();
    } catch {
      /* authError set in provider */
    }
  }

  async function handleGoogle() {
    clearError();
    try {
      await loginWithGoogle();
      router.push(nextPath ?? "/");
      router.refresh();
    } catch {
      /* handled */
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
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
        {authError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {authError}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
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

      <details className="mt-6 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600">
          Roles demo (por email)
        </summary>
        <ul className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 leading-relaxed">
          <li>admin@… → ADMIN</li>
          <li>arrendador@… → ARRENDADOR</li>
          <li>arrendatario@demo.edu → ARRENDATARIO</li>
          <li>nuevo.arrendatario@demo.edu → solicitud pendiente</li>
        </ul>
      </details>
    </div>
  );
}
