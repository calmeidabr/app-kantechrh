import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/usuarios
 * Retorna todos os usuários de `public.usuarios` combinados com os tenants (`public.tenants`) e `auth.users`.
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: usuariosData, error: usrErr }, { data: tenantsData }, { data: authList }] =
      await Promise.all([
        supabaseAdmin
          .from("usuarios")
          .select("*")
          .order("created_at", { ascending: true }),
        supabaseAdmin
          .from("tenants")
          .select("*")
          .order("created_at", { ascending: false }),
        supabaseAdmin.auth.admin.listUsers(),
      ]);

    const tenantsMap = new Map<string, Record<string, unknown>>();
    if (tenantsData) {
      for (const t of tenantsData) {
        if (t.id) tenantsMap.set(String(t.id), t as Record<string, unknown>);
      }
    }

    const authMap = new Map<string, Record<string, unknown>>();
    if (authList?.users) {
      for (const au of authList.users) {
        authMap.set(au.id, au as unknown as Record<string, unknown>);
      }
    }

    const usuarios = (usuariosData || []).map((row: Record<string, unknown>) => {
      const id = String(row.id || "");
      const tId = String(row.tenant_id || "00000000-0000-0000-0000-000000000000");
      const tenant = tenantsMap.get(tId);
      const authUser = authMap.get(id);

      return {
        id,
        usuario: String(row.usuario || ""),
        nome_completo: String(row.nome_completo || row.usuario || "Usuário"),
        email: String(row.email || authUser?.email || ""),
        celular: String(row.celular || "(27) 99590-8981"),
        data_nascimento: String(row.data_nascimento || "01/01/1985"),
        empresa: String(
          row.empresa ||
            tenant?.name ||
            (tId === "00000000-0000-0000-0000-000000000000" ? "Mundo Kan" : "Workspace")
        ),
        cargo: String(
          row.cargo ||
            (row.direitos === "admin master" ? "Admin Master" : "Gestor Corporativo")
        ),
        departamento: String(row.departamento || "Diretoria Executiva"),
        direitos: (row.direitos || "Comum") as
          | "admin master"
          | "Editor"
          | "Analista"
          | "Comum",
        status: (String(row.status || "Ativo") === "Inativo" ? "Inativo" : "Ativo") as
          | "Ativo"
          | "Inativo",
        foto: String(row.foto || "☖"),
        grupo: (String(row.grupo || "Geral") === "Empresas" ? "Empresas" : "Geral") as
          | "Geral"
          | "Empresas",
        tenant_id: tId,
        plano: String(tenant?.tier || "alta_performance"),
        is_main_user: Boolean(row.is_main_user ?? true),
      };
    });

    const tenants = (tenantsData || []).map((t: Record<string, unknown>) => {
      const tId = String(t.id);
      const tUsers = usuarios
        .filter((u) => u.tenant_id === tId)
        .map((u) => ({
          id: u.id,
          usuario: u.usuario,
          email: u.email,
        }));

      return {
        id: tId,
        name: String(t.name || "Organização"),
        slug: String(t.slug || "org"),
        tier: String(t.tier || "free"),
        created_at: String(t.created_at || "").slice(0, 10),
        usuarios: tUsers,
      };
    });

    return NextResponse.json({
      source: usrErr ? "fallback" : "supabase",
      warning: usrErr?.message,
      usuarios,
      tenants,
    });
  } catch (err) {
    return NextResponse.json(
      {
        source: "exception-fallback",
        error: err instanceof Error ? err.message : "Erro ao listar usuários",
        usuarios: [],
        tenants: [],
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/usuarios
 * Cria ou atualiza usuário em `public.usuarios` e gerencia sua senha no Supabase Auth (`auth.users`).
 * Também suporta criação de novo Tenant (`action: "create-tenant"` ou `action: "update-password"`).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    // Ação 1: Alterar senha de um usuário existente no Supabase Auth
    if (body.action === "update-password") {
      const { userId, usuario, newPassword } = body;
      if (!newPassword || String(newPassword).trim().length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: "A nova senha deve ter no mínimo 6 caracteres.",
          },
          { status: 400 }
        );
      }

      let targetId = userId;
      if (!targetId && usuario) {
        const { data: uRow } = await supabaseAdmin
          .from("usuarios")
          .select("id")
          .eq("usuario", usuario)
          .maybeSingle();
        targetId = uRow?.id;
      }

      if (!targetId) {
        return NextResponse.json(
          { success: false, error: "ID do usuário não localizado." },
          { status: 404 }
        );
      }

      const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(
        String(targetId),
        { password: String(newPassword).trim() }
      );

      if (pwdErr) {
        return NextResponse.json(
          { success: false, error: pwdErr.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Senha atualizada com sucesso no Supabase Auth!",
      });
    }

    // Ação 2: Alterar plano (tier) de um Tenant
    if (body.action === "update-tenant-tier") {
      const { tenantId, tier } = body;
      const { error } = await supabaseAdmin
        .from("tenants")
        .update({ tier })
        .eq("id", tenantId);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Ação 3: Criar ou atualizar usuário (e opcionalmente tenant)
    const {
      id,
      usuario,
      nome_completo,
      email,
      senha,
      celular,
      data_nascimento,
      empresa,
      cargo,
      departamento,
      direitos,
      status,
      grupo,
      tenant_id,
      tenant_tier,
    } = body;

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: "O campo 'usuario' é obrigatório." },
        { status: 400 }
      );
    }

    const cleanUser = String(usuario).trim();
    const cleanEmail = email
      ? String(email).trim()
      : `${cleanUser.toLowerCase()}@mundokan.com.br`;

    // Verificar se usuário já existe em public.usuarios
    const { data: existingUser } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .eq("usuario", cleanUser)
      .maybeSingle();

    let authId = existingUser?.id || id;

    // Se enviou senha e não tem usuário no Auth ainda, cria no Supabase Auth
    if (!existingUser && senha && String(senha).trim().length >= 6) {
      const { data: createdAuth, error: createAuthErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: String(senha).trim(),
          email_confirm: true,
          user_metadata: {
            full_name: nome_completo || cleanUser,
            empresa: empresa || "Mundo Kan",
          },
        });

      if (createAuthErr && !createAuthErr.message.toLowerCase().includes("already")) {
        return NextResponse.json(
          { success: false, error: createAuthErr.message },
          { status: 400 }
        );
      }

      if (createdAuth?.user?.id) {
        authId = createdAuth.user.id;
      }
    } else if (existingUser?.id && senha && String(senha).trim().length >= 6) {
      await supabaseAdmin.auth.admin.updateUserById(String(existingUser.id), {
        password: String(senha).trim(),
      });
    }

    // Aguardar breve propagação caso o trigger handle_new_user tenha criado registro
    const { data: afterTriggerUser } = authId
      ? await supabaseAdmin
          .from("usuarios")
          .select("*")
          .eq("id", authId)
          .maybeSingle()
      : { data: null };

    const targetRow = afterTriggerUser || existingUser;

    const userPayload: Record<string, unknown> = {
      usuario: cleanUser,
      nome_completo: nome_completo || cleanUser,
      email: cleanEmail,
      celular: celular || null,
      data_nascimento: data_nascimento || null,
      empresa: empresa || "Mundo Kan",
      cargo: cargo || null,
      departamento: departamento || null,
      direitos: direitos || "Comum",
      status: status || "Ativo",
      grupo: grupo || "Geral",
      updated_at: new Date().toISOString(),
    };

    if (tenant_id) {
      userPayload.tenant_id = tenant_id;
    }

    let savedUser;
    if (targetRow?.id) {
      const { data, error } = await supabaseAdmin
        .from("usuarios")
        .update(userPayload)
        .eq("id", targetRow.id)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      savedUser = data;

      // Se informou tenant_tier e empresa para novo tenant
      if (tenant_tier && savedUser?.tenant_id && savedUser.tenant_id !== "00000000-0000-0000-0000-000000000000") {
        await supabaseAdmin
          .from("tenants")
          .update({
            name: empresa || cleanUser,
            tier: tenant_tier,
          })
          .eq("id", savedUser.tenant_id);
      }
    } else {
      if (authId) userPayload.id = authId;
      userPayload.tenant_id = tenant_id || "00000000-0000-0000-0000-000000000000";
      userPayload.created_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from("usuarios")
        .insert(userPayload)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      savedUser = data;
    }

    return NextResponse.json({
      success: true,
      usuario: savedUser,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao salvar usuário.",
      },
      { status: 500 }
    );
  }
}
