import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, callMamEngine, normalizeKey } from "@/lib/supabase";
import { TALENTOS_MOCK, TalentoProfile, KanType } from "@/lib/mock-data";
import { obterVerticesTriangulo } from "@/lib/numerologia";

export const dynamic = "force-dynamic";

const SOFT_SKILL_COLORS: Record<string, string> = {
  Líder: "#510851",
  Lider: "#510851",
  Resultado: "#ea580c",
  Executor: "#8b5cf6",
  Criativo: "#10b981",
  Comunicador: "#6366f1",
  Influenciador: "#f59e0b",
  Vendedor: "#ec4899",
};

function cleanStr(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (!s || s.toLowerCase() === "nan" || s.toLowerCase() === "none" || s.toLowerCase() === "null") {
    return fallback;
  }
  return s;
}

function mapKanName(kanVal: unknown): KanType {
  const s = cleanStr(kanVal).toUpperCase();
  if (s.includes("MOVIMENTO")) return "Movimento";
  if (s.includes("CRIA") || s.includes("CRIACAO")) return "Criação";
  if (s.includes("FINALIDADE")) return "Finalidade";
  const num = parseInt(s, 10);
  if (num === 3) return "Criação";
  if (num === 6) return "Movimento";
  if (num === 9) return "Finalidade";
  return "Finalidade";
}

function mapKanNumberFromName(kanName: string, rawVal?: unknown): number {
  const s = cleanStr(rawVal);
  const match = s.match(/\d+/);
  if (match) {
    const n = parseInt(match[0], 10);
    if (n >= 1 && n <= 22) return n;
  }
  if (kanName === "Criação") return 3;
  if (kanName === "Movimento") return 6;
  return 9;
}

function normalizeProfileLabel(p: string): string {
  const norm = normalizeKey(p);
  if (norm.includes("lider")) return "Lider";
  if (norm.includes("resultado")) return "Resultado";
  if (norm.includes("executor")) return "Executor";
  if (norm.includes("criativo")) return "Criativo";
  if (norm.includes("comunicador")) return "Comunicador";
  if (norm.includes("influenciador")) return "Influenciador";
  if (norm.includes("vendedor")) return "Vendedor";
  return p.trim();
}

/**
 * Converte um registro bruto de `public.mapas_salvos` + `public.mapas_salvos_valores`
 * para o formato `TalentoProfile` consumido pelo frontend Next.js.
 */
