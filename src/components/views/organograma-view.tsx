"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Folder,
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  Users,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  UserPlus,
  Network,
  LayoutGrid,
  GitBranch,
  CheckCircle2,
  Eye,
  Compass,
  Sparkles,
  Triangle,
  Flame,
  MoreVertical,
  GripVertical,
  AlertTriangle,
  ArrowRightLeft,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TalentoProfile, EquipeData } from "@/lib/mock-data";
import { KanTrianglesSvg } from "@/components/kan-triangles-svg";

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
    label: string;
    swatch: string;
    levels: [string, string, string, string, string];
    textColors: [string, string, string, string, string];
  }
> = {
  emerald: {
    label: "Verde",
    swatch: "🟩",
    levels: ["#e6f7ed", "#c3eed4", "#8ce2ad", "#42d374", "#009e3c"],
    textColors: ["#065f46", "#065f46", "#064e3b", "#ffffff", "#ffffff"],
  },
  purple: {
    label: "Roxo",
    swatch: "🟪",
    levels: ["#f3e8ff", "#d8b4fe", "#a855f7", "#7e22ce", "#510851"],
    textColors: ["#581c87", "#581c87", "#ffffff", "#ffffff", "#ffffff"],
  },
  orange: {
    label: "Laranja",
    swatch: "🟧",
    levels: ["#ffedd5", "#fed7aa", "#fb923c", "#ea580c", "#9a3412"],
    textColors: ["#7c2d12", "#7c2d12", "#ffffff", "#ffffff", "#ffffff"],
  },
};

const KAN_TOOLTIPS: Record<string, string> = {
  Criação:
    "Força de Criação: Perfil voltado à inovação, ideação estratégica, visão de possibilidades e abertura de novos caminhos.",
  Movimento:
    "Força de Movimento: Perfil focado em articulação, engajamento de pessoas, dinamismo relacional e fluidez operacional.",
  Finalidade:
    "Força de Finalidade: Perfil focado em conclusão de ciclo, pragmatismo, estruturação técnica e entrega sob prazo.",
  Criativo:
    "Perfil Criativo: Alta capacidade de geração de ideias, originalidade e solução de problemas complexos.",
  Comunicador:
    "Perfil Comunicador: Forte expressão interpessoal, influência positiva e conexão entre áreas.",
  Executor:
    "Perfil Executor: Orientado à ação prática, cadência de entrega e superação de metas.",
  Resultado:
    "Perfil Resultado: Foco em indicadores de performance, eficiência e impacto direto no negócio.",
  Lider:
    "Perfil Líder: Capacidade natural de direcionamento, tomada de decisão e mobilização de equipes.",
  Analítico:
    "Perfil Analítico: Rigor lógico, avaliação de riscos e decisão baseada em evidências.",
};

function getKanTooltip(key: string): string {
  return (
    KAN_TOOLTIPS[key] ||
    `Metodologia KAN (${key}): Combinação comportamental mapeada pela geometria harmônica para alocação estratégica de talentos.`
  );
}

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

function getIndicador(
  t: TalentoProfile,
  campo: string,
  fallback = ""
): string {
  const found = t.indicadores_perfil?.find((ind) =>
    ind.Campo.toLowerCase().includes(campo.toLowerCase())
  );
  return found?.Valor || found?.Descricao || fallback;
}

const CARGOS_OPCOES = [
  "CEO / Founder",
  "Diretor(a) Executivo(a)",
  "Head de Produto",
  "Tech Lead / Principal Engineer",
  "Gerente de Gente & Cultura",
  "Product Manager Sênior",
  "Especialista em Dados & IA",
  "Executivo(a) de Contas",
  "Analista de RH Sênior",
];

interface OrganogramaViewProps {
  talentos: TalentoProfile[];
  setTalentos: React.Dispatch<React.SetStateAction<TalentoProfile[]>>;
  equipes: EquipeData[];
  setEquipes: React.Dispatch<React.SetStateAction<EquipeData[]>>;
  onInspectTalento?: (talento: TalentoProfile) => void;
}

export interface DepartamentoNode {
  id: string;
  nome: string;
  parentId: string | null;
  empresa: string;
  ordem: number;
}

export interface EmpresaRecord {
  id: string;
  nome_empresa: string;
  razao_social: string;
  cnpj: string;
  segmento: string;
  responsavel_nome: string;
  email: string;
  status: "Ativa" | "Inativa";
  cor: string;
}

const INITIAL_EMPRESAS: EmpresaRecord[] = [
  {
    id: "3",
    nome_empresa: "Mundo Kan",
    razao_social: "Mundo Kan Ltda",
    cnpj: "00.000.000/0001-00",
    segmento: "Serviços de Tecnologia",
    responsavel_nome: "Cristiano Corrêa",
    email: "cristiano@mundokan.com.br",
    status: "Ativa",
    cor: "#510851",
  },
  {
    id: "8",
    nome_empresa: "Cristiano Teste",
    razao_social: "Cristiano Teste Ltda",
    cnpj: "00.000.000/0001-00",
    segmento: "Tecnologia",
    responsavel_nome: "Cristiano Almeida",
    email: "cristiano.correabr7@gmail.com",
    status: "Ativa",
    cor: "#ea580c",
  },
];

const INITIAL_DEPARTAMENTOS: DepartamentoNode[] = [
  {
    id: "dept_1779068576195_0",
    nome: "Presidência / CEO",
    parentId: null,
    empresa: "Mundo Kan",
    ordem: 0,
  },
  {
    id: "dept_1779068586460_1",
    nome: "Comercial",
    parentId: "dept_1779068576195_0",
    empresa: "Mundo Kan",
    ordem: 1,
  },
  {
    id: "dept_1779068622788_4",
    nome: "Marketing",
    parentId: "dept_1779068576195_0",
    empresa: "Mundo Kan",
    ordem: 2,
  },
  {
    id: "dept_1779068641065_4",
    nome: "RH & Gente",
    parentId: "dept_1779068576195_0",
    empresa: "Mundo Kan",
    ordem: 3,
  },
  {
    id: "dept_1779068662360_5",
    nome: "Financeiro",
    parentId: "dept_1779068576195_0",
    empresa: "Mundo Kan",
    ordem: 4,
  },
  {
    id: "dept_1779068719854_6",
    nome: "Departamento Pessoal (DP)",
    parentId: "dept_1779068641065_4",
    empresa: "Mundo Kan",
    ordem: 5,
  },
];

const EMP_COLORS = [
  "#510851",
  "#ea580c",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#f59e0b",
];

