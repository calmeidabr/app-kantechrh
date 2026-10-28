import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wfenlrmsiyndtpxwfgxs.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-service-role-key";

/**
 * Public Supabase client (Anon Key / RLS enforced)
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Server-side Administrative Supabase client (Service Role Key - BFF Route Handlers only)
 * NEVER import this in Client Components ("use client").
 */
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Helper to normalize field names for KAN JSON parsing
 */
export function normalizeKey(key: string | null | undefined): string {
  if (!key) return "";
  return String(key)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_\-().ºª]/g, "");
}

/**
 * Internal MAM Engine Configuration (Server-to-Server BFF -> mam-kantechrh)
 */
export const MAM_ENGINE_CONFIG = {
  baseUrl: process.env.MAM_ENGINE_URL || "http://localhost:8000",
  dockerUrl: "http://mam-kantechrh:8000",
  internalSecret:
    process.env.MAM_INTERNAL_SECRET || "kantech-mam-secret-key-2026-isolated",
};

/**
 * Calls the isolated Python FastAPI calculation container (`mam-kantechrh`)
 */
export async function callMamEngine<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: T; error?: string; engineUrl?: string }> {
  const urlsToTry = [
    MAM_ENGINE_CONFIG.baseUrl,
    "http://127.0.0.1:8000",
    MAM_ENGINE_CONFIG.dockerUrl,
  ];

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(urlsToTry));

  for (const base of uniqueUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": MAM_ENGINE_CONFIG.internalSecret,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as T;
        return { ok: true, data, engineUrl: base };
      } else {
        const errText = await res.text();
        return {
          ok: false,
          error: `MAM Engine HTTP ${res.status}: ${errText}`,
          engineUrl: base,
        };
      }
    } catch {
      // Try next URL in list
      continue;
    }
  }

  return {
    ok: false,
    error:
      "Container de cálculo mam-kantechrh indisponível nas portas 8000/rede interna.",
  };
}
