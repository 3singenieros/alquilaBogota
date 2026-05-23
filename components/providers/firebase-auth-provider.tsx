"use client";

import { syncFirebaseSessionAction } from "@/app/login/actions";
import {
  loginWithEmailPassword,
  loginWithGoogle,
  logoutFirebase,
  registerWithEmailPassword,
  subscribeAuthState,
  type FirebaseUser,
} from "@/lib/firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authError: string | null;
  clearError: () => void;
  loginWithGoogle: () => Promise<string>;
  loginWithEmailPassword: (email: string, password: string) => Promise<string>;
  registerWithEmailPassword: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-email": "Correo electrónico inválido.",
    "auth/user-disabled": "Esta cuenta está deshabilitada.",
    "auth/user-not-found": "No existe una cuenta con este correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Credenciales incorrectas.",
    "auth/email-already-in-use": "Este correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/popup-closed-by-user": "Inicio con Google cancelado.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
  };
  return map[code] ?? "No se pudo completar la autenticación.";
}

async function syncServerSession(user: FirebaseUser): Promise<string> {
  const result = await syncFirebaseSessionAction({
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "Usuario",
    firebaseUid: user.uid,
    photoURL: user.photoURL ?? undefined,
  });
  return result.redirectTo;
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAuthState((user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const handleAuth = useCallback(
    async (fn: () => Promise<{ user: FirebaseUser }>) => {
      setAuthError(null);
      setLoading(true);
      try {
        const cred = await fn();
        return await syncServerSession(cred.user);
      } catch (e: unknown) {
        const code =
          e && typeof e === "object" && "code" in e
            ? String((e as { code: string }).code)
            : "";
        setAuthError(mapFirebaseError(code));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      loading,
      authError,
      clearError,
      loginWithGoogle: () => handleAuth(loginWithGoogle),
      loginWithEmailPassword: (email, password) =>
        handleAuth(() => loginWithEmailPassword(email, password)),
      registerWithEmailPassword: (email, password) =>
        handleAuth(() => registerWithEmailPassword(email, password)),
      logout: async () => {
        await logoutFirebase();
        setFirebaseUser(null);
      },
    }),
    [firebaseUser, loading, authError, clearError, handleAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useFirebaseAuth debe usarse dentro de FirebaseAuthProvider");
  }
  return ctx;
}
