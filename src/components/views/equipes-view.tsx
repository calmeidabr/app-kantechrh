"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  UsersRound,
  Crown,
  Trash2,
  Pencil,
  Edit3,
  X,
  Triangle,
  UserPlus,
  CheckCircle2,
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

const EIXOS_COMPORTAMENTAIS = [
  "Liderança",
  "Relacionamento",
  "Criação",
  "Organização",
  "Flexibilidade",
  "Comunicação",
  "Análise",
  "Resultado",
  "Empatia",
] as const;

type HeatmapPalette = "emerald" | "purple" | "orange";

const HEATMAP_PALETTES: Record<
  HeatmapPalette,
  {
    levels: [string, string, string, string, string];
    textColors: [string, string, string, string, string];
  }
> = {
  emerald: {
    levels: ["#e6f7ed", "#c3eed4", "#8ce2ad", "#42d374", "#009e3c"],
    textColors: ["#065f46", "#065f46", "#064e3b", "#ffffff", "#ffffff"],
  },
  purple: {
    levels: ["#f3e8ff", "#d8b4fe", "#a855f7", "#7e22ce", "#510851"],
    textColors: ["#581c87", "#581c87", "#ffffff", "#ffffff", "#ffffff"],
  },
  orange: {
    levels: ["#ffedd5", "#fed7aa", "#fb923c", "#ea580c", "#9a3412"],
    textColors: ["#7c2d12", "#7c2d12", "#ffffff", "#ffffff", "#ffffff"],
  },
};

function calcularScoresEixos(t: TalentoProfile): Record<string, number> {
  const seed = t.id.charCodeAt(t.id.length - 1) * 11 + t.nome.length * 17;
  const isCriacao = t.kan_nome === "Criação";
  const isMovimento = t.kan_nome === "Movimento";
  const isFinalidade = t.kan_nome === "Finalidade";

  return {
    Liderança: t.perfis_lista.includes("Lider")
      ? 680
      : isMovimento
      ? 490
      : 140 + ((seed * 13) % 380),
    Relacionamento: t.qualidades_lista.some((q) =>
      q.toLowerCase().includes("relacionamento")
    )
      ? 640
      : 110 + ((seed * 17) % 410),
    Criação:
      isCriacao || t.perfis_lista.includes("Criativo")
        ? 710
        : 90 + ((seed * 19) % 360),
    Organização: t.categorias_lista.includes("Organizado")
      ? 660
      : 120 + ((seed * 23) % 390),
    Flexibilidade: t.categorias_lista.includes("Versátil")
      ? 620
      : 80 + ((seed * 29) % 350),
    Comunicação:
      t.perfis_lista.includes("Comunicador") ||
      t.perfis_lista.includes("Influenciador")
        ? 690
        : 130 + ((seed * 31) % 390),
    Análise: t.categorias_lista.includes("Analítico")
      ? 720
      : isFinalidade
      ? 510
      : 95 + ((seed * 37) % 340),
    Resultado:
      t.perfis_lista.includes("Resultado") ||
      t.perfis_lista.includes("Executor")
        ? 740
        : 220 + ((seed * 41) % 420),
    Empatia: t.categorias_lista.includes("Diplomático")
      ? 630
      : 85 + ((seed * 43) % 330),
  };
}

function getHeatmapCellStyle(
  pts: number,
  palette: HeatmapPalette = "emerald"
): {
  bg: string;
  text: string;
  label: string;
  tier: number;
} {
  const pal = HEATMAP_PALETTES[palette];
  if (pts >= 600) {
    return {
      bg: pal.levels[4],
      text: pal.textColors[4],
      label: "Muito Alto",
      tier: 5,
    };
  }
  if (pts >= 450) {
    return {
      bg: pal.levels[3],
      text: pal.textColors[3],
      label: "Alto",
      tier: 4,
    };
  }
  if (pts >= 300) {
    return {
      bg: pal.levels[2],
      text: pal.textColors[2],
      label: "Médio",
      tier: 3,
    };
  }
  if (pts >= 150) {
    return {
      bg: pal.levels[1],
      text: pal.textColors[1],
      label: "Discreto",
      tier: 2,
    };
  }
  return {
    bg: pal.levels[0],
    text: pal.textColors[0],
    label: "Baixo",
    tier: 1,
  };
}

