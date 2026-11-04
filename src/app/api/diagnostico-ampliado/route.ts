import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function removerAcentos(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarTermo(t: unknown): string {
  return removerAcentos(t)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/numero/g, "no")
    .replace(/º/g, "");
}

function cleanStr(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (
    !s ||
    s.toLowerCase() === "nan" ||
    s.toLowerCase() === "none" ||
    s.toLowerCase() === "null"
  ) {
    return fallback;
  }
  return s;
}

const DEFAULT_MAP_PERFIL_EIXO: Record<string, string> = {
  lider: "Liderança",
  criativo: "Criação",
  executor: "Resultado",
  vendedor: "Relacionamento",
  influenciador: "Empatia",
  comunicador: "Comunicação",
  resultado: "Resultado",
  analitico: "Análise",
  analytical: "Análise",
  empatico: "Empatia",
  empathic: "Empatia",
  executivo: "Resultado",
  executive: "Resultado",
  dinamico: "Flexibilidade",
  dynamic: "Flexibilidade",
  colaborativo: "Liderança",
  collaborative: "Liderança",
  estabilizador: "Organização",
  stabilizer: "Organização",
};

const DEFAULT_MAP_CAT_EIXO: Record<string, string> = {
  justo: "Empatia",
  inovador: "Criação",
  visionario: "Criação",
  diplomatico: "Relacionamento",
  realizador: "Resultado",
  expansivo: "Comunicação",
  versatil: "Flexibilidade",
  planejador: "Resultado",
  magnetico: "Relacionamento",
  pratico: "Organização",
  analitico: "Análise",
  organizado: "Organização",
  financeiro: "Resultado",
  acabativo: "Resultado",
  comunicativo: "Comunicação",
  intuitivo: "Criação",
  harmonico: "Relacionamento",
  conhecimento: "Análise",
  execucaoefoco: "Resultado",
  planejamentoeestrutura: "Organização",
  organizacaoemetodo: "Organização",
  qualidadeepadrao: "Análise",
  precisaoecontrole: "Análise",
  analiseediagnostico: "Análise",
  inovacaoecriatividade: "Criação",
  adaptacaoeflexibilidade: "Flexibilidade",
  comunicacaoeconexao: "Comunicação",
  relacionamentoeparceria: "Relacionamento",
  empatiaesuporte: "Empatia",
  colaboracaoesinergia: "Liderança",
  liderancaeinfluencia: "Liderança",
  desenvolvimentoementoria: "Liderança",
  visaoefuturo: "Criação",
  estrategiaedecisao: "Liderança",
  iniciativaeautonomia: "Flexibilidade",
  resilienciaeequilibrio: "Flexibilidade",
  compromissoeentrega: "Resultado",
};

export const EIXOS_CONFIG = [
  {
    nome: "Criação",
    icon_class: "icon-lightbulb",
    icon_color: "#38bdf8",
    desc: "Inovação, ideação e visão de futuro",
  },
  {
    nome: "Liderança",
    icon_class: "icon-crown",
    icon_color: "#fbbf24",
    desc: "Direcionamento, autoridade e tomada de decisão",
  },
  {
    nome: "Resultado",
    icon_class: "icon-target",
    icon_color: "#34d399",
    desc: "Execução, foco em metas e tração operacional",
  },
  {
    nome: "Relacionamento",
    icon_class: "icon-users",
    icon_color: "#a78bfa",
    desc: "Conexão interpessoal, diplomacia e parceria",
  },
  {
    nome: "Análise",
    icon_class: "icon-search",
    icon_color: "#60a5fa",
    desc: "Pensamento crítico, rigor técnico e dados",
  },
  {
    nome: "Empatia",
    icon_class: "icon-heart",
    icon_color: "#f472b6",
    desc: "Escuta ativa, acolhimento e inteligência emocional",
  },
  {
    nome: "Comunicação",
    icon_class: "icon-message-square",
    icon_color: "#22d3ee",
    desc: "Expressão verbal, persuasão e engajamento",
  },
  {
    nome: "Organização",
    icon_class: "icon-layers",
    icon_color: "#818cf8",
    desc: "Processos, disciplina e governança estrutural",
  },
  {
    nome: "Flexibilidade",
    icon_class: "icon-refresh-cw",
    icon_color: "#fb923c",
    desc: "Adaptabilidade, agilidade e gestão de mudanças",
  },
];

