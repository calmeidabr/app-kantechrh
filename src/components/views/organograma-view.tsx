"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Edit3,
  Trash2,
  Users,
  Crown,
  ChevronLeft,
  ChevronRight,
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
    nome: "CEO/PRESIDENCIA",
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
    nome: "RH",
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
    nome: "DP",
    parentId: "dept_1779068641065_4",
    empresa: "Mundo Kan",
    ordem: 5,
  },
];

const EMP_COLORS = ["#510851", "#ea580c", "#10b981", "#6366f1", "#ec4899", "#f59e0b"];

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
  const [editStructureMode, setEditStructureMode] = useState(false);
  const [novoDeptNome, setNovoDeptNome] = useState("");
  const [novoDeptParentId, setNovoDeptParentId] = useState<string>("root");

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

  // Link Talent to Department modal/bar
  const [showVincularBar, setShowVincularBar] = useState(false);
  const [vincularTalentoNome, setVincularTalentoNome] = useState(
    talentos[0]?.nome || ""
  );
  const [vincularCargo, setVincularCargo] = useState(
    CARGOS_OPCOES[0] || "Diretor(a)"
  );
  const [vincularLider, setVincularLider] = useState(false);

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

  // Breadcrumb builder
  const breadcrumbPath = useMemo(() => {
    if (selectedDeptId === "all" || !selectedDeptObj) {
      return [selectedEmpresa, "Todos os Departamentos"];
    }
    const chain: string[] = [];
    let curr: DepartamentoNode | undefined = selectedDeptObj;
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      chain.unshift(curr.nome);
      curr = deptosDaEmpresa.find((d) => d.id === curr?.parentId);
    }
    return [selectedEmpresa, ...chain];
  }, [selectedEmpresa, selectedDeptId, selectedDeptObj, deptosDaEmpresa]);

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
        if (
          matchingDeptNames &&
          !matchingDeptNames.has((t.departamento || "").toLowerCase()) &&
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
        nome: "Presidência / Diretoria Executiva",
        parentId: null,
        empresa: nova.nome_empresa,
        ordem: 0,
      },
    ]);
    setNovaEmpresaNome("");
    setNovaEmpresaCnpj("");
    setNovaEmpresaSegmento("");
    setNovaEmpresaResp("");

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
          nome: "Presidência / Diretoria Executiva",
          parent_id: null,
          ordem: 0,
        }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  const handleAddDepartamento = async () => {
    if (!novoDeptNome.trim()) return;
    const newId = `dept_${Date.now()}`;
    const parentVal = novoDeptParentId === "root" ? null : novoDeptParentId;
    const ordemVal = departamentos.length;
    setDepartamentos((prev) => [
      ...prev,
      {
        id: newId,
        nome: novoDeptNome.trim(),
        parentId: parentVal,
        empresa: selectedEmpresa,
        ordem: ordemVal,
      },
    ]);
    setExpandedDepts((prev) => ({ ...prev, [novoDeptParentId]: true }));
    setNovoDeptNome("");

    try {
      await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "departamento",
          empresa: selectedEmpresa,
          departamento_id: newId,
          nome: novoDeptNome.trim(),
          parent_id: parentVal,
          ordem: ordemVal,
        }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  const handleDeleteDepartamento = async (deptId: string) => {
    setDepartamentos((prev) => prev.filter((d) => d.id !== deptId));
    if (selectedDeptId === deptId) setSelectedDeptId("all");
    try {
      await fetch(
        `/api/empresas?departamento_id=${encodeURIComponent(deptId)}`,
        { method: "DELETE" }
      );
    } catch {
      // Keep optimistic state
    }
  };

  const handleVincularTalento = async () => {
    if (!vincularTalentoNome) return;
    const targetDeptName = selectedDeptObj?.nome || "Comercial";
    const found = talentos.find((t) => t.nome === vincularTalentoNome);
    setTalentos((prev) =>
      prev.map((t) =>
        t.nome === vincularTalentoNome
          ? {
              ...t,
              departamento: targetDeptName,
              cargo: vincularCargo,
              empresa: selectedEmpresa,
            }
          : t
      )
    );
    if (found && vincularLider) {
      setDeptLeaders((prev) => ({ ...prev, [found.id]: true }));
    }
    setShowVincularBar(false);

    if (found) {
      try {
        await fetch("/api/talentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: found.nome,
            data_nascimento: found.data_nascimento,
            profissao: found.profissao,
            cargo: vincularCargo,
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
    setDeptLeaders((prev) => ({ ...prev, [talentoId]: !prev[talentoId] }));
  };

  // Recursive Tree Renderer
  const renderTreeNodes = (parentId: string | null, level = 0) => {
    const children = deptosDaEmpresa
      .filter((d) => d.parentId === parentId)
      .sort((a, b) => a.ordem - b.ordem);

    return children.map((node) => {
      const subChildren = deptosDaEmpresa.filter((d) => d.parentId === node.id);
      const hasChildren = subChildren.length > 0;
      const isExpanded = Boolean(expandedDepts[node.id]);
      const isSelected = selectedDeptId === node.id;
      const countInDept = talentos.filter((t) => {
        const d = (t.departamento || "").trim().toLowerCase();
        return (
          d === node.nome.trim().toLowerCase() ||
          d === node.id.trim().toLowerCase()
        );
      }).length;

      return (
        <div key={node.id} className="space-y-0.5">
          <div
            style={{ paddingLeft: `${level * 14 + 8}px` }}
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
            className={`group flex cursor-pointer items-center justify-between rounded-lg pr-2.5 py-2 text-xs transition-all ${
              isSelected
                ? "border-l-3 border-[#ea580c] bg-[#ea580c]/10 font-bold text-[#ea580c]"
                : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-[#ea580c]" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-[#510851] dark:text-purple-400" />
                )
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
              <span className="truncate">{node.nome}</span>
            </div>
            {countInDept > 0 && (
              <span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {countInDept}
              </span>
            )}
          </div>

          {hasChildren && isExpanded && renderTreeNodes(node.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER BAR: EMPRESA EM FOCO & CONTROLES */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0d111d] lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#510851] text-white">
              ESTRUTURA CORPORATIVA
            </Badge>
            <Badge variant="orange">Organograma & Equipes</Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Empresa, Organograma de Departamentos & Equipes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gerencie empresas multi-tenant, estrutura hierárquica de diretorias,
            lideranças por setor e triângulos harmônicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
            <Building2 className="h-4 w-4 text-[#510851] dark:text-purple-400" />
            <span className="text-xs font-semibold text-slate-500">
              Empresa (Foco):
            </span>
            <select
              value={selectedEmpresa}
              onChange={(e) => {
                setSelectedEmpresa(e.target.value);
                setSelectedDeptId("all");
                setColabPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none dark:text-white"
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmpresasPanel(!showEmpresasPanel)}
            className="text-xs"
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5 text-[#ea580c]" />
            {showEmpresasPanel ? "Fechar Empresas" : "Cadastro de Empresas"}
          </Button>

          <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setViewMode("setores")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "setores"
                  ? "bg-[#510851] text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Por Setor
            </button>
            <button
              onClick={() => setViewMode("arvore")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === "arvore"
                  ? "bg-[#ea580c] text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Árvore Visual
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: CADASTRO E EDIÇÃO DE EMPRESAS (COLLAPSIBLE) */}
      {showEmpresasPanel && (
        <Card className="border-[#510851]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Cadastro e Gestão de Empresas
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

      {/* SEÇÃO 2: ORGANOGRAMA INTERATIVO (SIDEBAR DE DEPARTAMENTOS + PAINEL PRINCIPAL) */}
      {viewMode === "setores" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT 4 COLS: DEPARTMENT TREE SIDEBAR */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Network className="h-4 w-4 text-[#ea580c]" />
                  Departamentos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditStructureMode(!editStructureMode)}
                  className="h-7 text-[11px]"
                >
                  <Edit3 className="mr-1 h-3 w-3" />
                  {editStructureMode ? "Concluir" : "Editar Estrutura"}
                </Button>
              </div>
              <CardDescription className="text-xs">
                Navegue pela árvore hierárquica de {selectedEmpresa}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => {
                  setSelectedDeptId("all");
                  setColabPage(1);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  selectedDeptId === "all"
                    ? "bg-[#510851] text-white shadow-2xs"
                    : "bg-slate-100/70 text-slate-700 hover:bg-slate-200/60 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Todos os Departamentos
                </span>
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {talentos.length}
                </span>
              </button>

              <div className="space-y-0.5 pt-1">
                {renderTreeNodes(null, 0)}
              </div>

              {/* HIERARCHY BUILDER FORM */}
              {editStructureMode && (
                <div className="mt-4 space-y-2.5 rounded-xl border border-dashed border-[#ea580c]/50 bg-[#ea580c]/5 p-3">
                  <div className="text-xs font-bold text-[#ea580c]">
                    Construtor de Hierarquia de Departamentos
                  </div>
                  <Input
                    value={novoDeptNome}
                    onChange={(e) => setNovoDeptNome(e.target.value)}
                    placeholder="Nome do novo departamento..."
                    className="h-8 bg-white text-xs dark:bg-slate-900"
                  />
                  <select
                    value={novoDeptParentId}
                    onChange={(e) => setNovoDeptParentId(e.target.value)}
                    className="h-8 w-full rounded-md border border-input bg-white px-2 text-xs dark:bg-slate-900"
                  >
                    <option value="root">Nenhum (Nível Mais Alto)</option>
                    {deptosDaEmpresa.map((d) => (
                      <option key={d.id} value={d.id}>
                        Subordinado a: {d.nome}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddDepartamento}
                    className="w-full h-8 bg-[#ea580c] text-xs font-semibold text-white hover:bg-[#d9460f]"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Criar Departamento
                  </Button>

                  {selectedDeptId !== "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDepartamento(selectedDeptId)}
                      className="w-full h-7 border-red-500/30 text-[11px] text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Excluir Departamento Selecionado
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT 8 COLS: BREADCRUMB + DEPARTMENT COLLABORATORS GRID + DIAGNÓSTICO DO DEPARTAMENTO */}
          <Card className="lg:col-span-8">
            <CardHeader className="pb-3">
              {/* Breadcrumb */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {breadcrumbPath.map((part, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="h-3 w-3" />}
                    <span
                      className={
                        idx === breadcrumbPath.length - 1
                          ? "text-[#ea580c]"
                          : ""
                      }
                    >
                      {part}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="text-lg font-extrabold">
                    {selectedDeptId === "all"
                      ? "Todos os Departamentos"
                      : selectedDeptObj?.nome}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {filteredColaboradores.length} colaborador(es) no setor •
                    Líderes destacados no topo com coroa 👑
                  </CardDescription>
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
                    onClick={() => setShowVincularBar(!showVincularBar)}
                    className="bg-[#510851] text-xs font-semibold text-white hover:bg-[#510851]/90"
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Vincular Talento ao Setor
                  </Button>
                </div>
              </div>

              {/* Vincular Talento Bar */}
              {showVincularBar && (
                <div className="mt-3 grid grid-cols-1 gap-2.5 rounded-xl border border-[#510851]/30 bg-[#510851]/5 p-3.5 sm:grid-cols-4">
                  <select
                    value={vincularTalentoNome}
                    onChange={(e) => setVincularTalentoNome(e.target.value)}
                    className="h-8 rounded-md border bg-white px-2.5 text-xs font-medium dark:bg-slate-900"
                  >
                    {talentos.map((t) => (
                      <option key={t.id} value={t.nome}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={vincularCargo}
                    onChange={(e) => setVincularCargo(e.target.value)}
                    className="h-8 rounded-md border bg-white px-2.5 text-xs font-medium dark:bg-slate-900"
                  >
                    {CARGOS_OPCOES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={vincularLider}
                      onChange={(e) => setVincularLider(e.target.checked)}
                      className="rounded"
                    />
                    Definir como Líder 👑
                  </label>
                  <Button
                    size="sm"
                    onClick={handleVincularTalento}
                    className="h-8 bg-[#ea580c] text-xs font-bold text-white hover:bg-[#d9460f]"
                  >
                    Confirmar Vínculo
                  </Button>
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
                    placeholder="Buscar colaborador por nome, cargo ou setor..."
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
              {(() => {
                const totalColabs = filteredColaboradores.length;
                const isShowingAllColabs = visibleColabCount >= totalColabs;
                const totalColabPages = Math.max(
                  1,
                  Math.ceil(totalColabs / visibleColabCount)
                );
                const safeColabPage = Math.min(colabPage, totalColabPages);
                const displayedColabs = isShowingAllColabs
                  ? filteredColaboradores
                  : filteredColaboradores.slice(
                      (safeColabPage - 1) * visibleColabCount,
                      safeColabPage * visibleColabCount
                    );

                return (
                  <>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      {displayedColabs.map((t) => {
                        const isLider = Boolean(deptLeaders[t.id]);
                        const resolvedDept =
                          deptNameByIdMap[
                            (t.departamento || "").trim().toLowerCase()
                          ] || t.departamento;
                        return (
                          <div
                            key={t.id}
                            className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                              isLider
                                ? "border-[#ea580c]/60 bg-[#ea580c]/5 shadow-xs"
                                : "border-slate-200/80 bg-white hover:border-[#510851]/40 dark:border-slate-800 dark:bg-slate-900/40"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative shrink-0">
                                <img
                                  src={t.avatar}
                                  alt={t.nome}
                                  className="h-12 w-12 rounded-full border-2 border-[#ea580c] object-cover"
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
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => onInspectTalento?.(t)}
                                    className="truncate text-left text-xs font-bold text-slate-900 hover:text-[#ea580c] hover:underline dark:text-white"
                                  >
                                    {t.nome}
                                  </button>
                                </div>
                                <div className="truncate text-[11px] font-semibold text-[#ea580c]">
                                  {t.cargo}
                                </div>
                                <div className="truncate text-[10px] text-slate-400">
                                  {resolvedDept}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-1">
                              <Badge variant="purple" className="text-[10px]">
                                KAN: {t.kan_nome}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {t.perfis_lista[0]}
                              </Badge>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
                              <button
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

                              {onInspectTalento && (
                                <button
                                  onClick={() => onInspectTalento(t)}
                                  className="flex items-center gap-1 text-[10px] font-semibold text-[#510851] hover:underline dark:text-purple-300"
                                >
                                  <Eye className="h-3 w-3" />
                                  Ficha Individual
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* PAGINAÇÃO E NAVEGAÇÃO DOS COLABORADORES DO DEPARTAMENTO */}
                    {totalColabs > 9 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                        <span className="text-xs font-medium text-slate-500">
                          Exibindo{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {displayedColabs.length}
                          </strong>{" "}
                          de{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {totalColabs}
                          </strong>{" "}
                          colaboradores
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

                          {visibleColabCount < totalColabs && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setVisibleColabCount((c) =>
                                    Math.min(totalColabs, c + 9)
                                  );
                                  setColabPage(1);
                                }}
                                className="h-7 text-xs font-semibold"
                              >
                                Apresentar próximos{" "}
                                {Math.min(9, totalColabs - visibleColabCount)}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setVisibleColabCount(totalColabs);
                                  setColabPage(1);
                                }}
                                className="h-7 text-xs font-semibold"
                              >
                                Apresentar todos ({totalColabs})
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
                  </>
                );
              })()}

              {/* PAINEL DE DIAGNÓSTICO DO DEPARTAMENTO: TRIÂNGULOS + TABELA COMPARATIVA + MAPA DE CALOR */}
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

                        {/* 1. TRIÂNGULOS HARMÔNICOS DO DEPARTAMENTO */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            1. Triângulos Harmônicos — {deptTitle}
                          </h4>
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

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setShowHeatmapValues(!showHeatmapValues)
                                }
                                className="h-8 text-xs font-bold"
                              >
                                {showHeatmapValues
                                  ? "Ocultar Pontos"
                                  : "Exibir Pontos"}
                              </Button>
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
                                              {showHeatmapValues ? val : ""}
                                            </td>
                                          );
                                        }
                                      )}
                                      <td className="px-2 py-1.5 text-center">
                                        <button
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
                                            ? `${Math.round(avg)}`
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
                                  {hoveredCell.pts} pontos ({hoveredCell.label})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">
                                Passe o cursor sobre qualquer célula do mapa de
                                calor para inspecionar o score individual.
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
        /* VISUAL TREE ORGANOGRAM VIEW */
        <Card className="p-6">
          <div className="mb-6 text-center">
            <Badge className="bg-[#510851] text-white">
              ÁRVORE HIERÁRQUICA CONECTADA
            </Badge>
            <h3 className="mt-2 text-lg font-extrabold">
              Organograma Corporativo — {selectedEmpresa}
            </h3>
            <p className="text-xs text-slate-500">
              Estrutura de comando e distribuição de forças KAN por diretoria
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6 overflow-x-auto py-2">
            {/* Level 0: CEO / Presidência */}
            <div className="flex flex-col items-center">
              <div className="w-72 rounded-2xl border-2 border-[#510851] bg-gradient-to-br from-[#510851] to-[#3b0764] p-4 text-center text-white shadow-lg">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  👑 Nível Executivo (C-Level)
                </div>
                <div className="mt-1 text-sm font-extrabold">
                  Presidência / Diretoria Executiva
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <img
                    src={talentos[0].avatar}
                    alt={talentos[0].nome}
                    className="h-8 w-8 rounded-full border border-white object-cover"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold">{talentos[0].nome}</div>
                    <div className="text-[10px] text-purple-200">
                      {talentos[0].cargo} • KAN {talentos[0].kan_nome}
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-6 w-0.5 bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Level 1: Diretorias */}
            <div className="grid min-w-[780px] grid-cols-4 gap-4 border-t-2 border-slate-300 pt-6 dark:border-slate-700">
              {[
                {
                  dept: "Produto & Inovação",
                  cor: "border-[#ea580c]",
                  badge: "bg-[#ea580c] text-white",
                },
                {
                  dept: "Gente & Cultura",
                  cor: "border-emerald-500",
                  badge: "bg-emerald-600 text-white",
                },
                {
                  dept: "Comercial & Growth",
                  cor: "border-purple-500",
                  badge: "bg-[#510851] text-white",
                },
                {
                  dept: "Engenharia & Dados",
                  cor: "border-blue-500",
                  badge: "bg-blue-600 text-white",
                },
              ].map((dir) => {
                const members = talentos.filter(
                  (t) => t.departamento === dir.dept
                );
                return (
                  <div
                    key={dir.dept}
                    className={`rounded-2xl border-t-4 bg-white p-4 shadow-sm dark:bg-slate-900 ${dir.cor}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">{dir.dept}</span>
                      <Badge className={`text-[10px] ${dir.badge}`}>
                        {members.length}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => onInspectTalento?.(m)}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
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
                              {m.cargo}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* SEÇÃO 3: EQUIPES DA EMPRESA & TRIÂNGULOS HARMÔNICOS INTEGRADOS */}
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
