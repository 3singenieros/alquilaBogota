"use client";

import { loginAction, type LoginFormState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ClipboardList } from "lucide-react";
import { useActionState } from "react";

const initialState: LoginFormState = {};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">AlquilaBogotá</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestión de arrendamientos — acceso al sistema
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <FormField label="Usuario">
          <Input
            name="usuario"
            autoComplete="username"
            placeholder="admin, arrendador o arrendatario"
            required
          />
        </FormField>
        <FormField label="Contraseña">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </FormField>
        {state?.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <details className="mt-6 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600">
          Credenciales de demostración
        </summary>
        <ul className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 font-mono text-[11px] leading-relaxed">
          <li>admin / admin123</li>
          <li>arrendador / arrendador123</li>
          <li>arrendatario / arrendatario123</li>
        </ul>
      </details>
    </div>
  );
}
