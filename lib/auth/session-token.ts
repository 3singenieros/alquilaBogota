import type { Rol } from "@/types";

const COOKIE_NAME = "alquila_session";

export type SessionTokenPayload = {
  userId: string;
  rol: Rol;
  exp: number;
};

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "cambiar-SESSION_SECRET-en-env-local";
}

function encodePayload(payload: SessionTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): SessionTokenPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionTokenPayload;
    if (!parsed.userId || !parsed.rol || typeof parsed.exp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function importHmacKey(): Promise<CryptoKey> {
  const secret = getSecret();
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64url");
}

export async function createSessionToken(
  userId: string,
  rol: Rol
): Promise<string> {
  const payload: SessionTokenPayload = {
    userId,
    rol,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const body = encodePayload(payload);
  const key = await importHmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  return `${body}.${bufferToBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionTokenPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const key = await importHmacKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Buffer.from(sig, "base64url"),
    new TextEncoder().encode(body)
  );
  if (!valid) return null;

  const payload = decodePayload(body);
  if (!payload || payload.exp < Date.now()) return null;
  return payload;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
