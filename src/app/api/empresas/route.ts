import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/empresas?empresa=...
 * Carrega empresas (`public.empresas`) e a árvore de departamentos (`public.hierarquia_departamentos`) do Supabase.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaFiltro = searchParams.get("empresa");
    const tenantId = searchParams.get("tenant_id");
    const isAdminMaster = searchParams.get("admin") === "true";

    const supabaseAdmin = getSupabaseAdmin();

    let empQuery = supabaseAdmin.from("empresas").select("*").order("nome_empresa");
    let hierQuery = supabaseAdmin.from("hierarquia_departamentos").select("*").order("ordem");

    if (
      tenantId &&
      !isAdminMaster &&
      tenantId !== "00000000-0000-0000-0000-000000000000"
    ) {
      empQuery = empQuery.eq("tenant_id", tenantId);
      hierQuery = hierQuery.eq("tenant_id", tenantId);
    }

    if (empresaFiltro) {
      hierQuery = hierQuery.ilike("empresa", empresaFiltro);
    }

    const [{ data: empresasData, error: empErr }, { data: hierData, error: hierErr }] =
      await Promise.all([empQuery, hierQuery]);

    const empresas = (empresasData || []).map((row: Record<string, unknown>) => {
      const rawLogo = row.logo ? String(row.logo).trim() : "";
      const logoUrl =
        rawLogo.length > 20
          ? rawLogo.startsWith("data:")
            ? rawLogo
            : `data:image/jpeg;base64,${rawLogo}`
          : undefined;

      return {
        id: String(row.id || row.nome_empresa),
        nome_empresa: String(row.nome_empresa || "Mundo Kan"),
        razao_social: String(row.razao_social || row.nome_empresa || ""),
        cnpj: String(row.cnpj || "00.000.000/0001-00"),
        segmento: String(row.segmento || "Tecnologia"),
        num_colaboradores: String(row.num_colaboradores || "50"),
        site: String(row.site || ""),
        telefone: String(row.telefone || ""),
        email: String(row.email || ""),
        responsavel_nome: String(row.responsavel_nome || "Administrador"),
        responsavel_celular: String(row.responsavel_celular || ""),
        responsavel_email: String(row.responsavel_email || ""),
        status: (String(row.status || "Ativa") === "Inativa" ? "Inativa" : "Ativa") as "Ativa" | "Inativa",
        logo_url: logoUrl,
        tenant_id: String(row.tenant_id || "00000000-0000-0000-0000-000000000000"),
      };
    });

    const hierarquia = (hierData || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      departamento_id: String(row.departamento_id || `dept_${row.id}`),
      nome: String(row.nome || "Departamento"),
      parent_id: row.parent_id ? String(row.parent_id) : null,
      empresa: String(row.empresa || "Mundo Kan"),
      ordem: Number(row.ordem || 0),
      tenant_id: String(row.tenant_id || "00000000-0000-0000-0000-000000000000"),
    }));

    return NextResponse.json({
      source: empErr ? "fallback" : "supabase",
      warning: empErr?.message || hierErr?.message,
      empresas,
      hierarquia,
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
      const { empresa, departamento_id, nome, parent_id, ordem, tenant_id } = body;
      if (!empresa || !departamento_id || !nome) {
        return NextResponse.json(
          { error: "Campos obrigatórios: empresa, departamento_id e nome." },
          { status: 400 }
        );
      }

      const { data: existingDept } = await supabaseAdmin
        .from("hierarquia_departamentos")
        .select("id")
        .eq("departamento_id", departamento_id)
        .maybeSingle();

      const deptPayload: Record<string, unknown> = {
        empresa,
        departamento_id,
        nome,
        parent_id:
          !parent_id || parent_id === "Nenhum (Nível Mais Alto)"
            ? null
            : parent_id,
        ordem: Number(ordem || 0),
        updated_at: new Date().toISOString(),
      };

      if (tenant_id) deptPayload.tenant_id = tenant_id;

      const { data, error } = existingDept?.id
        ? await supabaseAdmin
            .from("hierarquia_departamentos")
            .update(deptPayload)
            .eq("id", existingDept.id)
            .select()
            .single()
        : await supabaseAdmin
            .from("hierarquia_departamentos")
            .insert(deptPayload)
            .select()
            .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, departamento: data });
    }

    // Default: upsert empresa
    const {
      id,
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
      tenant_id,
    } = body;

    if (!nome_empresa) {
      return NextResponse.json(
        { error: "O campo nome_empresa é obrigatório." },
        { status: 400 }
      );
    }

    const empPayload: Record<string, unknown> = {
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
    };

    if (tenant_id) empPayload.tenant_id = tenant_id;

    let savedEmp;
    let saveErr;

    if (id && !isNaN(Number(id)) && Number(id) < 1000000) {
      const res = await supabaseAdmin
        .from("empresas")
        .update(empPayload)
        .eq("id", Number(id))
        .select()
        .single();
      savedEmp = res.data;
      saveErr = res.error;
    } else {
      const { data: existingEmp } = await supabaseAdmin
        .from("empresas")
        .select("id")
        .ilike("nome_empresa", nome_empresa)
        .maybeSingle();

      if (existingEmp?.id) {
        const res = await supabaseAdmin
          .from("empresas")
          .update(empPayload)
          .eq("id", existingEmp.id)
          .select()
          .single();
        savedEmp = res.data;
        saveErr = res.error;
      } else {
        const res = await supabaseAdmin
          .from("empresas")
          .insert(empPayload)
          .select()
          .single();
        savedEmp = res.data;
        saveErr = res.error;
      }
    }

    if (saveErr) {
      return NextResponse.json({ success: false, error: saveErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, empresa: savedEmp });
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

/**
 * DELETE /api/empresas?departamento_id=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departamentoId = searchParams.get("departamento_id");
    const isAdmin = searchParams.get("admin") === "true";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Ação não permitida: A exclusão de departamentos é restrita ao Painel de Controle com perfil Administrador." },
        { status: 403 }
      );
    }
    if (!departamentoId) {
      return NextResponse.json({ error: "departamento_id obrigatório" }, { status: 400 });
    }
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("hierarquia_departamentos")
      .delete()
      .eq("departamento_id", departamentoId);
    return NextResponse.json({ success: true, deleted: departamentoId });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro ao remover departamento" },
      { status: 500 }
    );
  }
}
