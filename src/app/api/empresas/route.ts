import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/empresas?empresa=...
 * Carrega empresas (`public.empresas`) e a árvore de departamentos (`public.hierarquia_departamentos`).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaFiltro = searchParams.get("empresa");
    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: empresasData, error: empErr }, { data: hierData, error: hierErr }] =
      await Promise.all([
        supabaseAdmin.from("empresas").select("*").order("nome_empresa"),
        empresaFiltro
          ? supabaseAdmin
              .from("hierarquia_departamentos")
              .select("*")
              .eq("empresa", empresaFiltro)
              .order("ordem")
          : supabaseAdmin.from("hierarquia_departamentos").select("*").order("ordem"),
      ]);

    return NextResponse.json({
      source: empErr ? "fallback" : "supabase",
      warning: empErr?.message || hierErr?.message,
      empresas: empresasData || [],
      hierarquia: hierData || [],
    });
  } catch (err) {
    return NextResponse.json({
      source: "exception-fallback",
      error: err instanceof Error ? err.message : "Erro ao buscar empresas",
      empresas: [],
      hierarquia: [],
    });
  }
}

/**
 * POST /api/empresas
 * Salva/atualiza empresa (`type: "empresa"`) ou departamento na árvore (`type: "departamento"`).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    if (body.type === "departamento") {
      const { empresa, departamento_id, nome, parent_id, ordem } = body;
      if (!empresa || !departamento_id || !nome) {
        return NextResponse.json(
          { error: "Campos obrigatórios: empresa, departamento_id e nome." },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("hierarquia_departamentos")
        .upsert(
          {
            empresa,
            departamento_id,
            nome,
            parent_id: parent_id || null,
            ordem: Number(ordem || 0),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "empresa,departamento_id" }
        )
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, departamento: data });
    }

    // Default: upsert empresa
    const {
      nome_empresa,
      razao_social,
      cnpj,
      segmento,
      num_colaboradores,
      site,
      telefone,
      email,
      responsavel_nome,
      responsavel_celular,
      responsavel_email,
      status,
    } = body;

    if (!nome_empresa) {
      return NextResponse.json(
        { error: "O campo nome_empresa é obrigatório." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("empresas")
      .upsert(
        {
          nome_empresa,
          razao_social: razao_social || "",
          cnpj: cnpj || null,
          segmento: segmento || "Tecnologia",
          num_colaboradores: String(num_colaboradores || "50"),
          site: site || "",
          telefone: telefone || "",
          email: email || "",
          responsavel_nome: responsavel_nome || "",
          responsavel_celular: responsavel_celular || "",
          responsavel_email: responsavel_email || "",
          status: status || "Ativa",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "cnpj" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, empresa: data });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao salvar empresa/hierarquia",
      },
      { status: 500 }
    );
  }
}
