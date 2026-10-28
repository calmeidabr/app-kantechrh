import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { VAGAS_MOCK } from "@/lib/mock-data";

/**
 * GET /api/vagas
 * Carrega vagas de `public.vagas` combinadas com `public.processos_seletivos`.
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const [{ data: vagasData, error: vagasErr }, { data: procData }] =
      await Promise.all([
        supabaseAdmin.from("vagas").select("*").order("id", { ascending: false }),
        supabaseAdmin.from("processos_seletivos").select("*"),
      ]);

    if (vagasErr || !vagasData || vagasData.length === 0) {
      return NextResponse.json({
        source: vagasErr ? "mock-fallback" : "mock-empty-db",
        warning: vagasErr?.message,
        vagas: VAGAS_MOCK,
      });
    }

    const procMap = new Map<number, Record<string, unknown>>();
    if (procData) {
      for (const p of procData) {
        if (p.vaga_id) procMap.set(Number(p.vaga_id), p as Record<string, unknown>);
      }
    }

    const vagas = vagasData.map((row: Record<string, unknown>) => {
      const id = Number(row.id);
      const proc = procMap.get(id);

      const parseArr = (val: unknown): string[] => {
        if (Array.isArray(val)) return val.map(String);
        if (typeof val === "string" && val.trim()) {
          if (val.startsWith("[")) {
            try {
              return JSON.parse(val).map(String);
            } catch {
              return [val];
            }
          }
          return val.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return [];
      };

      return {
        id,
        nome_vaga: String(row.nome_vaga || "Vaga Corporativa"),
        senioridade: String(row.senioridade || "Senior"),
        link_vaga: row.link_vaga ? String(row.link_vaga) : undefined,
        empresa: String(row.empresa || "KantechRH Enterprise"),
        departamento: String(row.departamento || "Produto & Inovação"),
        kan_ideal: parseArr(proc?.kan_ideal ?? row.kan_ideal),
        perfis_ideais: parseArr(proc?.perfis_ideais ?? row.perfis_ideais),
        categorias_ideais: parseArr(proc?.categorias_ideais ?? row.categorias_ideais),
        qualidades_ideais: parseArr(proc?.qualidades_ideais ?? row.qualidades_ideais),
        descricao_vaga: String(row.descricao_vaga || ""),
        equipe_associada: proc?.equipe_nome ? String(proc.equipe_nome) : undefined,
        candidatos_associados: parseArr(proc?.candidatos),
        created_at: String(row.created_at || new Date().toISOString()),
      };
    });

    return NextResponse.json({
      source: "supabase",
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
 * Cria ou atualiza uma vaga em `public.vagas` e seus candidatos/requisitos em `public.processos_seletivos`.
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
      candidatos_associados,
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
      empresa: empresa || "KantechRH Enterprise",
      departamento: departamento || "Diretoria Executiva",
      kan_ideal: Array.isArray(kan_ideal) ? kan_ideal.join(", ") : String(kan_ideal || ""),
      perfis_ideais: Array.isArray(perfis_ideais) ? perfis_ideais : [],
      categorias_ideais: Array.isArray(categorias_ideais) ? categorias_ideais : [],
      qualidades_ideais: Array.isArray(qualidades_ideais) ? qualidades_ideais : [],
      descricao_vaga: descricao_vaga || "",
      updated_at: new Date().toISOString(),
    };

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

    if (savedVaga?.id && Array.isArray(candidatos_associados)) {
      await supabaseAdmin.from("processos_seletivos").upsert(
        {
          vaga_id: savedVaga.id,
          empresa: empresa || "KantechRH Enterprise",
          candidatos: candidatos_associados,
          perfis_ideais: Array.isArray(perfis_ideais) ? perfis_ideais : [],
          categorias_ideais: Array.isArray(categorias_ideais) ? categorias_ideais : [],
          qualidades_ideais: Array.isArray(qualidades_ideais) ? qualidades_ideais : [],
          kan_ideal: Array.isArray(kan_ideal) ? kan_ideal : [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "vaga_id" }
      );
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
