import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-token";
import {
  E2E_DEMO_USERS,
  type E2eDemoRole,
} from "@/lib/auth/e2e-demo-users";

export { SESSION_COOKIE_NAME };

function envTruthy(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

/** Modo pruebas E2E (servidor): login demo sin Firebase. */
export function isE2eModeEnabled(): boolean {
  return (
    envTruthy(process.env.E2E_MODE) ||
    envTruthy(process.env.NEXT_PUBLIC_E2E_MODE) ||
    envTruthy(process.env.E2E_AUTH_ENABLED) ||
    envTruthy(process.env.NEXT_PUBLIC_E2E_AUTH)
  );
}

/** @deprecated Usar isE2eModeEnabled — alias por compatibilidad. */
export function isE2eAuthEnabled(): boolean {
  return isE2eModeEnabled();
}

export function parseE2eRole(value: unknown): E2eDemoRole | null {
  if (value === "ADMIN" || value === "ARRENDADOR" || value === "ARRENDATARIO") {
    return value;
  }
  return null;
}

export async function createE2eSessionTokenForRole(
  role: E2eDemoRole
): Promise<string> {
  const demo = E2E_DEMO_USERS[role];
  return createSessionToken({
    userId: demo.userId,
    roles: demo.roles,
    rolActivo: demo.rolActivo,
    perfilCompletado: true,
    email: demo.email,
    displayName: demo.displayName,
    firebaseUid: demo.firebaseUid,
  });
}
