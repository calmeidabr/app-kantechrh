import { NextRequest, NextResponse } from "next/server";
import { callMamEngine } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/calculos
 * BFF seguro que encaminha todos os cálculos proprietários (matching, harmonia,
 * sinergia, eixos comportamentais e sugestão de requisitos) para o container
 * isolado `mam-kantechrh`. Nenhuma fórmula fica exposta no código-fonte do navegador.
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

    return NextResponse.json({
      success: true,
      result: res.data,
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
