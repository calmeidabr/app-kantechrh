import { NextRequest, NextResponse } from "next/server";
import { supabase, getSupabaseAdmin } from "@/lib/supabase";

/**
 * Credenciais mestras/legadas compatíveis com `PROG/services/auth.py`
 */
const LEGACY_USERS: Record<
  string,
  { password: string; email: string; direitos: string; empresa: string; nome: string }
> = {
  adminkan: {
    password: "K@nAdmin#2026*",
    email: "adminkan@mundokan.com.br",
    direitos: "admin master",
    empresa: "Mundo Kan",
    nome: "Admin Master KAN",
  },
  admin: {
    password: "admin123",
    email: "admin@mundokan.com.br",
    direitos: "Editor",
    empresa: "Mundo Kan",
    nome: "Administrador",
  },
  cristiano: {
    password: "kan2026",
    email: "cristiano@mundokan.com.br",
    direitos: "Editor",
    empresa: "Mundo Kan",
    nome: "Cristiano Corrêa",
  },
  maria: {
    password: "maria2026",
    email: "maria@mundokan.com.br",
    direitos: "Analista",
    empresa: "Mundo Kan",
    nome: "Maria",
  },
};

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

/**
 * POST /api/auth
 * Autentica o usuário consultando:
 * 1) A tabela `public.usuarios` no Supabase (por `usuario` ou `email`, além de eventual coluna `senha`)
 * 2) O Supabase Auth (`auth.users` via `signInWithPassword`)
 * 3) As credenciais mestras/legadas do ecossistema KAN (`USUARIOS` em `services/auth.py`) com auto-onboarding
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = String(body.usernameOrEmail || body.usuario || "").trim();
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

    const supabaseAdmin = getSupabaseAdmin();
    const lowerId = rawIdentifier.toLowerCase();

    // 1. Buscar registro na tabela public.usuarios
    const { data: usuariosRows } = await supabaseAdmin
      .from("usuarios")
      .select("*");

    const matchedDbUser = (usuariosRows || []).find(
      (u: Record<string, unknown>) =>
        String(u.usuario || "").toLowerCase() === lowerId ||
        String(u.email || "").toLowerCase() === lowerId
    );

    if (matchedDbUser && String(matchedDbUser.status || "Ativo") === "Inativo") {
      return NextResponse.json(
        {
          success: false,
          error: "Este usuário encontra-se inativo no sistema. Contate o administrador.",
        },
        { status: 403 }
      );
    }

    let resolvedEmail = matchedDbUser?.email
      ? String(matchedDbUser.email)
      : rawIdentifier.includes("@")
      ? rawIdentifier
      : `${lowerId}@mundokan.com.br`;

    const resolvedUsername = matchedDbUser?.usuario
      ? String(matchedDbUser.usuario)
      : rawIdentifier.split("@")[0];

    let authenticated = false;
    let authUserId = matchedDbUser?.id ? String(matchedDbUser.id) : "";
    let sessionToken = "";

    // 2. Verificar se há coluna `senha` direta na tabela public.usuarios
    if (
      matchedDbUser &&
      matchedDbUser.senha &&
      String(matchedDbUser.senha) === password
    ) {
      authenticated = true;
    }

    // 3. Verificar credenciais legadas/mestras (`USUARIOS` de services/auth.py)
    const legacyKey = resolvedUsername.toLowerCase();
    if (!authenticated && LEGACY_USERS[legacyKey] && LEGACY_USERS[legacyKey].password === password) {
      authenticated = true;
      resolvedEmail = matchedDbUser?.email
        ? String(matchedDbUser.email)
        : LEGACY_USERS[legacyKey].email;

      // Garantir sincronização no Supabase Auth (auto-onboarding igual ao PROG/services/auth.py)
      try {
        const signRes = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });
        if (signRes.data?.session) {
          sessionToken = signRes.data.session.access_token;
          authUserId = signRes.data.user.id;
        } else {
          const created = await supabaseAdmin.auth.admin.createUser({
            email: resolvedEmail,
            password,
            email_confirm: true,
            user_metadata: { full_name: LEGACY_USERS[legacyKey].nome },
          });
          if (created.data?.user) {
            authUserId = created.data.user.id;
          }
        }
      } catch {
        // Continua autenticado via credencial KAN
      }
    }

    // 4. Autenticar via Supabase Auth (auth.users)
    if (!authenticated) {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });

      if (!authError && authData?.user) {
        authenticated = true;
        authUserId = authData.user.id;
        sessionToken = authData.session?.access_token || "";
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário ou senha incorretos. Verifique suas credenciais.",
        },
        { status: 401 }
      );
    }

    // 5. Hidratar dados completos do usuário e do Tenant no Supabase
    const finalDbUser =
      matchedDbUser ||
      (usuariosRows || []).find(
        (u: Record<string, unknown>) => String(u.id) === authUserId
      );

    const tenantId = finalDbUser?.tenant_id
      ? String(finalDbUser.tenant_id)
      : resolvedEmail.endsWith("@mundokan.com.br")
      ? "00000000-0000-0000-0000-000000000000"
      : "00000000-0000-0000-0000-000000000000";

    let tenantName = finalDbUser?.empresa ? String(finalDbUser.empresa) : "Mundo Kan";
    let tenantTier = "alta_performance";

    try {
      const { data: tenantData } = await supabaseAdmin
        .from("tenants")
        .select("id, name, tier")
        .eq("id", tenantId)
        .maybeSingle();

      if (tenantData) {
        tenantTier = String(tenantData.tier || "free");
        if (!finalDbUser?.empresa && tenantData.name) {
          tenantName = String(tenantData.name);
        }
      }
    } catch {
      // Fallback
    }

    const legacyInfo = LEGACY_USERS[legacyKey];
    const direitos = finalDbUser?.direitos
      ? String(finalDbUser.direitos)
      : legacyInfo?.direitos || (legacyKey === "adminkan" ? "admin master" : "Comum");

    const userSession: AuthUserSession = {
      id: authUserId || String(finalDbUser?.id || `usr-${legacyKey}`),
      usuario: String(finalDbUser?.usuario || resolvedUsername),
      nome_completo: String(
        finalDbUser?.nome_completo ||
          legacyInfo?.nome ||
          resolvedUsername.charAt(0).toUpperCase() + resolvedUsername.slice(1)
      ),
      email: resolvedEmail,
      celular: finalDbUser?.celular ? String(finalDbUser.celular) : "",
      data_nascimento: finalDbUser?.data_nascimento
        ? String(finalDbUser.data_nascimento)
        : "",
      empresa: tenantName || "Mundo Kan",
      cargo: finalDbUser?.cargo
        ? String(finalDbUser.cargo)
        : direitos === "admin master"
        ? "Admin Master"
        : "Gestor de RH",
      departamento: finalDbUser?.departamento
        ? String(finalDbUser.departamento)
        : "Diretoria Executiva",
      direitos,
      status: String(finalDbUser?.status || "Ativo"),
      foto: finalDbUser?.foto ? String(finalDbUser.foto) : "☖",
      grupo: String(finalDbUser?.grupo || "Geral"),
      tenant_id: tenantId,
      tenant_name: tenantName,
      tenant_tier: tenantTier,
      is_main_user: Boolean(finalDbUser?.is_main_user ?? true),
    };

    return NextResponse.json({
      success: true,
      user: userSession,
      token: sessionToken || `kan-session-${userSession.id}-${Date.now()}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao autenticar no Supabase.",
      },
      { status: 500 }
    );
  }
}