export const COLUNAS_SCORE = [
  "Motivação",
  "Impressão",
  "Expressão",
  "Destino",
  "Missão",
  "Dia Natalício",
  "Triângulo",
  "No Psiquico",
  "Estrutural",
  "Direcionamento",
  "REPETIÇÃO 1",
  "REPETIÇÃO 2",
] as const;

export const PERFIS_PADRAO = [
  "Líder",
  "Criativo",
  "Executor",
  "Resultado",
  "Vendedor",
  "Influenciador",
  "Comunicador",
] as const;

export const CATEGORIAS_PADRAO = [
  "Visionário",
  "Realizador",
  "Inovador",
  "Conhecimento",
  "Harmônico",
  "Analítico",
  "Diplomático",
  "Empático",
  "Comunicativo",
  "Magnético",
  "Organizado",
  "Justo",
  "Versátil",
  "Intuitivo",
] as const;

interface CachedDbTables {
  timestamp: number;
  atributosAmpliado: Record<string, unknown>[];
  perfilCategoriaAmpliado: Record<string, unknown>[];
  mapPerfilEixo: Record<string, string>;
  mapCatEixo: Record<string, string>;
  pesoDb: Record<string, number>;
  pesoCategoriaDb: Record<string, number>;
  kansDb: Record<string, { kan: string; descricao: string }>;
  repeticaoDb: Record<string, { perfil: string; categoria: string }>;
  mapasSalvos: Map<string, Record<string, unknown>>;
  mapasValores: Map<string, Record<string, unknown>>;
}

let cachedTables: CachedDbTables | null = null;
const CACHE_TTL_MS = 120 * 1000; // 2 minutes

async function getReferenceTables(): Promise<CachedDbTables> {
  if (cachedTables && Date.now() - cachedTables.timestamp < CACHE_TTL_MS) {
    return cachedTables;
  }

  const supabase = getSupabaseAdmin();

  const [
    { data: attrData },
    { data: perfCatData },
    { data: perfFocoData },
    { data: catAmpData },
    { data: pesoData },
    { data: pesoCatData },
    { data: kansData },
    { data: repData },
    { data: mapasData },
    { data: valoresData },
  ] = await Promise.all([
    supabase.from("atributos_ampliado").select("*").limit(500),
    supabase.from("perfil_categoria_ampliado").select("*").limit(300),
    supabase.from("perfil_foco_ampliado").select("*").limit(100),
    supabase.from("categoria_ampliado").select("*").limit(100),
    supabase.from("peso").select("*").limit(50),
    supabase.from("peso_categoria").select("*").limit(50),
    supabase.from("kans").select("*").limit(50),
    supabase.from("repeticao").select("*").limit(50),
    supabase
      .from("mapas_salvos")
      .select(
        "id, nome, data_nascimento, profissao, cargo, grupo, departamento, empresa, lider, perfil_json"
      )
      .limit(1000),
    supabase.from("mapas_salvos_valores").select("*").limit(1000),
  ]);

  const mapPerfilEixo: Record<string, string> = { ...DEFAULT_MAP_PERFIL_EIXO };
  if (perfFocoData) {
    for (const r of perfFocoData) {
      const pVal = cleanStr(r.perfil ?? r.Perfil);
      const eVal = cleanStr(r.eixo ?? r.Eixo);
      if (pVal && eVal) {
        mapPerfilEixo[normalizarTermo(pVal)] = eVal;
      }
    }
  }

  const mapCatEixo: Record<string, string> = { ...DEFAULT_MAP_CAT_EIXO };
  if (catAmpData) {
    for (const r of catAmpData) {
      const cVal = cleanStr(r.categoria ?? r.CATEGORIA);
      const eVal = cleanStr(r.eixo ?? r.Eixo);
      if (cVal && eVal) {
        mapCatEixo[normalizarTermo(cVal)] = eVal;
      }
    }
  }

  const pesoDb: Record<string, number> = {
    Motivação: 150,
    Impressão: 150,
    Expressão: 300,
    Destino: 150,
    Missão: 300,
    "Dia Natalício": 150,
    Triângulo: 150,
    "No Psiquico": 100,
    Estrutural: 0,
    Direcionamento: 0,
    "REPETIÇÃO 1": 100,
    "REPETIÇÃO 2": 100,
    KAN: 150,
  };
  if (pesoData) {
    for (const r of pesoData) {
      const k = cleanStr(r.campo);
      const v = Number(r.peso);
      if (k && !isNaN(v)) pesoDb[k] = v;
    }
  }

  const pesoCategoriaDb: Record<string, number> = {
    Motivação: 100,
    Impressão: 100,
    Expressão: 100,
    Destino: 100,
    Missão: 100,
    "Dia Natalício": 150,
    Triângulo: 100,
    "No Psiquico": 100,
    Estrutural: 100,
    Direcionamento: 100,
    "REPETIÇÃO 1": 100,
    "REPETIÇÃO 2": 100,
  };
  if (pesoCatData) {
    for (const r of pesoCatData) {
      const k = cleanStr(r.campo);
      const v = Number(r.peso);
      if (k && !isNaN(v)) pesoCategoriaDb[k] = v;
    }
  }

  const kansDb: Record<string, { kan: string; descricao: string }> = {};
  if (kansData) {
    for (const r of kansData) {
      const num = cleanStr(r.numero);
      if (num) {
        kansDb[num] = {
          kan: cleanStr(r.kan),
          descricao: cleanStr(r.descricao),
        };
      }
    }
  }

  const repeticaoDb: Record<string, { perfil: string; categoria: string }> = {};
  if (repData) {
    for (const r of repData) {
      const num = cleanStr(r.numero);
      if (num) {
        repeticaoDb[num] = {
          perfil: cleanStr(r.perfil),
          categoria: cleanStr(r.categoria),
        };
      }
    }
  }

  const mapasSalvos = new Map<string, Record<string, unknown>>();
  if (mapasData) {
    for (const m of mapasData) {
      const n = cleanStr(m.nome);
      if (n) {
        mapasSalvos.set(n, m);
        mapasSalvos.set(normalizarTermo(n), m);
      }
    }
  }

  const mapasValores = new Map<string, Record<string, unknown>>();
  if (valoresData) {
    for (const v of valoresData) {
      const n = cleanStr(v.nome);
      if (n) {
        mapasValores.set(n, v);
        mapasValores.set(normalizarTermo(n), v);
      }
    }
  }

  cachedTables = {
    timestamp: Date.now(),
    atributosAmpliado: (attrData || []) as Record<string, unknown>[],
    perfilCategoriaAmpliado: (perfCatData || []) as Record<string, unknown>[],
    mapPerfilEixo,
    mapCatEixo,
    pesoDb,
    pesoCategoriaDb,
    kansDb,
    repeticaoDb,
    mapasSalvos,
    mapasValores,
  };

  return cachedTables;
}