export function OrganogramaView({
  talentos,
  setTalentos,
  equipes,
  onInspectTalento,
}: OrganogramaViewProps) {
  const [empresas, setEmpresas] = useState<EmpresaRecord[]>(INITIAL_EMPRESAS);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>(
    INITIAL_EMPRESAS[0].nome_empresa
  );
  const [showEmpresasPanel, setShowEmpresasPanel] = useState(false);

  // Toast feedback state for microinteractions
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => {
      setToastFeedback((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // New / Edit Empresa state
  const [novaEmpresaNome, setNovaEmpresaNome] = useState("");
  const [novaEmpresaCnpj, setNovaEmpresaCnpj] = useState("");
  const [novaEmpresaSegmento, setNovaEmpresaSegmento] = useState("");
  const [novaEmpresaResp, setNovaEmpresaResp] = useState("");

  // Hierarchy & Departments state
  const [departamentos, setDepartamentos] = useState<DepartamentoNode[]>(
    INITIAL_DEPARTAMENTOS
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    dept_root: true,
    dept_1779068576195_0: true,
    dept_tech: true,
    dept_ops: true,
    dept_1779068641065_4: true,
  });
  const [viewMode, setViewMode] = useState<"setores" | "arvore">("setores");
  const [treeZoom, setTreeZoom] = useState<number>(100);

  // Sidebar Active Tree Builder states (Search, Inline Add Subdept, Inline Root Add, Context Menu, Rename)
  const [searchDeptTree, setSearchDeptTree] = useState("");
  const [inlineAddParentId, setInlineAddParentId] = useState<string | null>(
    null
  );
  const [inlineAddName, setInlineAddName] = useState("");
  const [showRootInlineAdd, setShowRootInlineAdd] = useState(false);
  const [rootInlineName, setRootInlineName] = useState("");
  const [openTreeMenuId, setOpenTreeMenuId] = useState<string | null>(null);
  const [renamingDeptId, setRenamingDeptId] = useState<string | null>(null);
  const [renamingDeptValue, setRenamingDeptValue] = useState("");

  // Drag & Drop states
  const [draggedTalentoId, setDraggedTalentoId] = useState<string | null>(null);
  const [dragOverDeptId, setDragOverDeptId] = useState<string | null>(null);
  const [dragOverLeaderZone, setDragOverLeaderZone] = useState(false);
  const [dragOverTeamZone, setDragOverTeamZone] = useState(false);

  // Card 3-dots menu & quick transfer state
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [transferringTalentoId, setTransferringTalentoId] = useState<
    string | null
  >(null);
  const [showQuickLeaderPicker, setShowQuickLeaderPicker] = useState(false);

  // Slide-over Drawer for "Vincular Talentos ao Setor" (Multi-select + Instant Search)
  const [showVincularDrawer, setShowVincularDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerOnlyUnallocated, setDrawerOnlyUnallocated] = useState(false);
  const [drawerSelectedNames, setDrawerSelectedNames] = useState<string[]>([]);
  const [vincularCargo, setVincularCargo] = useState(
    CARGOS_OPCOES[0] || "Executivo(a) de Contas"
  );
  const [vincularLider, setVincularLider] = useState(false);

  // Load real Empresas & Hierarquia from Supabase on mount
  useEffect(() => {
    let active = true;
    fetch("/api/empresas")
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res?.empresas) && res.empresas.length > 0) {
          const mappedEmps: EmpresaRecord[] = res.empresas.map(
            (e: Record<string, unknown>, idx: number) => ({
              id: String(e.id || `emp-${idx}`),
              nome_empresa: String(e.nome_empresa || "Mundo Kan"),
              razao_social: String(e.razao_social || e.nome_empresa || ""),
              cnpj: String(e.cnpj || "00.000.000/0001-00"),
              segmento: String(e.segmento || "Tecnologia"),
              responsavel_nome: String(e.responsavel_nome || "Administrador"),
              email: String(e.email || "contato@mundokan.com.br"),
              status:
                String(e.status || "Ativa") === "Inativa" ? "Inativa" : "Ativa",
              cor: EMP_COLORS[idx % EMP_COLORS.length],
            })
          );
          setEmpresas(mappedEmps);
          const firstActive =
            mappedEmps.find((e) => e.status === "Ativa") || mappedEmps[0];
          if (firstActive) {
            setSelectedEmpresa(firstActive.nome_empresa);
          }
        }
        if (Array.isArray(res?.hierarquia) && res.hierarquia.length > 0) {
          const mappedDepts: DepartamentoNode[] = res.hierarquia.map(
            (h: Record<string, unknown>, idx: number) => ({
              id: String(h.departamento_id || `dept_${idx}`),
              nome: String(h.nome || "Departamento"),
              parentId:
                h.parent_id &&
                String(h.parent_id) !== "null" &&
                String(h.parent_id) !== "Nenhum (Nível Mais Alto)"
                  ? String(h.parent_id)
                  : null,
              empresa: String(h.empresa || "Mundo Kan"),
              ordem: Number(h.ordem ?? idx),
            })
          );
          setDepartamentos(mappedDepts);
        }
      })
      .catch(() => {
        // Keep initial defaults
      });
    return () => {
      active = false;
    };
  }, []);

  // Department Leader tracking (talentoId -> boolean)
  const [deptLeaders, setDeptLeaders] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "4": true,
  });

  // Search & Filter inside Department
  const [searchColab, setSearchColab] = useState("");
  const [filterCargo, setFilterCargo] = useState("Todos");
  const [buscaEquipeOrg, setBuscaEquipeOrg] = useState("");

  const normText = (s?: string | null) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // Team triangles preview inside Organograma
  const [openTeamTrianglesId, setOpenTeamTrianglesId] = useState<string | null>(
    equipes[0]?.id || null
  );

  // Department Diagnostic state (Triângulos + Tabela Comparativa + Mapa de Calor)
  const [showDeptDiagnostico, setShowDeptDiagnostico] = useState(false);
  const [heatmapPalette, setHeatmapPalette] =
    useState<HeatmapPalette>("emerald");
  const [showHeatmapValues, setShowHeatmapValues] = useState(false);
  const [revealedAverageRows, setRevealedAverageRows] = useState<
    Record<string, boolean>
  >({});
  const [hoveredCell, setHoveredCell] = useState<{
    membro: string;
    cargo: string;
    eixo: string;
    pts: number;
    label: string;
  } | null>(null);

  // Pagination states for Department Collaborators & Equipes below
  const [visibleColabCount, setVisibleColabCount] = useState(9);
  const [colabPage, setColabPage] = useState(1);
  const [visibleEquipesOrgCount, setVisibleEquipesOrgCount] = useState(6);
  const [equipesOrgPage, setEquipesOrgPage] = useState(1);

  const deptosDaEmpresa = useMemo(
    () =>
      departamentos.filter(
        (d) => d.empresa.toLowerCase() === selectedEmpresa.toLowerCase()
      ),
    [departamentos, selectedEmpresa]
  );

  const deptNameByIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    departamentos.forEach((d) => {
      map[d.id.toLowerCase()] = d.nome;
    });
    return map;
  }, [departamentos]);

  const selectedDeptObj = useMemo(
    () => deptosDaEmpresa.find((d) => d.id === selectedDeptId) || null,
    [deptosDaEmpresa, selectedDeptId]
  );

  // Breadcrumb builder with node IDs for clickable navigation
  const breadcrumbNodes = useMemo(() => {
    if (selectedDeptId === "all" || !selectedDeptObj) {
      return [{ id: "all", label: "Todos os Departamentos" }];
    }
    const chain: { id: string; label: string }[] = [];
    let curr: DepartamentoNode | undefined = selectedDeptObj;
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      chain.unshift({ id: curr.id, label: curr.nome });
      curr = deptosDaEmpresa.find((d) => d.id === curr?.parentId);
    }
    return chain;
  }, [selectedDeptId, selectedDeptObj, deptosDaEmpresa]);

  // Talents filtered by selected department (including subdepartments when parent is clicked)
  const matchingDeptNames = useMemo(() => {
    if (selectedDeptId === "all" || !selectedDeptObj) return null;
    const names = new Set<string>([
      selectedDeptObj.nome.toLowerCase(),
      selectedDeptObj.id.toLowerCase(),
    ]);
    const collectChildren = (parentId: string) => {
      deptosDaEmpresa
        .filter((d) => d.parentId === parentId)
        .forEach((child) => {
          names.add(child.nome.toLowerCase());
          names.add(child.id.toLowerCase());
          collectChildren(child.id);
        });
    };
    collectChildren(selectedDeptObj.id);
    return names;
  }, [selectedDeptId, selectedDeptObj, deptosDaEmpresa]);

  const filteredColaboradores = useMemo(() => {
    const q = normText(searchColab);
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    return talentos
      .filter((t) => {
        const deptRaw = (t.departamento || "").trim().toLowerCase();
        if (!deptRaw || deptRaw === "sem departamento") {
          return false;
        }
        if (
          matchingDeptNames &&
          !matchingDeptNames.has(deptRaw) &&
          !matchingDeptNames.has((t.grupo || "").toLowerCase())
        ) {
          return false;
        }
        if (tokens.length > 0) {
          const deptResolved =
            deptNameByIdMap[(t.departamento || "").toLowerCase()] ||
            t.departamento;
          const searchable = normText(
            `${t.nome} ${t.cargo} ${t.profissao} ${deptResolved} ${t.grupo}`
          );
          if (!tokens.every((tk) => searchable.includes(tk))) {
            return false;
          }
        }
        if (filterCargo !== "Todos" && t.cargo !== filterCargo) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const lidA = deptLeaders[a.id] ? 1 : 0;
        const lidB = deptLeaders[b.id] ? 1 : 0;
        if (lidA !== lidB) return lidB - lidA;
        return a.nome.localeCompare(b.nome);
      });
  }, [
    talentos,
    matchingDeptNames,
    searchColab,
    filterCargo,
    deptLeaders,
    deptNameByIdMap,
  ]);

  // Split Department Collaborators into "Área de Liderança" vs "Integrantes da Equipe"
  const lideresDoSetor = useMemo(
    () => filteredColaboradores.filter((t) => Boolean(deptLeaders[t.id])),
    [filteredColaboradores, deptLeaders]
  );

  const integrantesDaEquipe = useMemo(
    () => filteredColaboradores.filter((t) => !deptLeaders[t.id]),
    [filteredColaboradores, deptLeaders]
  );

  // Calculate KAN Synergy / Harmony metrics for the active department
  const deptSynergyMetrics = useMemo(() => {
    const total = filteredColaboradores.length;
    if (total === 0) {
      return {
        score: 0,
        status: "Sem integrantes alocados",
        criacao: 0,
        movimento: 0,
        finalidade: 0,
      };
    }
    const criacao = filteredColaboradores.filter(
      (t) => t.kan_nome === "Criação"
    ).length;
    const movimento = filteredColaboradores.filter(
      (t) => t.kan_nome === "Movimento"
    ).length;
    const finalidade = filteredColaboradores.filter(
      (t) => t.kan_nome === "Finalidade"
    ).length;

    const activeForces = [criacao > 0, movimento > 0, finalidade > 0].filter(
      Boolean
    ).length;
    const maxForce = Math.max(criacao, movimento, finalidade);
    const balanceRatio = 1 - (maxForce - total / 3) / Math.max(1, total);
    const baseScore =
      activeForces === 3
        ? Math.min(98, Math.round(78 + balanceRatio * 20))
        : activeForces === 2
        ? Math.round(68 + balanceRatio * 14)
        : 58;

    let status = "Equilíbrio entre Criativos, Movimentadores e Finalizadores";
    if (activeForces === 1) {
      if (criacao > 0)
        status = "Concentração em Criação (Falta Movimento e Finalidade)";
      else if (movimento > 0)
        status = "Concentração em Movimento (Falta Criação e Finalidade)";
      else status = "Concentração em Finalidade (Falta Criação e Movimento)";
    } else if (activeForces === 2) {
      if (criacao === 0)
        status = "Forte em Movimento e Finalidade (Oportunidade em Criação)";
      else if (movimento === 0)
        status = "Equilíbrio entre Criativos e Finalizadores";
      else status = "Forte em Criação e Movimento (Oportunidade em Finalidade)";
    }

    return {
      score: baseScore,
      status,
      criacao,
      movimento,
      finalidade,
    };
  }, [filteredColaboradores]);

  const handleAddEmpresa = async () => {
    if (!novaEmpresaNome.trim()) return;
    const nova: EmpresaRecord = {
      id: `emp-${Date.now()}`,
      nome_empresa: novaEmpresaNome.trim(),
      razao_social: `${novaEmpresaNome.trim()} S.A.`,
      cnpj: novaEmpresaCnpj.trim() || "00.000.000/0001-00",
      segmento: novaEmpresaSegmento.trim() || "Corporativo",
      responsavel_nome: novaEmpresaResp.trim() || "Gestor RH",
      email: "contato@empresa.com.br",
      status: "Ativa",
      cor: "#510851",
    };
    setEmpresas((prev) => [...prev, nova]);
    setSelectedEmpresa(nova.nome_empresa);
    const rootDeptId = `dept_${Date.now()}`;
    setDepartamentos((prev) => [
      ...prev,
      {
        id: rootDeptId,
        nome: "Presidência / CEO",
        parentId: null,
        empresa: nova.nome_empresa,
        ordem: 0,
      },
    ]);
    setNovaEmpresaNome("");
    setNovaEmpresaCnpj("");
    setNovaEmpresaSegmento("");
    setNovaEmpresaResp("");
    triggerToast(`Empresa "${nova.nome_empresa}" cadastrada com sucesso!`);

    try {
      await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nova),
      });
      await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "departamento",
          empresa: nova.nome_empresa,
          departamento_id: rootDeptId,
          nome: "Presidência / CEO",
          parent_id: null,
          ordem: 0,
        }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  const createDepartamentoNode = async (
    nome: string,
    parentId: string | null
  ) => {
    if (!nome.trim()) return;
    const newId = `dept_${Date.now()}`;
    const ordemVal = departamentos.length;
    const cleanName = nome.trim();
    setDepartamentos((prev) => [
      ...prev,
      {
        id: newId,
        nome: cleanName,
        parentId,
        empresa: selectedEmpresa,
        ordem: ordemVal,
      },
    ]);
    if (parentId) {
      setExpandedDepts((prev) => ({ ...prev, [parentId]: true }));
    }
    setSelectedDeptId(newId);
    triggerToast(`Setor "${cleanName}" criado na estrutura!`);

    try {
      await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "departamento",
          empresa: selectedEmpresa,
          departamento_id: newId,
          nome: cleanName,
          parent_id: parentId,
          ordem: ordemVal,
        }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  const handleRenameDepartamento = async (deptId: string, novoNome: string) => {
    if (!novoNome.trim()) {
      setRenamingDeptId(null);
      return;
    }
    const clean = novoNome.trim();
    const target = departamentos.find((d) => d.id === deptId);
    setDepartamentos((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, nome: clean } : d))
    );
    if (target) {
      setTalentos((prev) =>
        prev.map((t) =>
          (t.departamento || "").toLowerCase() === target.nome.toLowerCase()
            ? { ...t, departamento: clean }
            : t
        )
      );
    }
    setRenamingDeptId(null);
    triggerToast(`Setor renomeado para "${clean}"`);

    if (target) {
      try {
        await fetch("/api/empresas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "departamento",
            empresa: target.empresa,
            departamento_id: target.id,
            nome: clean,
            parent_id: target.parentId,
            ordem: target.ordem,
          }),
        });
      } catch {
        // Keep optimistic state
      }
    }
  };

  const handleDeleteDepartamento = async (deptId: string) => {
    const target = departamentos.find((d) => d.id === deptId);
    setDepartamentos((prev) => prev.filter((d) => d.id !== deptId));
    if (selectedDeptId === deptId) setSelectedDeptId("all");
    setOpenTreeMenuId(null);
    if (target) {
      triggerToast(`Setor "${target.nome}" removido da estrutura.`);
    }
    try {
      await fetch(
        `/api/empresas?departamento_id=${encodeURIComponent(deptId)}`,
        { method: "DELETE" }
      );
    } catch {
      // Keep optimistic state
    }
  };

  // Transfer or allocate a talent to a specific department (used by Drag & Drop, Quick Transfer, and Drawer)
  const transferTalentoToDept = async (
    talentoId: string,
    targetDeptIdOrName: string,
    options?: { makeLeader?: boolean; customCargo?: string }
  ) => {
    const found = talentos.find((t) => t.id === talentoId);
    if (!found) return;
    const deptObj =
      deptosDaEmpresa.find((d) => d.id === targetDeptIdOrName) ||
      deptosDaEmpresa.find(
        (d) => d.nome.toLowerCase() === targetDeptIdOrName.toLowerCase()
      );
    const targetDeptName = deptObj ? deptObj.nome : targetDeptIdOrName;
    const updatedCargo = options?.customCargo || found.cargo;

    setTalentos((prev) =>
      prev.map((t) =>
        t.id === talentoId
          ? {
              ...t,
              departamento: targetDeptName,
              cargo: updatedCargo,
              empresa: selectedEmpresa,
            }
          : t
      )
    );

    if (options?.makeLeader !== undefined) {
      setDeptLeaders((prev) => ({
        ...prev,
        [talentoId]: Boolean(options.makeLeader),
      }));
    }

    triggerToast(
      options?.makeLeader
        ? `👑 ${found.nome} definido(a) como Líder de ${targetDeptName}!`
        : `${found.nome} alocado(a) em ${targetDeptName}!`
    );

    try {
      await fetch("/api/talentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: found.nome,
          data_nascimento: found.data_nascimento,
          profissao: found.profissao,
          cargo: updatedCargo,
          grupo: found.grupo,
          departamento: targetDeptName,
          empresa: selectedEmpresa,
          linkedin_url: found.linkedin_url,
          experiencias: found.experiencias,
          lider: options?.makeLeader ?? Boolean(deptLeaders[found.id]),
        }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  // Excluir (desvincular) talento do departamento atual
  const handleExcluirTalentoDoDept = async (talentoId: string) => {
    const found = talentos.find((t) => t.id === talentoId);
    if (!found) return;
    const oldDept =
      deptNameByIdMap[(found.departamento || "").trim().toLowerCase()] ||
      found.departamento ||
      "departamento";

    setTalentos((prev) =>
      prev.map((t) =>
        t.id === talentoId
          ? {
              ...t,
              departamento: "Sem Departamento",
              grupo:
                matchingDeptNames &&
                matchingDeptNames.has((t.grupo || "").toLowerCase())
                  ? ""
                  : t.grupo,
            }
          : t
      )
    );

    setDeptLeaders((prev) => {
      const next = { ...prev };
      delete next[talentoId];
      return next;
    });

    triggerToast(`${found.nome} excluído(a) do setor ${oldDept}.`);

    try {
      await fetch("/api/talentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: found.nome,
          data_nascimento: found.data_nascimento,
          profissao: found.profissao,
          cargo: found.cargo,
          grupo: "",
          departamento: "Sem Departamento",
          empresa: selectedEmpresa,
          linkedin_url: found.linkedin_url,
          experiencias: found.experiencias,
          lider: false,
        }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  // Batch link multiple selected talents from the Slide-over Drawer
  const handleBatchVincularTalentos = async () => {
    if (drawerSelectedNames.length === 0) return;
    const targetDeptName =
      selectedDeptObj?.nome || deptosDaEmpresa[0]?.nome || "Comercial";
    const selectedSet = new Set(drawerSelectedNames);

    const matchedTalentos = talentos.filter((t) => selectedSet.has(t.nome));

    setTalentos((prev) =>
      prev.map((t) =>
        selectedSet.has(t.nome)
          ? {
              ...t,
              departamento: targetDeptName,
              cargo: vincularCargo || t.cargo,
              empresa: selectedEmpresa,
            }
          : t
      )
    );

    if (vincularLider) {
      const updates: Record<string, boolean> = {};
      matchedTalentos.forEach((t) => {
        updates[t.id] = true;
      });
      setDeptLeaders((prev) => ({ ...prev, ...updates }));
    }

    setShowVincularDrawer(false);
    setDrawerSelectedNames([]);
    triggerToast(
      `${matchedTalentos.length} talento(s) vinculado(s) ao setor ${targetDeptName}!`
    );

    for (const found of matchedTalentos) {
      try {
        await fetch("/api/talentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: found.nome,
            data_nascimento: found.data_nascimento,
            profissao: found.profissao,
            cargo: vincularCargo || found.cargo,
            grupo: found.grupo,
            departamento: targetDeptName,
            empresa: selectedEmpresa,
            linkedin_url: found.linkedin_url,
            experiencias: found.experiencias,
            lider: vincularLider,
          }),
        });
      } catch {
        // Keep optimistic state
      }
    }
  };

  const toggleLeader = (talentoId: string) => {
    const t = talentos.find((item) => item.id === talentoId);
    const nextState = !deptLeaders[talentoId];
    setDeptLeaders((prev) => ({ ...prev, [talentoId]: nextState }));
    if (t) {
      triggerToast(
        nextState
          ? `👑 ${t.nome} promovido(a) à Liderança do Setor!`
          : `${t.nome} movido(a) para Integrantes da Equipe.`
      );
    }
  };

  // Helper to count members and check if a department has a leader
  const getDeptStats = (node: DepartamentoNode) => {
    const members = talentos.filter((t) => {
      const d = (t.departamento || "").trim().toLowerCase();
      return (
        d === node.nome.trim().toLowerCase() ||
        d === node.id.trim().toLowerCase()
      );
    });
    const hasLeader = members.some((m) => Boolean(deptLeaders[m.id]));
    return { count: members.length, hasLeader, members };
  };

  // Active Tree Builder Renderer (Seção 2.A: Hover Actions, Inline Subdept Input, Context Menu, Drag & Drop Target, Leader Alert)
  const renderTreeNodes = (parentId: string | null, level = 0) => {
    const qTree = normText(searchDeptTree);
    const children = deptosDaEmpresa
      .filter((d) => d.parentId === parentId)
      .sort((a, b) => a.ordem - b.ordem);

    return children.map((node) => {
      const subChildren = deptosDaEmpresa.filter((d) => d.parentId === node.id);
      const hasChildren = subChildren.length > 0;
      const isExpanded = Boolean(expandedDepts[node.id]) || Boolean(qTree);
      const isSelected = selectedDeptId === node.id;
      const isDragOver = dragOverDeptId === node.id;
      const { count: countInDept, hasLeader } = getDeptStats(node);

      // Filter by tree search if active
      if (qTree) {
        const matchesSelf = normText(node.nome).includes(qTree);
        const matchesDescendant = deptosDaEmpresa.some(
          (d) => d.parentId === node.id && normText(d.nome).includes(qTree)
        );
        if (!matchesSelf && !matchesDescendant) return null;
      }

      return (
        <div key={node.id} className="relative space-y-1">
          {/* Vertical hierarchy guide line for nested levels */}
          {level > 0 && (
            <div
              style={{ left: `${(level - 1) * 18 + 16}px` }}
              className="pointer-events-none absolute bottom-0 top-0 w-px bg-slate-200 dark:bg-slate-800"
            />
          )}

          <div
            style={{ paddingLeft: `${level * 18 + 10}px` }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverDeptId !== node.id) setDragOverDeptId(node.id);
            }}
            onDragLeave={() => {
              if (dragOverDeptId === node.id) setDragOverDeptId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverDeptId(null);
              const tId =
                e.dataTransfer.getData("text/plain") || draggedTalentoId;
              if (tId) {
                transferTalentoToDept(tId, node.id);
                setDraggedTalentoId(null);
              }
            }}
            onClick={() => {
              setSelectedDeptId(node.id);
              setColabPage(1);
              if (hasChildren) {
                setExpandedDepts((prev) => ({
                  ...prev,
                  [node.id]: !prev[node.id],
                }));
              }
            }}
            className={`group relative flex cursor-pointer items-center justify-between rounded-xl pr-2 py-2 text-xs transition-all ${
              isDragOver
                ? "bg-[#ea580c]/20 ring-2 ring-[#ea580c] font-bold text-[#ea580c]"
                : isSelected
                ? "border-l-4 border-[#ea580c] bg-[#ea580c]/10 font-bold text-[#ea580c] shadow-2xs"
                : level === 0
                ? "font-bold text-slate-800 hover:bg-slate-100/90 dark:text-slate-100 dark:hover:bg-slate-800/70"
                : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            {/* Left Icon + Node Name (or Inline Rename Input) */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedDepts((prev) => ({
                      ...prev,
                      [node.id]: !prev[node.id],
                    }));
                  }}
                  className="rounded p-0.5 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>
              ) : (
                <span className="w-4 shrink-0 text-center text-slate-400">
                  •
                </span>
              )}

              {level === 0 ? (
                <Building2 className="h-4 w-4 shrink-0 text-[#510851] dark:text-purple-400" />
              ) : hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-[#ea580c]" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-[#510851] dark:text-purple-400" />
                )
              ) : (
                <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}

              {renamingDeptId === node.id ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-1 items-center gap-1"
                >
                  <Input
                    value={renamingDeptValue}
                    onChange={(e) => setRenamingDeptValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleRenameDepartamento(node.id, renamingDeptValue);
                      if (e.key === "Escape") setRenamingDeptId(null);
                    }}
                    autoFocus
                    className="h-6 px-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleRenameDepartamento(node.id, renamingDeptValue)
                    }
                    className="rounded bg-emerald-600 p-1 text-white"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenamingDeptId(null)}
                    className="rounded bg-slate-200 p-1 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span className="truncate">{node.nome}</span>
              )}
            </div>

            {/* Right Counters, Leader Warning & Hover Actions (+ and ⋮) */}
            <div className="ml-1 flex items-center gap-1">
              {countInDept > 0 && !hasLeader && (
                <span
                  title="Sem líder definido neste setor"
                  className="flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400"
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  <span className="hidden xl:inline">Sem líder</span>
                </span>
              )}

              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isSelected
                    ? "bg-[#ea580c] text-white"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {countInDept}
              </span>

              {/* Floating Hover Actions: + (Subdepartamento) & ⋮ (Menu de Contexto) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center opacity-0 transition-opacity group-hover:opacity-100"
              >
                <button
                  type="button"
                  title="Adicionar Subdepartamento"
                  onClick={() => {
                    setInlineAddParentId(
                      inlineAddParentId === node.id ? null : node.id
                    );
                    setInlineAddName("");
                  }}
                  className="rounded-md p-1 text-slate-500 hover:bg-[#ea580c]/15 hover:text-[#ea580c] dark:text-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Opções do Setor"
                  onClick={() =>
                    setOpenTreeMenuId(
                      openTreeMenuId === node.id ? null : node.id
                    )
                  }
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Context Menu Dropdown (⋮) */}
            {openTreeMenuId === node.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 top-9 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => {
                    setRenamingDeptId(node.id);
                    setRenamingDeptValue(node.nome);
                    setOpenTreeMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                  Renomear Setor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInlineAddParentId(node.id);
                    setInlineAddName("");
                    setOpenTreeMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5 text-[#ea580c]" />
                  Adicionar Subárea
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeptId(node.id);
                    setShowQuickLeaderPicker(true);
                    setOpenTreeMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  Definir Líder da Área
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => handleDeleteDepartamento(node.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir Setor
                </button>
              </div>
            )}
          </div>

          {/* Inline Input for Creating a Subdepartment directly inside the Tree */}
          {inlineAddParentId === node.id && (
            <div
              style={{ marginLeft: `${(level + 1) * 18 + 10}px` }}
              className="flex items-center gap-1.5 rounded-xl border border-[#ea580c]/40 bg-[#ea580c]/5 p-1.5"
            >
              <Input
                value={inlineAddName}
                onChange={(e) => setInlineAddName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inlineAddName.trim()) {
                    createDepartamentoNode(inlineAddName, node.id);
                    setInlineAddName("");
                    setInlineAddParentId(null);
                  }
                  if (e.key === "Escape") {
                    setInlineAddParentId(null);
                  }
                }}
                placeholder={`Subárea em ${node.nome}...`}
                autoFocus
                className="h-7 bg-white text-xs dark:bg-slate-900"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (inlineAddName.trim()) {
                    createDepartamentoNode(inlineAddName, node.id);
                    setInlineAddName("");
                    setInlineAddParentId(null);
                  }
                }}
                className="h-7 bg-[#ea580c] px-2 text-xs text-white hover:bg-[#d9460f]"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setInlineAddParentId(null)}
                className="h-7 px-1.5 text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {hasChildren && isExpanded && renderTreeNodes(node.id, level + 1)}
        </div>
      );
    });
  };

  // Render Collaborator Card (reused for Leader and Team Member with appropriate styling)
  const renderCollaboratorCard = (t: TalentoProfile, isLider: boolean) => {
    const resolvedDept =
      deptNameByIdMap[(t.departamento || "").trim().toLowerCase()] ||
      t.departamento;
    const isMenuOpen = openCardMenuId === t.id;
    const isTransferOpen = transferringTalentoId === t.id;

    return (
      <div
        key={t.id}
        draggable
        onDragStart={(e) => {
          setDraggedTalentoId(t.id);
          e.dataTransfer.setData("text/plain", t.id);
        }}
        onDragEnd={() => {
          setDraggedTalentoId(null);
          setDragOverDeptId(null);
          setDragOverLeaderZone(false);
          setDragOverTeamZone(false);
        }}
        className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
          isLider
            ? "border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-white to-[#ea580c]/5 shadow-sm dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900"
            : "border-slate-200/80 bg-white hover:border-[#510851]/40 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/50"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            {/* Drag Handle + Avatar */}
            <div className="relative flex shrink-0 items-center gap-1">
              <span title="Arraste para transferir de setor ou promover a líder">
                <GripVertical className="h-4 w-4 cursor-grab text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing dark:text-slate-600" />
              </span>
              <div className="relative">
                <img
                  src={t.avatar}
                  alt={t.nome}
                  className={`h-12 w-12 rounded-full border-2 object-cover ${
                    isLider ? "border-amber-500" : "border-[#ea580c]"
                  }`}
                />
                {isLider && (
                  <span
                    title="Líder do Setor"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] shadow"
                  >
                    👑
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onInspectTalento?.(t)}
                  className="truncate text-left text-xs font-extrabold text-slate-900 hover:text-[#ea580c] hover:underline dark:text-white"
                >
                  {t.nome}
                </button>
                {isLider && (
                  <Badge className="bg-amber-500/20 text-[9px] font-extrabold text-amber-700 dark:text-amber-300">
                    Líder
                  </Badge>
                )}
              </div>
              <div className="truncate text-[11px] font-semibold text-[#ea580c]">
                {t.cargo}
              </div>
              <div className="truncate text-[10px] text-slate-400">
                {resolvedDept}
              </div>
            </div>
          </div>

          {/* 3-Dots Context Menu (⋮) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenCardMenuId(isMenuOpen ? null : t.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              title="Ações do colaborador"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-7 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    toggleLeader(t.id);
                    setOpenCardMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                >
                  <Crown className="h-3.5 w-3.5" />
                  {isLider ? "Remover da Liderança" : "Promover a Líder"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransferringTalentoId(isTransferOpen ? null : t.id);
                    setOpenCardMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-[#ea580c]" />
                  Transferir de Setor
                </button>
                {onInspectTalento && (
                  <button
                    type="button"
                    onClick={() => {
                      onInspectTalento(t);
                      setOpenCardMenuId(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#510851]" />
                    Diagnóstico Individual
                  </button>
                )}
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    handleExcluirTalentoDoDept(t.id);
                    setOpenCardMenuId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir do Departamento
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Transfer Sub-bar if "Transferir de Setor" was clicked */}
        {isTransferOpen && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-[#ea580c]/40 bg-[#ea580c]/5 p-2">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  transferTalentoToDept(t.id, e.target.value);
                  setTransferringTalentoId(null);
                }
              }}
              className="h-7 flex-1 rounded-md border bg-white px-2 text-[11px] font-medium dark:bg-slate-900"
            >
              <option value="" disabled>
                Mover para qual setor?
              </option>
              {deptosDaEmpresa.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setTransferringTalentoId(null)}
              className="rounded p-1 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Badges KAN with Hover Tooltips (Microinteraction Seção 4) */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <div className="group/kan relative inline-flex">
            <Badge variant="purple" className="cursor-help text-[10px]">
              KAN: {t.kan_nome}
            </Badge>
            <div className="pointer-events-none invisible absolute bottom-full left-0 z-40 mb-2 w-60 rounded-xl bg-slate-900 p-2.5 text-[10px] leading-relaxed font-normal text-white opacity-0 shadow-xl transition-all group-hover/kan:visible group-hover/kan:opacity-100">
              {getKanTooltip(t.kan_nome)}
            </div>
          </div>

          {t.perfis_lista[0] && (
            <div className="group/perf relative inline-flex">
              <Badge variant="secondary" className="cursor-help text-[10px]">
                {t.perfis_lista[0]}
              </Badge>
              <div className="pointer-events-none invisible absolute bottom-full left-0 z-40 mb-2 w-56 rounded-xl bg-slate-900 p-2.5 text-[10px] leading-relaxed font-normal text-white opacity-0 shadow-xl transition-all group-hover/perf:visible group-hover/perf:opacity-100">
                {getKanTooltip(t.perfis_lista[0])}
              </div>
            </div>
          )}
        </div>

        {/* Footer quick actions */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => toggleLeader(t.id)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${
              isLider
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Crown className="h-3 w-3" />
            {isLider ? "Líder" : "Tornar Líder"}
          </button>

          <div className="flex items-center gap-2">
            {onInspectTalento && (
              <button
                type="button"
                onClick={() => onInspectTalento(t)}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#510851] hover:underline dark:text-purple-300"
              >
                <Eye className="h-3 w-3" />
                Ficha
              </button>
            )}

            <button
              type="button"
              onClick={() => handleExcluirTalentoDoDept(t.id)}
              title="Excluir talento deste departamento"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-3 w-3" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative space-y-5">
      {/* FLOATING TOAST FEEDBACK (Microinteraction Seção 4) */}
      {toastFeedback && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-[#ea580c]/40 bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-[#ea580c]" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* =====================================================================
          HEADER OTIMIZADO (Seção 2.D & Wireframe):
          [Logo/Workspace] Empresa: [ Mundo Kan ▾ ] > Estrutura & Pessoas     [ Visão: Setores | Árvore ]
      ====================================================================== */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-xs dark:border-slate-800 dark:bg-[#0d111d] lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#510851] text-white shadow-xs">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 dark:border-slate-800 dark:bg-slate-900">
                <Building2 className="h-3.5 w-3.5 text-[#ea580c]" />
                <span className="text-[11px] font-medium text-slate-500">
                  Empresa:
                </span>
                <select
                  value={selectedEmpresa}
                  onChange={(e) => {
                    setSelectedEmpresa(e.target.value);
                    setSelectedDeptId("all");
                    setColabPage(1);
                  }}
                  className="cursor-pointer bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none dark:text-white"
                >
                  {empresas.map((emp) => (
                    <option
                      key={emp.id}
                      value={emp.nome_empresa}
                      className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                    >
                      {emp.nome_empresa}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Estrutura & Pessoas
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Construtor ativo de organograma, alocação de lideranças e sinergia
              comportamental KAN
            </p>
          </div>
        </div>

        {/* Right Controls: Discreet Company Manager + Clean View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmpresasPanel(!showEmpresasPanel)}
            className="h-8 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300"
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5 text-[#ea580c]" />
            {showEmpresasPanel ? "Fechar Empresas" : "Gerenciar Empresas"}
          </Button>

          <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
            <span className="px-2 text-[11px] font-semibold text-slate-400">
              Visão:
            </span>
            <button
              type="button"
              onClick={() => setViewMode("setores")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "setores"
                  ? "bg-[#510851] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Setores
            </button>
            <button
              type="button"
              onClick={() => setViewMode("arvore")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === "arvore"
                  ? "bg-[#ea580c] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Árvore Visual
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL RETRÁTIL DE GESTÃO MULTI-TENANT DE EMPRESAS */}
      {showEmpresasPanel && (
        <Card className="border-[#510851]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Cadastro e Gestão de Empresas (Multi-Tenant)
            </CardTitle>
            <CardDescription className="text-xs">
              Empresas cadastradas no ecossistema KantechRH com validação de
              CNPJ e vínculo de talentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 rounded-xl border bg-slate-50/60 p-4 dark:bg-slate-900/40 md:grid-cols-5">
              <Input
                value={novaEmpresaNome}
                onChange={(e) => setNovaEmpresaNome(e.target.value)}
                placeholder="Nome da Empresa *"
                className="h-9 text-xs"
              />
              <Input
                value={novaEmpresaCnpj}
                onChange={(e) => setNovaEmpresaCnpj(e.target.value)}
                placeholder="CNPJ (00.000.000/0001-00)"
                className="h-9 text-xs"
              />
              <Input
                value={novaEmpresaSegmento}
                onChange={(e) => setNovaEmpresaSegmento(e.target.value)}
                placeholder="Segmento de Atuação"
                className="h-9 text-xs"
              />
              <Input
                value={novaEmpresaResp}
                onChange={(e) => setNovaEmpresaResp(e.target.value)}
                placeholder="Responsável RH / Diretor"
                className="h-9 text-xs"
              />
              <Button
                onClick={handleAddEmpresa}
                className="h-9 bg-[#ea580c] text-xs font-semibold text-white hover:bg-[#d9460f]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar Empresa
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {empresas.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmpresa(emp.nome_empresa)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    selectedEmpresa === emp.nome_empresa
                      ? "border-[#510851] bg-[#510851]/5 ring-1 ring-[#510851] dark:border-purple-400"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{emp.nome_empresa}</span>
                    <Badge variant="success" className="text-[10px]">
                      {emp.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    CNPJ: {emp.cnpj} • {emp.segmento}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Resp.: {emp.responsavel_nome}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* =====================================================================
          SEÇÃO PRINCIPAL: MODO SETORES (SIDEBAR ATIVA + PAINEL ESTRUTURADO)
      ====================================================================== */}
      {viewMode === "setores" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT 4 COLS: CONSTRUTOR ATIVO DE ÁRVORE DE DEPARTAMENTOS */}
          <Card className="flex flex-col justify-between lg:col-span-4">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    <Network className="h-4 w-4 text-[#ea580c]" />
                    Departamentos ({deptosDaEmpresa.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowRootInlineAdd(true);
                      setRootInlineName("");
                    }}
                    className="h-7 border-[#ea580c]/40 text-[11px] font-bold text-[#ea580c] hover:bg-[#ea580c] hover:text-white"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Nova Área
                  </Button>
                </div>

                {/* Search Area in Sidebar */}
                <div className="relative pt-2">
                  <Search className="absolute left-2.5 top-4.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={searchDeptTree}
                    onChange={(e) => setSearchDeptTree(e.target.value)}
                    placeholder="Buscar área ou diretoria..."
                    className="h-8 pl-8 text-xs"
                  />
                  {searchDeptTree && (
                    <button
                      type="button"
                      onClick={() => setSearchDeptTree("")}
                      className="absolute right-2.5 top-4 text-xs text-slate-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5">
                {/* Global All Departments node */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeptId("all");
                    setColabPage(1);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    selectedDeptId === "all"
                      ? "bg-[#510851] text-white shadow-xs"
                      : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Todos os Departamentos
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                    {talentos.length}
                  </span>
                </button>

                {/* Active Interactive Tree */}
                <div className="space-y-0.5 pt-1">
                  {renderTreeNodes(null, 0)}
                </div>

                {/* Inline Root Department Creator */}
                {showRootInlineAdd && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-[#ea580c]/40 bg-[#ea580c]/5 p-2">
                    <Input
                      value={rootInlineName}
                      onChange={(e) => setRootInlineName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && rootInlineName.trim()) {
                          createDepartamentoNode(rootInlineName, null);
                          setRootInlineName("");
                          setShowRootInlineAdd(false);
                        }
                        if (e.key === "Escape") setShowRootInlineAdd(false);
                      }}
                      placeholder="Nome do departamento raiz..."
                      autoFocus
                      className="h-7 bg-white text-xs dark:bg-slate-900"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (rootInlineName.trim()) {
                          createDepartamentoNode(rootInlineName, null);
                          setRootInlineName("");
                          setShowRootInlineAdd(false);
                        }
                      }}
                      className="h-7 bg-[#ea580c] px-2 text-white hover:bg-[#d9460f]"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowRootInlineAdd(false)}
                      className="h-7 px-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>

            {/* Fixed Footer Button in Sidebar (Seção 2.A.2) */}
            <div className="border-t border-slate-100 p-4 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setShowRootInlineAdd(true);
                  setRootInlineName("");
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-[#ea580c] hover:bg-[#ea580c]/5 hover:text-[#ea580c] dark:border-slate-700 dark:text-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo Departamento Raiz
              </button>
              <p className="mt-1.5 text-center text-[10px] text-slate-400">
                💡 Dica: Passe o mouse nos setores para criar subáreas ou
                arraste colaboradores para as pastas.
              </p>
            </div>
          </Card>

          {/* RIGHT 8 COLS: DEPARTAMENTO ESTRUTURADO (SINERGIA KAN + LIDERANÇA + EQUIPE + DIAGNÓSTICO) */}
          <Card className="lg:col-span-8">
            <CardHeader className="pb-4">
              {/* Clickable Breadcrumb */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <span className="text-slate-500">{selectedEmpresa}</span>
                {breadcrumbNodes.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    <ChevronRight className="h-3 w-3" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDeptId(node.id);
                        setColabPage(1);
                      }}
                      className={`hover:underline ${
                        idx === breadcrumbNodes.length - 1
                          ? "font-extrabold text-[#ea580c]"
                          : "hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {node.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Department Title + Action Buttons */}
              <div className="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <CardTitle className="text-xl font-extrabold tracking-tight">
                    {selectedDeptId === "all"
                      ? "Todos os Departamentos"
                      : selectedDeptObj?.nome}
                  </CardTitle>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {filteredColaboradores.length}{" "}
                    {filteredColaboradores.length === 1 ? "pessoa" : "pessoas"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowDeptDiagnostico((prev) => !prev)}
                    disabled={filteredColaboradores.length === 0}
                    className={`text-xs font-bold transition-all ${
                      showDeptDiagnostico
                        ? "bg-[#ea580c] text-white shadow-sm hover:bg-[#d9460f]"
                        : "border border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c] hover:bg-[#ea580c] hover:text-white"
                    }`}
                  >
                    <Triangle className="mr-1.5 h-3.5 w-3.5" />
                    {showDeptDiagnostico
                      ? "Ocultar Diagnóstico"
                      : "Diagnóstico"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setShowVincularDrawer(true);
                      setDrawerSelectedNames([]);
                    }}
                    className="bg-[#510851] text-xs font-semibold text-white hover:bg-[#510851]/90"
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />+ Vincular
                    Talentos
                  </Button>
                </div>
              </div>

              {/* BARRA DE SINERGIA / HARMONIA KAN NO TOPO DO SETOR (Seção 2.C.3 & Wireframe) */}
              {filteredColaboradores.length > 0 && (
                <div className="mt-3 flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 font-extrabold text-emerald-700 dark:text-emerald-300">
                      {deptSynergyMetrics.score}%
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        <Sparkles className="h-3.5 w-3.5 text-[#ea580c]" />
                        Sinergia da Equipe: {deptSynergyMetrics.score}% (KAN)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {deptSynergyMetrics.status}
                      </div>
                    </div>
                  </div>

                  {/* Distribution of the 3 KAN Forces in the sector */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span
                      title={getKanTooltip("Criação")}
                      className="cursor-help rounded-lg bg-purple-500/10 px-2 py-1 text-purple-700 dark:text-purple-300"
                    >
                      Criação: {deptSynergyMetrics.criacao}
                    </span>
                    <span
                      title={getKanTooltip("Movimento")}
                      className="cursor-help rounded-lg bg-orange-500/10 px-2 py-1 text-orange-700 dark:text-orange-300"
                    >
                      Movimento: {deptSynergyMetrics.movimento}
                    </span>
                    <span
                      title={getKanTooltip("Finalidade")}
                      className="cursor-help rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300"
                    >
                      Finalidade: {deptSynergyMetrics.finalidade}
                    </span>
                  </div>
                </div>
              )}

              {/* Search & Cargo Filter */}
              <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={searchColab}
                    onChange={(e) => {
                      setSearchColab(e.target.value);
                      setColabPage(1);
                    }}
                    placeholder="Filtrar integrantes por nome, cargo ou perfil KAN..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <select
                  value={filterCargo}
                  onChange={(e) => {
                    setFilterCargo(e.target.value);
                    setColabPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="Todos">Todos os Cargos</option>
                  {Array.from(new Set(talentos.map((t) => t.cargo))).map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* ===============================================================
                  EMPTY STATE NOS DEPARTAMENTOS VAZIOS (Seção 4)
              ================================================================ */}
              {filteredColaboradores.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/30">
                  {/* Geometric KAN Blue Flower SVG Illustration */}
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#19345b]/10 dark:bg-blue-500/10">
                    <svg
                      viewBox="0 0 64 64"
                      className="h-10 w-10 text-[#19345b] dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="32" cy="32" r="24" strokeOpacity="0.25" />
                      <polygon
                        points="32,10 52,44 12,44"
                        stroke="#ea580c"
                        strokeWidth="2.2"
                        fill="rgba(234,88,12,0.08)"
                      />
                      <polygon
                        points="32,54 52,20 12,20"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        fill="rgba(25,52,91,0.08)"
                      />
                      <circle cx="32" cy="32" r="4" fill="#ea580c" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Este setor ainda não tem talentos alocados
                  </h4>
                  <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                    Vincule o primeiro líder ou colaborador para ativar a
                    geometria harmônica, a matriz comparativa e o mapa de calor
                    de{" "}
                    <strong>
                      {selectedDeptObj?.nome || "este departamento"}
                    </strong>
                    .
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <Button
                      size="sm"
                      onClick={() => {
                        setVincularLider(true);
                        setShowVincularDrawer(true);
                      }}
                      className="bg-[#ea580c] text-xs font-bold text-white hover:bg-[#d9460f]"
                    >
                      <Crown className="mr-1.5 h-3.5 w-3.5" />+ Definir Primeiro
                      Líder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setVincularLider(false);
                        setShowVincularDrawer(true);
                      }}
                      className="text-xs font-bold"
                    >
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" />+ Vincular
                      Colaboradores
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ===========================================================
                      BLOCO SUPERIOR: 👑 LIDERANÇA DO SETOR (Seção 2.C.1)
                  ============================================================ */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverLeaderZone(true);
                    }}
                    onDragLeave={() => setDragOverLeaderZone(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverLeaderZone(false);
                      const tId =
                        e.dataTransfer.getData("text/plain") ||
                        draggedTalentoId;
                      if (tId) {
                        const targetDept =
                          selectedDeptObj?.nome ||
                          talentos.find((item) => item.id === tId)
                            ?.departamento ||
                          "Comercial";
                        transferTalentoToDept(tId, targetDept, {
                          makeLeader: true,
                        });
                        setDraggedTalentoId(null);
                      }
                    }}
                    className={`rounded-2xl border p-4 transition-all ${
                      dragOverLeaderZone
                        ? "border-2 border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                        : "border-amber-500/30 bg-amber-500/5 dark:border-amber-500/20 dark:bg-amber-950/10"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-xs">
                          👑
                        </span>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          Liderança do Setor ({lideresDoSetor.length})
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setShowQuickLeaderPicker(!showQuickLeaderPicker)
                        }
                        className="text-[11px] font-bold text-[#ea580c] hover:underline"
                      >
                        {showQuickLeaderPicker
                          ? "Fechar seletor"
                          : "+ Definir Líder"}
                      </button>
                    </div>

                    {/* Quick inline Leader Picker */}
                    {showQuickLeaderPicker && (
                      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-white p-2.5 dark:bg-slate-900">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Escolher líder para o setor:
                        </span>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const targetDept =
                                selectedDeptObj?.nome || "Comercial";
                              transferTalentoToDept(
                                e.target.value,
                                targetDept,
                                { makeLeader: true }
                              );
                              setShowQuickLeaderPicker(false);
                            }
                          }}
                          className="h-8 flex-1 rounded-lg border px-2.5 text-xs font-medium dark:bg-slate-800"
                        >
                          <option value="" disabled>
                            Selecione um colaborador...
                          </option>
                          {filteredColaboradores.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nome} ({t.cargo} • KAN {t.kan_nome})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {lideresDoSetor.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                        {lideresDoSetor.map((t) =>
                          renderCollaboratorCard(t, true)
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => setShowQuickLeaderPicker(true)}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-500/40 bg-white/60 py-5 text-center transition-colors hover:border-amber-500 hover:bg-amber-500/10 dark:bg-slate-900/40"
                      >
                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                          [ + Definir Líder do Setor ]
                        </span>
                        <span className="mt-0.5 text-[11px] text-slate-500">
                          Clique para escolher o responsável da área ou arraste
                          um card de integrante para cá
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ===========================================================
                      BLOCO INFERIOR: 👥 INTEGRANTES DA EQUIPE (Seção 2.C.2)
                  ============================================================ */}
                  {(() => {
                    const totalIntegrantes = integrantesDaEquipe.length;
                    const isShowingAllColabs =
                      visibleColabCount >= totalIntegrantes;
                    const totalColabPages = Math.max(
                      1,
                      Math.ceil(totalIntegrantes / visibleColabCount)
                    );
                    const safeColabPage = Math.min(colabPage, totalColabPages);
                    const displayedIntegrantes = isShowingAllColabs
                      ? integrantesDaEquipe
                      : integrantesDaEquipe.slice(
                          (safeColabPage - 1) * visibleColabCount,
                          safeColabPage * visibleColabCount
                        );

                    return (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#510851] dark:text-purple-400" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              Integrantes da Equipe ({totalIntegrantes})
                            </h3>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Arraste qualquer card para outra pasta ou para a
                            liderança
                          </span>
                        </div>

                        {displayedIntegrantes.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                            {displayedIntegrantes.map((t) =>
                              renderCollaboratorCard(t, false)
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/30">
                            Todos os membros deste setor estão destacados na
                            Liderança acima.
                          </div>
                        )}

                        {/* Dropzone Footer inside Team Section (Wireframe) */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverTeamZone(true);
                          }}
                          onDragLeave={() => setDragOverTeamZone(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverTeamZone(false);
                            const tId =
                              e.dataTransfer.getData("text/plain") ||
                              draggedTalentoId;
                            if (tId) {
                              const targetDept =
                                selectedDeptObj?.nome || "Comercial";
                              transferTalentoToDept(tId, targetDept, {
                                makeLeader: false,
                              });
                              setDraggedTalentoId(null);
                            }
                          }}
                          onClick={() => {
                            setVincularLider(false);
                            setShowVincularDrawer(true);
                          }}
                          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-xs font-semibold transition-all ${
                            dragOverTeamZone
                              ? "border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c]"
                              : "border-slate-200 text-slate-400 hover:border-[#510851]/50 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900"
                          }`}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>
                            [ Arraste um membro aqui para vincular ou clique
                            para abrir a gaveta de talentos ]
                          </span>
                        </div>

                        {/* PAGINAÇÃO E NAVEGAÇÃO DOS INTEGRANTES DO DEPARTAMENTO */}
                        {totalIntegrantes > 9 && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                            <span className="text-xs font-medium text-slate-500">
                              Exibindo{" "}
                              <strong className="text-slate-900 dark:text-white">
                                {displayedIntegrantes.length}
                              </strong>{" "}
                              de{" "}
                              <strong className="text-slate-900 dark:text-white">
                                {totalIntegrantes}
                              </strong>{" "}
                              integrantes
                              {!isShowingAllColabs && totalColabPages > 1 && (
                                <>
                                  {" "}
                                  • Página{" "}
                                  <strong className="text-slate-900 dark:text-white">
                                    {safeColabPage}
                                  </strong>{" "}
                                  de{" "}
                                  <strong className="text-slate-900 dark:text-white">
                                    {totalColabPages}
                                  </strong>
                                </>
                              )}
                            </span>

                            <div className="flex flex-wrap items-center gap-2">
                              {!isShowingAllColabs && totalColabPages > 1 && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={safeColabPage <= 1}
                                    onClick={() =>
                                      setColabPage((p) => Math.max(1, p - 1))
                                    }
                                    className="h-7 px-2 text-xs font-semibold"
                                  >
                                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                                    Anterior
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={safeColabPage >= totalColabPages}
                                    onClick={() =>
                                      setColabPage((p) =>
                                        Math.min(totalColabPages, p + 1)
                                      )
                                    }
                                    className="h-7 px-2 text-xs font-semibold"
                                  >
                                    Próxima
                                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}

                              {visibleColabCount < totalIntegrantes && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setVisibleColabCount((c) =>
                                        Math.min(totalIntegrantes, c + 9)
                                      );
                                      setColabPage(1);
                                    }}
                                    className="h-7 text-xs font-semibold"
                                  >
                                    Apresentar próximos{" "}
                                    {Math.min(
                                      9,
                                      totalIntegrantes - visibleColabCount
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setVisibleColabCount(totalIntegrantes);
                                      setColabPage(1);
                                    }}
                                    className="h-7 text-xs font-semibold"
                                  >
                                    Apresentar todos ({totalIntegrantes})
                                  </Button>
                                </>
                              )}
                              {visibleColabCount > 9 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setVisibleColabCount(9);
                                    setColabPage(1);
                                  }}
                                  className="h-7 text-xs text-slate-500"
                                >
                                  Mostrar menos (9)
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ===============================================================
                  PAINEL DE DIAGNÓSTICO DO DEPARTAMENTO:
                  TRIÂNGULOS HARMÔNICOS + TABELA COMPARATIVA + MAPA DE CALOR
              ================================================================ */}
              {showDeptDiagnostico && filteredColaboradores.length > 0 && (
                <div className="space-y-6 rounded-2xl border-2 border-[#ea580c]/40 bg-slate-50/60 p-5 shadow-sm dark:bg-slate-900/40">
                  {(() => {
                    const deptTitle =
                      selectedDeptId === "all"
                        ? "Todos os Departamentos"
                        : selectedDeptObj?.nome || "Departamento";
                    const deptTalentos = filteredColaboradores;
                    const heatmapMatrix = deptTalentos.map((t) => ({
                      talento: t,
                      scores: calcularScoresEixos(t),
                    }));
                    const activePal = HEATMAP_PALETTES[heatmapPalette];

                    return (
                      <>
                        {/* CABEÇALHO DO DIAGNÓSTICO */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#ea580c] text-white">
                                DIAGNÓSTICO DO DEPARTAMENTO
                              </Badge>
                              <Badge variant="purple">
                                {deptTalentos.length} integrantes analisados
                              </Badge>
                            </div>
                            <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                              Geometria Harmônica, Matriz Comparativa & Mapa de
                              Calor — {deptTitle}
                            </h3>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDeptDiagnostico(false)}
                            className="h-7 text-xs"
                          >
                            Fechar Diagnóstico ✕
                          </Button>
                        </div>

                        {/* 1. ANÁLISE DE HARMONIA DO DEPARTAMENTO */}
                        <div className="space-y-2">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Triangle className="h-4 w-4 text-[#ea580c]" />
                                Análise de Harmonia - {deptTitle}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Projeção gráfica dos integrantes. A esfera preta indica o KAN de cada membro.
                              </p>
                            </div>
                            <Badge variant="purple">
                              {deptTalentos.length} Membros Projetados
                            </Badge>
                          </div>
                          <KanTrianglesSvg
                            membros={deptTalentos.map((t) => ({
                              nome: t.nome,
                              vertices: t.vertices_triangulo || [1, 2, 3],
                              isLider: Boolean(deptLeaders[t.id]),
                            }))}
                          />
                        </div>

                        {/* 2. TABELA COMPARATIVA DE PERFIL COMPORTAMENTAL */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="bg-[#4a0e4e] px-4 py-3 text-center text-xs font-extrabold uppercase tracking-widest text-white">
                            PERFIL COMPORTAMENTAL — {deptTitle}
                          </div>

                          {/* MOBILE: SWIPEABLE CARDS */}
                          <div className="block md:hidden p-3">
                            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                              <span>
                                Deslize para comparar os integrantes →
                              </span>
                              <span>{deptTalentos.length} membros</span>
                            </div>
                            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                              {deptTalentos.map((t) => {
                                const isLid = Boolean(deptLeaders[t.id]);
                                return (
                                  <div
                                    key={t.id}
                                    className="w-[85%] shrink-0 snap-center rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={t.avatar}
                                          alt={t.nome}
                                          className="h-9 w-9 rounded-full border border-[#ea580c] object-cover"
                                        />
                                        <div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onInspectTalento?.(t)
                                            }
                                            className="text-left text-xs font-extrabold text-[#4a0e4e] hover:underline dark:text-purple-300"
                                          >
                                            {isLid ? `👑 ${t.nome}` : t.nome}
                                          </button>
                                          <div className="text-[10px] text-slate-500">
                                            {t.cargo}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge
                                        variant="purple"
                                        className="text-[10px]"
                                      >
                                        KAN {t.kan_nome}
                                      </Badge>
                                    </div>
                                    <div className="mt-2.5 space-y-2 text-[11px]">
                                      <div>
                                        <span className="font-bold text-slate-500">
                                          Perfil Predominante:
                                        </span>{" "}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                          {t.perfis_lista.slice(0, 2).join(", ")}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-500">
                                          Forças Centrais:
                                        </span>{" "}
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {getIndicador(
                                            t,
                                            "Forças Centrais",
                                            "Articulação, energia e foco em resultados"
                                          )}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-500">
                                          Contexto de Maior Aderência:
                                        </span>{" "}
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {getIndicador(
                                            t,
                                            "Contexto de Maior Aderência",
                                            "Ambientes dinâmicos e colaborativos"
                                          )}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-500">
                                          Risco Prioritário:
                                        </span>{" "}
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {getIndicador(
                                            t,
                                            "Risco Prioritário",
                                            "Sobrecarga por excesso de frentes"
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* DESKTOP: COMPARATIVE MATRIX TABLE */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                                  <th className="w-44 border-r border-slate-200 px-3 py-2.5 text-left font-bold text-slate-500 dark:border-slate-800">
                                    Dimensão / Critério
                                  </th>
                                  {deptTalentos.map((t) => {
                                    const isLid = Boolean(deptLeaders[t.id]);
                                    return (
                                      <th
                                        key={t.id}
                                        className="min-w-[160px] border-r border-slate-200 px-3 py-2.5 text-center font-extrabold text-[#4a0e4e] dark:border-slate-800 dark:text-purple-300"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => onInspectTalento?.(t)}
                                          className="hover:text-[#ea580c] hover:underline"
                                        >
                                          {isLid ? `👑 ${t.nome}` : t.nome}
                                        </button>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                <tr>
                                  <td className="border-r border-slate-200 bg-slate-50/70 px-3 py-2.5 font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                                    Perfil Predominante
                                  </td>
                                  {deptTalentos.map((t) => (
                                    <td
                                      key={t.id}
                                      className="border-r border-slate-200 px-3 py-2.5 text-center font-semibold dark:border-slate-800"
                                    >
                                      {t.perfis_lista.slice(0, 2).join(", ")}
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  <td className="border-r border-slate-200 bg-slate-50/70 px-3 py-2.5 font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                                    Forças Centrais
                                  </td>
                                  {deptTalentos.map((t) => (
                                    <td
                                      key={t.id}
                                      className="border-r border-slate-200 px-3 py-2.5 text-center text-slate-600 dark:border-slate-800 dark:text-slate-300"
                                    >
                                      {getIndicador(
                                        t,
                                        "Forças Centrais",
                                        "Articulação, energia e foco em resultados"
                                      )}
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  <td className="border-r border-slate-200 bg-slate-50/70 px-3 py-2.5 font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                                    Contexto de Maior Aderência
                                  </td>
                                  {deptTalentos.map((t) => (
                                    <td
                                      key={t.id}
                                      className="border-r border-slate-200 px-3 py-2.5 text-center text-slate-600 dark:border-slate-800 dark:text-slate-300"
                                    >
                                      {getIndicador(
                                        t,
                                        "Contexto de Maior Aderência",
                                        "Ambientes dinâmicos e colaborativos"
                                      )}
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  <td className="border-r border-slate-200 bg-slate-50/70 px-3 py-2.5 font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                                    Risco Prioritário
                                  </td>
                                  {deptTalentos.map((t) => (
                                    <td
                                      key={t.id}
                                      className="border-r border-slate-200 px-3 py-2.5 text-center text-slate-600 dark:border-slate-800 dark:text-slate-300"
                                    >
                                      {getIndicador(
                                        t,
                                        "Risco Prioritário",
                                        "Sobrecarga por excesso de frentes"
                                      )}
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  <td className="border-r border-slate-200 bg-slate-50/70 px-3 py-2.5 font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                                    KAN
                                  </td>
                                  {deptTalentos.map((t) => (
                                    <td
                                      key={t.id}
                                      className="border-r border-slate-200 px-3 py-2.5 text-center font-extrabold text-[#ea580c] dark:border-slate-800"
                                    >
                                      {t.kan_nome}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 3. MAPA DE CALOR INTERATIVO DO DEPARTAMENTO */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <h4 className="flex items-center gap-2 text-sm font-extrabold">
                                <Flame className="h-4 w-4 text-[#ea580c]" />
                                Mapa de Calor Interativo — Eixos Comportamentais
                                do Departamento
                              </h4>
                              <p className="text-xs text-slate-500">
                                Passe o mouse sobre as células para ver o
                                detalhamento ou clique em &quot;Média&quot; para
                                revelar o score médio da linha
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950">
                                {(
                                  Object.keys(
                                    HEATMAP_PALETTES
                                  ) as HeatmapPalette[]
                                ).map((palKey) => (
                                  <button
                                    type="button"
                                    key={palKey}
                                    onClick={() => setHeatmapPalette(palKey)}
                                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                      heatmapPalette === palKey
                                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                                    }`}
                                  >
                                    <span>
                                      {HEATMAP_PALETTES[palKey].swatch}
                                    </span>
                                    <span>
                                      {HEATMAP_PALETTES[palKey].label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-xs">
                              <thead>
                                <tr className="border-b-2 border-slate-300 dark:border-slate-700">
                                  <th className="w-48 px-3 py-2 text-left font-extrabold text-slate-700 dark:text-slate-200">
                                    Eixo Comportamental
                                  </th>
                                  {heatmapMatrix.map(({ talento }) => {
                                    const isLid = Boolean(
                                      deptLeaders[talento.id]
                                    );
                                    return (
                                      <th
                                        key={talento.id}
                                        className="min-w-[110px] px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200"
                                      >
                                        <span className="block truncate">
                                          {isLid
                                            ? `👑 ${talento.nome.split(" ")[0]}`
                                            : talento.nome.split(" ")[0]}
                                        </span>
                                      </th>
                                    );
                                  })}
                                  <th className="w-24 px-2 py-2 text-center font-extrabold text-[#ea580c]">
                                    Média Setor
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {EIXOS_COMPORTAMENTAIS.map((eixo) => {
                                  const rowScores = heatmapMatrix.map(
                                    (m) => m.scores[eixo] || 0
                                  );
                                  const avg =
                                    rowScores.reduce((a, b) => a + b, 0) /
                                    Math.max(1, rowScores.length);
                                  const avgStyle = getHeatmapCellStyle(
                                    avg,
                                    heatmapPalette
                                  );
                                  const isRevealed = Boolean(
                                    revealedAverageRows[eixo]
                                  );

                                  return (
                                    <tr key={eixo}>
                                      <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">
                                        {eixo}
                                      </td>
                                      {heatmapMatrix.map(
                                        ({ talento, scores }) => {
                                          const val = scores[eixo] || 0;
                                          const cellStyle = getHeatmapCellStyle(
                                            val,
                                            heatmapPalette
                                          );
                                          return (
                                            <td
                                              key={talento.id}
                                              onMouseEnter={() =>
                                                setHoveredCell({
                                                  membro: talento.nome,
                                                  cargo: talento.cargo,
                                                  eixo,
                                                  pts: val,
                                                  label: cellStyle.label,
                                                })
                                              }
                                              onMouseLeave={() =>
                                                setHoveredCell(null)
                                              }
                                              style={{
                                                backgroundColor: cellStyle.bg,
                                                color: cellStyle.text,
                                              }}
                                              className="cursor-pointer border border-white/60 px-2 py-2.5 text-center font-extrabold transition-transform hover:scale-[1.03] dark:border-slate-900"
                                            >
                                              <span className="text-[10px]">
                                                {cellStyle.label}
                                              </span>
                                            </td>
                                          );
                                        }
                                      )}
                                      <td className="px-2 py-1.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setRevealedAverageRows((prev) => ({
                                              ...prev,
                                              [eixo]: !prev[eixo],
                                            }))
                                          }
                                          className={`w-full rounded-lg px-2 py-1 text-[11px] font-extrabold transition-all ${
                                            isRevealed
                                              ? "bg-[#ea580c] text-white shadow-2xs"
                                              : "border border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                          }`}
                                        >
                                          {isRevealed
                                            ? avgStyle.label
                                            : "Média"}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* HOVER TOOLTIP CARD */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs dark:bg-slate-950">
                            {hoveredCell ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-[#510851] text-white">
                                  {hoveredCell.membro}
                                </Badge>
                                <span className="text-slate-500">
                                  {hoveredCell.cargo} •
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  Eixo {hoveredCell.eixo}:
                                </span>
                                <span className="font-extrabold text-[#ea580c]">
                                  {hoveredCell.label}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">
                                Passe o cursor sobre qualquer célula do mapa de
                                calor para inspecionar o resultado individual.
                              </span>
                            )}

                            {/* LEGEND */}
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                              <span>Intensidade ({activePal.label}):</span>
                              {[100, 220, 380, 520, 680].map((v) => {
                                const st = getHeatmapCellStyle(
                                  v,
                                  heatmapPalette
                                );
                                return (
                                  <span
                                    key={v}
                                    style={{
                                      backgroundColor: st.bg,
                                      color: st.text,
                                    }}
                                    className="inline-block h-3.5 w-6 rounded border border-black/10"
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ===================================================================
            MODO ÁRVORE VISUAL COM ZOOM/PAN & SPANS DE CONTROLE (Seção 2.D)
        ==================================================================== */
        <Card className="p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <Badge className="bg-[#510851] text-white">
                ÁRVORE HIERÁRQUICA CONECTADA
              </Badge>
              <h3 className="mt-1.5 text-lg font-extrabold">
                Organograma Gráfico — {selectedEmpresa}
              </h3>
              <p className="text-xs text-slate-500">
                Análise visual de spans de controle, lideranças por diretoria e
                forças comportamentais KAN
              </p>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTreeZoom((z) => Math.max(60, z - 10))}
                className="h-7 px-2 text-xs"
                title="Diminuir Zoom"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-[46px] text-center text-xs font-extrabold">
                {treeZoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTreeZoom((z) => Math.min(140, z + 10))}
                className="h-7 px-2 text-xs"
                title="Aumentar Zoom"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTreeZoom(100)}
                className="h-7 px-2 text-xs text-slate-500"
                title="Resetar Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto py-4">
            <div
              style={{
                transform: `scale(${treeZoom / 100})`,
                transformOrigin: "top center",
              }}
              className="flex min-w-[860px] flex-col items-center space-y-6 transition-transform duration-200"
            >
              {/* Level 0: CEO / Presidência */}
              {talentos[0] && (
                <div className="flex flex-col items-center">
                  <div className="w-80 rounded-2xl border-2 border-[#510851] bg-gradient-to-br from-[#510851] to-[#3b0764] p-4 text-center text-white shadow-lg">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      👑 Nível Executivo (C-Level)
                    </div>
                    <div className="mt-1 text-sm font-extrabold">
                      {deptosDaEmpresa.find((d) => d.parentId === null)?.nome ||
                        "Presidência / CEO"}
                    </div>
                    <div className="mt-2.5 flex items-center justify-center gap-2.5">
                      <img
                        src={talentos[0].avatar}
                        alt={talentos[0].nome}
                        className="h-9 w-9 rounded-full border-2 border-amber-400 object-cover"
                      />
                      <div className="text-left">
                        <div className="text-xs font-bold">
                          {talentos[0].nome}
                        </div>
                        <div className="text-[10px] text-purple-200">
                          {talentos[0].cargo} • KAN {talentos[0].kan_nome}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-7 w-0.5 bg-slate-300 dark:bg-slate-700" />
                </div>
              )}

              {/* Level 1: Dynamic Departments from deptosDaEmpresa */}
              <div className="grid w-full grid-cols-4 gap-4 border-t-2 border-slate-300 pt-6 dark:border-slate-700">
                {(deptosDaEmpresa.filter((d) => d.parentId !== null).length > 0
                  ? deptosDaEmpresa.filter((d) => d.parentId !== null)
                  : deptosDaEmpresa
                )
                  .slice(0, 8)
                  .map((dept, idx) => {
                    const {
                      count,
                      hasLeader,
                      members: deptMembers,
                    } = getDeptStats(dept);
                    const borderColors = [
                      "border-[#ea580c]",
                      "border-emerald-500",
                      "border-[#510851]",
                      "border-blue-500",
                    ];
                    return (
                      <div
                        key={dept.id}
                        onClick={() => {
                          setSelectedDeptId(dept.id);
                          setViewMode("setores");
                        }}
                        className={`cursor-pointer rounded-2xl border-t-4 bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
                          borderColors[idx % borderColors.length]
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs font-extrabold">
                            {dept.nome}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {count}
                          </Badge>
                        </div>
                        {!hasLeader && count > 0 && (
                          <div className="mt-1 text-[10px] font-semibold text-amber-600">
                            ⚠️ Sem líder definido
                          </div>
                        )}
                        <div className="mt-3 space-y-2">
                          {deptMembers.slice(0, 5).map((m) => (
                            <div
                              key={m.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onInspectTalento?.(m);
                              }}
                              className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                            >
                              <img
                                src={m.avatar}
                                alt={m.nome}
                                className="h-7 w-7 rounded-full object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[11px] font-bold">
                                  {deptLeaders[m.id] ? `👑 ${m.nome}` : m.nome}
                                </div>
                                <div className="truncate text-[10px] text-slate-400">
                                  {m.cargo} • {m.kan_nome}
                                </div>
                              </div>
                            </div>
                          ))}
                          {deptMembers.length > 5 && (
                            <div className="pt-1 text-center text-[10px] font-bold text-[#ea580c]">
                              + {deptMembers.length - 5} integrantes (clique
                              para abrir)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* =====================================================================
          GAVETA LATERAL (SLIDE-OVER DRAWER) PARA VINCULAR TALENTOS AO SETOR (Seção 2.B)
      ====================================================================== */}
      {showVincularDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="flex h-full w-full max-w-md flex-col justify-between bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <div>
                  <Badge className="bg-[#510851] text-white">
                    ALOCAÇÃO RÁPIDA EM LOTE
                  </Badge>
                  <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    Vincular Talentos a{" "}
                    {selectedDeptObj?.nome || "Departamento"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVincularDrawer(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search & Role Configuration */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="Buscar por nome, cargo ou perfil KAN..."
                    className="h-9 pl-9 text-xs"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                      Cargo no Setor
                    </label>
                    <select
                      value={vincularCargo}
                      onChange={(e) => setVincularCargo(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border bg-white px-2 text-xs font-medium dark:bg-slate-800"
                    >
                      {CARGOS_OPCOES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <input
                        type="checkbox"
                        checked={vincularLider}
                        onChange={(e) => setVincularLider(e.target.checked)}
                        className="rounded"
                      />
                      Definir como Líder 👑
                    </label>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={drawerOnlyUnallocated}
                    onChange={(e) => setDrawerOnlyUnallocated(e.target.checked)}
                    className="rounded"
                  />
                  Mostrar apenas talentos fora deste setor
                </label>
              </div>

              {/* Multi-select Talent List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    Selecione um ou vários talentos (
                    {drawerSelectedNames.length} marcados)
                  </span>
                  {drawerSelectedNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDrawerSelectedNames([])}
                      className="text-[11px] text-[#ea580c] hover:underline"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>

                <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                  {talentos
                    .filter((t) => {
                      if (
                        drawerOnlyUnallocated &&
                        matchingDeptNames &&
                        matchingDeptNames.has(
                          (t.departamento || "").toLowerCase()
                        )
                      ) {
                        return false;
                      }
                      const q = normText(drawerSearch);
                      if (!q) return true;
                      return normText(
                        `${t.nome} ${t.cargo} ${t.profissao} ${t.kan_nome} ${t.perfis_lista.join(
                          " "
                        )}`
                      ).includes(q);
                    })
                    .slice(0, 60)
                    .map((t) => {
                      const isChecked = drawerSelectedNames.includes(t.nome);
                      const resolvedDept =
                        deptNameByIdMap[
                          (t.departamento || "").trim().toLowerCase()
                        ] || t.departamento;
                      return (
                        <label
                          key={t.id}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all ${
                            isChecked
                              ? "border-[#ea580c] bg-[#ea580c]/10"
                              : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setDrawerSelectedNames((prev) =>
                                  isChecked
                                    ? prev.filter((n) => n !== t.nome)
                                    : [...prev, t.nome]
                                )
                              }
                              className="rounded"
                            />
                            <img
                              src={t.avatar}
                              alt={t.nome}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                {t.nome}
                              </div>
                              <div className="truncate text-[10px] text-slate-500">
                                {t.cargo} • Atual: {resolvedDept}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="purple"
                            className="shrink-0 text-[9px]"
                          >
                            {t.kan_nome}
                          </Badge>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Drawer Footer CTAs */}
            <div className="flex items-center gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <Button
                onClick={handleBatchVincularTalentos}
                disabled={drawerSelectedNames.length === 0}
                className="flex-1 bg-[#ea580c] text-xs font-extrabold text-white hover:bg-[#d9460f]"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Vincular Selecionados ({drawerSelectedNames.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowVincularDrawer(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 3: EQUIPES DA EMPRESA & GEOMETRIA HARMÔNICA (COM PAGINAÇÃO)
      ====================================================================== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-[#ea580c]" />
                Equipes da Empresa & Geometria Harmônica ({equipes.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Inspecione os integrantes e projete os Triângulos Harmônicos de
                cada equipe diretamente no organograma
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={buscaEquipeOrg}
                onChange={(e) => {
                  setBuscaEquipeOrg(e.target.value);
                  setEquipesOrgPage(1);
                }}
                placeholder="Buscar equipe ou membro..."
                className="h-8 pl-8 pr-7 text-xs"
              />
              {buscaEquipeOrg && (
                <button
                  type="button"
                  onClick={() => {
                    setBuscaEquipeOrg("");
                    setEquipesOrgPage(1);
                  }}
                  className="absolute right-2 top-2 text-xs text-slate-400"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const filteredEquipesOrg = equipes
              .filter((eq) => {
                const q = normText(buscaEquipeOrg);
                if (!q) return true;
                const tokens = q.split(/\s+/).filter(Boolean);
                const searchable = `${normText(eq.nome)} ${eq.membros
                  .map((m) => normText(m.nome))
                  .join(" ")}`;
                return tokens.every((tk) => searchable.includes(tk));
              })
              .sort((a, b) => {
                const q = normText(buscaEquipeOrg);
                if (!q) return 0;
                const na = normText(a.nome);
                const nb = normText(b.nome);
                if ((na === q) !== (nb === q)) return na === q ? -1 : 1;
                if (na.startsWith(q) !== nb.startsWith(q))
                  return na.startsWith(q) ? -1 : 1;
                return na.localeCompare(nb);
              });

            const totalEq = filteredEquipesOrg.length;
            const isShowingAllEq = visibleEquipesOrgCount >= totalEq;
            const totalEqPages = Math.max(
              1,
              Math.ceil(totalEq / visibleEquipesOrgCount)
            );
            const safeEqPage = Math.min(equipesOrgPage, totalEqPages);
            const displayedEquipesOrg = isShowingAllEq
              ? filteredEquipesOrg
              : filteredEquipesOrg.slice(
                  (safeEqPage - 1) * visibleEquipesOrgCount,
                  safeEqPage * visibleEquipesOrgCount
                );

            return (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {displayedEquipesOrg.map((eq) => {
                    const isSelected = openTeamTrianglesId === eq.id;
                    return (
                      <div
                        key={eq.id}
                        onClick={() =>
                          setOpenTeamTrianglesId(isSelected ? null : eq.id)
                        }
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-[#ea580c] bg-[#ea580c]/5 ring-1 ring-[#ea580c]"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{eq.nome}</span>
                          <Badge variant="success">
                            {eq.harmonia}% Harmonia
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {eq.departamento} • {eq.membros.length} integrantes
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {eq.membros.slice(0, 8).map((m) => {
                              const tal = talentos.find(
                                (t) => t.nome === m.nome
                              );
                              return tal ? (
                                <img
                                  key={m.nome}
                                  src={tal.avatar}
                                  alt={m.nome}
                                  className="h-7 w-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                                />
                              ) : null;
                            })}
                          </div>
                          <span className="flex items-center gap-1 text-xs font-semibold text-[#ea580c]">
                            <Compass className="h-3.5 w-3.5" />
                            {isSelected
                              ? "Ocultar Triângulos"
                              : "Ver Triângulos"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CONTROLES DE PAGINAÇÃO E NAVEGAÇÃO DAS EQUIPES */}
                {totalEq > 6 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                    <span className="text-xs font-medium text-slate-500">
                      Exibindo{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {displayedEquipesOrg.length}
                      </strong>{" "}
                      de{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {totalEq}
                      </strong>{" "}
                      equipes
                      {!isShowingAllEq && totalEqPages > 1 && (
                        <>
                          {" "}
                          • Página{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {safeEqPage}
                          </strong>{" "}
                          de{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {totalEqPages}
                          </strong>
                        </>
                      )}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {!isShowingAllEq && totalEqPages > 1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={safeEqPage <= 1}
                            onClick={() =>
                              setEquipesOrgPage((p) => Math.max(1, p - 1))
                            }
                            className="h-7 px-2 text-xs font-semibold"
                          >
                            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                            Anterior
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={safeEqPage >= totalEqPages}
                            onClick={() =>
                              setEquipesOrgPage((p) =>
                                Math.min(totalEqPages, p + 1)
                              )
                            }
                            className="h-7 px-2 text-xs font-semibold"
                          >
                            Próxima
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {visibleEquipesOrgCount < totalEq && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setVisibleEquipesOrgCount((c) =>
                                Math.min(totalEq, c + 6)
                              );
                              setEquipesOrgPage(1);
                            }}
                            className="h-7 text-xs font-semibold"
                          >
                            Apresentar próximas{" "}
                            {Math.min(6, totalEq - visibleEquipesOrgCount)}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setVisibleEquipesOrgCount(totalEq);
                              setEquipesOrgPage(1);
                            }}
                            className="h-7 text-xs font-semibold"
                          >
                            Apresentar todas ({totalEq})
                          </Button>
                        </>
                      )}
                      {visibleEquipesOrgCount > 6 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setVisibleEquipesOrgCount(6);
                            setEquipesOrgPage(1);
                          }}
                          className="h-7 text-xs text-slate-500"
                        >
                          Mostrar menos (6)
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {openTeamTrianglesId && (
            <div className="mt-4 grid grid-cols-1 gap-6 rounded-2xl border bg-slate-50/50 p-5 dark:bg-slate-900/30 lg:grid-cols-12">
              {(() => {
                const eq = equipes.find((e) => e.id === openTeamTrianglesId);
                if (!eq) return null;
                const eqTalentos = eq.membros
                  .map(
                    (m) =>
                      talentos.find((t) => t.nome === m.nome) ||
                      talentos.find(
                        (t) =>
                          t.nome.trim().toLowerCase() ===
                          m.nome.trim().toLowerCase()
                      )
                  )
                  .filter((t): t is TalentoProfile => Boolean(t));

                return (
                  <>
                    <div className="space-y-3 lg:col-span-5">
                      <Badge className="bg-[#ea580c] text-white">
                        PROJEÇÃO GEOMÉTRICA DE EQUIPE
                      </Badge>
                      <h4 className="text-base font-extrabold">{eq.nome}</h4>
                      <p className="text-xs text-slate-500">
                        Status Geométrico: <strong>{eq.triangulo_status}</strong>{" "}
                        • Harmonia Global: <strong>{eq.harmonia}%</strong>
                      </p>
                      <div className="space-y-2 pt-1">
                        {eqTalentos.map((t) => {
                          const isLid = eq.membros.find(
                            (m) =>
                              m.nome.trim().toLowerCase() ===
                              t.nome.trim().toLowerCase()
                          )?.lider;
                          return (
                            <div
                              key={t.id}
                              className="flex items-center justify-between rounded-xl border bg-white p-2.5 text-xs dark:bg-slate-900"
                            >
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={t.avatar}
                                  alt={t.nome}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <div>
                                  <div className="font-bold">
                                    {isLid ? `👑 ${t.nome}` : t.nome}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {t.cargo}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline">
                                KAN: {t.kan_nome}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="lg:col-span-7">
                      <KanTrianglesSvg
                        membros={eqTalentos.map((t) => ({
                          nome: t.nome,
                          vertices: t.vertices_triangulo || [1, 2, 3],
                          isLider: eq.membros.find(
                            (m) =>
                              m.nome.trim().toLowerCase() ===
                              t.nome.trim().toLowerCase()
                          )?.lider,
                        }))}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
