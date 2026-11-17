import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, callMamEngine, normalizeKey } from "@/lib/supabase";
import { TALENTOS_MOCK, TalentoProfile, KanType, DetalheAtributoAuditoria } from "@/lib/mock-data";
import { invalidateDiagnosticoCache } from "@/lib/diagnostico-cache";
import { invalidateFotoCache, setFotoCache } from "@/lib/foto-cache";
import {
  calcularDetalhamentoAtributosServidor,
  calcularPerfilNumerologicoServidor,
  isDetalhamentoValido,
  normalizarKanNumero,
} from "@/lib/detalhamento-server";

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
  if (!isNaN(num)) {
    const kNorm = normalizarKanNumero(num);
    if (kNorm === 3) return "Criação";
    if (kNorm === 6) return "Movimento";
    return "Finalidade";
  }
  return "Finalidade";
}

function mapKanNumberFromName(kanName: string, rawVal?: unknown): 3 | 6 | 9 {
  if (kanName === "Criação") return 3;
  if (kanName === "Movimento") return 6;
  if (kanName === "Finalidade") return 9;
  const s = cleanStr(rawVal);
  const match = s.match(/\d+/);
  if (match) {
    const n = parseInt(match[0], 10);
    if (!isNaN(n)) return normalizarKanNumero(n);
  }
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
  const dataNascClean = cleanStr(row.data_nascimento, "01/01/1990");
  const calcPerfil = calcularPerfilNumerologicoServidor(nome, dataNascClean);
  const pJsonRaw = row.perfil_json;

  let kanNome: KanType = calcPerfil.kanNome;
  let kanNumero: number = calcPerfil.kanNumero;
  let estrutural: number = calcPerfil.estrutural;
  let direcionamento: number = calcPerfil.direcionamento;
  let perfisLista: string[] = [];
  let categoriasLista: string[] = [];
  let qualidadesLista: string[] = [];
  const indicadoresPerfil: { Campo: string; Valor: string; Descricao: string }[] = [];
  const mapaDetalhado: Record<string, string> = {};
  const detalhamentoAtributos: DetalheAtributoAuditoria[] = [];

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
        } else if (
          campoOrig === "DetalhamentoAtributosJSON" &&
          typeof rawVal === "string" &&
          rawVal.trim().startsWith("[")
        ) {
          try {
            const list = JSON.parse(rawVal) as Array<Record<string, unknown>>;
            for (const itemD of list) {
              detalhamentoAtributos.push({
                campo: cleanStr(itemD.campo || itemD.Campo),
                valor: cleanStr(itemD.valor || itemD.Valor),
                atributo: cleanStr(itemD.atributo || itemD.Atributo || itemD.Matriz),
                perfil: cleanStr(itemD.perfil || itemD.Perfil),
                categoria: cleanStr(itemD.categoria || itemD.Categoria),
                qualidade: cleanStr(itemD.qualidade || itemD.Qualidade),
                soft_skills: cleanStr(itemD.soft_skills || itemD["Soft Skills"]),
              });
            }
          } catch {
            // ignore
          }
        } else if (campoOrig.startsWith("Detalhamento:")) {
          const nomeCampo = campoOrig.replace("Detalhamento:", "").trim();
          detalhamentoAtributos.push({
            campo: nomeCampo,
            valor: rawVal,
            atributo: cleanStr(item.Atributo || item.Resultado || item.Matriz),
            perfil: cleanStr(item.Perfil),
            categoria: cleanStr(item.Categoria),
            qualidade: cleanStr(item.Qualidade),
            soft_skills: cleanStr(item.SoftSkills || item.soft_skills || item["Soft Skills"]),
          });
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
  }

  // O cálculo numerológico oficial a partir de nome + data_nascimento é sempre soberano para KAN, Estrutural, Direcionamento e Vértices
  kanNome = calcPerfil.kanNome;
  kanNumero = calcPerfil.kanNumero;
  estrutural = calcPerfil.estrutural;
  direcionamento = calcPerfil.direcionamento;

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

  const distinct: [number, number, number] = calcPerfil.vertices;
  const v1 = calcPerfil.kanNumero;

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

  const estruturalFinal = calcPerfil.estrutural;
  const direcionamentoFinal = calcPerfil.direcionamento;

  const valoresMapa: Record<string, string> = {
    motivacao: String(calcPerfil.motivacao),
    impressao: String(calcPerfil.impressao),
    expressao: String(calcPerfil.expressao),
    destino: String(calcPerfil.destino),
    missao: String(calcPerfil.missao),
    numero_psiquico: String(calcPerfil.numPsiquico),
    dia_natalicio: String(calcPerfil.diaNatalicio),
    triangulo: String(calcPerfil.triangulo),
    estrutural: String(estruturalFinal),
    direcionamento: String(direcionamentoFinal),
    licoes_carmicas: cleanStr(valoresRow?.licoes_carmicas || mapaDetalhado["Lições Cármicas"]),
    dividas_carmicas: cleanStr(valoresRow?.dividas_carmicas || mapaDetalhado["Dívidas Cármicas"]),
    tendencias_ocultas: cleanStr(valoresRow?.tendencias_ocultas || mapaDetalhado["Tendências Ocultas"]),
    resposta_subconsciente: cleanStr(valoresRow?.resposta_subconsciente || mapaDetalhado["Resposta Subconsciente"]),
    repeticao_1: String(calcPerfil.rep1),
    repeticao_2: String(calcPerfil.rep2),
  };

  const detalhamentoCalculado = calcularDetalhamentoAtributosServidor({
    nome,
    data_nascimento: dataNascClean,
    valores_mapa: valoresMapa,
    vertices_triangulo: [distinct[0], distinct[1], distinct[2]],
    estrutural: estruturalFinal,
    direcionamento: direcionamentoFinal,
    kan_numero: v1,
  });

  const rowId = String(row.id || idx + 1);

  return {
    id: rowId,
    codigo: String(10000000 + ((Number(row.id) || idx + 1) * 7919) % 89999999),
    nome,
    email: `${normalizeKey(nome).slice(0, 16) || "talento"}@mundokan.com.br`,
    data_nascimento: dataNascClean,
    profissao: profissaoClean,
    cargo: cargoClean,
    grupo: grupoClean,
    departamento: deptoClean,
    empresa: empresaClean,
    status: "Ativo",
    avatar: `/api/talentos/foto?id=${encodeURIComponent(rowId)}&nome=${encodeURIComponent(nome)}`,
    foto_base64: cleanStr(row.foto_base64) || undefined,
    linkedin_url: cleanStr(row.linkedin_url),
    experiencias: cleanStr(row.experiencias),
    kan_numero: v1,
    kan_nome: kanNome,
    estrutural: estruturalFinal,
    direcionamento: direcionamentoFinal,
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
    detalhamento_atributos: isDetalhamentoValido(detalhamentoCalculado)
      ? detalhamentoCalculado
      : isDetalhamentoValido(detalhamentoAtributos)
      ? detalhamentoAtributos
      : detalhamentoCalculado,
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

    // Enriquecer com cálculos isolados no container mam-kantechrh (scores_eixos, soft_skills_compativeis, vértices)
    const payloadEnrich = talentos.map((t) => ({
      id: t.id,
      nome: t.nome,
      data_nascimento: t.data_nascimento,
      kan_nome: t.kan_nome,
      perfis_lista: t.perfis_lista,
      categorias_lista: t.categorias_lista,
      qualidades_lista: t.qualidades_lista,
    }));

    const enrichRes = await callMamEngine<{
      items?: Array<{
        id: string;
        scores_eixos?: Record<string, number>;
        soft_skills_compativeis?: string[];
        vertices_triangulo?: [number, number, number];
        kan_nome?: string;
      }>;
    }>("/api/v1/enriquecer-talentos-lote", {
      talentos: payloadEnrich,
      incluir_vertices: true,
    });

    if (enrichRes.ok && enrichRes.data?.items) {
      const enrichMap = new Map(
        enrichRes.data.items.map((item) => [item.id, item])
      );
      for (const t of talentos) {
        const extra = enrichMap.get(t.id);
        if (extra) {
          if (extra.scores_eixos) t.scores_eixos = extra.scores_eixos;
          if (extra.soft_skills_compativeis)
            t.soft_skills_compativeis = extra.soft_skills_compativeis;
          if (
            Array.isArray(extra.vertices_triangulo) &&
            extra.vertices_triangulo.length === 3
          ) {
            t.vertices_triangulo = extra.vertices_triangulo;
          }
          if (extra.kan_nome) {
            t.kan_nome = mapKanName(extra.kan_nome);
          }
        }
      }
    }

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
      foto_base64,
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

    const nomeTrim = String(nome).trim();
    const dataNascTrim = String(data_nascimento).trim();

    const calcPerfilFallback = calcularPerfilNumerologicoServidor(
      nomeTrim,
      dataNascTrim
    );
    const detalhesFallback = calcularDetalhamentoAtributosServidor({
      nome: nomeTrim,
      data_nascimento: dataNascTrim,
    });

    // Extrai perfis, categorias e qualidades predominantes do detalhamento oficial
    const perfisDerivados = Array.from(
      new Set(
        detalhesFallback
          .map((d) => normalizeProfileLabel(d.perfil || ""))
          .filter(Boolean)
      )
    );
    const catsDerivadas = Array.from(
      new Set(
        detalhesFallback
          .map((d) => (d.categoria || "").trim())
          .filter(Boolean)
      )
    );
    const qualsDerivadas = Array.from(
      new Set(
        detalhesFallback
          .map((d) => (d.qualidade || "").trim())
          .filter(Boolean)
      )
    );

    const fallbackPerfilJsonList = [
      {
        Campo: "KAN",
        Valor: calcPerfilFallback.kanNome.toUpperCase(),
        Descricao: "",
        Resultado: calcPerfilFallback.kanNome.toUpperCase(),
      },
      {
        Campo: "Perfil",
        Valor: (perfisDerivados.length ? perfisDerivados : ["Lider", "Resultado"]).join(", "),
        Descricao: "",
        Resultado: (perfisDerivados.length ? perfisDerivados : ["Lider", "Resultado"]).join(", "),
      },
      {
        Campo: "Categoria",
        Valor: (catsDerivadas.length ? catsDerivadas : ["Realizador", "Analítico"]).join(", "),
        Descricao: "",
        Resultado: (catsDerivadas.length ? catsDerivadas : ["Realizador", "Analítico"]).join(", "),
      },
      {
        Campo: "Qualidades",
        Valor: (qualsDerivadas.length ? qualsDerivadas : ["Execução", "Análise"]).join(", "),
        Descricao: "",
        Resultado: (qualsDerivadas.length ? qualsDerivadas : ["Execução", "Análise"]).join(", "),
      },
      {
        Campo: "Estrutural",
        Valor: String(calcPerfilFallback.estrutural),
        Descricao: "",
        Resultado: String(calcPerfilFallback.estrutural),
      },
      {
        Campo: "Direcionamento",
        Valor: String(calcPerfilFallback.direcionamento),
        Descricao: "",
        Resultado: String(calcPerfilFallback.direcionamento),
      },
      {
        Campo: "REPETIÇÃO 1",
        Valor: String(calcPerfilFallback.rep1),
        Descricao: "",
        Resultado: String(calcPerfilFallback.rep1),
      },
      {
        Campo: "REPETIÇÃO 2",
        Valor: String(calcPerfilFallback.rep2),
        Descricao: "",
        Resultado: String(calcPerfilFallback.rep2),
      },
      {
        Campo: "DetalhamentoAtributosJSON",
        Valor: JSON.stringify(detalhesFallback),
        Descricao: "Detalhamento completo dos atributos e soft skills para auditoria",
        Resultado: "OK",
      },
    ];

    const calcData: Record<string, unknown> =
      mamResponse.ok && mamResponse.data
        ? mamResponse.data
        : {
            kan_numero: calcPerfilFallback.kanNumero,
            kan_nome: calcPerfilFallback.kanNome,
            estrutural: calcPerfilFallback.estrutural,
            direcionamento: calcPerfilFallback.direcionamento,
            vertices_triangulo: calcPerfilFallback.vertices,
            perfis_lista: perfisDerivados.length ? perfisDerivados : ["Lider", "Resultado"],
            categorias_lista: catsDerivadas.length ? catsDerivadas : ["Realizador", "Analítico"],
            qualidades_lista: qualsDerivadas.length ? qualsDerivadas : ["Execução", "Análise"],
            perfil_json: JSON.stringify(fallbackPerfilJsonList),
            valores_resumo: {
              kan: calcPerfilFallback.kanNome.toUpperCase(),
              perfil: (perfisDerivados.length ? perfisDerivados : ["Lider", "Resultado"]).join(", "),
              categoria: (catsDerivadas.length ? catsDerivadas : ["Realizador", "Analítico"]).join(", "),
              qualidades: (qualsDerivadas.length ? qualsDerivadas : ["Execução", "Análise"]).join(", "),
            },
          };

    const supabaseAdmin = getSupabaseAdmin();
    const perfilJsonStr = calcData?.perfil_json
      ? typeof calcData.perfil_json === "string"
        ? calcData.perfil_json
        : JSON.stringify(calcData.perfil_json)
      : JSON.stringify(fallbackPerfilJsonList);

    const upsertMapaPayload: Record<string, unknown> = {
      nome: nomeTrim,
      data_nascimento: dataNascTrim,
      profissao: profissao || cargo || "Especialista Corporativo",
      cargo: cargo || profissao || "Analista Sênior",
      grupo: grupo || departamento || "Geral",
      departamento: departamento || grupo || "Diretoria Executiva",
      empresa: empresa || "Mundo Kan",
      linkedin_url: linkedin_url || "",
      experiencias: experiencias || "",
      lider: Boolean(lider),
      perfil_json: perfilJsonStr,
      tenant_id: tenant_id || "00000000-0000-0000-0000-000000000000",
    };

    if (foto_base64) {
      upsertMapaPayload.foto_base64 = String(foto_base64).trim();
    }

    // Verifica se o talento já existe em mapas_salvos (como 'nome' não tem UNIQUE constraint no banco, fazemos select + update/insert)
    const { data: existingMapa } = await supabaseAdmin
      .from("mapas_salvos")
      .select("id")
      .ilike("nome", nomeTrim)
      .limit(1)
      .maybeSingle();

    let savedMapa = null;
    let saveError = null;

    if (existingMapa?.id) {
      const res = await supabaseAdmin
        .from("mapas_salvos")
        .update(upsertMapaPayload)
        .eq("id", existingMapa.id)
        .select()
        .single();
      savedMapa = res.data;
      saveError = res.error;
    } else {
      const res = await supabaseAdmin
        .from("mapas_salvos")
        .insert(upsertMapaPayload)
        .select()
        .single();
      savedMapa = res.data;
      saveError = res.error;
    }

    if (savedMapa && foto_base64) {
      setFotoCache(savedMapa.id, String(foto_base64).trim(), nomeTrim);
    }

    if (calcData) {
      const vertices = Array.isArray(calcData.vertices_triangulo)
        ? calcData.vertices_triangulo
        : calcPerfilFallback.vertices;

      const valoresPayload = {
        nome: nomeTrim,
        data_nascimento: dataNascTrim,
        kan: String(calcData.kan_nome || calcData.kan_numero || calcPerfilFallback.kanNome).toUpperCase(),
        perfil: Array.isArray(calcData.perfis_lista)
          ? calcData.perfis_lista.join(", ")
          : String(calcData.perfil || (perfisDerivados.length ? perfisDerivados.join(", ") : "Lider, Resultado")),
        categoria: Array.isArray(calcData.categorias_lista)
          ? calcData.categorias_lista.join(", ")
          : String(calcData.categoria || (catsDerivadas.length ? catsDerivadas.join(", ") : "Realizador")),
        qualidades: Array.isArray(calcData.qualidades_lista)
          ? calcData.qualidades_lista.join(", ")
          : String(calcData.qualidades || (qualsDerivadas.length ? qualsDerivadas.join(", ") : "Execução, Análise")),
        motivacao: String(calcPerfilFallback.motivacao),
        impressao: String(calcPerfilFallback.impressao),
        expressao: String(calcPerfilFallback.expressao),
        dia_natalicio: String(calcPerfilFallback.diaNatalicio),
        numero_psiquico: String(calcPerfilFallback.numPsiquico),
        destino: String(calcPerfilFallback.destino),
        missao: String(calcPerfilFallback.missao),
        estrutural: String(calcData.estrutural ?? calcPerfilFallback.estrutural),
        direcionamento: String(calcData.direcionamento ?? calcPerfilFallback.direcionamento),
        repeticao_1: String(calcPerfilFallback.rep1),
        repeticao_2: String(calcPerfilFallback.rep2),
        repeticao_mapa: String(calcPerfilFallback.rep2),
        vertice_triangulo_1: String(vertices[0] ?? calcPerfilFallback.vertices[0]),
        vertice_triangulo_2: String(vertices[1] ?? calcPerfilFallback.vertices[1]),
        vertice_triangulo_3: String(vertices[2] ?? calcPerfilFallback.vertices[2]),
      };

      const { data: existingVal } = await supabaseAdmin
        .from("mapas_salvos_valores")
        .select("id")
        .ilike("nome", nomeTrim)
        .limit(1)
        .maybeSingle();

      if (existingVal?.id) {
        await supabaseAdmin
          .from("mapas_salvos_valores")
          .update(valoresPayload)
          .eq("id", existingVal.id);
      } else {
        await supabaseAdmin.from("mapas_salvos_valores").insert(valoresPayload);
      }
    }

    try {
      invalidateDiagnosticoCache();
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: !saveError,
      mamEngineUsed: mamResponse.ok,
      mamEngineUrl: mamResponse.engineUrl,
      mamError: mamResponse.error,
      dbError: saveError?.message,
      calculation: calcData,
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
 * PUT /api/talentos
 * Atualiza um Talento existente no Supabase + recalcula matriz comportamental no `mam-kantechrh`.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      originalNome,
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
      foto_base64,
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

    const calcPerfilFallback = calcularPerfilNumerologicoServidor(
      String(nome).trim(),
      String(data_nascimento).trim()
    );
    const calcData =
      mamResponse.ok && mamResponse.data
        ? mamResponse.data
        : {
            kan_numero: calcPerfilFallback.kanNumero,
            kan_nome: calcPerfilFallback.kanNome,
            estrutural: calcPerfilFallback.estrutural,
            direcionamento: calcPerfilFallback.direcionamento,
            vertices_triangulo: calcPerfilFallback.vertices,
          };
    const supabaseAdmin = getSupabaseAdmin();

    const perfilJsonStr = calcData?.perfil_json
      ? typeof calcData.perfil_json === "string"
        ? calcData.perfil_json
        : JSON.stringify(calcData.perfil_json)
      : null;

    const nomeTrim = String(nome).trim();
    const dataNascTrim = String(data_nascimento).trim();

    const updatePayload: Record<string, unknown> = {
      nome: nomeTrim,
      data_nascimento: dataNascTrim,
      profissao: profissao || cargo || "Especialista Corporativo",
      cargo: cargo || profissao || "Analista Sênior",
      grupo: grupo || departamento || "Geral",
      departamento: departamento || grupo || "Diretoria Executiva",
      empresa: empresa || "Mundo Kan",
      linkedin_url: linkedin_url || "",
      experiencias: experiencias || "",
      lider: Boolean(lider),
    };

    if (tenant_id) updatePayload.tenant_id = tenant_id;
    if (perfilJsonStr) updatePayload.perfil_json = perfilJsonStr;
    if (foto_base64 !== undefined) {
      updatePayload.foto_base64 = foto_base64 ? String(foto_base64).trim() : null;
    }

    let savedMapa = null;
    let saveError = null;

    // Update by ID if provided and valid
    if (id && !String(id).startsWith("mock-") && !isNaN(Number(id))) {
      const res = await supabaseAdmin
        .from("mapas_salvos")
        .update(updatePayload)
        .eq("id", Number(id))
        .select()
        .maybeSingle();
      savedMapa = res.data;
      saveError = res.error;
    }

    // Fallback: update by originalNome or nome
    if (!savedMapa) {
      const searchName = String(originalNome || nomeTrim).trim();
      const { data: existingByName } = await supabaseAdmin
        .from("mapas_salvos")
        .select("id")
        .ilike("nome", searchName)
        .limit(1)
        .maybeSingle();

      if (existingByName?.id) {
        const res = await supabaseAdmin
          .from("mapas_salvos")
          .update(updatePayload)
          .eq("id", existingByName.id)
          .select()
          .maybeSingle();
        savedMapa = res.data;
        saveError = res.error;
      }
    }

    // If still not found, insert new record (ensuring tenant_id is populated)
    if (!savedMapa && !saveError) {
      const insertPayload = {
        ...updatePayload,
        tenant_id: tenant_id || "00000000-0000-0000-0000-000000000000",
      };
      const res = await supabaseAdmin
        .from("mapas_salvos")
        .insert(insertPayload)
        .select()
        .single();
      savedMapa = res.data;
      saveError = res.error;
    }

    // Update mapas_salvos_valores
    if (calcData) {
      const vertices = Array.isArray(calcData.vertices_triangulo)
        ? calcData.vertices_triangulo
        : calcPerfilFallback.vertices;

      // Clean old values if name changed
      if (originalNome && originalNome !== nomeTrim) {
        await supabaseAdmin.from("mapas_salvos_valores").delete().eq("nome", originalNome);
      }

      const valoresUpdatePayload = {
        nome: nomeTrim,
        data_nascimento: dataNascTrim,
        kan: String(calcData.kan_nome || calcData.kan_numero || calcPerfilFallback.kanNome).toUpperCase(),
        perfil: Array.isArray(calcData.perfis_lista)
          ? calcData.perfis_lista.join(", ")
          : String(calcData.perfil || "Lider, Resultado"),
        categoria: Array.isArray(calcData.categorias_lista)
          ? calcData.categorias_lista.join(", ")
          : String(calcData.categoria || "Realizador"),
        qualidades: Array.isArray(calcData.qualidades_lista)
          ? calcData.qualidades_lista.join(", ")
          : String(calcData.qualidades || "Execução, Análise"),
        motivacao: String(calcPerfilFallback.motivacao),
        impressao: String(calcPerfilFallback.impressao),
        expressao: String(calcPerfilFallback.expressao),
        dia_natalicio: String(calcPerfilFallback.diaNatalicio),
        numero_psiquico: String(calcPerfilFallback.numPsiquico),
        destino: String(calcPerfilFallback.destino),
        missao: String(calcPerfilFallback.missao),
        estrutural: String(calcData.estrutural ?? calcPerfilFallback.estrutural),
        direcionamento: String(calcData.direcionamento ?? calcPerfilFallback.direcionamento),
        repeticao_1: String(calcPerfilFallback.rep1),
        repeticao_2: String(calcPerfilFallback.rep2),
        repeticao_mapa: String(calcPerfilFallback.rep2),
        vertice_triangulo_1: String(vertices[0] ?? calcPerfilFallback.vertices[0]),
        vertice_triangulo_2: String(vertices[1] ?? calcPerfilFallback.vertices[1]),
        vertice_triangulo_3: String(vertices[2] ?? calcPerfilFallback.vertices[2]),
      };

      const { data: existingVal } = await supabaseAdmin
        .from("mapas_salvos_valores")
        .select("id")
        .ilike("nome", nomeTrim)
        .limit(1)
        .maybeSingle();

      if (existingVal?.id) {
        await supabaseAdmin
          .from("mapas_salvos_valores")
          .update(valoresUpdatePayload)
          .eq("id", existingVal.id);
      } else {
        await supabaseAdmin.from("mapas_salvos_valores").insert(valoresUpdatePayload);
      }
    }

    // Invalidate Diagnóstico Ampliado cache so new values appear immediately
    try {
      invalidateDiagnosticoCache();
    } catch {
      // ignore
    }

    // Update foto cache if foto was updated or deleted
    if (foto_base64 !== undefined) {
      const finalB64 = foto_base64 ? String(foto_base64).trim() : null;
      const targetId = savedMapa?.id ?? id;
      if (targetId) setFotoCache(targetId, finalB64, nome);
      if (originalNome && originalNome !== nome) {
        invalidateFotoCache(undefined, originalNome);
      }
    }

    return NextResponse.json({
      success: !saveError,
      mamEngineUsed: mamResponse.ok,
      calculated: calcData,
      savedRecord: savedMapa,
      dbError: saveError?.message,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao atualizar talento.",
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
    const id = searchParams.get("id");
    const isAdmin = searchParams.get("admin") === "true";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Ação não permitida: A exclusão de talentos é restrita ao Painel de Controle com perfil Administrador." },
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