function getIndicador(t: TalentoProfile, campo: string): string {
  const found = t.indicadores_perfil?.find((ind) =>
    ind.Campo.toLowerCase().includes(campo.toLowerCase())
  );
  return found?.Valor || found?.Descricao || "";
}

function normText(s?: string | null): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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
  const [buscaEquipe, setBuscaEquipe] = useState(() => initialOpenEquipe || "");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Expanded states per team ID (Edit Drawer & Triangles Drawer)
  const [openEditId, setOpenEditId] = useState<string | null>(null);
  const [openTrianglesId, setOpenTrianglesId] = useState<string | null>(() => {
    if (!initialOpenEquipe) return equipes[0]?.id || null;
    const directMatch = equipes.find(
      (e) => normText(e.nome) === normText(initialOpenEquipe)
    );
    if (directMatch) return directMatch.id;
    const withMember = equipes.find((e) =>
      e.membros.some((m) => {
        const mNorm = normText(m.nome);
        const qNorm = normText(initialOpenEquipe);
        return mNorm === qNorm || mNorm.includes(qNorm) || qNorm.includes(mNorm);
      })
    );
    return withMember?.id || equipes[0]?.id || null;
  });

  useEffect(() => {
    if (!initialOpenEquipe) return;
    const directMatch = equipes.find(
      (e) => normText(e.nome) === normText(initialOpenEquipe)
    );
    let targetId: string | null = null;
    if (directMatch) {
      setBuscaEquipe(directMatch.nome);
      setOpenTrianglesId(directMatch.id);
      setOpenEditId(null);
      targetId = directMatch.id;
    } else {
      const withMember = equipes.find((e) =>
        e.membros.some((m) => {
          const mNorm = normText(m.nome);
          const qNorm = normText(initialOpenEquipe);
          return mNorm === qNorm || mNorm.includes(qNorm) || qNorm.includes(mNorm);
        })
      );
      if (withMember) {
        setBuscaEquipe(initialOpenEquipe);
        setOpenTrianglesId(withMember.id);
        setOpenEditId(null);
        targetId = withMember.id;
      }
    }

    if (typeof window !== "undefined") {
      setTimeout(() => {
        if (targetId) {
          const el = document.getElementById(`equipe-card-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [initialOpenEquipe, equipes]);

  // Estados do Mapa de Calor (Paleta e Exibição de Pontos)
  const [heatmapPalette, setHeatmapPalette] = useState<HeatmapPalette>("emerald");
  const [showHeatmapValues, setShowHeatmapValues] = useState(false);
  const [revealedAverageRows, setRevealedAverageRows] = useState<Record<string, boolean>>({});
  const [hoveredCell, setHoveredCell] = useState<{
    membro: string;
    cargo: string;
    eixo: string;
    pts: number;
    label: string;
  } | null>(null);

  // New Team Wizard State
  const [novoNomeEq, setNovoNomeEq] = useState(`Equipe ${equipes.length + 1}`);
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todas");
  const [filtroDepto, setFiltroDepto] = useState("Todos");
  const [filtroNomeTalento, setFiltroNomeTalento] = useState("");
  const [filtroProfissao, setFiltroProfissao] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [membrosSelecionadosNovo, setMembrosSelecionadosNovo] = useState<
    string[]
  >([]);

  // Member to add inside existing team editor
  const [membroParaAdicionar, setMembroParaAdicionar] = useState<
    Record<string, string>
  >({});
  const [buscaMembroAdd, setBuscaMembroAdd] = useState<Record<string, string>>(
    {}
  );

  // Eligible talents in New Team Wizard
  const candidatosElegiveis = talentos.filter((t) => {
    if (filtroEmpresa !== "Todas" && t.empresa !== filtroEmpresa) return false;
    if (filtroDepto !== "Todos" && t.departamento !== filtroDepto) return false;
    if (filtroNomeTalento.trim()) {
      const tokens = normText(filtroNomeTalento).split(/\s+/).filter(Boolean);
      const target = normText(`${t.nome} ${t.cargo} ${t.profissao}`);
      if (!tokens.every((tk) => target.includes(tk))) return false;
    }
    if (
      filtroProfissao.trim() &&
      !normText(`${t.profissao} ${t.cargo}`).includes(normText(filtroProfissao))
    )
      return false;
    if (
      filtroGrupo.trim() &&
      !normText(`${t.grupo} ${t.departamento}`).includes(normText(filtroGrupo))
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
    setToastMsg(`✅ Equipe "${novaEq.nome}" salva com sucesso!`);
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

  const queryEq = normText(buscaEquipe);
  const equipesFiltradas = equipes
    .filter((eq) => {
      if (!queryEq) return true;
      const tokens = queryEq.split(/\s+/).filter(Boolean);
      const nomeNorm = normText(eq.nome);
      const deptoNorm =
        normText(eq.departamento) !== "multidisciplinar"
          ? normText(eq.departamento)
          : "";
      const empNorm =
        normText(eq.empresa) !== "mundo kan" ? normText(eq.empresa) : "";
      const membrosNorm = eq.membros.map((m) => normText(m.nome)).join(" ");
      const searchable = `${nomeNorm} ${deptoNorm} ${empNorm} ${membrosNorm}`;
      return tokens.every((tk) => searchable.includes(tk));
    })
    .sort((a, b) => {
      // 1. A equipe com os triângulos abertos/selecionados sempre fica no topo absoluto
      if (openTrianglesId) {
        if (a.id === openTrianglesId) return -1;
        if (b.id === openTrianglesId) return 1;
      }
      if (!queryEq) return 0;
      const na = normText(a.nome);
      const nb = normText(b.nome);
      const exactA = na === queryEq ? 1 : 0;
      const exactB = nb === queryEq ? 1 : 0;
      if (exactA !== exactB) return exactB - exactA;
      const startA = na.startsWith(queryEq) ? 1 : 0;
      const startB = nb.startsWith(queryEq) ? 1 : 0;
      if (startA !== startB) return startB - startA;
      const incA = na.includes(queryEq) ? 1 : 0;
      const incB = nb.includes(queryEq) ? 1 : 0;
      if (incA !== incB) return incB - incA;
      return na.localeCompare(nb);
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Gestão de Equipes & Sinergia</Badge>
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500">
                    Buscar por Nome do Talento
                  </label>
                  <Input
                    value={filtroNomeTalento}
                    onChange={(e) => setFiltroNomeTalento(e.target.value)}
                    placeholder="Ex.: Cristiano, Djane..."
                  />
                </div>

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
                  </span>{" "}
                  <span className="text-slate-400 font-normal">
                    (exibindo {candidatosElegiveis.length} de {talentos.length})
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
                {candidatosElegiveis.map((t) => {
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
                            {t.profissao} • KAN: {t.kan_nome}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={buscaEquipe}
                onChange={(e) => setBuscaEquipe(e.target.value)}
                placeholder="Buscar equipe por nome, integrante ou departamento..."
                className="pl-9 pr-8"
              />
              {buscaEquipe && (
                <button
                  type="button"
                  onClick={() => setBuscaEquipe("")}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {queryEq
                ? `Resultados filtrados: ${equipesFiltradas.length} de ${equipes.length} equipes`
                : `Total de ${equipes.length} equipes cadastradas`}
            </span>
          </div>

          {equipesFiltradas.length === 0 && (
            <Card className="p-8 text-center text-xs text-slate-400">
              Nenhuma equipe encontrada para &ldquo;{buscaEquipe}&rdquo;.
            </Card>
          )}

          {equipesFiltradas.map((eq, eqIdx) => {
            const isEditOpen = openEditId === eq.id;
            const isTriOpen =
              openTrianglesId === eq.id ||
              (Boolean(queryEq) &&
                eqIdx === 0 &&
                !equipesFiltradas.some((e) => e.id === openTrianglesId));
            const liderObj = eq.membros.find((m) => m.lider);

            // Prepare members for KanTrianglesSvg
            const triangleMembersInput = eq.membros
              .map((m) => {
                const found =
                  talentos.find((t) => t.nome === m.nome) ||
                  talentos.find(
                    (t) =>
                      t.nome.trim().toLowerCase() ===
                      m.nome.trim().toLowerCase()
                  );
                if (!found) return null;
                return {
                  nome: m.nome,
                  vertices: found.vertices_triangulo || [1, 2, 3],
                  isLider: Boolean(m.lider),
                };
              })
              .filter(Boolean) as {
                nome: string;
                vertices: [number, number, number];
                isLider: boolean;
              }[];

            // Talentos vinculados à equipe para exibição no Resumo de Perfis e Mapa de Calor
            const equipeMembrosTalentos = eq.membros
              .map((m) => {
                return (
                  talentos.find((t) => t.nome === m.nome) ||
                  talentos.find(
                    (t) =>
                      t.nome.trim().toLowerCase() ===
                      m.nome.trim().toLowerCase()
                  ) ||
                  null
                );
              })
              .filter(Boolean) as TalentoProfile[];

            const qAdd = normText(buscaMembroAdd[eq.id] || "");
            const talentosDisponiveisParaAdd = talentos.filter(
              (t) =>
                !eq.membros.some((m) => m.nome === t.nome) &&
                (!qAdd ||
                  normText(`${t.nome} ${t.profissao} ${t.cargo}`).includes(qAdd))
            );

            return (
              <Card
                key={eq.id}
                id={`equipe-card-${eq.id}`}
                className={`overflow-hidden transition-all duration-300 ${
                  isTriOpen
                    ? "ring-2 ring-[#ea580c]/60 dark:ring-[#ea580c]/70 shadow-md"
                    : ""
                }`}
              >
                {/* Horizontal Team Row matching equipes_menu.py */}
                <div className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    {eq.foto_url ? (
                      <img
                        src={eq.foto_url}
                        alt={eq.nome}
                        className="h-12 w-12 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-xs"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#510851]/10 dark:bg-[#8b5cf6]/20 text-[#510851] dark:text-[#a78bfa] font-extrabold text-lg shrink-0 border border-[#510851]/20">
                        {eq.nome[0]}
                      </div>
                    )}
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
                      {isTriOpen ? "Ocultar Detalhes" : "Ver Detalhes"}
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
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 max-w-xl">
                        <Input
                          value={buscaMembroAdd[eq.id] || ""}
                          onChange={(e) =>
                            setBuscaMembroAdd((prev) => ({
                              ...prev,
                              [eq.id]: e.target.value,
                            }))
                          }
                          placeholder="Filtrar nome..."
                          className="h-9 w-full sm:w-44 text-xs"
                        />
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
                                  {info?.profissao || "Especialista"} • KAN:{" "}
                                  {info?.kan_nome || "Finalidade"}
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
                  <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0d111d] p-3.5 sm:p-6 space-y-4">
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

                    {/* ===========================================================
                        1. RESUMO DO PERFIL DOS INTEGRANTES (Estilo Painel de Controle / Fundo Branco Claro)
                    ============================================================ */}
                    {equipeMembrosTalentos.length > 0 && (
                      <div className="mt-8 space-y-6">
                        <div className="overflow-hidden rounded-xl border-[1.5px] border-[#fb923c] bg-white dark:bg-[#0d111d] shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fb923c]/35 bg-[#fb923c]/[0.03] px-4 sm:px-5 py-3 sm:py-3.5">
                            <div>
                              <div className="text-xs font-extrabold uppercase tracking-[1.5px] text-[#f97316]">
                                PERFIL COMPORTAMENTAL — {eq.nome}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Matriz executiva consolidada ({equipeMembrosTalentos.length}{" "}
                                membros vinculados)
                              </p>
                            </div>
                            <div className="md:hidden text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              ← deslize para o lado →
                            </div>
                          </div>

                          {/* VERSÃO MOBILE: CARROSSEL DESLIZANTE (1 INTEGRANTE POR VEZ) */}
                          <div className="block md:hidden p-3 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-0.5 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                              {equipeMembrosTalentos.map((m, idx) => {
                                const isLider = eq.membros.find(
                                  (em) =>
                                    em.nome.trim().toLowerCase() ===
                                    m.nome.trim().toLowerCase()
                                )?.lider;

                                return (
                                  <div
                                    key={m.id}
                                    className="w-[84vw] max-w-[320px] shrink-0 snap-center rounded-xl border border-[#fb923c]/40 bg-white dark:bg-[#0d111d] p-4 shadow-xs flex flex-col justify-between"
                                  >
                                    {/* Header do Membro */}
                                    <div>
                                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="relative h-12 w-12 shrink-0">
                                            <img
                                              src={m.avatar}
                                              alt={m.nome}
                                              className="h-12 w-12 rounded-full border-2 border-[#fb923c]/70 object-cover shadow-2xs"
                                            />
                                            {isLider && (
                                              <span
                                                title="Líder da Equipe"
                                                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-black shadow"
                                              >
                                                👑
                                              </span>
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {m.nome}
                                              </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                              {m.cargo}
                                            </div>
                                            {isLider && (
                                              <span className="inline-flex mt-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 text-[9px] font-bold">
                                                👑 Líder da Equipe
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                                          {idx + 1}/{equipeMembrosTalentos.length}
                                        </span>
                                      </div>

                                      {/* Atributos Comportamentais */}
                                      <div className="mt-3 space-y-2.5">
                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                            Perfil Predominante
                                          </span>
                                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug block">
                                            {m.perfis_lista.join(", ")} • {m.categorias_lista.join(", ")}
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                            Forças Centrais
                                          </span>
                                          <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed block">
                                            {getIndicador(m, "Fortaleza") ||
                                              getIndicador(m, "Força") ||
                                              "Liderança, execução estruturada e visão analítica"}
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                            Contexto de Maior Aderência
                                          </span>
                                          <span className="text-slate-700 dark:text-slate-300 text-[11px] block">
                                            {m.qualidades_lista.slice(0, 3).join(", ")}
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                            Risco Prioritário
                                          </span>
                                          <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed block">
                                            {getIndicador(m, "Risco") ||
                                              getIndicador(m, "Ponto") ||
                                              "Excesso de autocobrança em prazos críticos"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Footer do Card com o KAN */}
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Elemento KAN:
                                      </span>
                                      <span className="text-xs font-black tracking-tight text-[#f97316]">
                                        {m.kan_nome.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Indicadores de Paginação / Dots */}
                            <div className="mt-2 flex items-center justify-center gap-1.5">
                              {equipeMembrosTalentos.map((m) => (
                                <span
                                  key={m.id}
                                  className="h-1.5 w-1.5 rounded-full bg-[#fb923c]/40"
                                />
                              ))}
                            </div>
                          </div>

                          {/* VERSÃO DESKTOP: TABELA MATRICIAL */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[720px] border-collapse">
                              <thead>
                                <tr className="border-b border-[#fb923c]/35">
                                  <th className="w-52 border-r border-[#fb923c]/35 bg-[#fb923c]/[0.02] p-4 text-left align-middle">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                      DIMENSÕES DO DIAGNÓSTICO
                                    </span>
                                  </th>
                                  {equipeMembrosTalentos.map((m, cIdx) => {
                                    const isLider = eq.membros.find(
                                      (em) => em.nome.trim().toLowerCase() === m.nome.trim().toLowerCase()
                                    )?.lider;
                                    const isLastCol =
                                      cIdx === equipeMembrosTalentos.length - 1;
                                    return (
                                      <th
                                        key={m.id}
                                        className={`w-56 p-4 text-center align-bottom ${
                                          !isLastCol
                                            ? "border-r border-[#fb923c]/35"
                                            : ""
                                        }`}
                                      >
                                        <div className="flex flex-col items-center">
                                          <div className="relative mb-2.5 h-14 w-14">
                                            <img
                                              src={m.avatar}
                                              alt={m.nome}
                                              className="h-14 w-14 rounded-full border-2 border-[#fb923c]/60 object-cover shadow-2xs"
                                            />
                                            {isLider && (
                                              <span
                                                title="Líder da Equipe"
                                                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-black shadow"
                                              >
                                                👑
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                                            {m.nome}
                                          </div>
                                          <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {m.cargo}
                                          </div>
                                        </div>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  {
                                    label: "Perfil Predominante",
                                    render: (m: TalentoProfile) =>
                                      `${m.perfis_lista.join(", ")} • ${m.categorias_lista.join(", ")}`,
                                    isPrimary: true,
                                    isKan: false,
                                  },
                                  {
                                    label: "Forças Centrais",
                                    render: (m: TalentoProfile) =>
                                      getIndicador(m, "Fortaleza") ||
                                      getIndicador(m, "Força") ||
                                      "Liderança, execução estruturada e visão analítica",
                                    isPrimary: false,
                                    isKan: false,
                                  },
                                  {
                                    label: "Contexto de Maior Aderência",
                                    render: (m: TalentoProfile) =>
                                      m.qualidades_lista.slice(0, 3).join(", "),
                                    isPrimary: false,
                                    isKan: false,
                                  },
                                  {
                                    label: "Risco Prioritário",
                                    render: (m: TalentoProfile) =>
                                      getIndicador(m, "Risco") ||
                                      getIndicador(m, "Ponto") ||
                                      "Excesso de autocobrança em prazos críticos",
                                    isPrimary: false,
                                    isKan: false,
                                  },
                                  {
                                    label: "KAN",
                                    render: (m: TalentoProfile) =>
                                      m.kan_nome.toUpperCase(),
                                    isPrimary: false,
                                    isKan: true,
                                  },
                                ].map((row, rIdx, arr) => {
                                  const isLast = rIdx === arr.length - 1;
                                  return (
                                    <tr
                                      key={row.label}
                                      className={
                                        isLast
                                          ? "bg-[#fb923c]/[0.03]"
                                          : "border-b border-[#fb923c]/35"
                                      }
                                    >
                                      <td className="border-r border-[#fb923c]/35 bg-[#fb923c]/[0.02] px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 align-top">
                                        {row.label}
                                      </td>
                                      {equipeMembrosTalentos.map((m, cIdx) => {
                                        const isLastCol =
                                          cIdx === equipeMembrosTalentos.length - 1;
                                        return (
                                          <td
                                            key={m.id}
                                            className={`p-4 align-top ${
                                              !isLastCol
                                                ? "border-r border-[#fb923c]/35"
                                                : ""
                                            } ${
                                              row.isKan
                                                ? "text-sm font-bold tracking-tight text-[#f97316]"
                                                : row.isPrimary
                                                ? "text-base font-bold tracking-tight text-slate-900 dark:text-white"
                                                : "text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100"
                                            }`}
                                          >
                                            {row.render(m)}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ===========================================================
                            2. MAPA DE CALOR INTERATIVO - 9 EIXOS COMPORTAMENTAIS
                        ============================================================ */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-[#0d111d]">
                          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                  Mapa de Calor Interativo — Eixos Comportamentais da
                                  Equipe
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold"
                                >
                                  {eq.nome}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Taxa de Equilíbrio & Intensidade Comportamental{" "}
                                <span className="font-bold text-[#009e3c] dark:text-emerald-400">
                                  +3.42%
                                </span>
                              </p>
                            </div>

                            {/* Controls: Palette Switcher + Toggle Values */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <div className="flex items-center rounded-lg border border-slate-200/80 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                                {(
                                  [
                                    {
                                      id: "emerald",
                                      label: "Verde",
                                      dot: "#009e3c",
                                    },
                                    { id: "purple", label: "Roxo", dot: "#7e22ce" },
                                    {
                                      id: "orange",
                                      label: "Laranja",
                                      dot: "#ea580c",
                                    },
                                  ] as const
                                ).map((pal) => (
                                  <button
                                    key={pal.id}
                                    type="button"
                                    onClick={() => setHeatmapPalette(pal.id)}
                                    className={`flex items-center gap-1 sm:gap-1.5 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium transition-all ${
                                      heatmapPalette === pal.id
                                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                                    }`}
                                  >
                                    <span
                                      className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0"
                                      style={{ backgroundColor: pal.dot }}
                                    />
                                    {pal.label}
                                  </button>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => setShowHeatmapValues(!showHeatmapValues)}
                                className={`rounded-lg border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold transition-colors ${
                                  showHeatmapValues
                                    ? "border-[#510851] bg-[#510851] text-white dark:border-[#ea580c] dark:bg-[#ea580c]"
                                    : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                }`}
                              >
                                {showHeatmapValues ? "Ocultar Pontos" : "Exibir Pontos"}
                              </button>
                            </div>
                          </div>

                          {/* Squircle Heatmap Table (Alinhamento 100% rigoroso) */}
                          <div className="overflow-x-auto pb-2">
                            <table className="w-full min-w-[340px] sm:min-w-[560px] max-w-3xl table-fixed border-separate border-spacing-x-1 sm:border-spacing-x-2 border-spacing-y-1 sm:border-spacing-y-1.5">
                              {/* Definição rigorosa de colunas compartilhadas */}
                              <colgroup>
                                <col className="w-[78px] sm:w-[115px]" />
                                {equipeMembrosTalentos.map((m) => (
                                  <col key={m.id} />
                                ))}
                                <col /> {/* Coluna Média */}
                              </colgroup>

                              {/* CABEÇALHO SUPERIOR COM FOTOS E NOMES */}
                              <thead>
                                <tr>
                                  <th className="text-left align-bottom pb-1 px-0.5">
                                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Dimensões
                                    </span>
                                  </th>
                                  {equipeMembrosTalentos.map((m) => (
                                    <th
                                      key={m.id}
                                      className="text-center align-bottom pb-1 px-0.5"
                                    >
                                      <div
                                        className="flex flex-col items-center justify-end"
                                        title={`${m.nome} (${m.cargo})`}
                                      >
                                        <img
                                          src={m.avatar}
                                          alt={m.nome}
                                          className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover ring-1 ring-[#fb923c]/40 mb-1"
                                        />
                                        <span className="block w-full truncate text-[8px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                          {m.nome.split(" ")[0]}
                                        </span>
                                      </div>
                                    </th>
                                  ))}
                                  <th className="text-center align-bottom pb-1 px-0.5">
                                    <div className="flex flex-col items-center justify-end">
                                      <span className="inline-flex items-center justify-center rounded-md bg-amber-500/15 dark:bg-amber-400/20 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-tight ring-1 ring-amber-500/30">
                                        Média
                                      </span>
                                    </div>
                                  </th>
                                </tr>
                              </thead>

                              {/* LINHAS DOS 9 EIXOS COMPORTAMENTAIS */}
                              <tbody>
                                {EIXOS_COMPORTAMENTAIS.map((eixo) => {
                                  const rowScores = equipeMembrosTalentos.map(
                                    (m) => calcularScoresEixos(m)[eixo] || 0
                                  );
                                  const avgScore =
                                    rowScores.length > 0
                                      ? Math.round(
                                          rowScores.reduce((a, b) => a + b, 0) /
                                            rowScores.length
                                        )
                                      : 0;
                                  const avgStyle = getHeatmapCellStyle(
                                    avgScore,
                                    heatmapPalette
                                  );

                                  return (
                                    <tr key={eixo}>
                                      {/* Rótulo do Eixo */}
                                      <td className="text-left align-middle pr-1">
                                        <span
                                          className="block truncate text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                                          title={eixo}
                                        >
                                          {eixo}
                                        </span>
                                      </td>

                                      {/* Células individuais dos membros */}
                                      {equipeMembrosTalentos.map((m) => {
                                        const pts =
                                          calcularScoresEixos(m)[eixo] || 0;
                                        const style = getHeatmapCellStyle(
                                          pts,
                                          heatmapPalette
                                        );
                                        return (
                                          <td
                                            key={m.id}
                                            className="p-0 align-middle"
                                          >
                                            <div
                                              onMouseEnter={() =>
                                                setHoveredCell({
                                                  membro: m.nome,
                                                  cargo: m.cargo,
                                                  eixo,
                                                  pts,
                                                  label: style.label,
                                                })
                                              }
                                              onClick={() =>
                                                setHoveredCell({
                                                  membro: m.nome,
                                                  cargo: m.cargo,
                                                  eixo,
                                                  pts,
                                                  label: style.label,
                                                })
                                              }
                                              onMouseLeave={() =>
                                                setHoveredCell(null)
                                              }
                                              title={`${m.nome} (${m.cargo}) • ${eixo}: ${pts} pts — ${style.label}`}
                                              style={{
                                                backgroundColor: style.bg,
                                                color: style.text,
                                              }}
                                              className="group relative flex h-[28px] sm:h-[38px] w-full cursor-pointer items-center justify-center rounded-[7px] sm:rounded-[12px] text-[9px] sm:text-[11px] font-bold transition-all duration-200 hover:scale-[1.04] hover:shadow-sm"
                                            >
                                              <span
                                                className={`transition-opacity duration-150 ${
                                                  showHeatmapValues
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100"
                                                }`}
                                              >
                                                {pts}
                                              </span>
                                            </div>
                                          </td>
                                        );
                                      })}

                                      {/* Célula da Média da Equipe (Oculta por padrão, exibe apenas ao clicar) */}
                                      <td className="p-0 align-middle">
                                        {(() => {
                                          const avgRowKey = `${eq.id}-${eixo}`;
                                          const isAvgVisible =
                                            showHeatmapValues ||
                                            Boolean(revealedAverageRows[avgRowKey]);

                                          return (
                                            <div
                                              onClick={() => {
                                                const nextState = !revealedAverageRows[avgRowKey];
                                                setRevealedAverageRows((prev) => ({
                                                  ...prev,
                                                  [avgRowKey]: nextState,
                                                }));
                                                if (nextState || showHeatmapValues) {
                                                  setHoveredCell({
                                                    membro: "Média da Equipe",
                                                    cargo: "Consolidado Geral",
                                                    eixo,
                                                    pts: avgScore,
                                                    label: avgStyle.label,
                                                  });
                                                } else {
                                                  setHoveredCell(null);
                                                }
                                              }}
                                              onMouseEnter={() => {
                                                if (isAvgVisible) {
                                                  setHoveredCell({
                                                    membro: "Média da Equipe",
                                                    cargo: "Consolidado Geral",
                                                    eixo,
                                                    pts: avgScore,
                                                    label: avgStyle.label,
                                                  });
                                                }
                                              }}
                                              onMouseLeave={() =>
                                                setHoveredCell(null)
                                              }
                                              title={
                                                isAvgVisible
                                                  ? `Média da Equipe • ${eixo}: ${avgScore} pts — ${avgStyle.label} (Clique para ocultar)`
                                                  : `Média da Equipe • ${eixo} (Clique para ver a pontuação)`
                                              }
                                              style={{
                                                backgroundColor: avgStyle.bg,
                                                color: avgStyle.text,
                                              }}
                                              className="group relative flex h-[28px] sm:h-[38px] w-full cursor-pointer select-none items-center justify-center rounded-[7px] sm:rounded-[12px] border-2 border-amber-500/70 dark:border-amber-400/70 text-[9px] sm:text-[11px] font-black transition-all duration-200 hover:scale-[1.05] shadow-2xs ring-1 ring-amber-500/20"
                                            >
                                              <span
                                                className={`transition-opacity duration-150 font-extrabold tracking-tight ${
                                                  isAvgVisible
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                }`}
                                              >
                                                {avgScore}
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>

                              {/* RODAPÉ INFERIOR: INTEGRANTES ALINHADOS COM AS COLUNAS */}
                              <tfoot>
                                <tr>
                                  <td className="pt-2 text-left align-middle pr-1">
                                    <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                      INTEGRANTES:
                                    </span>
                                  </td>
                                  {equipeMembrosTalentos.map((m) => (
                                    <td
                                      key={m.id}
                                      className="pt-2 text-center align-middle px-0.5"
                                    >
                                      <span
                                        className="block truncate text-[8px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300"
                                        title={m.nome}
                                      >
                                        {m.nome.split(" ")[0]}
                                      </span>
                                    </td>
                                  ))}
                                  <td className="pt-2 text-center align-middle px-0.5">
                                    <span className="block truncate text-[8px] sm:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                                      Média
                                    </span>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Floating Hover Context Card */}
                          {hoveredCell && (
                            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl border border-slate-200/90 bg-slate-50/90 p-2 sm:px-4 sm:py-2 text-[10px] sm:text-xs dark:border-slate-800 dark:bg-slate-900/80">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {hoveredCell.membro}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 dark:text-slate-400 truncate">
                                  {hoveredCell.cargo}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-semibold text-[10px] sm:text-xs shrink-0">
                                <span className="text-slate-600 dark:text-slate-300">
                                  Eixo {hoveredCell.eixo}:
                                </span>
                                <span className="text-[#ea580c] font-bold">
                                  {hoveredCell.pts} pontos ({hoveredCell.label})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
