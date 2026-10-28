import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, callMamEngine, normalizeKey } from "@/lib/supabase";
import { TALENTOS_MOCK, TalentoProfile, KanType } from "@/lib/mock-data";

const SOFT_SKILL_COLORS: Record<string, string> = {
  Lider: "#510851",
  Líder: "#510851",
  Resultado: "#ea580c",
  Executor: "#8b5cf6",
  Criativo: "#10b981",
  Comunicador: "#6366f1",
  Influenciador: "#f59e0b",
  Vendedor: "#ec4899",
};

function mapKanName(kanVal: unknown): KanType {
  const s = String(kanVal || "").toLowerCase();
  if (s.includes("cria") || s === "3" || s === "1" || s === "2") return "Criação";
  if (s.includes("mov") || s === "6" || s === "4" || s === "5") return "Movimento";
  return "Finalidade";
}

function mapSupabaseRowToTalento(
  row: Record<string, unknown>,
  idx: number,
  valoresRow?: Record<string, unknown>
): TalentoProfile {
  const nome = String(row.nome || `Talento ${idx + 1}`);
  const pJsonRaw = row.perfil_json;

  let kanNumero = 8;
  let kanNome: KanType = "Finalidade";
  let estrutural = 1;
  let direcionamento = 7;
  let perfisLista: string[] = [];
  let categoriasLista: string[] = [];
  let qualidadesLista: string[] = [];
  const indicadoresPerfil: { Campo: string; Valor: string; Descricao: string }[] = [];

  if (typeof pJsonRaw === "string" && pJsonRaw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(pJsonRaw) as Array<Record<string, unknown>>;
      for (const item of parsed) {
        const campoOrig = String(item.Campo || "");
        const campoNorm = normalizeKey(campoOrig);
        const rawVal = String(item.Valor ?? item.Resultado ?? "");
        const rawDesc = String(item.Descricao ?? item.Explicacao ?? "");

        if (campoNorm === "kan") {
          const numMatch = rawVal.match(/\d+/);
          if (numMatch) kanNumero = parseInt(numMatch[0], 10);
          kanNome = mapKanName(rawVal);
          indicadoresPerfil.push({
            Campo: "Índice KAN Central",
            Valor: `${kanNumero} — ${kanNome}`,
            Descricao: rawDesc || `Força primordial ${kanNome} identificada pelo motor KAN.`,
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
            .map((s) => s.trim())
            .filter(Boolean);
          indicadoresPerfil.push({
            Campo: "Perfil Comportamental",
            Valor: rawVal,
            Descricao: rawDesc.replace(/<br\s*\/?>/gi, " ") || "Vetor comportamental dominante.",
          });
        } else if (campoNorm === "categoria") {
          categoriasLista = rawVal
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          indicadoresPerfil.push({
            Campo: "Categoria Principal",
            Valor: rawVal,
            Descricao: rawDesc.replace(/<br\s*\/?>/gi, " ") || "Estilo de atuação predominante.",
          });
        } else if (campoNorm === "qualidades") {
          qualidadesLista = rawVal
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          indicadoresPerfil.push({
            Campo: "Qualidades & Suporte",
            Valor: rawVal,
            Descricao: rawDesc.replace(/<br\s*\/?>/gi, " ").replace(/<\/?b>/gi, "") || "Competências naturais de suporte.",
          });
        } else if (campoNorm === "fortaleza") {
          indicadoresPerfil.push({
            Campo: "Fortaleza Comportamental",
            Valor: rawVal,
            Descricao: rawDesc || "Potencial de destaque na operação.",
          });
        } else if (campoNorm === "desafio" || campoNorm === "riscocomportamental") {
          indicadoresPerfil.push({
            Campo: "Ponto de Atenção na Gestão",
            Valor: rawVal,
            Descricao: rawDesc || "Fator de atenção para gestão de liderança.",
          });
        }
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  // Fallback to mapas_salvos_valores if available
  if (valoresRow) {
    if (!perfisLista.length && valoresRow.perfil) {
      perfisLista = String(valoresRow.perfil)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!categoriasLista.length && valoresRow.categoria) {
      categoriasLista = String(valoresRow.categoria)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!qualidadesLista.length && valoresRow.qualidades) {
      qualidadesLista = String(valoresRow.qualidades)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (valoresRow.estrutural) {
      const n = parseInt(String(valoresRow.estrutural), 10);
      if (!isNaN(n)) estrutural = n;
    }
    if (valoresRow.direcionamento) {
      const n = parseInt(String(valoresRow.direcionamento), 10);
      if (!isNaN(n)) direcionamento = n;
    }
  }

  if (!perfisLista.length) perfisLista = ["Lider", "Resultado", "Executor"];
  if (!categoriasLista.length) categoriasLista = ["Realizador", "Visionário"];
  if (!qualidadesLista.length) qualidadesLista = ["Execução", "Análise", "Organização"];

  let v1 = kanNumero > 9 ? (kanNumero === 11 ? 2 : 4) : kanNumero || 8;
  let v2 = estrutural > 9 ? (estrutural === 11 ? 2 : 4) : estrutural || 1;
  let v3 = direcionamento > 9 ? (direcionamento === 11 ? 2 : 4) : direcionamento || 7;

  if (valoresRow?.vertice_triangulo_1 && valoresRow?.vertice_triangulo_2 && valoresRow?.vertice_triangulo_3) {
    v1 = parseInt(String(valoresRow.vertice_triangulo_1), 10) || v1;
    v2 = parseInt(String(valoresRow.vertice_triangulo_2), 10) || v2;
    v3 = parseInt(String(valoresRow.vertice_triangulo_3), 10) || v3;
  }

  // Ensure distinct vertices 1..9
  const distinct = Array.from(new Set([v1, v2, v3].filter((n) => n >= 1 && n <= 9)));
  for (const fb of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    if (distinct.length >= 3) break;
    if (!distinct.includes(fb)) distinct.push(fb);
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
    const isTop = perfisLista.some(
      (pl) => normalizeKey(pl) === normalizeKey(p)
    );
    const baseScore = isTop ? 92 - i * 3 : 76 - i * 2;
    return {
      perfil: p,
      score: Math.max(55, Math.min(98, baseScore)),
      cor: SOFT_SKILL_COLORS[p] || "#510851",
    };
  });

  const aiText = String(row.ai_diagnosis || "").trim();
  const aiParagraphs = aiText
    ? aiText.split(/\n+/).filter(Boolean)
    : [
        `O perfil corporativo de ${nome} apresenta predominância na força KAN ${kanNome} (${kanNumero}), combinando base estrutural ${v2} e vetor de direcionamento ${v3}.`,
        `Destaca-se nos vetores comportamentais de ${perfisLista.join(", ")}, com estilo ${categoriasLista.join(", ")} e forte capacidade de entrega em ${qualidadesLista.join(", ")}.`,
      ];

  return {
    id: String(row.id || idx + 1),
    codigo: String(10000000 + ((idx + 1) * 7919) % 89999999),
    nome,
    email: `${normalizeKey(nome).slice(0, 14)}@kantechrh.com.br`,
    data_nascimento: String(row.data_nascimento || "01/01/1990"),
    profissao: String(row.profissao || row.cargo || "Especialista Corporativo"),
    cargo: String(row.cargo || "Analista Sênior"),
    grupo: String(row.grupo || row.departamento || "Corporativo"),
    departamento: String(row.departamento || row.grupo || "Diretoria Executiva"),
    empresa: String(row.empresa || "KantechRH Enterprise"),
    status: "Ativo",
    avatar:
      row.foto_base64 && String(row.foto_base64).length > 20
        ? String(row.foto_base64).startsWith("data:")
          ? String(row.foto_base64)
          : `data:image/jpeg;base64,${row.foto_base64}`
        : TALENTOS_MOCK[idx % TALENTOS_MOCK.length].avatar,
    linkedin_url: String(row.linkedin_url || ""),
    experiencias: String(row.experiencias || ""),
    kan_numero: v1,
    kan_nome: kanNome,
    estrutural: v2,
    direcionamento: v3,
    perfil_dominante: `${perfisLista[0] || "Líder"} ${categoriasLista[0] || "Realizador"}`,
    perfis_lista: perfisLista,
    categorias_lista: categoriasLista,
    qualidades_lista: qualidadesLista,
    vertices_triangulo: [distinct[0], distinct[1], distinct[2]],
    aderencia_vaga: 88 + (idx % 10),
    indicadores_perfil:
      indicadoresPerfil.length > 0
        ? indicadoresPerfil
        : TALENTOS_MOCK[0].indicadores_perfil,
    soft_skills: softSkills,
    ai_diagnosis: aiParagraphs,
  };
}

/**
 * GET /api/talentos
 * Lista talentos da tabela `public.mapas_salvos` + `public.mapas_salvos_valores` no Supabase.
 * Caso o banco esteja vazio ou offline, retorna fallback estruturado com `TALENTOS_MOCK`.
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: mapasData, error: mapasError }, { data: valoresData }] =
      await Promise.all([
        supabaseAdmin
          .from("mapas_salvos")
          .select(
            "id, nome, data_nascimento, profissao, cargo, grupo, empresa, departamento, linkedin_url, experiencias, lider, perfil_json, ai_diagnosis"
          )
          .order("nome", { ascending: true })
          .limit(300),
        supabaseAdmin.from("mapas_salvos_valores").select("*").limit(300),
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
        count: TALENTOS_MOCK.length,
        talentos: TALENTOS_MOCK,
      });
    }

    const valoresMap = new Map<string, Record<string, unknown>>();
    if (valoresData) {
      for (const vRow of valoresData) {
        if (vRow.nome) valoresMap.set(String(vRow.nome), vRow);
      }
    }

    const talentos = mapasData.map((row, idx) =>
      mapSupabaseRowToTalento(
        row as Record<string, unknown>,
        idx,
        valoresMap.get(String(row.nome))
      )
    );

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
 * Cadastra ou atualiza um Talento:
 * 1) Solicita ao container isolado `mam-kantechrh` (`/api/v1/calcular-completo`) os cálculos proprietários KAN.
 * 2) Persiste os dados brutos e o `perfil_json` em `public.mapas_salvos` e os vértices/indicadores em `public.mapas_salvos_valores`.
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
    } = body;

    if (!nome || !data_nascimento) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome e data_nascimento (dd/mm/aaaa)." },
        { status: 400 }
      );
    }

    // 1. Call isolated FastAPI calculation microservice (mam-kantechrh)
    const mamResponse = await callMamEngine<Record<string, unknown>>(
      "/api/v1/calcular-completo",
      {
        nome,
        data_nascimento,
        cargo: cargo || profissao || "",
        empresa: empresa || "KantechRH Enterprise",
      }
    );

    const calcData = mamResponse.ok && mamResponse.data ? mamResponse.data : null;

    // 2. Prepare payload for public.mapas_salvos
    const supabaseAdmin = getSupabaseAdmin();
    const perfilJsonStr = calcData?.perfil_json
      ? typeof calcData.perfil_json === "string"
        ? calcData.perfil_json
        : JSON.stringify(calcData.perfil_json)
      : null;

    const upsertMapaPayload: Record<string, unknown> = {
      nome,
      data_nascimento,
      profissao: profissao || cargo || "Especialista",
      cargo: cargo || "Analista",
      grupo: grupo || departamento || "Geral",
      departamento: departamento || grupo || "Diretoria Executiva",
      empresa: empresa || "KantechRH Enterprise",
      linkedin_url: linkedin_url || "",
      experiencias: experiencias || "",
      lider: Boolean(lider),
    };

    if (perfilJsonStr) {
      upsertMapaPayload.perfil_json = perfilJsonStr;
    }

    const { data: savedRow, error: saveErr } = await supabaseAdmin
      .from("mapas_salvos")
      .upsert(upsertMapaPayload, { onConflict: "nome" })
      .select()
      .single();

    // 3. Upsert into public.mapas_salvos_valores if calculation succeeded
    if (calcData && calcData.valores_resumo) {
      const resumo = calcData.valores_resumo as Record<string, unknown>;
      await supabaseAdmin.from("mapas_salvos_valores").upsert(
        {
          nome,
          data_nascimento,
          ...resumo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "nome" }
      );
    }

    return NextResponse.json({
      success: true,
      mamCalculated: mamResponse.ok,
      mamEngineUrl: mamResponse.engineUrl,
      calculation: calcData,
      savedRecord: savedRow || upsertMapaPayload,
      dbWarning: saveErr ? saveErr.message : null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno ao salvar talento.",
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
        { error: "Parâmetro 'nome' é obrigatório para exclusão." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("mapas_salvos_valores").delete().eq("nome", nome);
    const { error } = await supabaseAdmin
      .from("mapas_salvos")
      .delete()
      .eq("nome", nome);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted: nome });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro ao excluir" },
      { status: 500 }
    );
  }
}
