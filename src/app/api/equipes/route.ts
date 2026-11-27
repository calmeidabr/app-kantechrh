import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { EQUIPES_MOCK } from "@/lib/mock-data";
import {
  getRequestTenantContext,
  getPlanLimits,
  getCurrentMonthStartIso,
  UPGRADE_PLAN_URL,
} from "@/lib/auth-security";

export const dynamic = "force-dynamic";

function parseMembros(raw: unknown): { nome: string; lider: boolean }[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return list
    .map((m) => {
      if (typeof m === "string") return { nome: m.trim(), lider: false };
      if (m && typeof m === "object") {
        const obj = m as Record<string, unknown>;
        return {
          nome: String(obj.nome || "").trim(),
          lider: Boolean(obj.lider),
        };
      }
      return { nome: "", lider: false };
    })
    .filter((m) => m.nome.length > 0);
}

/**
 * GET /api/equipes
 * Carrega todas as equipes da tabela `public.equipes` no Supabase (46 equipes cadastradas).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestTenantContext(req);
    const { searchParams } = new URL(req.url);
    const queryTenantId = searchParams.get("tenant_id");

    if (!ctx.isAdminKan && !ctx.tenantId) {
      return NextResponse.json({
        source: "supabase-empty",
        count: 0,
        equipes: [],
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from("equipes")
      .select("id, nome, empresa, departamento, membros, foto_base64, tenant_id, created_at, updated_at")
      .order("nome", { ascending: true })
      .limit(500);

    if (!ctx.isAdminKan && ctx.tenantId) {
      query = query.eq("tenant_id", ctx.tenantId);
    } else if (
      ctx.isAdminKan &&
      queryTenantId &&
      queryTenantId !== "all"
    ) {
      query = query.eq("tenant_id", queryTenantId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        source: ctx.isAdminKan ? "mock-fallback" : "supabase-error",
        warning: error.message,
        equipes: ctx.isAdminKan ? EQUIPES_MOCK : [],
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        source: "supabase-empty",
        count: 0,
        equipes: [],
      });
    }

    const equipes = data.map((row: Record<string, unknown>, idx: number) => {
      const membros = parseMembros(row.membros);
      const fotoRaw = row.foto_base64 ? String(row.foto_base64).trim() : "";
      const fotoUrl =
        fotoRaw.length > 20
          ? fotoRaw.startsWith("data:")
            ? fotoRaw
            : `data:image/jpeg;base64,${fotoRaw}`
          : undefined;

      return {
        id: String(row.id || `eq-${idx + 1}`),
        nome: String(row.nome || `Equipe ${idx + 1}`),
        empresa: row.empresa ? String(row.empresa) : "Mundo Kan",
        departamento: row.departamento ? String(row.departamento) : "Geral",
        foto_url: fotoUrl,
        membros,
        harmonia: 85 + ((Number(row.id) || idx) % 12),
        triangulo_status: "Sinergia Complacente",
        distribuicao: {
          Lider: 28,
          Criativo: 24,
          Executor: 26,
          Resultado: 22,
        },
        tenant_id: String(row.tenant_id || "00000000-0000-0000-0000-000000000000"),
      };
    });

    return NextResponse.json({
      source: "supabase",
      count: equipes.length,
      equipes,
    });
  } catch (err) {
    return NextResponse.json({
      source: "mock-exception-fallback",
      error: err instanceof Error ? err.message : "Unknown error",
      equipes: EQUIPES_MOCK,
    });
  }
}

/**
 * POST /api/equipes
 * Cria ou atualiza uma equipe em `public.equipes`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      nome,
      empresa,
      departamento,
      membros,
      tenant_id,
      foto_base64,
      foto_url,
    } = body;

    if (!nome || !String(nome).trim()) {
      return NextResponse.json(
        { error: "O nome da equipe é obrigatório." },
        { status: 400 }
      );
    }

    const nomeTrim = String(nome).trim();
    const supabaseAdmin = getSupabaseAdmin();
    const ctx = getRequestTenantContext(req, tenant_id);

    // 1. Valida e garante tenant_id existente no banco (evita erro de chave estrangeira)
    let validTenantId =
      ctx.tenantId ||
      (tenant_id && typeof tenant_id === "string" ? tenant_id.trim() : "") ||
      "00000000-0000-0000-0000-000000000000";

    const { data: tenantRow } = await supabaseAdmin
      .from("tenants")
      .select("id, tier")
      .eq("id", validTenantId)
      .maybeSingle();

    if (!tenantRow?.id) {
      validTenantId = "00000000-0000-0000-0000-000000000000";
    }

    const payload: Record<string, unknown> = {
      nome: nomeTrim,
      empresa: empresa || ctx.empresa || "Mundo Kan",
      departamento: departamento || "Geral",
      membros: Array.isArray(membros) ? membros : [],
      tenant_id: validTenantId,
      updated_at: new Date().toISOString(),
    };

    if (foto_base64 !== undefined) {
      payload.foto_base64 = foto_base64 ? String(foto_base64).trim() : null;
    } else if (foto_url !== undefined) {
      payload.foto_base64 = foto_url ? String(foto_url).trim() : null;
    }

    let existingId: number | null = null;
    if (id && !String(id).startsWith("eq-") && !isNaN(Number(id))) {
      let byIdQuery = supabaseAdmin
        .from("equipes")
        .select("id")
        .eq("id", Number(id));
      if (!ctx.isAdminKan) {
        byIdQuery = byIdQuery.eq("tenant_id", validTenantId);
      }
      const { data: byId } = await byIdQuery.maybeSingle();
      if (byId?.id) existingId = Number(byId.id);
    }

    if (!existingId) {
      let byNameQuery = supabaseAdmin
        .from("equipes")
        .select("id")
        .eq("tenant_id", validTenantId)
        .ilike("nome", nomeTrim);
      const { data: byName } = await byNameQuery.limit(1).maybeSingle();
      if (byName?.id) existingId = Number(byName.id);
    }

    // Se for uma NOVA equipe e o usuário não for adminkan, valida o limite mensal do plano
    if (!existingId && !ctx.isAdminKan) {
      const planLimits = getPlanLimits(tenantRow?.tier || ctx.tenantTier);
      const monthStartIso = getCurrentMonthStartIso();

      const { count: monthCount } = await supabaseAdmin
        .from("equipes")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", validTenantId)
        .gte("created_at", monthStartIso);

      const currentCreatedThisMonth = monthCount ?? 0;
      if (currentCreatedThisMonth >= planLimits.maxEquipesMes) {
        return NextResponse.json(
          {
            success: false,
            limitReached: true,
            resource: "equipes",
            planName: planLimits.label,
            currentCount: currentCreatedThisMonth,
            maxLimit: planLimits.maxEquipesMes,
            upgradeUrl: UPGRADE_PLAN_URL,
            error: `Limite máximo mensal do Plano ${planLimits.label} atingido (${currentCreatedThisMonth}/${planLimits.maxEquipesMes} equipes criadas neste mês). Você continua com acesso completo à sua base criada. Faça o upgrade de plano se desejar continuar criando novas equipes.`,
          },
          { status: 403 }
        );
      }
    }

    let data = null;
    let error = null;

    if (existingId) {
      const res = await supabaseAdmin
        .from("equipes")
        .update(payload)
        .eq("id", existingId)
        .select();
      data = res.data?.[0] || null;
      error = res.error;
    } else {
      payload.created_at = new Date().toISOString();
      const res = await supabaseAdmin
        .from("equipes")
        .insert(payload)
        .select();
      data = res.data?.[0] || null;
      error = res.error;
    }

    if (error) {
      console.error("[POST /api/equipes] Erro Supabase:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      equipe: data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao salvar equipe.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/equipes?nome=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nome = searchParams.get("nome");
    const isAdmin = searchParams.get("admin") === "true";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Ação não permitida: A exclusão de equipes é restrita ao Painel de Controle com perfil Administrador." },
        { status: 403 }
      );
    }
    if (!nome) {
      return NextResponse.json(
        { error: "Parâmetro 'nome' obrigatório." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("equipes").delete().eq("nome", nome);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, deleted: nome });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao remover equipe",
      },
      { status: 500 }
    );
  }
}
