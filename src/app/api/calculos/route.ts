import { NextRequest, NextResponse } from "next/server";
import { callMamEngine, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
          .eq("nome", nomeStr)
          .maybeSingle();

        if (mapaAtual) {
          let perfilList: Array<Record<string, unknown>> = [];
          if (
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

          const detalhes = (res.data as Record<string, unknown>)
            ?.detalhamento_atributos as Array<Record<string, unknown>> | undefined;

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

          await supabaseAdmin
            .from("mapas_salvos")
            .update({ perfil_json: JSON.stringify(perfilList) })
            .eq("id", mapaAtual.id);

          salvoSupabase = true;
        }
      } catch (saveErr) {
        console.warn("Aviso ao persistir detalhamento no Supabase:", saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      result: res.data,
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
