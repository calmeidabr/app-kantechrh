import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { EQUIPES_MOCK } from "@/lib/mock-data";

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
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    const isAdminMaster = searchParams.get("admin") === "true";

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from("equipes")
      .select("id, nome, empresa, departamento, membros, foto_base64, tenant_id, created_at, updated_at")
      .order("nome", { ascending: true })
      .limit(500);

    if (
      tenantId &&
      !isAdminMaster &&
      tenantId !== "00000000-0000-0000-0000-000000000000"
    ) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        source: "mock-fallback",
        warning: error.message,
        equipes: EQUIPES_MOCK,
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        source: "supabase-empty",
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
    const { nome, empresa, departamento, membros, tenant_id } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "O nome da equipe é obrigatório." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const payload: Record<string, unknown> = {
      nome,
      empresa: empresa || "Mundo Kan",
      departamento: departamento || "Geral",
      membros: Array.isArray(membros) ? membros : [],
      updated_at: new Date().toISOString(),
    };

    if (tenant_id) {
      payload.tenant_id = tenant_id;
    }

    const { data, error } = await supabaseAdmin
      .from("equipes")
      .upsert(payload, { onConflict: "nome" })
      .select()
      .single();

    if (error) {
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
