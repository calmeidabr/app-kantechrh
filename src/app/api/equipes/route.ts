import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { EQUIPES_MOCK } from "@/lib/mock-data";

/**
 * GET /api/equipes
 * Carrega equipes da tabela `public.equipes` no Supabase com fallback para `EQUIPES_MOCK`.
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("equipes")
      .select("*")
      .order("nome", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        source: error ? "mock-fallback" : "mock-empty-db",
        warning: error?.message,
        equipes: EQUIPES_MOCK,
      });
    }

    const equipes = data.map((row: Record<string, unknown>, idx: number) => {
      const rawMembros = Array.isArray(row.membros) ? row.membros : [];
      const membros = rawMembros.map((m: unknown) => {
        if (typeof m === "string") return { nome: m, lider: false };
        if (m && typeof m === "object") {
          const obj = m as Record<string, unknown>;
          return {
            nome: String(obj.nome || ""),
            lider: Boolean(obj.lider),
          };
        }
        return { nome: "", lider: false };
      }).filter((m) => m.nome);

      return {
        id: String(row.id || `eq-${idx + 1}`),
        nome: String(row.nome || `Equipe ${idx + 1}`),
        empresa: String(row.empresa || "KantechRH Enterprise"),
        departamento: String(row.departamento || "Diretoria Executiva"),
        foto_url: row.foto_base64 ? String(row.foto_base64) : undefined,
        membros,
        harmonia: 86 + (idx % 10),
        triangulo_status: "Sinergia Complacente",
        distribuicao: {
          Lider: 28,
          Criativo: 24,
          Executor: 26,
          Resultado: 22,
        },
      };
    });

    return NextResponse.json({
      source: "supabase",
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
    const { nome, empresa, departamento, membros } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "O nome da equipe é obrigatório." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("equipes")
      .upsert(
        {
          nome,
          empresa: empresa || "KantechRH Enterprise",
          departamento: departamento || "Diretoria Executiva",
          membros: Array.isArray(membros) ? membros : [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "nome" }
      )
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
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted: nome });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro ao remover equipe" },
      { status: 500 }
    );
  }
}
