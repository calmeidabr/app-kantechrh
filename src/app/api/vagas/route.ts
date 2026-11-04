import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, normalizeKey } from "@/lib/supabase";
import { VAGAS_MOCK } from "@/lib/mock-data";

function parseArr(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof val === "string" && val.trim()) {
    const trimmed = val.trim();
    if (trimmed.toLowerCase() === "nenhum" || trimmed === "[]") return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        // Fallback to split
      }
    }
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => Boolean(s) && s.toLowerCase() !== "nenhum");
  }
  return [];
}

function normalizePerfil(val: string): string {
  const n = normalizeKey(val);
  if (n.includes("lider")) return "Lider";
  if (n.includes("resultado")) return "Resultado";
  if (n.includes("executor")) return "Executor";
  if (n.includes("criativo")) return "Criativo";
  if (n.includes("comunicador")) return "Comunicador";
  if (n.includes("influenciador")) return "Influenciador";
  if (n.includes("vendedor")) return "Vendedor";
  return val.trim();
}

function normalizeKan(val: string): string {
  const n = normalizeKey(val);
  if (n.includes("movimento")) return "Movimento";
  if (n.includes("cria")) return "Criação";
  if (n.includes("finalidade")) return "Finalidade";
  return val.trim();
}

/**
 * GET /api/vagas
 * Carrega vagas de `public.vagas` combinadas com `public.processos_seletivos` (candidatos, equipe associada e requisitos).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    const isAdminMaster = searchParams.get("admin") === "true";

    const supabaseAdmin = getSupabaseAdmin();

    let vagasQuery = supabaseAdmin
      .from("vagas")
      .select("*")
      .order("id", { ascending: false });
    let procQuery = supabaseAdmin.from("processos_seletivos").select("*");

    if (
      tenantId &&
      !isAdminMaster &&
      tenantId !== "00000000-0000-0000-0000-000000000000"
    ) {
      vagasQuery = vagasQuery.eq("tenant_id", tenantId);
      procQuery = procQuery.eq("tenant_id", tenantId);
    }

    const [{ data: vagasData, error: vagasErr }, { data: procData }] =
      await Promise.all([vagasQuery, procQuery]);

    if (vagasErr) {
      return NextResponse.json({
        source: "mock-fallback",
        warning: vagasErr.message,
        vagas: VAGAS_MOCK,
      });
    }

    if (!vagasData || vagasData.length === 0) {
      return NextResponse.json({
        source: "supabase-empty",
        vagas: [],
      });
    }

    const procMap = new Map<number, Record<string, unknown>>();
    if (procData) {
      for (const p of procData) {
        if (p.vaga_id) {
          procMap.set(Number(p.vaga_id), p as Record<string, unknown>);
        }
      }
    }

    const vagas = vagasData.map((row: Record<string, unknown>) => {
      const id = Number(row.id);
      const proc = procMap.get(id);

      const kanFromProc = parseArr(proc?.kan_ideal).map(normalizeKan);
      const kanFromVaga = parseArr(row.kan_ideal).map(normalizeKan);
      const kanIdeal = kanFromProc.length > 0 ? kanFromProc : kanFromVaga.length > 0 ? kanFromVaga : ["Finalidade"];

      const perfisFromProc = parseArr(proc?.perfis_ideais).map(normalizePerfil);
      const perfisFromVaga = parseArr(row.perfis_ideais).map(normalizePerfil);
      const perfisIdeais = perfisFromProc.length > 0 ? perfisFromProc : perfisFromVaga;

      const catsFromProc = parseArr(proc?.categorias_ideais);
      const catsFromVaga = parseArr(row.categorias_ideais);
      const categoriasIdeais = catsFromProc.length > 0 ? catsFromProc : catsFromVaga;

      const qualsFromProc = parseArr(proc?.qualidades_ideais);
      const qualsFromVaga = parseArr(row.qualidades_ideais);
      const qualidadesIdeais = qualsFromProc.length > 0 ? qualsFromProc : qualsFromVaga;

      const equipeAssociada = proc?.equipe
        ? String(proc.equipe)
        : proc?.equipe_nome
        ? String(proc.equipe_nome)
        : undefined;

      const candidatosAssociados = parseArr(proc?.candidatos);

      return {
        id,
        processo_id: proc?.id ? Number(proc.id) : undefined,
        nome_vaga: String(row.nome_vaga || "Vaga Corporativa"),
        senioridade: String(row.senioridade || "Senior"),
        link_vaga: row.link_vaga ? String(row.link_vaga) : undefined,
        empresa: String(row.empresa || proc?.empresa || "Mundo Kan"),
        departamento: String(row.departamento || "Comercial"),
        kan_ideal: kanIdeal,
        perfis_ideais: perfisIdeais,
        categorias_ideais: categoriasIdeais,
        qualidades_ideais: qualidadesIdeais,
        descricao_vaga: String(row.descricao_vaga || ""),
        equipe_associada: equipeAssociada,
        candidatos_associados: candidatosAssociados,
        created_at: String(row.created_at || new Date().toISOString()),
        tenant_id: String(row.tenant_id || "00000000-0000-0000-0000-000000000000"),
      };
    });

    return NextResponse.json({
      source: "supabase",
      count: vagas.length,
      vagas,
    });
  } catch (err) {
    return NextResponse.json({
      source: "mock-exception-fallback",
      error: err instanceof Error ? err.message : "Unknown error",
      vagas: VAGAS_MOCK,
    });
  }
}

/**
 * POST /api/vagas
 * Cria ou atualiza uma vaga em `public.vagas` e seus candidatos/equipe/requisitos em `public.processos_seletivos`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      nome_vaga,
      senioridade,
      link_vaga,
      empresa,
      departamento,
      kan_ideal,
      perfis_ideais,
      categorias_ideais,
      qualidades_ideais,
      descricao_vaga,
      equipe_associada,
      candidatos_associados,
      tenant_id,
    } = body;

    if (!nome_vaga) {
      return NextResponse.json(
        { error: "O título da vaga (nome_vaga) é obrigatório." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const vagaPayload: Record<string, unknown> = {
      nome_vaga,
      senioridade: senioridade || "Senior",
      link_vaga: link_vaga || "",
      empresa: empresa || "Mundo Kan",
      departamento: departamento || "Comercial",
      kan_ideal: Array.isArray(kan_ideal) ? kan_ideal.join(", ") : String(kan_ideal || ""),
      perfis_ideais: JSON.stringify(Array.isArray(perfis_ideais) ? perfis_ideais : []),
      categorias_ideais: JSON.stringify(Array.isArray(categorias_ideais) ? categorias_ideais : []),
      qualidades_ideais: JSON.stringify(Array.isArray(qualidades_ideais) ? qualidades_ideais : []),
      descricao_vaga: descricao_vaga || "",
      updated_at: new Date().toISOString(),
    };

    if (tenant_id) {
      vagaPayload.tenant_id = tenant_id;
    }

    if (id && Number(id) < 1000000000) {
      vagaPayload.id = Number(id);
    }

    const { data: savedVaga, error: vagaError } = await supabaseAdmin
      .from("vagas")
      .upsert(vagaPayload)
      .select()
      .single();

    if (vagaError) {
      return NextResponse.json(
        { success: false, error: vagaError.message },
        { status: 400 }
      );
    }

    if (savedVaga?.id) {
      // Check if processos_seletivos row already exists for this vaga_id
      const { data: existingProc } = await supabaseAdmin
        .from("processos_seletivos")
        .select("id")
        .eq("vaga_id", savedVaga.id)
        .maybeSingle();

      const procPayload: Record<string, unknown> = {
        vaga_id: savedVaga.id,
        empresa: empresa || "Mundo Kan",
        candidatos: Array.isArray(candidatos_associados) ? candidatos_associados : [],
        perfis_ideais: Array.isArray(perfis_ideais) ? perfis_ideais : [],
        categorias_ideais: Array.isArray(categorias_ideais) ? categorias_ideais : [],
        qualidades_ideais: Array.isArray(qualidades_ideais) ? qualidades_ideais : [],
        kan_ideal: JSON.stringify(Array.isArray(kan_ideal) ? kan_ideal : []),
        equipe: equipe_associada || null,
        updated_at: new Date().toISOString(),
      };

      if (tenant_id) {
        procPayload.tenant_id = tenant_id;
      }

      if (existingProc?.id) {
        await supabaseAdmin
          .from("processos_seletivos")
          .update(procPayload)
          .eq("id", existingProc.id);
      } else {
        await supabaseAdmin.from("processos_seletivos").insert(procPayload);
      }
    }

    return NextResponse.json({
      success: true,
      vaga: savedVaga,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao salvar vaga.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vagas?id=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID da vaga obrigatório." }, { status: 400 });
    }
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("processos_seletivos").delete().eq("vaga_id", Number(id));
    const { error } = await supabaseAdmin.from("vagas").delete().eq("id", Number(id));
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, deleted: id });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro ao remover vaga" },
      { status: 500 }
    );
  }
}
