import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { invalidateDiagnosticoCache } from "@/lib/diagnostico-cache";

export const dynamic = "force-dynamic";

const TABELAS_METADATA: Record<
  string,
  {
    nomeAmigavel: string;
    grupo: "Diagnóstico Ampliado" | "Pesos & Regras de Cálculo" | "Tabelas Complementares" | "Cadastros Principais (CRUD Admin)";
    primaryKey: string;
    descricao: string;
    orderColumn?: string;
  }
> = {
  atributos_ampliado: {
    nomeAmigavel: "Atributos Ampliados",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Definições corporativas de RH, classes, dimensões, eixos, soft skills correspondentes, antídotos e riscos prioritários (169 registros).",
    orderColumn: "id",
  },
  perfil_categoria_ampliado: {
    nomeAmigavel: "Perfis & Categorias",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Descrição completa, resumo executivo, forças centrais associadas, risco prioritário e contextos organizacionais de maior aderência (98 registros).",
    orderColumn: "id",
  },
  categoria_ampliado: {
    nomeAmigavel: "Categorias & Eixos",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Descrição detalhada no ambiente corporativo, resumo executivo e classificação por Eixo comportamental para cada categoria (19 registros).",
    orderColumn: "id",
  },
  perfil_foco_ampliado: {
    nomeAmigavel: "Perfis & Novos Focos",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Direcionamento, influência, autonomia da equipe, processos, disciplina, escuta, mobilização e eixos metodológicos por perfil (7 registros).",
    orderColumn: "id",
  },
  riscos_ampliado: {
    nomeAmigavel: "Riscos Comportamentais",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Classificação analítica de riscos, origens prováveis, gatilhos de ativação, comportamentos observáveis, impactos no time e PDI (149 registros).",
    orderColumn: "id",
  },
  forcas_centrais: {
    nomeAmigavel: "Forças Centrais",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Mapeamento de como cada força central se manifesta no comportamento, seu valor concreto para o negócio e riscos de excesso (48 registros).",
    orderColumn: "id",
  },
  soft_skills_ampliado: {
    nomeAmigavel: "Soft Skills Expandidas",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Catálogo de soft skills corporativas novas cruzadas com as soft skills base e descrições operacionais (474 registros).",
    orderColumn: "id",
  },
  matriz_ampliado: {
    nomeAmigavel: "Matriz Ampliada (Arquétipos 1 a 31)",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "resultado",
    descricao:
      "Mapeamento completo de arquétipos, motivação, expressão, destino, missão, dia natalício, talentos ocultos e desafios por resultado (1 a 31).",
    orderColumn: "resultado",
  },
  atributos_comparacao: {
    nomeAmigavel: "De-Para Comparativo",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao:
      "Matriz comparativa de correspondência entre Atributos Ampliados e a base legada.",
    orderColumn: "id",
  },
  peso: {
    nomeAmigavel: "Pesos por Campo / Indicador",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "campo",
    descricao:
      "Pesos aplicados a cada campo metodológico (Motivação, Impressão, Expressão, Destino, Missão, etc.) no cálculo dos eixos e perfis.",
    orderColumn: "campo",
  },
  peso_categoria: {
    nomeAmigavel: "Pesos por Categoria",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "id",
    descricao:
      "Pesos numéricos atribuídos por categoria comportamental.",
    orderColumn: "id",
  },
  repeticao: {
    nomeAmigavel: "Regras de Repetição KAN",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "repeticao",
    descricao:
      "Bônus e direcionamento atribuídos a repetições de vibrações dominantes no mapa.",
    orderColumn: "repeticao",
  },
  kans: {
    nomeAmigavel: "Definições dos 3 KANs",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "numero",
    descricao:
      "Forças essenciais KAN (Criação, Movimento, Finalidade) e suas descrições metodológicas.",
    orderColumn: "numero",
  },
  atributos: {
    nomeAmigavel: "Atributos Base (Originais)",
    grupo: "Tabelas Complementares",
    primaryKey: "atributo",
    descricao: "Tabela original de atributos, perfis, categorias e qualidades.",
    orderColumn: "atributo",
  },
  matriz: {
    nomeAmigavel: "Matriz Base (Original)",
    grupo: "Tabelas Complementares",
    primaryKey: "resultado",
    descricao: "Matriz cabalística original (resultados 1 a 31).",
    orderColumn: "resultado",
  },
  qualidades: {
    nomeAmigavel: "Qualidades Comportamentais",
    grupo: "Tabelas Complementares",
    primaryKey: "id",
    descricao: "Descrições de qualidades e forças de atuação em equipe.",
    orderColumn: "id",
  },
  desafios: {
    nomeAmigavel: "Desafios de Aniversário",
    grupo: "Tabelas Complementares",
    primaryKey: "dia_nascimento",
    descricao: "Mapeamento de desafios comportamentais por dia de nascimento (1 a 31).",
    orderColumn: "dia_nascimento",
  },

  // 4. Cadastros Principais (CRUD Completo com Exclusão no Painel de Controle)
  mapas_salvos: {
    nomeAmigavel: "Talentos (Mapas Salvos)",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Cadastro de talentos corporativos, cargos, empresas e perfis KAN gravados no Supabase.",
    orderColumn: "nome",
  },
  processos_seletivos: {
    nomeAmigavel: "Processos Seletivos",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Processos seletivos, pipeline de candidatos e compatibilidade com vagas.",
    orderColumn: "id",
  },
  vagas: {
    nomeAmigavel: "Vagas Corporativas",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Vagas abertas com requisitos KAN, senioridade e departamentos.",
    orderColumn: "id",
  },
  hierarquia_departamentos: {
    nomeAmigavel: "Departamentos (Hierarquia)",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Árvore de governança, departamentos e organograma corporativo.",
    orderColumn: "ordem",
  },
  equipes: {
    nomeAmigavel: "Equipes Cadastradas",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Equipes, departamentos associados, líderes e integrantes.",
    orderColumn: "nome",
  },
};