function mapSupabaseRowToTalento(
  row: Record<string, unknown>,
  idx: number,
  valoresRow?: Record<string, unknown>
): TalentoProfile & {
  tenant_id?: string;
  valores_mapa?: Record<string, string>;
} {
  const nome = cleanStr(row.nome, `Talento #${idx + 1}`);
  const pJsonRaw = row.perfil_json;

  let kanNome: KanType = "Finalidade";
  let kanNumero = 8;
  let estrutural = 1;
  let direcionamento = 7;
  let perfisLista: string[] = [];
  let categoriasLista: string[] = [];
  let qualidadesLista: string[] = [];
  const indicadoresPerfil: { Campo: string; Valor: string; Descricao: string }[] = [];
  const mapaDetalhado: Record<string, string> = {};

  if (typeof pJsonRaw === "string" && pJsonRaw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(pJsonRaw) as Array<Record<string, unknown>>;
      for (const item of parsed) {
        const campoOrig = String(item.Campo || "");
        const campoNorm = normalizeKey(campoOrig);
        const rawVal = cleanStr(item.Valor ?? item.Resultado);
        const rawDesc = cleanStr(item.Descricao ?? item.Explicacao);

        if (campoNorm === "kan") {
          kanNome = mapKanName(rawVal);
          kanNumero = mapKanNumberFromName(kanNome, rawVal);
          indicadoresPerfil.push({
            Campo: "Força Central KAN",
            Valor: kanNome,
            Descricao:
              rawDesc.replace(/<br\s*\/?>/gi, " ") ||
              `Força primordial ${kanNome} identificada pelo motor KAN.`,
          });
        } else if (campoNorm === "estrutural") {
          const n = parseInt(rawVal, 10);
          if (!isNaN(n)) estrutural = n;
        } else if (campoNorm === "direcionamento") {
          const n = parseInt(rawVal, 10);
          if (!isNaN(n)) direcionamento = n;
        } else if (campoNorm === "perfil") {
          perfisLista = rawVal
            .split(",")
            .map((s) => normalizeProfileLabel(s))
            .filter(Boolean);
          indicadoresPerfil.push({
            Campo: "Perfil Comportamental",
            Valor: perfisLista.join(", "),
            Descricao:
              rawDesc.replace(/<br\s*\/?>/gi, " ") ||
              "Vetor comportamental dominante.",
          });
        } else if (campoNorm === "categoria") {
          categoriasLista = rawVal
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          indicadoresPerfil.push({
            Campo: "Categoria Principal",
            Valor: categoriasLista.join(", "),
            Descricao:
              rawDesc.replace(/<br\s*\/?>/gi, " ") ||
              "Estilo de atuação predominante.",
          });
        } else if (campoNorm === "qualidades") {
          qualidadesLista = rawVal
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          indicadoresPerfil.push({
            Campo: "Qualidades & Suporte",
            Valor: qualidadesLista.join(", "),
            Descricao:
              rawDesc.replace(/<br\s*\/?>/gi, " ").replace(/<\/?b>/gi, "") ||
              "Competências naturais de suporte.",
          });
        } else if (campoNorm === "fortaleza") {
          if (rawVal) {
            indicadoresPerfil.push({
              Campo: "Fortaleza Comportamental",
              Valor: rawVal,
              Descricao: rawDesc || "Potencial de destaque na operação.",
            });
          }
        } else if (campoNorm === "desafio" || campoNorm === "riscocomportamental") {
          if (rawVal) {
            indicadoresPerfil.push({
              Campo: "Ponto de Atenção na Gestão",
              Valor: rawVal,
              Descricao: rawDesc || "Fator de atenção para gestão de liderança.",
            });
          }
        } else if (campoOrig.includes("Mapa:")) {
          const k = campoOrig.split("Mapa:")[1]?.trim();
          if (k && rawVal) mapaDetalhado[k] = rawVal;
        }
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  // Hydrate from mapas_salvos_valores when available
  if (valoresRow) {
    if (valoresRow.kan) {
      kanNome = mapKanName(valoresRow.kan);
      kanNumero = mapKanNumberFromName(kanNome, valoresRow.kan);
    }
    if (!perfisLista.length && valoresRow.perfil) {
      perfisLista = cleanStr(valoresRow.perfil)
        .split(",")
        .map((s) => normalizeProfileLabel(s))
        .filter(Boolean);
    }
    if (!categoriasLista.length && valoresRow.categoria) {
      categoriasLista = cleanStr(valoresRow.categoria)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!qualidadesLista.length && valoresRow.qualidades) {
      qualidadesLista = cleanStr(valoresRow.qualidades)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (valoresRow.estrutural) {
      const n = parseInt(cleanStr(valoresRow.estrutural), 10);
      if (!isNaN(n)) estrutural = n;
    }
    if (valoresRow.direcionamento) {
      const n = parseInt(cleanStr(valoresRow.direcionamento), 10);
      if (!isNaN(n)) direcionamento = n;
    }
  }

  if (!perfisLista.length) perfisLista = ["Lider", "Resultado", "Executor"];
  if (!categoriasLista.length) categoriasLista = ["Realizador", "Analítico"];
  if (!qualidadesLista.length) qualidadesLista = ["Execução", "Análise", "Organização"];

  // Build qualitative indicators if perfil_json was not present
  if (indicadoresPerfil.length === 0) {
    indicadoresPerfil.push(
      {
        Campo: "Força Central KAN",
        Valor: kanNome,
        Descricao:
          kanNome === "Movimento"
            ? "Versatilidade cognitiva, adaptabilidade rápida a mudanças e facilidade para conectar diferentes áreas."
            : kanNome === "Criação"
            ? "Estímulo para criar, estruturar processos inovadores e desenvolver soluções técnicas com precisão."
            : "Orientação para entregas concretas, governança, visão sistêmica e capacidade de realização executiva.",
      },
      {
        Campo: "Perfil Comportamental",
        Valor: perfisLista.join(", "),
        Descricao: `Predominância nos vetores comportamentais de ${perfisLista.join(", ")}.`,
      },
      {
        Campo: "Categoria Principal",
        Valor: categoriasLista.join(", "),
        Descricao: `Atuação caracterizada pelo estilo ${categoriasLista.join(", ")}.`,
      },
      {
        Campo: "Qualidades & Suporte",
        Valor: qualidadesLista.join(", "),
        Descricao: `Competências naturais de sustentação em ${qualidadesLista.join(", ")}.`,
      }
    );
  }

  const dataNascClean = cleanStr(row.data_nascimento, "01/01/1990");
  const calcTri = obterVerticesTriangulo(nome, dataNascClean);
  const distinct = calcTri.vertices;
  const v1 = calcTri.kanNumero || distinct[0];
  estrutural = calcTri.estrutural || estrutural;
  direcionamento = calcTri.direcionamento || direcionamento;
  if ([3, 6, 9].includes(calcTri.kanNumero)) {
    kanNome = mapKanName(calcTri.kanNumero);
  }

  const allSevenProfiles = [
    "Líder",
    "Resultado",
    "Executor",
    "Criativo",
    "Comunicador",
    "Influenciador",
    "Vendedor",
  ];
  const softSkills = allSevenProfiles.map((p, i) => {
    const rankIdx = perfisLista.findIndex(
      (pl) => normalizeKey(pl) === normalizeKey(p)
    );
    const baseScore =
      rankIdx === 0
        ? 95
        : rankIdx === 1
        ? 89
        : rankIdx === 2
        ? 84
        : rankIdx > 2
        ? 79
        : 68 - (i % 4) * 3;
    return {
      perfil: p,
      score: Math.max(55, Math.min(98, baseScore)),
      cor: SOFT_SKILL_COLORS[p] || "#510851",
    };
  });

  const aiText = cleanStr(row.ai_diagnosis);
  const aiParagraphs = aiText
    ? aiText.split(/\n+/).filter(Boolean)
    : [
        `O perfil corporativo de ${nome} apresenta predominância na força KAN ${kanNome}, evidenciando alta sinergia com desafios estratégicos e operacionais.`,
        `Destaca-se nos vetores comportamentais de ${perfisLista.join(", ")}, com estilo ${categoriasLista.join(", ")} e forte capacidade de entrega em ${qualidadesLista.join(", ")}.`,
      ];

  const profissaoClean = cleanStr(row.profissao) || cleanStr(row.cargo) || "Especialista Corporativo";
  const cargoClean = cleanStr(row.cargo) || profissaoClean;
  const grupoClean = cleanStr(row.grupo) || cleanStr(row.departamento) || "Geral";
  const deptoClean = cleanStr(row.departamento) || grupoClean;
  const empresaClean = cleanStr(row.empresa) || "Mundo Kan";

  const valoresMapa: Record<string, string> = {
    motivacao: cleanStr(valoresRow?.motivacao || mapaDetalhado["Motivação"]),
    impressao: cleanStr(valoresRow?.impressao || mapaDetalhado["Impressão"]),
    expressao: cleanStr(valoresRow?.expressao || mapaDetalhado["Expressão"]),
    destino: cleanStr(valoresRow?.destino || mapaDetalhado["Destino"]),
    missao: cleanStr(valoresRow?.missao || mapaDetalhado["Missão"]),
    numero_psiquico: cleanStr(valoresRow?.numero_psiquico || mapaDetalhado["Número Psíquico"]),
    dia_natalicio: cleanStr(valoresRow?.dia_natalicio),
    licoes_carmicas: cleanStr(valoresRow?.licoes_carmicas || mapaDetalhado["Lições Cármicas"]),
    dividas_carmicas: cleanStr(valoresRow?.dividas_carmicas || mapaDetalhado["Dívidas Cármicas"]),
    tendencias_ocultas: cleanStr(valoresRow?.tendencias_ocultas || mapaDetalhado["Tendências Ocultas"]),
    resposta_subconsciente: cleanStr(valoresRow?.resposta_subconsciente || mapaDetalhado["Resposta Subconsciente"]),
    repeticao_1: cleanStr(valoresRow?.repeticao_1),
    repeticao_2: cleanStr(valoresRow?.repeticao_2),
  };

  const rowId = String(row.id || idx + 1);

  return {
    id: rowId,
    codigo: String(10000000 + ((Number(row.id) || idx + 1) * 7919) % 89999999),
    nome,
    email: `${normalizeKey(nome).slice(0, 16) || "talento"}@mundokan.com.br`,
    data_nascimento: cleanStr(row.data_nascimento, "01/01/1990"),
    profissao: profissaoClean,
    cargo: cargoClean,
    grupo: grupoClean,
    departamento: deptoClean,
    empresa: empresaClean,
    status: "Ativo",
    avatar: `/api/talentos/foto?id=${encodeURIComponent(rowId)}&nome=${encodeURIComponent(nome)}`,
    linkedin_url: cleanStr(row.linkedin_url),
    experiencias: cleanStr(row.experiencias),
    kan_numero: v1,
    kan_nome: kanNome,
    estrutural: estrutural || distinct[1],
    direcionamento: direcionamento || distinct[2],
    perfil_dominante: `${perfisLista[0] || "Líder"} ${categoriasLista[0] || "Realizador"}`,
    perfis_lista: perfisLista,
    categorias_lista: categoriasLista,
    qualidades_lista: qualidadesLista,
    vertices_triangulo: [distinct[0], distinct[1], distinct[2]],
    aderencia_vaga: 88 + (idx % 10),
    indicadores_perfil: indicadoresPerfil,
    soft_skills: softSkills,
    ai_diagnosis: aiParagraphs,
    tenant_id: cleanStr(row.tenant_id, "00000000-0000-0000-0000-000000000000"),
    valores_mapa: valoresMapa,
  };
}

/**
 * GET /api/talentos
 * Lista todos os talentos da tabela `public.mapas_salvos` + `public.mapas_salvos_valores` no Supabase (~502 perfis).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    const isAdminMaster = searchParams.get("admin") === "true";

    const supabaseAdmin = getSupabaseAdmin();

    let mapasQuery = supabaseAdmin
      .from("mapas_salvos")
      .select(
        "id, nome, data_nascimento, profissao, cargo, grupo, empresa, departamento, linkedin_url, experiencias, lider, perfil_json, ai_diagnosis, tenant_id"
      )
      .order("nome", { ascending: true })
      .limit(1000);

    if (
      tenantId &&
      !isAdminMaster &&
      tenantId !== "00000000-0000-0000-0000-000000000000"
    ) {
      mapasQuery = mapasQuery.eq("tenant_id", tenantId);
    }

    const [{ data: mapasData, error: mapasError }, { data: valoresData }] =
      await Promise.all([
        mapasQuery,
        supabaseAdmin.from("mapas_salvos_valores").select("*").limit(1000),
      ]);

    if (mapasError) {
      return NextResponse.json({
        source: "mock-fallback",
        warning: mapasError.message,
        count: TALENTOS_MOCK.length,
        talentos: TALENTOS_MOCK,
      });
    }

    if (!mapasData || mapasData.length === 0) {
      return NextResponse.json({
        source: "mock-empty-db",
        count: 0,
        talentos: [],
      });
    }

    const valoresMap = new Map<string, Record<string, unknown>>();
    if (valoresData) {
      for (const vRow of valoresData) {
        if (vRow.nome) {
          valoresMap.set(String(vRow.nome).trim(), vRow);
          valoresMap.set(String(vRow.nome).trim().toLowerCase(), vRow);
        }
      }
    }

    const talentos = mapasData.map((row, idx) => {
      const nomeKey = String(row.nome || "").trim();
      const valRow =
        valoresMap.get(nomeKey) || valoresMap.get(nomeKey.toLowerCase());
      return mapSupabaseRowToTalento(
        row as Record<string, unknown>,
        idx,
        valRow
      );
    });

    return NextResponse.json({
      source: "supabase",
      count: talentos.length,
      talentos,
    });
  } catch (err) {
    return NextResponse.json({
      source: "mock-exception-fallback",
      error: err instanceof Error ? err.message : "Unknown error",
      count: TALENTOS_MOCK.length,
      talentos: TALENTOS_MOCK,
    });
  }
}

/**
 * POST /api/talentos
 * Cadastra ou atualiza um Talento no Supabase + calcula no `mam-kantechrh`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome,
      data_nascimento,
      profissao,
      cargo,
      grupo,
      departamento,
      empresa,
      linkedin_url,
      experiencias,
      lider,
      tenant_id,
    } = body;

    if (!nome || !data_nascimento) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome e data_nascimento (dd/mm/aaaa)." },
        { status: 400 }
      );
    }

    const mamResponse = await callMamEngine<Record<string, unknown>>(
      "/api/v1/calcular-completo",
      {
        nome,
        data_nascimento,
        cargo: cargo || profissao || "",
        empresa: empresa || "Mundo Kan",
      }
    );

    const calcData = mamResponse.ok && mamResponse.data ? mamResponse.data : null;

    const supabaseAdmin = getSupabaseAdmin();
    const perfilJsonStr = calcData?.perfil_json
      ? typeof calcData.perfil_json === "string"
        ? calcData.perfil_json
        : JSON.stringify(calcData.perfil_json)
      : null;

    const upsertMapaPayload: Record<string, unknown> = {
      nome: String(nome).trim(),
      data_nascimento: String(data_nascimento).trim(),
      profissao: profissao || cargo || "Especialista Corporativo",
      cargo: cargo || profissao || "Analista Sênior",
      grupo: grupo || departamento || "Geral",
      departamento: departamento || grupo || "Diretoria Executiva",
      empresa: empresa || "Mundo Kan",
      linkedin_url: linkedin_url || "",
      experiencias: experiencias || "",
      lider: Boolean(lider),
    };

    if (tenant_id) {
      upsertMapaPayload.tenant_id = tenant_id;
    }

    if (perfilJsonStr) {
      upsertMapaPayload.perfil_json = perfilJsonStr;
    }

    const { data: savedMapa, error: saveError } = await supabaseAdmin
      .from("mapas_salvos")
      .upsert(upsertMapaPayload, { onConflict: "nome" })
      .select()
      .single();

    if (calcData) {
      const vertices = Array.isArray(calcData.vertices_triangulo)
        ? calcData.vertices_triangulo
        : [8, 1, 7];

      await supabaseAdmin.from("mapas_salvos_valores").upsert(
        {
          nome: String(nome).trim(),
          data_nascimento: String(data_nascimento).trim(),
          kan: String(calcData.kan_nome || calcData.kan_numero || "FINALIDADE").toUpperCase(),
          perfil: Array.isArray(calcData.perfis_lista)
            ? calcData.perfis_lista.join(", ")
            : String(calcData.perfil || "Lider, Resultado"),
          categoria: Array.isArray(calcData.categorias_lista)
            ? calcData.categorias_lista.join(", ")
            : String(calcData.categoria || "Realizador"),
          qualidades: Array.isArray(calcData.qualidades_lista)
            ? calcData.qualidades_lista.join(", ")
            : String(calcData.qualidades || "Execução, Análise"),
          estrutural: String(calcData.estrutural ?? 1),
          direcionamento: String(calcData.direcionamento ?? 7),
          vertice_triangulo_1: String(vertices[0] ?? 8),
          vertice_triangulo_2: String(vertices[1] ?? 1),
          vertice_triangulo_3: String(vertices[2] ?? 7),
        },
        { onConflict: "nome" }
      );
    }

    return NextResponse.json({
      success: !saveError,
      mamEngineUsed: mamResponse.ok,
      mamEngineUrl: mamResponse.engineUrl,
      mamError: mamResponse.error,
      dbError: saveError?.message,
      calculated: calcData,
      savedRecord: savedMapa,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao processar cadastro de talento.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/talentos?nome=...
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
    await Promise.all([
      supabaseAdmin.from("mapas_salvos").delete().eq("nome", nome),
      supabaseAdmin.from("mapas_salvos_valores").delete().eq("nome", nome),
    ]);

    return NextResponse.json({ success: true, deleted: nome });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erro ao excluir talento.",
      },
      { status: 500 }
    );
  }
}
