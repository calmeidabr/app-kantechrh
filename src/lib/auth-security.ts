import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

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

/**
 * URL oficial de upgrade de plano no site KantechRH
 */
export const UPGRADE_PLAN_URL = "https://www.kantechrh.com.br/#pricing";

export interface PlanQuotaConfig {
  tier: string;
  label: string;
  maxTalentosMes: number;
  maxProcessosMes: number;
  maxEquipesMes: number;
  maxUsuarios: number;
}

export const PLAN_LIMITS: Record<string, PlanQuotaConfig> = {
  free: {
    tier: "free",
    label: "FREE",
    maxTalentosMes: 5,
    maxProcessosMes: 1,
    maxEquipesMes: 1,
    maxUsuarios: 1,
  },
  start: {
    tier: "start",
    label: "START",
    maxTalentosMes: 10,
    maxProcessosMes: 3,
    maxEquipesMes: 3,
    maxUsuarios: 1,
  },
  intermediario: {
    tier: "intermediario",
    label: "INTERMEDIÁRIO",
    maxTalentosMes: 50,
    maxProcessosMes: 10,
    maxEquipesMes: 10,
    maxUsuarios: 3,
  },
  business: {
    tier: "business",
    label: "BUSINESS",
    maxTalentosMes: 100,
    maxProcessosMes: 30,
    maxEquipesMes: 30,
    maxUsuarios: 10,
  },
  pro: {
    tier: "pro",
    label: "PRO",
    maxTalentosMes: 300,
    maxProcessosMes: 50,
    maxEquipesMes: 70,
    maxUsuarios: 15,
  },
  alta_performance: {
    tier: "alta_performance",
    label: "ALTA PERFORMANCE",
    maxTalentosMes: 700,
    maxProcessosMes: 75,
    maxEquipesMes: 100,
    maxUsuarios: 15,
  },
};

export function getPlanLimits(tier?: string | null): PlanQuotaConfig {
  const norm = String(tier || "free")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  return PLAN_LIMITS[norm] || PLAN_LIMITS.free;
}

export function getCurrentMonthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

export interface RequestTenantContext {
  authenticated: boolean;
  isAdminKan: boolean;
  tenantId: string | null;
  tenantTier: string;
  empresa: string;
  user: AuthUserSession | null;
}

/**
 * Extrai o contexto Multi-Tenant diretamente do cookie HttpOnly assinado (`kantech_session`).
 * Somente o usuário `adminkan` possui acesso global irrestrito à base total.
 * Todos os demais usuários enxergam e manipulam exclusivamente os registros do seu próprio `tenant_id`.
 */
export function getRequestTenantContext(
  req: NextRequest,
  bodyTenantId?: string | null
): RequestTenantContext {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const check = verifySessionToken(token);
  const { searchParams } = new URL(req.url);
  const queryTenantId = searchParams.get("tenant_id");

  if (check.valid && check.payload?.user) {
    const u = check.payload.user;
    const isAdminKan =
      String(u.usuario || "")
        .trim()
        .toLowerCase() === "adminkan";

    const effectiveTenantId = isAdminKan
      ? queryTenantId || bodyTenantId || u.tenant_id || null
      : u.tenant_id || queryTenantId || bodyTenantId || null;

    return {
      authenticated: true,
      isAdminKan,
      tenantId: effectiveTenantId,
      tenantTier: u.tenant_tier || "free",
      empresa: u.empresa || u.tenant_name || "Workspace KantechRH",
      user: u,
    };
  }

  // Sem cookie de sessão válido: se informou tenant_id explícito na query/body (ex: chamada interna), isola por ele; nunca libera base global
  const fallbackTenant =
    queryTenantId && queryTenantId !== "00000000-0000-0000-0000-000000000000"
      ? queryTenantId
      : bodyTenantId && bodyTenantId !== "00000000-0000-0000-0000-000000000000"
      ? bodyTenantId
      : null;

  return {
    authenticated: false,
    isAdminKan: false,
    tenantId: fallbackTenant,
    tenantTier: "free",
    empresa: "Workspace KantechRH",
    user: null,
  };
}