// Cabalistic table fallback when a talent is not yet in mapas_salvos_valores
const TABELA_CABALISTICA: Record<string, number> = {
  A: 1, I: 1, Q: 1, J: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5,
  U: 6, V: 6, W: 6, X: 6, Ç: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

const VOGAIS = new Set(["A", "E", "I", "O", "U", "Y"]);

function reduceNum(n: number, keepMaster = true): number {
  let curr = n;
  while (curr > 9) {
    if (keepMaster && (curr === 11 || curr === 22)) return curr;
    curr = String(curr)
      .split("")
      .reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return curr || 1;
}

function parseDayFromBirthdate(dtStr: string): { day: number; month: number; year: number } {
  const clean = cleanStr(dtStr, "01/01/1990");
  if (clean.includes("/")) {
    const parts = clean.split("/");
    const d = parseInt(parts[0], 10) || 1;
    const m = parseInt(parts[1], 10) || 1;
    const y = parseInt(parts[2], 10) || 1990;
    return { day: d, month: m, year: y };
  }
  if (clean.includes("-")) {
    const parts = clean.split("-");
    const y = parseInt(parts[0], 10) || 1990;
    const m = parseInt(parts[1], 10) || 1;
    const d = parseInt(parts[2], 10) || 1;
    return { day: d, month: m, year: y };
  }
  return { day: 1, month: 1, year: 1990 };
}

function extractNumClean(v: unknown): string {
  const s = cleanStr(v);
  if (!s) return "";
  return s.split(" - ")[0].split(",")[0].trim();
}

export function calcularDiagnosticoMembro(
  nomeMembro: string,
  tables: CachedDbTables,
  fallbackDataNasc?: string
) {
  const normKey = normalizarTermo(nomeMembro);
  const mapaRow =
    tables.mapasSalvos.get(nomeMembro.trim()) ||
    tables.mapasSalvos.get(normKey) ||
    {};
  const valRow =
    tables.mapasValores.get(nomeMembro.trim()) ||
    tables.mapasValores.get(normKey) ||
    {};

  const dtNascStr =
    cleanStr(valRow.data_nascimento) ||
    cleanStr(mapaRow.data_nascimento) ||
    cleanStr(fallbackDataNasc, "01/01/1990");
  const { day, month, year } = parseDayFromBirthdate(dtNascStr);

  // Extract from perfil_json if available
  const pJsonMap: Record<string, string> = {};
  const pJsonRaw = mapaRow.perfil_json;
  if (typeof pJsonRaw === "string" && pJsonRaw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(pJsonRaw) as Array<Record<string, unknown>>;
      for (const item of parsed) {
        const c = cleanStr(item.Campo);
        const v = cleanStr(item.Valor ?? item.Resultado);
        if (c && v) {
          pJsonMap[c] = v;
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }

  // Fallback Cabalistic computation if valRow is missing fields
  const upperName = removerAcentos(nomeMembro).toUpperCase().replace(/[^A-Z]/g, "");
  let sumVogais = 0;
  let sumConsoantes = 0;
  for (const ch of upperName) {
    const val = TABELA_CABALISTICA[ch] || 1;
    if (VOGAIS.has(ch)) sumVogais += val;
    else sumConsoantes += val;
  }
  const calcMotivacao = reduceNum(sumVogais, true);
  const calcImpressao = reduceNum(sumConsoantes, false);
  const calcExpressao = reduceNum(sumVogais + sumConsoantes, true);
  const calcDestino = reduceNum(
    reduceNum(day, false) + reduceNum(month, false) + reduceNum(year, false),
    true
  );
  const calcMissao = reduceNum(calcExpressao + calcDestino, true);
  const calcPsiquico = reduceNum(day, false);

  const motivacaoStr =
    extractNumClean(valRow.motivacao) ||
    extractNumClean(pJsonMap["Motivação"]) ||
    String(calcMotivacao);
  const impressaoStr =
    extractNumClean(valRow.impressao) ||
    extractNumClean(pJsonMap["Impressão"]) ||
    String(calcImpressao);
  const expressaoStr =
    extractNumClean(valRow.expressao) ||
    extractNumClean(pJsonMap["Expressão"]) ||
    String(calcExpressao);
  const destinoStr =
    extractNumClean(valRow.destino) ||
    extractNumClean(pJsonMap["Destino"]) ||
    String(calcDestino);
  const missaoStr =
    extractNumClean(valRow.missao) ||
    extractNumClean(pJsonMap["Missão"]) ||
    String(calcMissao);
  const diaNatalicioStr =
    extractNumClean(valRow.dia_natalicio) || String(day);
  const trianguloStr =
    extractNumClean(valRow.vertice_triangulo_1) ||
    extractNumClean(pJsonMap["Triângulo Harmônico"]) ||
    String(reduceNum(calcMotivacao + calcExpressao, false));
  const psiquicoStr =
    extractNumClean(valRow.numero_psiquico) ||
    extractNumClean(pJsonMap["Número Psíquico"]) ||
    String(calcPsiquico);
  const estruturalStr =
    extractNumClean(valRow.estrutural) ||
    extractNumClean(pJsonMap["Estrutural"]) ||
    String(reduceNum(calcExpressao, false));
  const direcionamentoStr =
    extractNumClean(valRow.direcionamento) ||
    extractNumClean(pJsonMap["Direcionamento"]) ||
    String(reduceNum(calcDestino, false));
  const rep1Str =
    extractNumClean(valRow.repeticao_1) ||
    String(reduceNum(calcMotivacao, false));
  const rep2Str =
    extractNumClean(valRow.repeticao_2) ||
    extractNumClean(valRow.repeticao_mapa) ||
    extractNumClean(pJsonMap["Repetição Mapa"]) ||
    String(reduceNum(calcImpressao, false));

  const valoresScoreMap: Record<string, string> = {
    Motivação: motivacaoStr,
    Impressão: impressaoStr,
    Expressão: expressaoStr,
    Destino: destinoStr,
    Missão: missaoStr,
    "Dia Natalício": diaNatalicioStr,
    Triângulo: trianguloStr,
    "No Psiquico": psiquicoStr,
    Estrutural: estruturalStr,
    Direcionamento: direcionamentoStr,
    "REPETIÇÃO 1": rep1Str,
    "REPETIÇÃO 2": rep2Str,
  };

  // Initialize score matrices
  const scorePerfMatrix: Record<string, Record<string, number>> = {};
  for (const p of PERFIS_PADRAO) {
    scorePerfMatrix[p] = {};
    for (const c of COLUNAS_SCORE) scorePerfMatrix[p][c] = 0;
    scorePerfMatrix[p].TOTAL = 0;
  }

  const scoreCatMatrix: Record<string, Record<string, number>> = {};
  for (const cat of CATEGORIAS_PADRAO) {
    scoreCatMatrix[cat] = {};
    for (const c of COLUNAS_SCORE) scoreCatMatrix[cat][c] = 0;
    scoreCatMatrix[cat].TOTAL = 0;
  }

  const detalhesAtributosList: Array<{
    Campo: string;
    Valor: string;
    "Atributo Ampliado": string;
    Perfil: string;
    Categoria: string;
    Eixo: string;
    Polaridade: string;
    "Área de Suporte": string;
    "Soft Skills": string;
    "Risco Prioritário": string;
  }> = [];

  for (const campoNome of COLUNAS_SCORE) {
    const valNum = valoresScoreMap[campoNome] || "";
    if (!valNum) continue;

    let attrEncontrado = "";
    let perfilEnc = "";
    let catEnc = "";
    let polEnc = "POSITIVA";
    let areaSupEnc = "";
    let eixoEnc = "";
    let softSkEnc = "";
    let riscoEnc = "";

    const cNorm = normalizarTermo(campoNome);
    let matchedRow = tables.atributosAmpliado.find(
      (r) =>
        normalizarTermo(r.campo ?? r.Campo) === cNorm &&
        cleanStr(r.resultado ?? r.Resultado) === valNum
    );

    if (!matchedRow && ["11", "22", "33"].includes(valNum)) {
      const valRed = String(
        valNum
          .split("")
          .reduce((acc, d) => acc + parseInt(d, 10), 0)
      );
      matchedRow = tables.atributosAmpliado.find(
        (r) =>
          normalizarTermo(r.campo ?? r.Campo) === cNorm &&
          cleanStr(r.resultado ?? r.Resultado) === valRed
      );
    }

    if (matchedRow) {
      attrEncontrado = cleanStr(matchedRow.atributos ?? matchedRow.ATRIBUTOS);
      perfilEnc = cleanStr(matchedRow.perfil ?? matchedRow.PERFIL);
      catEnc = cleanStr(matchedRow.categoria ?? matchedRow.CATEGORIA);
      polEnc = cleanStr(matchedRow.polaridade ?? matchedRow.POLARIDADE, "POSITIVA");
      areaSupEnc = cleanStr(matchedRow.area_de_suporte ?? matchedRow["AREA DE SUPORTE"]);
      eixoEnc = cleanStr(matchedRow.eixo ?? matchedRow.Eixo);
      softSkEnc = cleanStr(matchedRow.soft_skills ?? matchedRow["Soft Skills"]);
      riscoEnc = cleanStr(matchedRow.risco_prioritario ?? matchedRow["Risco Prioritário"]);
    }

    if (!perfilEnc) {
      const rRep = tables.repeticaoDb[valNum];
      if (rRep) {
        perfilEnc = rRep.perfil;
        catEnc = rRep.categoria;
        if (!attrEncontrado) {
          attrEncontrado = `Repetição ${valNum}`;
        }
      }
    }

    if (!eixoEnc || eixoEnc === "N/D") {
      if (perfilEnc && tables.mapPerfilEixo[normalizarTermo(perfilEnc)]) {
        eixoEnc = tables.mapPerfilEixo[normalizarTermo(perfilEnc)];
      } else if (catEnc && tables.mapCatEixo[normalizarTermo(catEnc)]) {
        eixoEnc = tables.mapCatEixo[normalizarTermo(catEnc)];
      }
    }

    const pesoCampo = Number(tables.pesoDb[campoNome] ?? 0);
    const pesoCat = Number(tables.pesoCategoriaDb[campoNome] ?? pesoCampo);

    if (perfilEnc) {
      const pClean = removerAcentos(perfilEnc).toLowerCase().trim();
      for (const idxP of PERFIS_PADRAO) {
        if (removerAcentos(idxP).toLowerCase().trim() === pClean) {
          scorePerfMatrix[idxP][campoNome] += pesoCampo;
          break;
        }
      }
    }

    if (catEnc) {
      const cClean = removerAcentos(catEnc).toLowerCase().trim();
      for (const idxC of CATEGORIAS_PADRAO) {
        if (removerAcentos(idxC).toLowerCase().trim() === cClean) {
          scoreCatMatrix[idxC][campoNome] += pesoCat;
          break;
        }
      }
    }

    detalhesAtributosList.push({
      Campo: campoNome,
      Valor: valNum,
      "Atributo Ampliado": attrEncontrado || "N/D",
      Perfil: perfilEnc || "N/D",
      Categoria: catEnc || "N/D",
      Eixo: eixoEnc || "N/D",
      Polaridade: polEnc || "POSITIVA",
      "Área de Suporte": areaSupEnc || "N/D",
      "Soft Skills": softSkEnc || "N/D",
      "Risco Prioritário": riscoEnc || "N/D",
    });
  }

  let perfilTop = "Líder";
  let maxPerfScore = -1;
  for (const p of PERFIS_PADRAO) {
    const sum = COLUNAS_SCORE.reduce((acc, c) => acc + scorePerfMatrix[p][c], 0);
    scorePerfMatrix[p].TOTAL = sum;
    if (sum > maxPerfScore) {
      maxPerfScore = sum;
      perfilTop = p;
    }
  }

  let catTop = "Realizador";
  let maxCatScore = -1;
  for (const cat of CATEGORIAS_PADRAO) {
    const sum = COLUNAS_SCORE.reduce((acc, c) => acc + scoreCatMatrix[cat][c], 0);
    scoreCatMatrix[cat].TOTAL = sum;
    if (sum > maxCatScore) {
      maxCatScore = sum;
      catTop = cat;
    }
  }

  const perfilPredominante = `${perfilTop} ${catTop}`;

  // Look up in perfil_categoria_ampliado
  let descCompletaTxt = "";
  let resumoTxt = "";
  let forcasTxt = "";
  let riscoPriorTxt = "";
  let descRiscoTxt = "";
  let contextoTxt = "";

  const chaveNorm = normalizarTermo(perfilPredominante);
  let matchedPc = tables.perfilCategoriaAmpliado.find(
    (r) =>
      normalizarTermo(r.perfil_predominante ?? r["PERFIL PREDOMINANTE"]) ===
      chaveNorm
  );
  if (!matchedPc) {
    const pW = normalizarTermo(perfilTop);
    const cW = normalizarTermo(catTop);
    matchedPc = tables.perfilCategoriaAmpliado.find((r) => {
      const k = normalizarTermo(
        r.perfil_predominante ?? r["PERFIL PREDOMINANTE"]
      );
      return k.includes(pW) && k.includes(cW);
    });
  }

  if (matchedPc) {
    descCompletaTxt = cleanStr(
      matchedPc.descricao_completa ?? matchedPc["DESCRIÇÃO COMPLETA"]
    );
    resumoTxt = cleanStr(matchedPc.resumo ?? matchedPc.RESUMO);
    forcasTxt = cleanStr(matchedPc.forcas_centrais ?? matchedPc["FORÇAS CENTRAIS"]);
    riscoPriorTxt = cleanStr(
      matchedPc.risco_prioritario ?? matchedPc["RISCO PRIORITÁRIO"]
    );
    descRiscoTxt = cleanStr(
      matchedPc.descricao_do_risco ?? matchedPc["DESCRIÇÃO DO RISCO"]
    );
    contextoTxt = cleanStr(
      matchedPc.contexto_de_maior_aderencia ??
        matchedPc["CONTEXTO DE MAIOR ADERÊNCIA"]
    );
  }

  // Determine KAN title & description (never displaying numeric KAN outside admin)
  const rawKanVal =
    cleanStr(valRow.kan) ||
    cleanStr(pJsonMap["KAN"]) ||
    String(
      [3, 6, 9][
        (parseInt(trianguloStr, 10) || 1) % 3
      ]
    );
  const kanMapTitulos: Record<string, string> = {
    "3": "CRIAÇÃO",
    "6": "MOVIMENTO",
    "9": "FINALIDADE",
  };
  let kanNome = kanMapTitulos[rawKanVal] || rawKanVal.toUpperCase();
  if (kanNome.includes("CRIA")) kanNome = "CRIAÇÃO";
  else if (kanNome.includes("MOV")) kanNome = "MOVIMENTO";
  else if (kanNome.includes("FIN")) kanNome = "FINALIDADE";
  else kanNome = "FINALIDADE";

  const kanKeyNum =
    kanNome === "CRIAÇÃO" ? "3" : kanNome === "MOVIMENTO" ? "6" : "9";
  const kanData = tables.kansDb[kanKeyNum] || tables.kansDb[rawKanVal];
  let kanDesc = cleanStr(kanData?.descricao);
  if (kanDesc) {
    kanDesc = kanDesc
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/^"|"$/g, ""))
      .filter(Boolean)
      .join(" ");
  } else {
    if (kanNome === "CRIAÇÃO") {
      kanDesc =
        "Estímulo para criar em qualquer área de atuação. Impulso a trazer novidades, diferenciais e evolução constante.";
    } else if (kanNome === "MOVIMENTO") {
      kanDesc =
        "Trocas, interações e conexão de pontos. Propulsores de movimento e agilidade fundamentais para a eficiência da equipe.";
    } else {
      kanDesc =
        "Prazer em concluir atividades e ciclos. Foco contínuo que evita dispersão de energia e garante as entregas.";
    }
  }

  const maiorPeso = Math.max(
    300,
    ...Object.values(tables.pesoDb).filter((v) => !isNaN(v))
  );

  // Build 9 axes score matrix
  const eixosLista = EIXOS_CONFIG.map((e) => e.nome);
  const colunasEixosScore = [
    ...COLUNAS_SCORE,
    "Perfil Predominante",
    "Categoria Predominante",
  ];
  const scoreEixosMatrix: Record<string, Record<string, number>> = {};
  for (const eNome of eixosLista) {
    scoreEixosMatrix[eNome] = {};
    for (const col of colunasEixosScore) scoreEixosMatrix[eNome][col] = 0;
    scoreEixosMatrix[eNome].TOTAL = 0;
  }

  for (const dItem of detalhesAtributosList) {
    const cNome = dItem.Campo;
    const pCampo = Number(tables.pesoDb[cNome] ?? 0);
    const eixoVal = dItem.Eixo;
    if (eixoVal && eixoVal !== "N/D") {
      const eClean = removerAcentos(eixoVal).toLowerCase().trim();
      for (const eNome of eixosLista) {
        if (removerAcentos(eNome).toLowerCase().trim() === eClean) {
          scoreEixosMatrix[eNome][cNome] += pCampo;
          break;
        }
      }
    }
  }

  let eixoPerfilTop = tables.mapPerfilEixo[normalizarTermo(perfilTop)] || "";
  if (!eixoPerfilTop) {
    const pNorm = normalizarTermo(perfilTop);
    for (const [kP, vE] of Object.entries(tables.mapPerfilEixo)) {
      if (kP.includes(pNorm) || pNorm.includes(kP)) {
        eixoPerfilTop = vE;
        break;
      }
    }
  }

  let eixoCatTop = tables.mapCatEixo[normalizarTermo(catTop)] || "";
  if (!eixoCatTop) {
    const cNorm = normalizarTermo(catTop);
    for (const [kC, vE] of Object.entries(tables.mapCatEixo)) {
      if (kC.includes(cNorm) || cNorm.includes(kC)) {
        eixoCatTop = vE;
        break;
      }
    }
  }

  if (eixoPerfilTop) {
    const ePClean = removerAcentos(eixoPerfilTop).toLowerCase().trim();
    for (const eNome of eixosLista) {
      if (removerAcentos(eNome).toLowerCase().trim() === ePClean) {
        scoreEixosMatrix[eNome]["Perfil Predominante"] += maiorPeso;
        break;
      }
    }
  }

  if (eixoCatTop) {
    const eCClean = removerAcentos(eixoCatTop).toLowerCase().trim();
    for (const eNome of eixosLista) {
      if (removerAcentos(eNome).toLowerCase().trim() === eCClean) {
        scoreEixosMatrix[eNome]["Categoria Predominante"] += maiorPeso;
        break;
      }
    }
  }

  const scoreEixos: Record<string, number> = {};
  for (const eNome of eixosLista) {
    const sum = colunasEixosScore.reduce(
      (acc, col) => acc + (scoreEixosMatrix[eNome][col] || 0),
      0
    );
    scoreEixosMatrix[eNome].TOTAL = sum;
    scoreEixos[eNome] = sum;
  }

  // Soft skills accumulation
  const scoreSoftSkills: Record<string, number> = {};
  for (const dItem of detalhesAtributosList) {
    const cNome = dItem.Campo;
    const pCampo = Number(tables.pesoDb[cNome] ?? 0);
    const skVal = dItem["Soft Skills"];
    if (skVal && skVal !== "N/D") {
      for (const sk of skVal.split(",")) {
        const skClean = sk.trim();
        if (skClean) {
          scoreSoftSkills[skClean] = (scoreSoftSkills[skClean] || 0) + pCampo;
        }
      }
    }
  }

  const sortedSkills: Array<[string, number]> = Object.entries(
    scoreSoftSkills
  ).sort((a, b) => b[1] - a[1]);

  // Origens e Rastreabilidade Completa dos Eixos (for Admin Painel de Controle)
  const origensEixosList: Array<{
    Eixo: string;
    Origem: string;
    "Valor Mapa": string;
    Atributo: string;
    "Perfil Mapeado": string;
    "Categoria Mapeada": string;
    Pontos: number;
  }> = [];

  for (const dItem of detalhesAtributosList) {
    const cNome = dItem.Campo;
    const pCampo = Number(tables.pesoDb[cNome] ?? 0);
    const eVal = dItem.Eixo;
    if (eVal && eVal !== "N/D") {
      origensEixosList.push({
        Eixo: eVal,
        Origem: `Campo ${cNome}`,
        "Valor Mapa": dItem.Valor,
        Atributo: dItem["Atributo Ampliado"],
        "Perfil Mapeado": dItem.Perfil,
        "Categoria Mapeada": dItem.Categoria,
        Pontos: pCampo,
      });
    }
  }

  if (eixoPerfilTop) {
    origensEixosList.push({
      Eixo: eixoPerfilTop,
      Origem: "Perfil Predominante",
      "Valor Mapa": "-",
      Atributo: `Perfil Predominante: ${perfilTop}`,
      "Perfil Mapeado": perfilTop,
      "Categoria Mapeada": "-",
      Pontos: maiorPeso,
    });
  }

  if (eixoCatTop) {
    origensEixosList.push({
      Eixo: eixoCatTop,
      Origem: "Categoria Predominante",
      "Valor Mapa": "-",
      Atributo: `Categoria Predominante: ${catTop}`,
      "Perfil Mapeado": "-",
      "Categoria Mapeada": catTop,
      Pontos: maiorPeso,
    });
  }

  return {
    nome: nomeMembro,
    perfil_predominante: perfilPredominante,
    resumo:
      resumoTxt ||
      "Combina autoridade natural e foco implacável em entregas concretas.",
    forcas:
      forcasTxt ||
      "Liderança, resultados, execução, disciplina e persistência",
    contexto: contextoTxt || "Projetos críticos, operações e implantação",
    risco_prior:
      riscoPriorTxt ||
      "Pressão Excessiva por Resultados, Centralização e Microgestão",
    desc_risco:
      descRiscoTxt ||
      "Risco de esgotamento do time (burnout) e turnover por ritmo insustentável de cobrança, agravado por microgestão centralizadora e negligência no desenvolvimento e capacitação da equipe.",
    kan_nome: kanNome,
    kan_desc: kanDesc,
    desc_completa: descCompletaTxt,
    score_eixos: scoreEixos,
    eixos_config: EIXOS_CONFIG,
    sorted_skills: sortedSkills,
    perfil_top: perfilTop,
    cat_top: catTop,
    eixo_perfil_top: eixoPerfilTop,
    eixo_cat_top: eixoCatTop,
    maior_peso: maiorPeso,
    // Admin Painel de Controle tables
    colunas_score: COLUNAS_SCORE,
    colunas_eixos_score: colunasEixosScore,
    score_eixos_matrix: scoreEixosMatrix,
    origens_eixos_list: origensEixosList,
    score_perf_matrix: scorePerfMatrix,
    score_cat_matrix: scoreCatMatrix,
    detalhes_atributos_list: detalhesAtributosList,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nome = searchParams.get("nome");
    const nomesBatch = searchParams.get("nomes");
    const dataNasc = searchParams.get("data_nascimento") || undefined;

    const tables = await getReferenceTables();

    if (nomesBatch) {
      const nomesList = nomesBatch
        .split("||")
        .map((s) => s.trim())
        .filter(Boolean);
      const results: Record<string, ReturnType<typeof calcularDiagnosticoMembro>> = {};
      for (const n of nomesList) {
        results[n] = calcularDiagnosticoMembro(n, tables);
      }
      return NextResponse.json({
        source: "supabase-diagnostico-ampliado",
        count: nomesList.length,
        diagnosticos: results,
      });
    }

    if (!nome) {
      return NextResponse.json(
        { error: "Parâmetro 'nome' ou 'nomes' é obrigatório." },
        { status: 400 }
      );
    }

    const diag = calcularDiagnosticoMembro(nome, tables, dataNasc);
    return NextResponse.json({
      source: "supabase-diagnostico-ampliado",
      diagnostico: diag,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro ao calcular Diagnóstico Ampliado.",
      },
      { status: 500 }
    );
  }
}
