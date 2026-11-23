import { NextRequest, NextResponse } from "next/server";
import { callMamEngine, getSupabaseAdmin } from "@/lib/supabase";
import { getLastCacheInvalidationTime } from "@/lib/diagnostico-cache";

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

interface CachedDbTables {
  timestamp: number;
  serializableTables: {
    atributosAmpliado: Record<string, unknown>[];
    perfilCategoriaAmpliado: Record<string, unknown>[];
    forcasCentrais: Record<string, unknown>[];
    riscosAmpliado: Record<string, unknown>[];
    qualidadesDb: Record<string, string>;
    mapPerfilEixo: Record<string, string>;
    mapCatEixo: Record<string, string>;
    pesoDb: Record<string, number>;
    pesoCategoriaDb: Record<string, number>;
    kansDb: Record<string, { kan: string; descricao: string }>;
    repeticaoDb: Record<string, { perfil: string; categoria: string }>;
    softSkillsDescricoes: Record<string, string>;
  };
  mapasSalvos: Map<string, Record<string, unknown>>;
  mapasValores: Map<string, Record<string, unknown>>;
}

let cachedTables: CachedDbTables | null = null;
const CACHE_TTL_MS = 120 * 1000;

async function getReferenceTables(): Promise<CachedDbTables> {
  if (
    cachedTables &&
    Date.now() - cachedTables.timestamp < CACHE_TTL_MS &&
    cachedTables.timestamp > getLastCacheInvalidationTime()
  ) {
    return cachedTables;
  }

  const supabase = getSupabaseAdmin();

  const [
    { data: attrData },
    { data: perfCatData },
    { data: forcasData },
    { data: riscosData },
    { data: qualidadesData },
    { data: perfFocoData },
    { data: catAmpData },
    { data: pesoData },
    { data: pesoCatData },
    { data: kansData },
    { data: repData },
    { data: mapasData },
    { data: valoresData },
    { data: skAmpData },
    { data: skBaseData },
  ] = await Promise.all([
    supabase.from("atributos_ampliado").select("*").limit(500),
    supabase.from("perfil_categoria_ampliado").select("*").limit(300),
    supabase.from("forcas_centrais").select("*").limit(200),
    supabase.from("riscos_ampliado").select("*").limit(300),
    supabase.from("qualidades").select("*").limit(100),
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
    supabase
      .from("soft_skills_ampliado")
      .select("soft_skill_nova, soft_skill_base, descricao")
      .limit(1000),
    supabase.from("soft_skills").select("nome, explicacao").limit(100),
  ]);

  const mapPerfilEixo: Record<string, string> = {};
  if (perfFocoData) {
    for (const r of perfFocoData) {
      const pVal = cleanStr(r.perfil ?? r.Perfil);
      const eVal = cleanStr(r.eixo ?? r.Eixo);
      if (pVal && eVal) mapPerfilEixo[normalizarTermo(pVal)] = eVal;
    }
  }

  const mapCatEixo: Record<string, string> = {};
  if (catAmpData) {
    for (const r of catAmpData) {
      const cVal = cleanStr(r.categoria ?? r.CATEGORIA);
      const eVal = cleanStr(r.eixo ?? r.Eixo);
      if (cVal && eVal) mapCatEixo[normalizarTermo(cVal)] = eVal;
    }
  }

  const pesoDb: Record<string, number> = {};
  if (pesoData) {
    for (const r of pesoData) {
      const c = cleanStr(r.campo ?? r.Campo);
      const p = Number(r.peso ?? r.Peso);
      if (c && !isNaN(p)) pesoDb[c] = p;
    }
  }

  const pesoCategoriaDb: Record<string, number> = {};
  if (pesoCatData) {
    for (const r of pesoCatData) {
      const c = cleanStr(r.campo ?? r.Campo);
      const p = Number(r.peso ?? r.Peso);
      if (c && !isNaN(p)) pesoCategoriaDb[c] = p;
    }
  }

  const kansDb: Record<string, { kan: string; descricao: string }> = {};
  if (kansData) {
    for (const r of kansData) {
      const num = cleanStr(r.numero ?? r.Numero ?? r.id);
      const k = cleanStr(r.kan ?? r.KAN);
      const d = cleanStr(r.descricao ?? r.Descricao);
      if (num) kansDb[num] = { kan: k, descricao: d };
    }
  }

  const repeticaoDb: Record<string, { perfil: string; categoria: string }> = {};
  if (repData) {
    for (const r of repData) {
      const num = cleanStr(r.numero ?? r.Numero);
      if (num) {
        repeticaoDb[num] = {
          perfil: cleanStr(r.perfil ?? r.PERFIL),
          categoria: cleanStr(r.categoria ?? r.CATEGORIA),
        };
      }
    }
  }

  const qualidadesDb: Record<string, string> = {};
  if (qualidadesData) {
    for (const r of qualidadesData) {
      const q = cleanStr(r.qualidade ?? r.Qualidade ?? r.nome);
      const d = cleanStr(r.descricao ?? r.Descricao ?? r.explicacao);
      if (q && d) {
        qualidadesDb[q] = d;
        qualidadesDb[normalizarTermo(q)] = d;
      }
    }
  }

  const softSkillsDescricoes: Record<string, string> = {};
  if (skBaseData) {
    for (const r of skBaseData) {
      const n = cleanStr(r.nome);
      const d = cleanStr(r.explicacao);
      if (n && d) {
        softSkillsDescricoes[n] = d;
        softSkillsDescricoes[normalizarTermo(n)] = d;
      }
    }
  }
  if (skAmpData) {
    for (const r of skAmpData) {
      const skNova = cleanStr(r.soft_skill_nova);
      const skBase = cleanStr(r.soft_skill_base);
      const desc = cleanStr(r.descricao);
      if (desc) {
        if (skNova) {
          softSkillsDescricoes[skNova] = desc;
          softSkillsDescricoes[normalizarTermo(skNova)] = desc;
        }
        if (skBase && !softSkillsDescricoes[normalizarTermo(skBase)]) {
          softSkillsDescricoes[skBase] = desc;
          softSkillsDescricoes[normalizarTermo(skBase)] = desc;
        }
      }
    }
  }

  const mapasSalvos = new Map<string, Record<string, unknown>>();
  if (mapasData) {
    for (const r of mapasData) {
      const n = cleanStr(r.nome);
      if (n) {
        mapasSalvos.set(n, r);
        mapasSalvos.set(normalizarTermo(n), r);
      }
    }
  }

  const mapasValores = new Map<string, Record<string, unknown>>();
  if (valoresData) {
    for (const r of valoresData) {
      const n = cleanStr(r.nome);
      if (n) {
        mapasValores.set(n, r);
        mapasValores.set(normalizarTermo(n), r);
      }
    }
  }

  cachedTables = {
    timestamp: Date.now(),
    serializableTables: {
      atributosAmpliado: (attrData || []) as Record<string, unknown>[],
      perfilCategoriaAmpliado: (perfCatData || []) as Record<string, unknown>[],
      forcasCentrais: (forcasData || []) as Record<string, unknown>[],
      riscosAmpliado: (riscosData || []) as Record<string, unknown>[],
      qualidadesDb,
      mapPerfilEixo,
      mapCatEixo,
      pesoDb,
      pesoCategoriaDb,
      kansDb,
      repeticaoDb,
      softSkillsDescricoes,
    },
    mapasSalvos,
    mapasValores,
  };

  return cachedTables;
}