/**
 * GET /api/admin/tabelas?tabela=<nome>&limit=<limit>&offset=<offset>&q=<search>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tabela = searchParams.get("tabela") || "atributos_ampliado";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10), 1), 1000);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const meta = TABELAS_METADATA[tabela];
    if (!meta) {
      return NextResponse.json(
        {
          error: `Tabela '${tabela}' não é permitida ou não existe.`,
          tabelasDisponiveis: Object.keys(TABELAS_METADATA),
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Query rows
    let queryBuilder = supabase
      .from(tabela)
      .select("*", { count: "exact" });

    if (meta.orderColumn) {
      queryBuilder = queryBuilder.order(meta.orderColumn, { ascending: true });
    }

    // Limit and range
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      return NextResponse.json(
        { error: `Erro ao consultar tabela '${tabela}': ${error.message}` },
        { status: 500 }
      );
    }

    // Identify columns
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    // Optional text filter in-memory if query param provided
    let records = data || [];
    if (query) {
      records = records.filter((row: Record<string, unknown>) => {
        return Object.values(row).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    return NextResponse.json({
      tabela,
      metadata: meta,
      totalCount: count ?? records.length,
      limit,
      offset,
      columns,
      records,
      tabelasDisponiveis: Object.entries(TABELAS_METADATA).map(([key, info]) => ({
        key,
        nome: info.nomeAmigavel,
        grupo: info.grupo,
        primaryKey: info.primaryKey,
        descricao: info.descricao,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro inesperado ao consultar tabela administrativa.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tabelas
 * Atualiza um registro existente na tabela selecionada do Supabase.
 * Body: { tabela, pkValue, updates, usuario }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { tabela, pkValue, updates, usuario } = body;

    if (!tabela || pkValue === undefined || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Parâmetros 'tabela', 'pkValue' e 'updates' são obrigatórios." },
        { status: 400 }
      );
    }

    const meta = TABELAS_METADATA[tabela];
    if (!meta) {
      return NextResponse.json(
        { error: `Tabela '${tabela}' não é permitida para edição.` },
        { status: 400 }
      );
    }

    // Clean updates: avoid updating primaryKey itself if not needed or created_at
    const cleanUpdates = { ...updates };
    delete cleanUpdates.created_at;
    delete cleanUpdates[meta.primaryKey];

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from(tabela)
      .update(cleanUpdates)
      .eq(meta.primaryKey, pkValue)
      .select();

    if (error) {
      return NextResponse.json(
        { error: `Erro no Supabase ao atualizar '${tabela}': ${error.message}` },
        { status: 500 }
      );
    }

    // Invalida cache de memória do Diagnóstico Ampliado
    try {
      invalidateDiagnosticoCache();
    } catch {
      // cache clearing fallback
    }

    return NextResponse.json({
      success: true,
      message: `Registro na tabela '${meta.nomeAmigavel}' atualizado com sucesso no Supabase.`,
      tabela,
      pkColumn: meta.primaryKey,
      pkValue,
      updatedRecord: data?.[0] || cleanUpdates,
      updatedBy: usuario || "adminkan",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro inesperado ao salvar alterações no Supabase.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tabelas
 * Insere um novo registro na tabela selecionada do Supabase.
 * Body: { tabela, record, usuario }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tabela, record, usuario } = body;

    if (!tabela || !record || typeof record !== "object") {
      return NextResponse.json(
        { error: "Parâmetros 'tabela' e 'record' são obrigatórios." },
        { status: 400 }
      );
    }

    const meta = TABELAS_METADATA[tabela];
    if (!meta) {
      return NextResponse.json(
        { error: `Tabela '${tabela}' não é permitida.` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from(tabela)
      .insert(record)
      .select();

    if (error) {
      return NextResponse.json(
        { error: `Erro no Supabase ao inserir em '${tabela}': ${error.message}` },
        { status: 500 }
      );
    }

    try {
      invalidateDiagnosticoCache();
    } catch {
      // cache clearing fallback
    }

    return NextResponse.json({
      success: true,
      message: `Novo registro inserido com sucesso na tabela '${meta.nomeAmigavel}' do Supabase.`,
      tabela,
      insertedRecord: data?.[0] || record,
      createdBy: usuario || "adminkan",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro inesperado ao inserir registro no Supabase.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tabelas?tabela=<nome>&pkValue=<val>
 * Exclui um registro da tabela selecionada do Supabase.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tabela = searchParams.get("tabela");
    const pkValue = searchParams.get("pkValue");

    if (!tabela || pkValue === null || pkValue === undefined) {
      return NextResponse.json(
        { error: "Parâmetros 'tabela' e 'pkValue' são obrigatórios." },
        { status: 400 }
      );
    }

    const meta = TABELAS_METADATA[tabela];
    if (!meta) {
      return NextResponse.json(
        { error: `Tabela '${tabela}' não é permitida.` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Cascade delete related records if applicable
    if (tabela === "mapas_salvos") {
      const { data: talRow } = await supabase.from("mapas_salvos").select("nome").eq("id", pkValue).maybeSingle();
      if (talRow?.nome) {
        await supabase.from("mapas_salvos_valores").delete().eq("nome", talRow.nome);
      }
    } else if (tabela === "vagas") {
      await supabase.from("processos_seletivos").delete().eq("vaga_id", Number(pkValue));
    }

    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq(meta.primaryKey, pkValue);

    if (error) {
      return NextResponse.json(
        { error: `Erro ao excluir registro em '${tabela}': ${error.message}` },
        { status: 500 }
      );
    }

    try {
      invalidateDiagnosticoCache();
    } catch {
      // cache clearing fallback
    }

    return NextResponse.json({
      success: true,
      message: `Registro removido com sucesso da tabela '${meta.nomeAmigavel}'.`,
      tabela,
      pkValue,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro inesperado ao excluir registro.",
      },
      { status: 500 }
    );
  }
}
