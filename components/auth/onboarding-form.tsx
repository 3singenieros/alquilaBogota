"use client";

import { completeOnboardingAction } from "@/app/onboarding/actions";
import { useFirebaseAuth } from "@/components/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { ROLES_ONBOARDING } from "@/lib/auth/profile-session";
import { cn } from "@/lib/utils";
import type { Rol, Usuario } from "@/types";
import { Building2, UserRound } from "lucide-react";
import { useState, useTransition } from "react";

const ROLE_META = {
  ARRENDADOR: {
    title: "Arrendador",
    description: "Publica inmuebles, contratos, pagos y mantenimiento de tus propiedades.",
    icon: Building2,
  },
  ARRENDATARIO: {
    title: "Arrendatario",
    description: "Recibe invitaciones, reporta pagos y gestiona tu arrendamiento activo.",
    icon: UserRound,
  },
};

export function OnboardingForm({ usuario }: { usuario: Usuario }) {
  const { firebaseUser } = useFirebaseAuth();
  const [selected, setSelected] = useState<Rol[]>([]);
  const [telefono, setTelefono] = useState(usuario.telefono ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleRole(role: Rol) {
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selected.length === 0) {
      setError("Selecciona al menos un rol para continuar.");
      return;
    }
    const uid = firebaseUser?.uid ?? usuario.firebaseUid;
    const email = firebaseUser?.email ?? usuario.email;
    if (!uid || !email) {
      setError("No se pudo obtener la sesión de Firebase.");
      return;
    }

    startTransition(async () => {
      try {
        await completeOnboardingAction({
          firebaseUid: uid,
          email,
          nombre: firebaseUser?.displayName ?? usuario.nombre,
          roles: selected,
          telefono: telefono.trim() || undefined,
          photoURL: firebaseUser?.photoURL ?? usuario.photoURL,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo guardar el perfil."
        );
      }
    });
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Bienvenido a AlquilaBogotá</h1>
      <p className="mt-1 text-sm text-slate-600">
        Hola, <span className="font-medium">{usuario.nombre}</span> (
        {usuario.email})
      </p>
      <p className="mt-4 text-sm text-slate-700">
        Selecciona cómo deseas usar la plataforma. Puedes elegir uno o ambos roles.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES_ONBOARDING.map((role) => {
            const meta = ROLE_META[role as keyof typeof ROLE_META];
            const Icon = meta.icon;
            const active = selected.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  active
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20"
                    : "border-[var(--border)] hover:border-indigo-300 hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "mb-2 h-6 w-6",
                    active ? "text-indigo-600" : "text-slate-400"
                  )}
                />
                <p className="font-semibold text-slate-900">{meta.title}</p>
                <p className="mt-1 text-xs text-slate-500">{meta.description}</p>
              </button>
            );
          })}
        </div>

        <FormField label="Teléfono (opcional)">
          <Input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="300 000 0000"
          />
        </FormField>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Guardando..." : "Continuar"}
        </Button>
      </form>
    </div>
  );
}
