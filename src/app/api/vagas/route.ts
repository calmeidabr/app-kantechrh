import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, normalizeKey } from "@/lib/supabase";
import { VAGAS_MOCK } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

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
      const rawQuals = qualsFromProc.length > 0 ? qualsFromProc : qualsFromVaga;
      const softSkillsFromQuals = rawQuals
        .filter((q) => q.startsWith("SOFT:"))
        .map((q) => q.replace(/^SOFT:\s*/, ""));
      const pureQuals = rawQuals.filter((q) => !q.startsWith("SOFT:"));
      const softSkillsDirect = parseArr(proc?.soft_skills_ideais || row.soft_skills_ideais);
      const softSkillsIdeais = [
        ...new Set([...softSkillsDirect, ...softSkillsFromQuals]),
      ];

      const equipeAssociada = proc?.equipe
        ? String(proc.equipe)
        : proc?.equipe_nome
        ? String(proc.equipe_nome)
        : undefined;

      const candidatosAssociados = parseArr(proc?.candidatos);

      let histHarmonia: unknown[] = [];
      if (Array.isArray(proc?.historico_harmonia)) {
        histHarmonia = proc.historico_harmonia;
      } else if (typeof proc?.historico_harmonia === "string") {
        try {
          histHarmonia = JSON.parse(proc.historico_harmonia);
        } catch {
          histHarmonia = [];
        }
      }

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
        qualidades_ideais: pureQuals,
        soft_skills_ideais: softSkillsIdeais,
        descricao_vaga: String(row.descricao_vaga || ""),
        equipe_associada: equipeAssociada,
        candidatos_associados: candidatosAssociados,
        historico_harmonia: histHarmonia,
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

    // 1. AÇÃO ESPECÍFICA: Confirmar e Salvar Análise de Harmonia no Histórico
    if (body.action === "salvar_analise_harmonia") {
      const { vaga_id, analise } = body;
      if (!vaga_id || !analise) {
        return NextResponse.json(
          { success: false, error: "vaga_id e analise são obrigatórios." },
          { status: 400 }
        );
      }

      const supabaseAdmin = getSupabaseAdmin();
      const { data: existingProc, error: procFetchErr } = await supabaseAdmin
        .from("processos_seletivos")
        .select("id, historico_harmonia")
        .eq("vaga_id", Number(vaga_id))
        .maybeSingle();

      if (procFetchErr) {
        return NextResponse.json(
          { success: false, error: procFetchErr.message },
          { status: 500 }
        );
      }

      let currentHist: unknown[] = [];
      if (Array.isArray(existingProc?.historico_harmonia)) {
        currentHist = existingProc.historico_harmonia;
      } else if (typeof existingProc?.historico_harmonia === "string") {
        try {
          currentHist = JSON.parse(existingProc.historico_harmonia);
        } catch {
          currentHist = [];
        }
      }

      const updatedHist = [analise, ...currentHist];

      if (existingProc?.id) {
        const { error: updErr } = await supabaseAdmin
          .from("processos_seletivos")
          .update({
            historico_harmonia: updatedHist,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProc.id);

        if (updErr) {
          return NextResponse.json(
            { success: false, error: updErr.message },
            { status: 400 }
          );
        }
      } else {
        const { error: insErr } = await supabaseAdmin
          .from("processos_seletivos")
          .insert({
            vaga_id: Number(vaga_id),
            historico_harmonia: updatedHist,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insErr) {
          return NextResponse.json(
            { success: false, error: insErr.message },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        historico_harmonia: updatedHist,
      });
    }

    // 2. AÇÃO ESPECÍFICA: Excluir item do Histórico de Harmonia
    if (body.action === "excluir_analise_harmonia") {
      const { vaga_id, analise_id } = body;
      const supabaseAdmin = getSupabaseAdmin();
      const { data: existingProc } = await supabaseAdmin
        .from("processos_seletivos")
        .select("id, historico_harmonia")
        .eq("vaga_id", Number(vaga_id))
        .maybeSingle();

      if (existingProc?.id) {
        let currentHist: Array<{ id?: string }> = [];
        if (Array.isArray(existingProc.historico_harmonia)) {
          currentHist = existingProc.historico_harmonia as Array<{ id?: string }>;
        }
        const updatedHist = currentHist.filter((item) => item?.id !== analise_id);
        await supabaseAdmin
          .from("processos_seletivos")
          .update({
            historico_harmonia: updatedHist,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProc.id);

        return NextResponse.json({ success: true, historico_harmonia: updatedHist });
      }
      return NextResponse.json({ success: true, historico_harmonia: [] });
    }

    // 3. FLUXO PADRÃO: Criação ou atualização completa de Vaga
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
      soft_skills_ideais,
      descricao_vaga,
      equipe_associada,
      candidatos_associados,
      historico_harmonia,
      tenant_id,
    } = body;

    if (!nome_vaga) {
      return NextResponse.json(
        { error: "O título da vaga (nome_vaga) é obrigatório." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const empresaNome = (empresa && String(empresa).trim()) || "Mundo Kan";

    // Resolução de tenant_id:
    // 1. Se fornecido UUID válido, utiliza-o.
    // 2. Senão, busca na tabela public.empresas pelo nome da empresa.
    // 3. Fallback para tenant padrão '00000000-0000-0000-0000-000000000000'.
    let resolvedTenantId = typeof tenant_id === "string" && tenant_id.length > 20 ? tenant_id : null;
    if (!resolvedTenantId && empresaNome) {
      const { data: empMatch } = await supabaseAdmin
        .from("empresas")
        .select("tenant_id")
        .ilike("nome_empresa", empresaNome)
        .maybeSingle();
      if (empMatch?.tenant_id) {
        resolvedTenantId = empMatch.tenant_id;
      }
    }
    if (!resolvedTenantId) {
      resolvedTenantId = "00000000-0000-0000-0000-000000000000";
    }

    const combinedQuals = [
      ...(Array.isArray(qualidades_ideais) ? qualidades_ideais : []),
      ...(Array.isArray(soft_skills_ideais)
        ? soft_skills_ideais.map((s: string) =>
            s.startsWith("SOFT:") ? s : `SOFT:${s}`
          )
        : []),
    ];

    const vagaPayload: Record<string, unknown> = {
      nome_vaga,
      senioridade: senioridade || "Senior",
      link_vaga: link_vaga || "",
      empresa: empresaNome,
      departamento: departamento || "Comercial",
      kan_ideal: Array.isArray(kan_ideal) ? kan_ideal.join(", ") : String(kan_ideal || ""),
      perfis_ideais: JSON.stringify(Array.isArray(perfis_ideais) ? perfis_ideais : []),
      categorias_ideais: JSON.stringify(Array.isArray(categorias_ideais) ? categorias_ideais : []),
      qualidades_ideais: JSON.stringify(combinedQuals),
      descricao_vaga: descricao_vaga || "",
      tenant_id: resolvedTenantId,
      updated_at: new Date().toISOString(),
    };

    const isEdit = id && Number(id) > 0 && Number(id) < 1000000000;
    let savedVaga: any = null;
    let vagaError: any = null;

    if (isEdit) {
      vagaPayload.id = Number(id);
      const res = await supabaseAdmin
        .from("vagas")
        .upsert(vagaPayload)
        .select()
        .single();
      savedVaga = res.data;
      vagaError = res.error;
    } else {
      const res = await supabaseAdmin
        .from("vagas")
        .insert(vagaPayload)
        .select()
        .single();
      savedVaga = res.data;
      vagaError = res.error;
    }

    if (vagaError || !savedVaga) {
      console.error("Erro ao salvar vaga no Supabase:", vagaError);
      return NextResponse.json(
        { success: false, error: vagaError?.message || "Falha ao gravar vaga no banco de dados." },
        { status: 400 }
      );
    }

    // Sincronizar public.processos_seletivos
    const { data: existingProc } = await supabaseAdmin
      .from("processos_seletivos")
      .select("id, historico_harmonia")
      .eq("vaga_id", savedVaga.id)
      .maybeSingle();

    const procPayload: Record<string, unknown> = {
      vaga_id: savedVaga.id,
      empresa: empresaNome,
      candidatos: Array.isArray(candidatos_associados) ? candidatos_associados : [],
      perfis_ideais: Array.isArray(perfis_ideais) ? perfis_ideais : [],
      categorias_ideais: Array.isArray(categorias_ideais) ? categorias_ideais : [],
      qualidades_ideais: combinedQuals,
      kan_ideal: JSON.stringify(Array.isArray(kan_ideal) ? kan_ideal : []),
      equipe: equipe_associada || null,
      historico_harmonia:
        historico_harmonia !== undefined
          ? historico_harmonia
          : existingProc?.historico_harmonia || [],
      tenant_id: resolvedTenantId,
      updated_at: new Date().toISOString(),
    };

    let savedProcId = existingProc?.id;
    if (existingProc?.id) {
      await supabaseAdmin
        .from("processos_seletivos")
        .update(procPayload)
        .eq("id", existingProc.id);
    } else {
      const { data: newProc } = await supabaseAdmin
        .from("processos_seletivos")
        .insert({
          ...procPayload,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();
      if (newProc?.id) savedProcId = newProc.id;
    }

    // Retornar objeto completo estruturado como VagaData
    const completeVaga = {
      id: Number(savedVaga.id),
      processo_id: savedProcId ? Number(savedProcId) : undefined,
      nome_vaga: String(savedVaga.nome_vaga),
      senioridade: String(savedVaga.senioridade || "Senior"),
      link_vaga: savedVaga.link_vaga ? String(savedVaga.link_vaga) : undefined,
      empresa: String(savedVaga.empresa || empresaNome),
      departamento: String(savedVaga.departamento || "Comercial"),
      kan_ideal: Array.isArray(kan_ideal) && kan_ideal.length > 0 ? kan_ideal : parseArr(savedVaga.kan_ideal),
      perfis_ideais: Array.isArray(perfis_ideais) && perfis_ideais.length > 0 ? perfis_ideais : parseArr(savedVaga.perfis_ideais),
      categorias_ideais: Array.isArray(categorias_ideais) && categorias_ideais.length > 0 ? categorias_ideais : parseArr(savedVaga.categorias_ideais),
      qualidades_ideais: Array.isArray(qualidades_ideais) ? qualidades_ideais : [],
      soft_skills_ideais: Array.isArray(soft_skills_ideais) ? soft_skills_ideais : [],
      descricao_vaga: String(savedVaga.descricao_vaga || ""),
      equipe_associada: equipe_associada || undefined,
      candidatos_associados: Array.isArray(candidatos_associados) ? candidatos_associados : [],
      historico_harmonia: Array.isArray(historico_harmonia) ? historico_harmonia : (existingProc?.historico_harmonia || []),
      created_at: String(savedVaga.created_at || new Date().toISOString()),
      tenant_id: String(savedVaga.tenant_id || resolvedTenantId),
    };

    return NextResponse.json({
      success: true,
      vaga: completeVaga,
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
    const isAdmin = searchParams.get("admin") === "true";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Ação não permitida: A exclusão de vagas e processos seletivos é restrita ao Painel de Controle com perfil Administrador." },
        { status: 403 }
      );
    }
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
