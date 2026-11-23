import { NextRequest, NextResponse } from "next/server";
import { supabase, getSupabaseAdmin } from "@/lib/supabase";
import {
  SESSION_COOKIE_NAME,
  attachSessionCookie,
  clearSessionCookie,
  verifySessionToken,
  verifyPassword,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  type AuthUserSession,
} from "@/lib/auth-security";

export const dynamic = "force-dynamic";
export type { AuthUserSession };

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * GET /api/auth
 * Valida a sessão atual via cookie HttpOnly assinado + timeout de inatividade (5 min).
 * Se `?touch=1`, renova o timestamp de atividade (`lastActive`) no cookie de sessão.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const check = verifySessionToken(token);

  if (!check.valid || !check.payload) {
    const res = NextResponse.json(
      {
        authenticated: false,
        expired: Boolean(check.expired),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
    if (token) {
      clearSessionCookie(res);
    }
    return res;
  }

  const touch = new URL(req.url).searchParams.get("touch") === "1";
  const res = NextResponse.json(
    {
      authenticated: true,
      user: check.payload.user,
      lastActive: check.payload.lastActive,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );

  if (touch) {
    attachSessionCookie(res, check.payload.user, check.payload.iat);
  }

  return res;
}

/**
 * DELETE /api/auth
 * Encerra a sessão removendo o cookie HttpOnly.
 */
export async function DELETE() {
  const res = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  clearSessionCookie(res);
  return res;
}

/**
 * POST /api/auth
 * Autentica exclusivamente contra o Supabase Auth (senhas criptografadas com bcrypt em `auth.users`)
 * ou hash criptográfico `scrypt$` em `public.usuarios`.
 * Zero credenciais em texto puro ou hardcoded no repositório.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = String(
      body.usernameOrEmail || body.usuario || ""
    ).trim();
    const password = String(body.password || body.senha || "");

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe o nome de usuário (ou e-mail) e a senha.",
        },
        { status: 400 }
      );
    }

    const lowerId = rawIdentifier.toLowerCase();
    const rateKey = `${getClientIp(req)}::${lowerId}`;
    const rateCheck = checkLoginRateLimit(rateKey);
    if (!rateCheck.allowed) {
      const mins = Math.ceil((rateCheck.retryAfterSeconds || 60) / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Muitas tentativas de login. Aguarde ${mins} minuto(s) e tente novamente.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Localizar usuário em public.usuarios (por usuario ou email)
    const { data: usuariosRows } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id, usuario, nome_completo, email, celular, data_nascimento, empresa, cargo, departamento, direitos, status, foto, grupo, tenant_id, is_main_user"
      );

    const matchedDbUser = (usuariosRows || []).find(
      (u: Record<string, unknown>) =>
        String(u.usuario || "").toLowerCase() === lowerId ||
        String(u.email || "").toLowerCase() === lowerId
    );

    if (
      matchedDbUser &&
      String(matchedDbUser.status || "Ativo") === "Inativo"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este usuário encontra-se inativo no sistema. Contate o administrador.",
        },
        { status: 403 }
      );
    }

    const resolvedEmail = matchedDbUser?.email
      ? String(matchedDbUser.email).trim()
      : rawIdentifier.includes("@")
      ? rawIdentifier
      : `${lowerId}@mundokan.com.br`;

    const resolvedUsername = matchedDbUser?.usuario
      ? String(matchedDbUser.usuario)
      : rawIdentifier.split("@")[0];

    let authenticated = false;
    let authUserId = matchedDbUser?.id ? String(matchedDbUser.id) : "";

    // 2. Autenticar exclusivamente via Supabase Auth (bcrypt criptografado em auth.users)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

    if (!authError && authData?.user) {
      authenticated = true;
      authUserId = authData.user.id;
    }

    // 3. Suporte secundário apenas a hash criptográfico scrypt$ (nunca texto puro)
    if (!authenticated && matchedDbUser?.id) {
      const { data: hashRow } = await supabaseAdmin
        .from("usuarios")
        .select("*")
        .eq("id", matchedDbUser.id)
        .maybeSingle();

      const storedHash =
        hashRow && typeof hashRow === "object"
          ? String(
              (hashRow as Record<string, unknown>).senha_hash ||
                (hashRow as Record<string, unknown>).senha ||
                ""
            )
          : "";

      if (storedHash.startsWith("scrypt$") && verifyPassword(password, storedHash)) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      recordFailedLoginAttempt(rateKey);
      return NextResponse.json(
        {
          success: false,
          error: "Usuário ou senha incorretos. Verifique suas credenciais.",
        },
        { status: 401 }
      );
    }

    clearFailedLoginAttempts(rateKey);

    // 4. Hidratar dados completos do usuário e do Tenant no Supabase
    const finalDbUser =
      matchedDbUser ||
      (usuariosRows || []).find(
        (u: Record<string, unknown>) => String(u.id) === authUserId
      );

    const tenantId = finalDbUser?.tenant_id
      ? String(finalDbUser.tenant_id)
      : "00000000-0000-0000-0000-000000000000";

    const { data: tenantData } = await supabaseAdmin
      .from("tenants")
      .select("id, name, tier")
      .eq("id", tenantId)
      .maybeSingle();

    const userSession: AuthUserSession = {
      id: authUserId || String(finalDbUser?.id || resolvedUsername),
      usuario: finalDbUser?.usuario
        ? String(finalDbUser.usuario)
        : resolvedUsername,
      nome_completo: finalDbUser?.nome_completo
        ? String(finalDbUser.nome_completo)
        : resolvedUsername,
      email: finalDbUser?.email ? String(finalDbUser.email) : resolvedEmail,
      celular: finalDbUser?.celular ? String(finalDbUser.celular) : undefined,
      data_nascimento: finalDbUser?.data_nascimento
        ? String(finalDbUser.data_nascimento)
        : undefined,
      empresa: finalDbUser?.empresa
        ? String(finalDbUser.empresa)
        : tenantData?.name || "Mundo Kan",
      cargo: finalDbUser?.cargo
        ? String(finalDbUser.cargo)
        : String(finalDbUser?.direitos || "").toLowerCase() === "admin master"
        ? "Admin Master"
        : "Gestor de RH",
      departamento: finalDbUser?.departamento
        ? String(finalDbUser.departamento)
        : "Diretoria Executiva",
      direitos: finalDbUser?.direitos ? String(finalDbUser.direitos) : "Comum",
      status: finalDbUser?.status ? String(finalDbUser.status) : "Ativo",
      foto: finalDbUser?.foto ? String(finalDbUser.foto) : undefined,
      grupo: finalDbUser?.grupo ? String(finalDbUser.grupo) : "Geral",
      tenant_id: tenantId,
      tenant_name: tenantData?.name ? String(tenantData.name) : "Mundo Kan",
      tenant_tier: tenantData?.tier
        ? String(tenantData.tier)
        : "alta_performance",
      is_main_user: Boolean(finalDbUser?.is_main_user ?? true),
    };

    const res = NextResponse.json(
      {
        success: true,
        user: userSession,
      },
      { headers: { "Cache-Control": "no-store" } }
    );

    // Anexa cookie HttpOnly de sessão (sem Max-Age -> expira ao reiniciar o navegador)
    attachSessionCookie(res, userSession);

    return res;
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao autenticar usuário.",
      },
      { status: 500 }
    );
  }
}
