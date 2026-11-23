import { NextRequest, NextResponse } from "next/server";
import { callMamEngine, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

let cachedPesos: {
  ts: number;
  pesosPerfil: Record<string, number>;
  pesosCat: Record<string, number>;
} | null = null;

async function getPesosServidor(): Promise<{
  pesosPerfil: Record<string, number>;
  pesosCat: Record<string, number>;
}> {
  if (cachedPesos && Date.now() - cachedPesos.ts < 60_000) {
    return cachedPesos;
  }
  const pesosPerfil: Record<string, number> = {};
  const pesosCat: Record<string, number> = {};
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: pData }, { data: pcData }] = await Promise.all([
      supabase.from("peso").select("*").limit(50),
      supabase.from("peso_categoria").select("*").limit(50),
    ]);
    if (Array.isArray(pData)) {
      for (const r of pData) {
        const k = String(r.campo || "").trim();
        const v = Number(r.peso);
        if (k && !isNaN(v)) pesosPerfil[k] = v;
      }
    }
    if (Array.isArray(pcData)) {
      for (const r of pcData) {
        const k = String(r.campo || "").trim();
        const v = Number(r.peso);
        if (k && !isNaN(v)) pesosCat[k] = v;
      }
    }
    cachedPesos = { ts: Date.now(), pesosPerfil, pesosCat };
  } catch {
    // fallback to built-in official weights
  }
  return { pesosPerfil, pesosCat };
}

/**
 * POST /api/calculos
 * BFF seguro que encaminha todos os cálculos proprietários (matching, harmonia,
 * sinergia, eixos comportamentais, sugestão de requisitos e detalhamento de atributos)
 * para o container isolado `mam-kantechrh`. Nenhuma fórmula fica exposta no código-fonte do navegador.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body as {
      action: string;
      payload?: Record<string, unknown>;
    };

    const endpointMap: Record<string, string> = {
      "calcular-match-vaga": "/api/v1/calcular-match-vaga",
      "calcular-harmonia-grupo": "/api/v1/calcular-harmonia-grupo",
      "calcular-sinergia-departamento": "/api/v1/calcular-sinergia-departamento",
      "sugerir-requisitos-vaga": "/api/v1/sugerir-requisitos-vaga",
      "enriquecer-talentos-lote": "/api/v1/enriquecer-talentos-lote",
      "detalhamento-atributos": "/api/v1/detalhamento-atributos",
    };

    let resultData: Record<string, unknown> | null = null;

    if (action === "detalhamento-atributos") {
      const { pesosPerfil, pesosCat } = await getPesosServidor();
      const res = await callMamEngine("/api/v1/detalhamento-atributos", {
        ...(payload || {}),
        pesos_perfil: pesosPerfil,
        pesos_cat: pesosCat,
      });
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: res.error },
          { status: 503 }
        );
      }
      resultData = res.data as Record<string, unknown>;
    } else {
      const endpoint = endpointMap[action];
      if (!endpoint) {
        return NextResponse.json(
          { success: false, error: `Ação de cálculo desconhecida: ${action}` },
          { status: 400 }
        );
      }

      const res = await callMamEngine(endpoint, payload || {});
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: res.error },
          { status: 503 }
        );
      }
      resultData = res.data as Record<string, unknown>;
    }

    // Se solicitado, persiste o detalhamento de atributos diretamente em public.mapas_salvos no Supabase
    let salvoSupabase = false;
    if (
      action === "detalhamento-atributos" &&
      payload?.salvar_supabase &&
      payload?.nome
    ) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const nomeStr = String(payload.nome).trim();
        const { data: mapaAtual } = await supabaseAdmin
          .from("mapas_salvos")
          .select("id, perfil_json")
          .ilike("nome", nomeStr)
          .limit(1)
          .maybeSingle();

        let perfilList: Array<Record<string, unknown>> = [];
        if (
          mapaAtual &&
          typeof mapaAtual.perfil_json === "string" &&
          mapaAtual.perfil_json.trim().startsWith("[")
        ) {
          try {
            perfilList = JSON.parse(mapaAtual.perfil_json);
          } catch {
            perfilList = [];
          }
        }

        // Remove registros antigos de detalhamento para evitar duplicatas
        perfilList = perfilList.filter((it) => {
          const c = String(it.Campo || "");
          return (
            !c.startsWith("Detalhamento:") &&
            c !== "DetalhamentoAtributosJSON"
          );
        });

        const detalhes = resultData?.detalhamento_atributos as
          | Array<Record<string, unknown>>
          | undefined;

        if (Array.isArray(detalhes)) {
          for (const d of detalhes) {
            const cNome = String(d.campo || d.Campo || "");
            const aNome = String(d.atributo || d.Atributo || d.Matriz || "");
            const pNome = String(d.perfil || d.Perfil || "");
            const catNome = String(d.categoria || d.Categoria || "");
            const qNome = String(d.qualidade || d.Qualidade || "");
            const sNome = String(d.soft_skills || d["Soft Skills"] || "");
            const vVal = String(d.valor || d.Valor || "");

            perfilList.push({
              Campo: `Detalhamento: ${cNome}`,
              Valor: vVal,
              Atributo: aNome,
              Perfil: pNome,
              Categoria: catNome,
              Qualidade: qNome,
              SoftSkills: sNome,
              Resultado: aNome,
              Descricao: `Atributo: ${aNome} | Perfil: ${pNome} | Categoria: ${catNome} | Qualidade: ${qNome} | Soft Skills: ${sNome}`,
            });
          }

          perfilList.push({
            Campo: "DetalhamentoAtributosJSON",
            Valor: JSON.stringify(detalhes),
            Descricao:
              "Detalhamento completo dos atributos e soft skills para auditoria",
            Resultado: "OK",
          });
        }

        if (mapaAtual?.id) {
          await supabaseAdmin
            .from("mapas_salvos")
            .update({ perfil_json: JSON.stringify(perfilList) })
            .eq("id", mapaAtual.id);
          salvoSupabase = true;
        } else {
          await supabaseAdmin.from("mapas_salvos").insert({
            nome: nomeStr,
            data_nascimento: String(payload.data_nascimento || "").trim(),
            profissao: "Especialista Corporativo",
            cargo: "Analista Sênior",
            grupo: "Geral",
            departamento: "Diretoria Executiva",
            empresa: "Mundo Kan",
            lider: false,
            tenant_id: "00000000-0000-0000-0000-000000000000",
            perfil_json: JSON.stringify(perfilList),
          });
          salvoSupabase = true;
        }
      } catch (saveErr) {
        console.warn("Aviso ao persistir detalhamento no Supabase:", saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      result: resultData,
      salvo_supabase: salvoSupabase,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro interno no BFF de cálculos.",
      },
      { status: 500 }
    );
  }
}
