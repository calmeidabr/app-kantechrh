"use client";

import React, { useState, useMemo } from "react";
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
    id: "emp-1",
    nome_empresa: "KantechRH Enterprise",
    razao_social: "Kantech Inteligência Comportamental S.A.",
    cnpj: "42.819.304/0001-90",
    segmento: "HR Tech & People Analytics",
    responsavel_nome: "Cristiano Almeida",
    email: "contato@kantechrh.com.br",
    status: "Ativa",
    cor: "#510851",
  },
  {
    id: "emp-2",
    nome_empresa: "Nexus Tecnologia S.A.",
    razao_social: "Nexus Engenharia de Software S.A.",
    cnpj: "18.492.110/0001-32",
    segmento: "Tecnologia & SaaS",
    responsavel_nome: "Roberto Siqueira",
    email: "rh@nexustech.io",
    status: "Ativa",
    cor: "#ea580c",
  },
  {
    id: "emp-3",
    nome_empresa: "Grupo Valora Holding",
    razao_social: "Valora Participações e Finanças S.A.",
    cnpj: "09.331.780/0001-15",
    segmento: "Mercado Financeiro",
    responsavel_nome: "Fernanda Lima",
    email: "pessoas@grupovalora.com.br",
    status: "Ativa",
    cor: "#10b981",
  },
];

