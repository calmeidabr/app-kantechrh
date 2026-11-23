import crypto from "crypto";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "kantech_session";
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inatividade

export interface AuthUserSession {
  id: string;
  usuario: string;
  nome_completo: string;
  email: string;
  celular?: string;
  data_nascimento?: string;
  empresa: string;
  cargo?: string;
  departamento?: string;
  direitos: string;
  status: string;
  foto?: string;
  grupo: string;
  tenant_id: string;
  tenant_name: string;
  tenant_tier: string;
  is_main_user: boolean;
}

export interface SignedSessionPayload {
  user: AuthUserSession;
  iat: number;
  lastActive: number;
}

function getSessionSecret(): string {
  const envSecret =
    process.env.AUTH_SESSION_SECRET ||
    process.env.MAM_INTERNAL_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (envSecret && envSecret.length >= 16) {
    return crypto.createHash("sha256").update(envSecret).digest("hex");
  }
  // Fallback derivado de chave em memória por processo (nunca segredo fraco fixo)
  return crypto
    .createHash("sha256")
    .update(`kantech-runtime-${process.pid}`)
    .digest("hex");
}

/**
 * Gera hash criptográfico seguro de senha usando scrypt + salt aleatório de 16 bytes (padrão OWASP).
 * Formato: scrypt$<salt_hex>$<derived_key_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
    .toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifica senha contra hash scrypt usando comparação em tempo constante (timingSafeEqual).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt$")) {
    return false;
  }
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  try {
    const derived = crypto.scryptSync(password, salt, 64, {
      N: 16384,
      r: 8,
      p: 1,
    });
    const storedBuf = Buffer.from(keyHex, "hex");
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Assina o payload da sessão com HMAC-SHA256.
 */
export function signSessionToken(payload: SignedSessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

/**
 * Verifica assinatura HMAC-SHA256 e timeout de inatividade de 5 minutos.
 */
export function verifySessionToken(
  token: string | undefined | null
): {
  valid: boolean;
  expired?: boolean;
  payload?: SignedSessionPayload;
} {
  if (!token || !token.includes(".")) {
    return { valid: false };
  }
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [encoded, providedSig] = parts;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(encoded)
      .digest("base64url");

    const sigBuf = Buffer.from(providedSig, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return { valid: false };
    }

    const decoded = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SignedSessionPayload;

    if (!decoded?.user?.usuario || typeof decoded.lastActive !== "number") {
      return { valid: false };
    }

    const elapsed = Date.now() - decoded.lastActive;
    if (elapsed > IDLE_TIMEOUT_MS) {
      return { valid: false, expired: true };
    }

    return { valid: true, payload: decoded };
  } catch {
    return { valid: false };
  }
}

/**
 * Grava cookie de sessão HttpOnly, SameSite=Lax, Secure (em produção) SEM Max-Age/Expires,
 * garantindo que o navegador destrua a sessão automaticamente ao ser reiniciado.
 */
export function attachSessionCookie(
  res: NextResponse,
  user: AuthUserSession,
  iat?: number
): void {
  const now = Date.now();
  const token = signSessionToken({
    user,
    iat: iat || now,
    lastActive: now,
  });

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Sem maxAge / expires propositalmente: cookie de sessão expira ao fechar/reiniciar o navegador
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Proteção contra força bruta (Rate Limiting por IP + usuário):
 * Máximo de 5 tentativas falhas em janela de 15 minutos.
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const failedAttemptsStore = new Map<
  string,
  { count: number; firstAttemptAt: number }
>();

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = failedAttemptsStore.get(key);
  if (!entry) return { allowed: true };

  if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    failedAttemptsStore.delete(key);
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttemptAt);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(key: string): void {
  const now = Date.now();
  const entry = failedAttemptsStore.get(key);
  if (!entry || now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    failedAttemptsStore.set(key, { count: 1, firstAttemptAt: now });
  } else {
    entry.count += 1;
    failedAttemptsStore.set(key, entry);
  }
}

export function clearFailedLoginAttempts(key: string): void {
  failedAttemptsStore.delete(key);
}
