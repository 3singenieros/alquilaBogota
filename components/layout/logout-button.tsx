"use client";

import { logoutAction } from "@/app/login/actions";
import { useFirebaseAuth } from "@/components/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

export function LogoutButton() {
  const { logout: logoutFirebase } = useFirebaseAuth();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      title="Cerrar sesión"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await logoutFirebase();
          await logoutAction();
        });
      }}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Salir</span>
    </Button>
  );
}
