"use client";

import { getMockCurrentUser } from "@/lib/auth/mock-session";
import type { Rol, Usuario } from "@/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RoleContextValue = {
  rol: Rol;
  usuario: Usuario;
  setRol: (rol: Rol) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [rol, setRolState] = useState<Rol>("ADMIN");

  useEffect(() => {
    const saved = localStorage.getItem("demo-rol") as Rol | null;
    if (saved && ["ADMIN", "ARRENDADOR", "ARRENDATARIO"].includes(saved)) {
      setRolState(saved);
    }
  }, []);

  const setRol = (next: Rol) => {
    setRolState(next);
    localStorage.setItem("demo-rol", next);
  };

  const value = useMemo(
    () => ({ rol, usuario: getMockCurrentUser(rol), setRol }),
    [rol]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole debe usarse dentro de RoleProvider");
  return ctx;
}