/**
 * GET /api/diagnostico-ampliado
 * Proxy BFF puro: lê tabelas de referência no Supabase e delega 100% dos cálculos
 * de Diagnóstico Ampliado para o container Docker isolado `mam-kantechrh`.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nome = searchParams.get("nome");
    const nomesBatch = searchParams.get("nomes");
    const dataNasc = searchParams.get("data_nascimento") || undefined;
    if (searchParams.get("refresh") === "true") {
      cachedTables = null;
    }

    const tables = await getReferenceTables();

    if (nomesBatch) {
      const nomesList = nomesBatch
        .split("||")
        .map((s) => s.trim())
        .filter(Boolean);

      const membrosPayload = nomesList.map((n) => {
        const normKey = normalizarTermo(n);
        const mapaRow =
          tables.mapasSalvos.get(n) || tables.mapasSalvos.get(normKey) || {};
        const valRow =
          tables.mapasValores.get(n) || tables.mapasValores.get(normKey) || {};
        const dtNascStr =
          cleanStr(mapaRow.data_nascimento) ||
          cleanStr(valRow.data_nascimento) ||
          "01/01/1990";
        return {
          nome: n,
          data_nascimento: dtNascStr,
          val_row: valRow,
        };
      });

      const mamRes = await callMamEngine<{
        count?: number;
        diagnosticos?: Record<string, unknown>;
      }>("/api/v1/diagnostico-ampliado-lote", {
        membros: membrosPayload,
        tables: tables.serializableTables,
      });

      if (!mamRes.ok || !mamRes.data?.diagnosticos) {
        return NextResponse.json(
          {
            error:
              mamRes.error ||
              "Motor isolado mam-kantechrh indisponível para Diagnóstico Ampliado.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        source: "mam-kantechrh-diagnostico-ampliado",
        count: nomesList.length,
        diagnosticos: mamRes.data.diagnosticos,
      });
    }

    if (!nome) {
      return NextResponse.json(
        { error: "Parâmetro 'nome' ou 'nomes' é obrigatório." },
        { status: 400 }
      );
    }

    const normKey = normalizarTermo(nome);
    const mapaRow =
      tables.mapasSalvos.get(nome.trim()) ||
      tables.mapasSalvos.get(normKey) ||
      {};
    const valRow =
      tables.mapasValores.get(nome.trim()) ||
      tables.mapasValores.get(normKey) ||
      {};
    const dtNascStr =
      cleanStr(mapaRow.data_nascimento) ||
      cleanStr(valRow.data_nascimento) ||
      cleanStr(dataNasc, "01/01/1990");

    const mamRes = await callMamEngine<{ diagnostico?: unknown }>(
      "/api/v1/diagnostico-ampliado",
      {
        nome: nome.trim(),
        data_nascimento: dtNascStr,
        val_row: valRow,
        tables: tables.serializableTables,
      }
    );

    if (!mamRes.ok || !mamRes.data?.diagnostico) {
      return NextResponse.json(
        {
          error:
            mamRes.error ||
            "Motor isolado mam-kantechrh indisponível para Diagnóstico Ampliado.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      source: "mam-kantechrh-diagnostico-ampliado",
      diagnostico: mamRes.data.diagnostico,
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
