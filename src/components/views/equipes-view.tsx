"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  UsersRound,
  Crown,
  Trash2,
  Pencil,
  Triangle,
  UserPlus,
  CheckCircle2,
  X,
  UploadCloud,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { KanTrianglesSvg } from "@/components/kan-triangles-svg";
import {
  EMPRESAS_TENANT,
  DEPARTAMENTOS_OPCOES,
  type EquipeData,
  type TalentoProfile,
} from "@/lib/mock-data";

export function EquipesView({
  equipes,
  setEquipes,
  talentos,
  initialOpenEquipe,
  onInspectTalento,
}: {
  equipes: EquipeData[];
  setEquipes: React.Dispatch<React.SetStateAction<EquipeData[]>>;
  talentos: TalentoProfile[];
  initialOpenEquipe?: string | null;
  onInspectTalento: (t: TalentoProfile) => void;
}) {
  const [addMode, setAddMode] = useState(false);
  const [buscaEquipe, setBuscaEquipe] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Expanded states per team ID (Edit Drawer & Triangles Drawer)
  const [openEditId, setOpenEditId] = useState<string | null>(
    initialOpenEquipe
      ? equipes.find((e) => e.nome === initialOpenEquipe)?.id || null
      : null
  );
  const [openTrianglesId, setOpenTrianglesId] = useState<string | null>(
    equipes[0]?.id || null
  );

  // New Team Wizard State
  const [novoNomeEq, setNovoNomeEq] = useState(`Equipe ${equipes.length + 1}`);
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todas");
  const [filtroDepto, setFiltroDepto] = useState("Todos");
  const [filtroProfissao, setFiltroProfissao] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [membrosSelecionadosNovo, setMembrosSelecionadosNovo] = useState<
    string[]
  >([]);

  // Member to add inside existing team editor
  const [membroParaAdicionar, setMembroParaAdicionar] = useState<
    Record<string, string>
  >({});

  // Eligible talents in New Team Wizard
  const candidatosElegiveis = talentos.filter((t) => {
    if (filtroEmpresa !== "Todas" && t.empresa !== filtroEmpresa) return false;
    if (filtroDepto !== "Todos" && t.departamento !== filtroDepto) return false;
    if (
      filtroProfissao.trim() &&
      !t.profissao.toLowerCase().includes(filtroProfissao.toLowerCase())
    )
      return false;
    if (
      filtroGrupo.trim() &&
      !t.grupo.toLowerCase().includes(filtroGrupo.toLowerCase())
    )
      return false;
    return true;
  });

  const handleAdicionarFiltroLote = () => {
    const nomes = candidatosElegiveis.map((c) => c.nome);
    setMembrosSelecionadosNovo((prev) => Array.from(new Set([...prev, ...nomes])));
    setToastMsg(`✅ ${nomes.length} talento(s) adicionados pelos filtros!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSalvarNovaEquipe = async () => {
    if (!novoNomeEq.trim()) {
      setToastMsg("⚠️ Informe o Nome da Equipe.");
      return;
    }
    if (membrosSelecionadosNovo.length === 0) {
      setToastMsg("⚠️ Selecione pelo menos 1 integrante para a equipe.");
      return;
    }

    const novaEq: EquipeData = {
      id: `eq-${Date.now()}`,
      nome: novoNomeEq.trim(),
      empresa:
        filtroEmpresa === "Todas" ? EMPRESAS_TENANT[0].nome : filtroEmpresa,
      departamento:
        filtroDepto === "Todos" ? "Multidisciplinar" : filtroDepto,
      membros: membrosSelecionadosNovo.map((nome, i) => ({
        nome,
        lider: i === 0,
      })),
      harmonia: 89.2,
      triangulo_status: "Encaixe Muito Alto",
      distribuicao: { Lider: 30, Criativo: 25, Executor: 25, Resultado: 20 },
    };

    try {
      await fetch("/api/equipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novaEq.nome,
          empresa: novaEq.empresa,
          departamento: novaEq.departamento,
          membros: novaEq.membros,
        }),
      });
    } catch {
      // Keep local state if offline
    }

    setEquipes((prev) => [novaEq, ...prev]);
    setAddMode(false);
    setMembrosSelecionadosNovo([]);
    setOpenTrianglesId(novaEq.id);
    setToastMsg(`✅ Equipe "${novaEq.nome}" salva no Supabase com sucesso!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Toggle Crown (Leader) inside existing team
  const handleToggleLider = (eqId: string, memberName: string) => {
    setEquipes((prev) =>
      prev.map((eq) => {
        if (eq.id !== eqId) return eq;
        const currentLider = eq.membros.find((m) => m.lider)?.nome;
        const nextLider = currentLider === memberName ? null : memberName;
        return {
          ...eq,
          membros: eq.membros.map((m) => ({
            ...m,
            lider: m.nome === nextLider,
          })),
        };
      })
    );
    setToastMsg(`👑 Liderança atualizada para ${memberName}!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Remove member from team
  const handleRemoverMembro = (eqId: string, memberName: string) => {
    setEquipes((prev) =>
      prev.map((eq) =>
        eq.id === eqId
          ? {
              ...eq,
              membros: eq.membros.filter((m) => m.nome !== memberName),
            }
          : eq
      )
    );
    setToastMsg(`Membro "${memberName}" removido da equipe.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Add member to existing team
  const handleAddMemberToTeam = (eqId: string) => {
    const targetName = membroParaAdicionar[eqId];
    if (!targetName) return;
    setEquipes((prev) =>
      prev.map((eq) => {
        if (eq.id !== eqId) return eq;
        if (eq.membros.some((m) => m.nome === targetName)) return eq;
        return {
          ...eq,
          membros: [...eq.membros, { nome: targetName, lider: false }],
        };
      })
    );
    setToastMsg(`✅ "${targetName}" adicionado à equipe!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Delete entire team
  const handleDeleteEquipe = (eqId: string, eqNome: string) => {
    setEquipes((prev) => prev.filter((e) => e.id !== eqId));
    setToastMsg(`Equipe "${eqNome}" excluída.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const equipesFiltradas = equipes.filter((eq) => {
    if (!buscaEquipe.trim()) return true;
    const q = buscaEquipe.toLowerCase();
    return (
      eq.nome.toLowerCase().includes(q) ||
      eq.empresa.toLowerCase().includes(q) ||
      eq.departamento.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Gestão de Equipes & Sinergia</Badge>
            <span className="text-xs text-slate-400">
              Tabela: <code className="font-mono">public.equipes</code> + Motor{" "}
              <code className="font-mono">harmonia.py</code>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Gestão de Equipes & Triângulos Harmônicos
          </h1>
          <p className="text-xs text-slate-500">
            Agrupe talentos por empresas, departamentos ou individualmente, defina a liderança (👑) e projete a geometria comportamental do grupo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!addMode ? (
            <Button
              onClick={() => {
                setNovoNomeEq(`Equipe ${equipes.length + 1}`);
                setAddMode(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar Nova Equipe
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setAddMode(false)}>
              <X className="h-4 w-4" />
              Voltar para Lista de Equipes
            </Button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="rounded-xl border border-[#510851]/20 bg-[#510851]/5 dark:bg-[#8b5cf6]/15 px-4 py-3 text-xs font-semibold text-[#510851] dark:text-white flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)}>✕</button>
        </div>
      )}

      {/* ===================================================================
          MODO 1: WIZARD ADICIONAR NOVA EQUIPE (COM FILTROS EM LOTE)
      ==================================================================== */}
      {addMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Nova Equipe</CardTitle>
            <CardDescription>
              Use os filtros inteligentes para importar membros em lote por Empresa, Departamento, Profissão ou Grupo, ou selecione individualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome + Foto */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold">Nome da Equipe *</label>
                <Input
                  value={novoNomeEq}
                  onChange={(e) => setNovoNomeEq(e.target.value)}
                  placeholder="Ex.: Squad Core Product & IA"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  Foto / Ícone da Equipe (Opcional)
                </label>
                <label className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-medium">
                  <UploadCloud className="h-3.5 w-3.5 text-[#510851]" />
                  <span>Enviar Imagem</span>
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>

            {/* Filtros e Adição em Lote */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-[#ea580c]" />
                  Filtros e Adição em Lote
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAdicionarFiltroLote}
                  >
                    Adicionar Filtro ({candidatosElegiveis.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMembrosSelecionadosNovo([])}
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500">
                    Empresa Base
                  </label>
                  <select
                    value={filtroEmpresa}
                    onChange={(e) => setFiltroEmpresa(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-2.5 text-xs"
                  >
                    <option value="Todas">Todas</option>
                    {EMPRESAS_TENANT.map((emp) => (
                      <option key={emp.id} value={emp.nome}>
                        {emp.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500">
                    Departamento Base
                  </label>
                  <select
                    value={filtroDepto}
                    onChange={(e) => setFiltroDepto(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-2.5 text-xs"
                  >
                    <option value="Todos">Todos</option>
                    {DEPARTAMENTOS_OPCOES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500">
                    Buscar por Profissão
                  </label>
                  <Input
                    value={filtroProfissao}
                    onChange={(e) => setFiltroProfissao(e.target.value)}
                    placeholder="Ex.: Tech Lead, Head..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500">
                    Buscar por Grupo
                  </label>
                  <Input
                    value={filtroGrupo}
                    onChange={(e) => setFiltroGrupo(e.target.value)}
                    placeholder="Ex.: Core Tech, Board..."
                  />
                </div>
              </div>
            </div>

            {/* Seleção Fina (Um a Um) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">
                  Seleção Fina (Clique para marcar/desmarcar integrantes) —{" "}
                  <span className="text-[#510851] dark:text-[#a78bfa]">
                    {membrosSelecionadosNovo.length} selecionado(s)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {talentos.map((t) => {
                  const isSel = membrosSelecionadosNovo.includes(t.nome);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setMembrosSelecionadosNovo((prev) =>
                          isSel
                            ? prev.filter((n) => n !== t.nome)
                            : [...prev, t.nome]
                        )
                      }
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isSel
                          ? "border-[#510851] bg-[#510851]/5 dark:border-[#8b5cf6] dark:bg-[#8b5cf6]/15"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={t.avatar}
                          alt={t.nome}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">
                            {t.nome}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {t.profissao} • KAN {t.kan_numero}
                          </div>
                        </div>
                      </div>
                      {isSel && (
                        <CheckCircle2 className="h-4 w-4 text-[#510851] dark:text-[#a78bfa] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-200/80 dark:border-slate-800 pt-4">
              <Button onClick={handleSalvarNovaEquipe}>
                Salvar Equipe ({membrosSelecionadosNovo.length} integrantes)
              </Button>
              <Button variant="outline" onClick={() => setAddMode(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ===================================================================
            MODO 2: LISTA DE EQUIPES + EDIÇÃO DE MEMBROS + TRIÂNGULOS SVG
        ==================================================================== */
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={buscaEquipe}
              onChange={(e) => setBuscaEquipe(e.target.value)}
              placeholder="Buscar equipe por nome, empresa ou departamento..."
              className="pl-9"
            />
          </div>

          {equipesFiltradas.map((eq) => {
            const isEditOpen = openEditId === eq.id;
            const isTriOpen = openTrianglesId === eq.id;
            const liderObj = eq.membros.find((m) => m.lider);

            // Prepare members for KanTrianglesSvg
            const triangleMembersInput = eq.membros
              .map((m) => {
                const found = talentos.find((t) => t.nome === m.nome);
                if (!found) return null;
                return {
                  nome: m.nome,
                  vertices: found.vertices_triangulo,
                  isLider: Boolean(m.lider),
                };
              })
              .filter(Boolean) as {
              nome: string;
              vertices: [number, number, number];
              isLider: boolean;
            }[];

            const talentosDisponiveisParaAdd = talentos.filter(
              (t) => !eq.membros.some((m) => m.nome === t.nome)
            );

            return (
              <Card key={eq.id} className="overflow-hidden">
                {/* Horizontal Team Row matching equipes_menu.py */}
                <div className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#510851]/10 dark:bg-[#8b5cf6]/20 text-[#510851] dark:text-[#a78bfa] font-extrabold text-lg shrink-0 border border-[#510851]/20">
                      {eq.nome[0]}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {eq.nome}
                        </h3>
                        <Badge variant="success">
                          Harmonia: {eq.harmonia}%
                        </Badge>
                        {liderObj && (
                          <Badge variant="orange">
                            <Crown className="h-3 w-3" />
                            Líder: {liderObj.nome.split(" ")[0]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {eq.membros.length} integrantes
                        </span>{" "}
                        • Empresa: {eq.empresa} • Depto: {eq.departamento}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons (Editar, Triângulos, Excluir) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={isEditOpen ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setOpenEditId(isEditOpen ? null : eq.id)
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {isEditOpen ? "Ocultar Integrantes" : "Editar Integrantes"}
                    </Button>

                    <Button
                      variant={isTriOpen ? "orange" : "outline"}
                      size="sm"
                      onClick={() =>
                        setOpenTrianglesId(isTriOpen ? null : eq.id)
                      }
                    >
                      <Triangle className="h-3.5 w-3.5" />
                      {isTriOpen ? "Ocultar Triângulos" : "Triângulos Harmônicos"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEquipe(eq.id, eq.nome)}
                      className="text-slate-400 hover:text-red-600"
                      title="Excluir Equipe"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* ===========================================================
                    DRAWER 1: EDITAR INTEGRANTES & DEFINIR LÍDER (COROA 👑)
                ============================================================ */}
                {isEditOpen && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 space-y-5">
                    {/* Add new member bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <UserPlus className="h-4 w-4 text-[#510851] dark:text-[#a78bfa]" />
                        <span>Adicionar Talento à Equipe:</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <select
                          value={membroParaAdicionar[eq.id] || ""}
                          onChange={(e) =>
                            setMembroParaAdicionar((prev) => ({
                              ...prev,
                              [eq.id]: e.target.value,
                            }))
                          }
                          className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs"
                        >
                          <option value="">
                            Selecione um talento disponível (
                            {talentosDisponiveisParaAdd.length})...
                          </option>
                          {talentosDisponiveisParaAdd.map((t) => (
                            <option key={t.id} value={t.nome}>
                              {t.nome} ({t.profissao})
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAddMemberToTeam(eq.id)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      Clique no botão <strong>Coroa (👑)</strong> para definir ou remover a liderança da equipe (peso dobrado nos cálculos de harmonia) ou na <strong>Lixeira</strong> para remover o membro.
                    </div>

                    {/* 3-Column Member Cards Grid */}
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {eq.membros.map((m) => {
                        const info = talentos.find((t) => t.nome === m.nome);
                        return (
                          <div
                            key={m.nome}
                            className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                              m.lider
                                ? "border-[#ea580c] bg-orange-500/5 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  info?.avatar ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                                }
                                alt={m.nome}
                                className="h-11 w-11 rounded-full object-cover ring-2 ring-[#ea580c]/40"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      info && onInspectTalento(info)
                                    }
                                    className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#510851] truncate"
                                  >
                                    {m.nome}
                                  </button>
                                  {m.lider && (
                                    <span className="inline-flex items-center gap-0.5 rounded bg-[#ea580c] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                      <Crown className="h-2.5 w-2.5" />
                                      Líder
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {info?.profissao || "Especialista"} • KAN{" "}
                                  {info?.kan_numero || 8}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <Button
                                size="sm"
                                variant={m.lider ? "orange" : "outline"}
                                onClick={() => handleToggleLider(eq.id, m.nome)}
                                className="h-8 text-xs"
                              >
                                <Crown className="h-3.5 w-3.5" />
                                {m.lider ? "Líder Ativo" : "Tornar Líder"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRemoverMembro(eq.id, m.nome)
                                }
                                className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ===========================================================
                    DRAWER 2: TRIÂNGULOS HARMÔNICOS INTERATIVOS (PLANO KAN)
                ============================================================ */}
                {isTriOpen && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d111d] p-6 space-y-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Triangle className="h-4 w-4 text-[#ea580c]" />
                          Geometria de Triângulos Harmônicos — {eq.nome}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Projeção oficial sobre o Plano KAN (Fogo • Terra • Água • Ar). A esfera preta indica o vértice do KAN principal de cada membro.
                        </p>
                      </div>
                      <Badge variant="purple">
                        {triangleMembersInput.length} Triângulos Projetados
                      </Badge>
                    </div>

                    <KanTrianglesSvg membros={triangleMembersInput} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
