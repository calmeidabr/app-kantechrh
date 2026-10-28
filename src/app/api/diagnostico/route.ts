import { NextRequest, NextResponse } from "next/server";
import { callMamEngine, getSupabaseAdmin, MAM_ENGINE_CONFIG } from "@/lib/supabase";

/**
 * GET /api/diagnostico
 * Verifica o status de saúde (healthcheck) do motor isolado `mam-kantechrh` e da conexão Supabase.
 */
export async function GET() {
  const urlsToTry = [
    MAM_ENGINE_CONFIG.baseUrl,
    "http://127.0.0.1:8000",
    MAM_ENGINE_CONFIG.dockerUrl,
  ];

  let mamStatus = "offline";
  let mamActiveUrl = "";
  let mamDetails: Record<string, unknown> = {};

  for (const base of Array.from(new Set(urlsToTry))) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${base}/health`, {
        headers: { "X-Internal-Secret": MAM_ENGINE_CONFIG.internalSecret },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      if (res.ok) {
        mamStatus = "online";
        mamActiveUrl = base;
        mamDetails = await res.json();
        break;
      }
    } catch {
      continue;
    }
  }

  let supabaseStatus = "offline";
  let mapasCount = 0;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { count, error } = await supabaseAdmin
      .from("mapas_salvos")
      .select("id", { count: "exact", head: true });
    if (!error) {
      supabaseStatus = "online";
      mapasCount = count || 0;
    }
  } catch {
    supabaseStatus = "offline";
  }

  return NextResponse.json({
    mamEngine: {
      status: mamStatus,
      url: mamActiveUrl || MAM_ENGINE_CONFIG.baseUrl,
      details: mamDetails,
    },
    supabase: {
      status: supabaseStatus,
      totalTalentosRegistrados: mapasCount,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/diagnostico
 * Proxy BFF seguro para acionar cálculos no container isolado `mam-kantechrh`:
 * - action = "calcular-completo": Calcula mapa cabalístico + perfil comportamental + triângulo de Tesla
 * - action = "calcular-harmonia-trio": Calcula harmonia de equipe / simulação de candidato nos 5 blocos
 * - action = "sincronizar-lote": Recalcula e sincroniza talentos de `mapas_salvos` com `mapas_salvos_valores`
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === "calcular-harmonia-trio") {
      const res = await callMamEngine("/api/v1/calcular-harmonia-trio", payload || {});
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: res.error },
          { status: 503 }
        );
      }
      return NextResponse.json({
        success: true,
        engineUrl: res.engineUrl,
        result: res.data,
      });
    }

    if (action === "sincronizar-lote") {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: mapas } = await supabaseAdmin
        .from("mapas_salvos")
        .select("nome, data_nascimento, cargo, empresa")
        .limit(100);

      if (!mapas || mapas.length === 0) {
        return NextResponse.json({
          success: true,
          processed: 0,
          message: "Nenhum registro encontrado em mapas_salvos para sincronizar.",
        });
      }

      const res = await callMamEngine<{
        processed: number;
        items: Array<Record<string, unknown>>;
      }>("/api/v1/calcular-lote", { talentos: mapas });

      if (!res.ok || !res.data) {
        return NextResponse.json(
          { success: false, error: res.error },
          { status: 503 }
        );
      }

      // Upsert batch into mapas_salvos_valores
      if (Array.isArray(res.data.items) && res.data.items.length > 0) {
        await supabaseAdmin
          .from("mapas_salvos_valores")
          .upsert(res.data.items, { onConflict: "nome" });
      }

      return NextResponse.json({
        success: true,
        engineUrl: res.engineUrl,
        processed: res.data.processed,
      });
    }

    // Default: calcular-completo
    const res = await callMamEngine("/api/v1/calcular-completo", payload || body);
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      engineUrl: res.engineUrl,
      result: res.data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno no BFF Diagnóstico.",
      },
      { status: 500 }
    );
  }
}