const INITIAL_DEPARTAMENTOS: DepartamentoNode[] = [
  {
    id: "dept-ceo",
    nome: "Diretoria Executiva",
    parentId: null,
    empresa: "KantechRH Enterprise",
    ordem: 0,
  },
  {
    id: "dept-prod",
    nome: "Produto & Inovação",
    parentId: "dept-ceo",
    empresa: "KantechRH Enterprise",
    ordem: 1,
  },
  {
    id: "dept-eng",
    nome: "Engenharia & Dados",
    parentId: "dept-prod",
    empresa: "KantechRH Enterprise",
    ordem: 2,
  },
  {
    id: "dept-rh",
    nome: "Gente & Cultura",
    parentId: "dept-ceo",
    empresa: "KantechRH Enterprise",
    ordem: 3,
  },
  {
    id: "dept-com",
    nome: "Comercial & Growth",
    parentId: "dept-ceo",
    empresa: "KantechRH Enterprise",
    ordem: 4,
  },
  {
    id: "dept-ops",
    nome: "Operações & Finanças",
    parentId: "dept-ceo",
    empresa: "KantechRH Enterprise",
    ordem: 5,
  },
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
    "dept-ceo": true,
    "dept-prod": true,
    "dept-rh": true,
  });
  const [viewMode, setViewMode] = useState<"setores" | "arvore">("setores");
  const [editStructureMode, setEditStructureMode] = useState(false);
  const [novoDeptNome, setNovoDeptNome] = useState("");
  const [novoDeptParentId, setNovoDeptParentId] = useState<string>("dept-ceo");

  // Department Leader tracking (talentoId -> boolean)
  const [deptLeaders, setDeptLeaders] = useState<Record<string, boolean>>({
    "tal-1": true,
    "tal-2": true,
    "tal-4": true,
  });

  // Search & Filter inside Department
  const [searchColab, setSearchColab] = useState("");
  const [filterCargo, setFilterCargo] = useState("Todos");

  // Link Talent to Department modal/bar
  const [showVincularBar, setShowVincularBar] = useState(false);
  const [vincularTalentoNome, setVincularTalentoNome] = useState(
    talentos[0]?.nome || ""
  );
  const [vincularCargo, setVincularCargo] = useState(CARGOS_OPCOES[0] || "Diretor(a)");
  const [vincularLider, setVincularLider] = useState(false);

  // Team triangles preview inside Organograma
  const [openTeamTrianglesId, setOpenTeamTrianglesId] = useState<string | null>(
    equipes[0]?.id || null
  );

  const deptosDaEmpresa = useMemo(
    () => departamentos.filter((d) => d.empresa === selectedEmpresa),
    [departamentos, selectedEmpresa]
  );

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
    const names = new Set<string>([selectedDeptObj.nome]);
    const collectChildren = (parentId: string) => {
      deptosDaEmpresa
        .filter((d) => d.parentId === parentId)
        .forEach((child) => {
          names.add(child.nome);
          collectChildren(child.id);
        });
    };
    collectChildren(selectedDeptObj.id);
    return names;
  }, [selectedDeptId, selectedDeptObj, deptosDaEmpresa]);

  const filteredColaboradores = useMemo(() => {
    return talentos
      .filter((t) => {
        if (matchingDeptNames && !matchingDeptNames.has(t.departamento)) {
          return false;
        }
        if (searchColab.trim()) {
          const q = searchColab.toLowerCase();
          if (
            !t.nome.toLowerCase().includes(q) &&
            !t.cargo.toLowerCase().includes(q) &&
            !t.departamento.toLowerCase().includes(q)
          ) {
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
  }, [talentos, matchingDeptNames, searchColab, filterCargo, deptLeaders]);

  const handleAddEmpresa = () => {
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
    // Seed root dept for new company
    setDepartamentos((prev) => [
      ...prev,
      {
        id: `dept-${Date.now()}`,
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
  };

  const handleAddDepartamento = () => {
    if (!novoDeptNome.trim()) return;
    const newId = `dept-${Date.now()}`;
    setDepartamentos((prev) => [
      ...prev,
      {
        id: newId,
        nome: novoDeptNome.trim(),
        parentId: novoDeptParentId === "root" ? null : novoDeptParentId,
        empresa: selectedEmpresa,
        ordem: prev.length,
      },
    ]);
    setExpandedDepts((prev) => ({ ...prev, [novoDeptParentId]: true }));
    setNovoDeptNome("");
  };

  const handleDeleteDepartamento = (deptId: string) => {
    setDepartamentos((prev) => prev.filter((d) => d.id !== deptId));
    if (selectedDeptId === deptId) setSelectedDeptId("all");
  };

  const handleVincularTalento = () => {
    if (!vincularTalentoNome) return;
    const targetDeptName =
      selectedDeptObj?.nome || "Produto & Inovação";
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
    const found = talentos.find((t) => t.nome === vincularTalentoNome);
    if (found && vincularLider) {
      setDeptLeaders((prev) => ({ ...prev, [found.id]: true }));
    }
    setShowVincularBar(false);
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
      const countInDept = talentos.filter(
        (t) => t.departamento === node.nome
      ).length;

      return (
        <div key={node.id} className="space-y-0.5">
          <div
            style={{ paddingLeft: `${level * 14 + 8}px` }}
            onClick={() => {
              setSelectedDeptId(node.id);
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
              Cadastro e Gestão de Empresas (`public.empresas`)
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
                onClick={() => setSelectedDeptId("all")}
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
                    Construtor de Hierarquia (`hierarquia_departamentos`)
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

          {/* RIGHT 8 COLS: BREADCRUMB + DEPARTMENT COLLABORATORS GRID */}
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
                    {filteredColaboradores.length} colaborador(es) exibido(s) •
                    Líderes destacados no topo com coroa 👑
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  onClick={() => setShowVincularBar(!showVincularBar)}
                  className="bg-[#510851] text-xs font-semibold text-white hover:bg-[#510851]/90"
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Vincular Talento ao Setor
                </Button>
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
                    onChange={(e) => setSearchColab(e.target.value)}
                    placeholder="Buscar colaborador por nome, cargo ou setor..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <select
                  value={filterCargo}
                  onChange={(e) => setFilterCargo(e.target.value)}
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

            <CardContent>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredColaboradores.map((t) => {
                  const isLider = Boolean(deptLeaders[t.id]);
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
                            {t.departamento}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-1">
                        <Badge variant="purple" className="text-[10px]">
                          KAN {t.kan_numero} • {t.kan_nome}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
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
                            Diagnóstico
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
          <div className="flex items-center justify-between">
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {equipes.map((eq) => {
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
                    <Badge variant="success">{eq.harmonia}% Harmonia</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {eq.departamento} • {eq.membros.length} integrantes
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {eq.membros.map((m) => {
                        const tal = talentos.find((t) => t.nome === m.nome);
                        return tal ? (
                          <img
                            key={m.nome}
                            src={tal.avatar}
                            alt={m.nome}
                            className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                          />
                        ) : null;
                      })}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#ea580c]">
                      <Compass className="h-3.5 w-3.5" />
                      {isSelected ? "Ocultar Triângulos" : "Ver Triângulos"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {openTeamTrianglesId && (
            <div className="mt-4 grid grid-cols-1 gap-6 rounded-2xl border bg-slate-50/50 p-5 dark:bg-slate-900/30 lg:grid-cols-12">
              {(() => {
                const eq = equipes.find((e) => e.id === openTeamTrianglesId);
                if (!eq) return null;
                const eqTalentos = eq.membros
                  .map((m) => talentos.find((t) => t.nome === m.nome))
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
                            (m) => m.nome === t.nome
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
                              <Badge variant="outline" className="font-mono">
                                {t.vertices_triangulo.join(" - ")}
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
                          vertices: t.vertices_triangulo,
                          isLider: eq.membros.find((m) => m.nome === t.nome)
                            ?.lider,
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
