"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Search,
  LayoutDashboard,
  Compass,
  Users,
  Briefcase,
  Network,
  UsersRound,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Layers,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Moon,
  Sun,
  Palette,
  Sparkles,
  Download,
  Filter,
  Eye,
  MoreVertical,
  FileText,
  FileSpreadsheet,
  Plus,
  BrainCircuit,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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
import {
  TALENTOS_MOCK,
  EMPRESAS_TENANT,
  WEEKLY_DIAGNOSTICS_CHART,
  EQUIPES_MOCK,
  VAGAS_MOCK,
  type TalentoProfile,
  type EquipeData,
  type VagaData,
} from "@/lib/mock-data";
import { TalentosView } from "@/components/views/talentos-view";
import { EquipesView } from "@/components/views/equipes-view";
import {
  VagasView,
  ProcessoSeletivoView,
} from "@/components/views/processos-seletivos-view";
import { PainelControleView } from "@/components/views/admin-view";
import { OrganogramaView } from "@/components/views/organograma-view";
import { PeopleAnalyticsView } from "@/components/views/analytics-view";

type RouteKey =
  | "Home"
  | "Diagnósticos"
  | "Talentos"
  | "Equipes"
  | "Processo seletivo"
  | "Analytics"
  | "Vagas"
  | "Empresa e Organograma"
  | "SaaS Multi-Tenant"
  | "Painel de Controle";

export default function KantechApp() {
  const { theme, setTheme } = useTheme();
  const [activeRoute, setActiveRoute] = useState<RouteKey>("Home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(EMPRESAS_TENANT[0]);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);

  // Stateful collections so changes in Talentos / Equipes / Vagas / Processos reflect everywhere
  const [talentos, setTalentos] = useState<TalentoProfile[]>(TALENTOS_MOCK);
  const [equipes, setEquipes] = useState<EquipeData[]>(EQUIPES_MOCK);
  const [vagas, setVagas] = useState<VagaData[]>(VAGAS_MOCK);
  const [bffStatus, setBffStatus] = useState<{
    supabase: string;
    mamEngine: string;
    source: string;
  }>({
    supabase: "conectando",
    mamEngine: "conectando",
    source: "mock",
  });

  // Selection & navigation states
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("Todos");
  const [selectedTalento, setSelectedTalento] = useState<TalentoProfile>(
    TALENTOS_MOCK[0]
  );
  const [selectedVagaId, setSelectedVagaId] = useState<number>(
    VAGAS_MOCK[0].id
  );
  const [initialOpenEquipe, setInitialOpenEquipe] = useState<string | null>(
    null
  );
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [showNewTalentModal, setShowNewTalentModal] = useState(false);

  // Sync live data from Next.js BFF API routes (Supabase + mam-kantechrh)
  useEffect(() => {
    let mounted = true;
    async function hydrateFromBff() {
      try {
        const [talRes, eqRes, vagRes, diagRes] = await Promise.all([
          fetch("/api/talentos").then((r) => r.json()).catch(() => null),
          fetch("/api/equipes").then((r) => r.json()).catch(() => null),
          fetch("/api/vagas").then((r) => r.json()).catch(() => null),
          fetch("/api/diagnostico").then((r) => r.json()).catch(() => null),
        ]);

        if (!mounted) return;

        if (talRes?.talentos && Array.isArray(talRes.talentos) && talRes.talentos.length > 0) {
          setTalentos(talRes.talentos);
          setSelectedTalento(talRes.talentos[0]);
        }
        if (eqRes?.equipes && Array.isArray(eqRes.equipes) && eqRes.equipes.length > 0) {
          setEquipes(eqRes.equipes);
        }
        if (vagRes?.vagas && Array.isArray(vagRes.vagas) && vagRes.vagas.length > 0) {
          setVagas(vagRes.vagas);
          setSelectedVagaId(vagRes.vagas[0].id);
        }
        setBffStatus({
          supabase: diagRes?.supabase?.status || (talRes?.source === "supabase" ? "online" : "fallback"),
          mamEngine: diagRes?.mamEngine?.status || "standby",
          source: talRes?.source || "mock",
        });
      } catch {
        // Keep mock fallback
      }
    }
    hydrateFromBff();
    return () => {
      mounted = false;
    };
  }, []);

  // Collapsible Sidebar Groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    CADASTROS: true,
    ANALISES: true,
  });

  const toggleGroup = (grp: string) => {
    setOpenGroups((prev) => ({ ...prev, [grp]: !prev[grp] }));
  };

  const handleInspectTalento = (talento: TalentoProfile) => {
    setSelectedTalento(talento);
    setActiveRoute("Diagnósticos");
  };

  const handleNavigateEquipe = (equipeNome: string) => {
    setInitialOpenEquipe(equipeNome);
    setActiveRoute("Equipes");
  };

  const handleAnalisarProcesso = (vagaId: number) => {
    setSelectedVagaId(vagaId);
    setActiveRoute("Processo seletivo");
  };

  const filteredTalentos = talentos.filter((t) => {
    const matchesSearch =
      t.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.departamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.codigo.includes(searchQuery);
    const matchesDept =
      departmentFilter === "Todos" || t.departamento === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleSimulateAI = () => {
    setIsGeneratingIA(true);
    setTimeout(() => {
      setIsGeneratingIA(false);
    }, 1000);
  };

  const heatmapRows = ["12.00", "11.00", "10.00", "09.00", "08.00"];
  const heatmapCols = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const heatmapEixos = [
    "Empatia",
    "Inovação",
    "Análise",
    "Comunicação",
    "Liderança",
  ];
  // 1 to 5 intensity levels matching the exact Shadcn UI reference image
  const heatmapMatrix = [
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 4, 1],
    [2, 2, 4, 2, 4, 2],
    [3, 3, 4, 3, 4, 4],
    [5, 5, 5, 5, 5, 5],
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      {/* =====================================================================
          SIDEBAR (Shadcn UI Kit Style adapted to KantechRH)
      ====================================================================== */}
      <aside
        className={`${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        } flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0d111d] transition-all duration-200 shrink-0 select-none z-20`}
      >
        {/* Top Brand + Search */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#510851] text-white font-bold shadow-xs">
                <span className="text-sm tracking-tighter">◇</span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[15px] tracking-tight text-slate-900 dark:text-white">
                      Kantech<span className="text-[#ea580c]">RH</span>
                    </span>
                    <span className="rounded bg-[#510851]/10 dark:bg-[#8b5cf6]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#510851] dark:text-[#a78bfa]">
                      PRO
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-none">
                    Soft Skills & People Analytics
                  </span>
                </div>
              )}
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar talento..."
                className="h-9 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 pl-8 pr-10 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#510851]/20 focus:border-[#510851]"
              />
              <kbd className="pointer-events-none absolute right-2 top-2 inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                ⌘K
              </kbd>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5">
          {/* Group 1: Dashboards */}
          <div>
            {!sidebarCollapsed && (
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Dashboards
              </div>
            )}
            <nav className="space-y-0.5">
              <SidebarItem
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="HR Overview (Home)"
                active={activeRoute === "Home"}
                collapsed={sidebarCollapsed}
                badge="Ativo"
                badgeVariant="emerald"
                onClick={() => setActiveRoute("Home")}
              />
              <SidebarItem
                icon={<Compass className="h-4 w-4" />}
                label="Diagnósticos KAN"
                active={activeRoute === "Diagnósticos"}
                collapsed={sidebarCollapsed}
                badge="IA"
                badgeVariant="orange"
                onClick={() => setActiveRoute("Diagnósticos")}
              />
              <SidebarItem
                icon={<BarChart3 className="h-4 w-4" />}
                label="People Analytics"
                active={activeRoute === "Analytics"}
                collapsed={sidebarCollapsed}
                onClick={() => setActiveRoute("Analytics")}
              />
            </nav>
          </div>

          {/* Group 2: Cadastros & Análises */}
          <div>
            {!sidebarCollapsed && (
              <button
                onClick={() => toggleGroup("CADASTROS")}
                className="flex w-full items-center justify-between px-2.5 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600"
              >
                <span>Cadastros & Seleção</span>
                {openGroups.CADASTROS ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            {(openGroups.CADASTROS || sidebarCollapsed) && (
              <nav className="space-y-0.5">
                <SidebarItem
                  icon={<Users className="h-4 w-4" />}
                  label="Talentos & OCR"
                  active={activeRoute === "Talentos"}
                  collapsed={sidebarCollapsed}
                  hasChevron
                  onClick={() => setActiveRoute("Talentos")}
                />
                <SidebarItem
                  icon={<UsersRound className="h-4 w-4" />}
                  label="Equipes & Harmonia"
                  active={activeRoute === "Equipes"}
                  collapsed={sidebarCollapsed}
                  hasChevron
                  onClick={() => setActiveRoute("Equipes")}
                />
                <SidebarItem
                  icon={<UserCheck className="h-4 w-4" />}
                  label="Processo Seletivo"
                  active={activeRoute === "Processo seletivo"}
                  collapsed={sidebarCollapsed}
                  badge="Match"
                  badgeVariant="orange"
                  onClick={() => setActiveRoute("Processo seletivo")}
                />
                <SidebarItem
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Vagas"
                  active={activeRoute === "Vagas"}
                  collapsed={sidebarCollapsed}
                  hasChevron
                  onClick={() => setActiveRoute("Vagas")}
                />
                <SidebarItem
                  icon={<Network className="h-4 w-4" />}
                  label="Organograma"
                  active={activeRoute === "Empresa e Organograma"}
                  collapsed={sidebarCollapsed}
                  hasChevron
                  onClick={() => setActiveRoute("Empresa e Organograma")}
                />
              </nav>
            )}
          </div>

          {/* Group 3: Governança & Admin Master */}
          <div>
            {!sidebarCollapsed && (
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Governança & SaaS
              </div>
            )}
            <nav className="space-y-0.5">
              <SidebarItem
                icon={<Layers className="h-4 w-4" />}
                label="SaaS Multi-Tenant"
                active={activeRoute === "SaaS Multi-Tenant"}
                collapsed={sidebarCollapsed}
                hasChevron
                onClick={() => setActiveRoute("SaaS Multi-Tenant")}
              />
              <SidebarItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Painel de Controle"
                active={activeRoute === "Painel de Controle"}
                collapsed={sidebarCollapsed}
                onClick={() => setActiveRoute("Painel de Controle")}
              />
            </nav>
          </div>
        </div>

        {/* Bottom Card: Motor MAM Isolado */}
        <div className="p-3">
          {!sidebarCollapsed ? (
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Motor MAM Isolado
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Seguro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Cálculos protegidos via container interno{" "}
                <code className="text-[#510851] dark:text-[#a78bfa] font-semibold">
                  mam-kantechrh
                </code>{" "}
                + Supabase RLS.
              </p>
              <Button
                onClick={() => setActiveRoute("Talentos")}
                className="w-full h-8 text-xs font-semibold bg-slate-900 hover:bg-[#510851] dark:bg-[#8b5cf6] text-white rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" />
                Cadastrar Talento
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              onClick={() => setActiveRoute("Talentos")}
              className="w-full h-9 bg-[#510851] text-white"
              title="Cadastrar Talento"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE (Topbar + Scrollable Content)
      ====================================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0d111d] px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Alternar barra lateral"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 transition-colors"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedTenant.cor }}
                />
                <span className="font-semibold">{selectedTenant.nome}</span>
                <span className="text-[10px] text-slate-400">
                  • {selectedTenant.plano}
                </span>
                <SlidersHorizontal className="h-3 w-3 text-slate-400 ml-1" />
              </button>

              {tenantMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-lg z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Alternar Empresa (Multi-Tenant)
                  </div>
                  {EMPRESAS_TENANT.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setSelectedTenant(emp);
                        setTenantMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: emp.cor }}
                        />
                        <span className="font-medium">{emp.nome}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {emp.plano}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="hidden md:flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300"
              title="Status em tempo real da camada BFF (Supabase + Container mam-kantechrh)"
            >
              <span className="flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    bffStatus.supabase === "online"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
                Supabase ({talentos.length})
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    bffStatus.mamEngine === "online"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
                mam-kantechrh
              </span>
            </div>

            <button
              onClick={() => setActiveRoute("Processo seletivo")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#510851] dark:text-[#a78bfa] hover:underline px-2 py-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#ea580c]" />
              Matching Seletivo
            </button>

            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notificações"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ea580c]" />
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Alternar Modo Claro / Escuro"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Identidade KantechRH (#510851 & #ea580c)"
            >
              <Palette className="h-4 w-4 text-[#510851] dark:text-[#a78bfa]" />
            </button>

            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

            <div className="flex items-center gap-2.5 pl-1">
              <img
                src={talentos[0].avatar}
                alt="Admin Master"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-[#510851]/20"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold leading-none">
                  Cristiano Almeida
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  ● Admin Master
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================================
            MAIN SCROLLABLE CONTENT AREA
        ==================================================================== */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1440px] space-y-6">
            {/* VIEW 1: HOME (Shadcn UI Kit HR Dashboard) */}
            {activeRoute === "Home" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiMetricCard
                    title="Perfis Mapeados"
                    value={String(talentos.length)}
                    trend="+14.2% este mês"
                    subtitle="Sincronizado com Supabase"
                    accentColor="#510851"
                    icon={
                      <Users className="h-4 w-4 text-[#510851] dark:text-[#a78bfa]" />
                    }
                  />
                  <KpiMetricCard
                    title="Equipes Cadastradas"
                    value={String(equipes.length)}
                    trend="88.4% Harmonia Média"
                    subtitle="Triângulos de Equipe"
                    accentColor="#ea580c"
                    icon={<Compass className="h-4 w-4 text-[#ea580c]" />}
                  />
                  <KpiMetricCard
                    title="Processos Seletivos"
                    value={`${vagas.length} Ativos`}
                    trend="94% Fit Cultural"
                    subtitle="Aderência comportamental"
                    accentColor="#10b981"
                    icon={<UserCheck className="h-4 w-4 text-emerald-600" />}
                  />
                  <KpiMetricCard
                    title="Motor de Cálculo & IA"
                    value="Online"
                    trend="Gemini 2.5 + MAM"
                    subtitle="Container Isolado Ativo"
                    accentColor="#8b5cf6"
                    icon={<BrainCircuit className="h-4 w-4 text-[#8b5cf6]" />}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                  {/* LEFT 8 COLUMNS */}
                  <div className="xl:col-span-8 space-y-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            Fluxo de Diagnósticos & Mapeamentos Comportamentais
                          </CardTitle>
                          <CardDescription>
                            Volume semanal de perfis processados pelo container interno{" "}
                            <span className="font-medium text-[#510851] dark:text-[#a78bfa]">
                              mam-kantechrh
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-xs bg-slate-200 dark:bg-slate-700" />
                            Mapeados
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-xs bg-[#510851] dark:bg-[#8b5cf6]" />
                            Alta Liderança
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-xs bg-[#ea580c]" />
                            Fit &gt; 90%
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="h-[230px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={WEEKLY_DIAGNOSTICS_CHART}
                              barSize={38}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgba(148,163,184,0.18)"
                              />
                              <XAxis
                                dataKey="dia"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#64748b" }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#64748b" }}
                              />
                              <RechartsTooltip
                                cursor={{ fill: "rgba(81, 8, 81, 0.04)" }}
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "1px solid #e2e8f0",
                                  fontSize: "12px",
                                }}
                              />
                              <Bar
                                dataKey="mapeados"
                                stackId="a"
                                fill="#e2e8f0"
                                radius={[0, 0, 6, 6]}
                                name="Perfis Mapeados"
                              />
                              <Bar
                                dataKey="lideranca"
                                stackId="a"
                                fill="#510851"
                                name="Alta Liderança"
                              />
                              <Bar
                                dataKey="aderencia"
                                stackId="a"
                                fill="#ea580c"
                                radius={[6, 6, 0, 0]}
                                name="Fit > 90%"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Talentos Table Card */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle className="text-base font-semibold">
                            Todos os Talentos Mapeados
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveRoute("Talentos")}
                            >
                              <Plus className="h-3.5 w-3.5 text-[#510851]" />
                              Cadastrar Talento
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-3.5 w-3.5" />
                              Exportar
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                            <div className="relative flex-1 max-w-xs">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar talento, cargo ou ID..."
                                className="pl-9 h-9 text-xs"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setDepartmentFilter(
                                  departmentFilter === "Todos"
                                    ? "Produto & Inovação"
                                    : "Todos"
                                )
                              }
                            >
                              <Filter className="h-3.5 w-3.5" />
                              {departmentFilter === "Todos"
                                ? "Filtros"
                                : departmentFilter}
                            </Button>
                          </div>
                          <span className="text-xs text-slate-400">
                            Exibindo {filteredTalentos.length} de{" "}
                            {talentos.length} perfis sincronizados
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="px-0 pb-2">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-y border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                                <th className="py-3 pl-6 pr-3 w-8">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                  />
                                </th>
                                <th className="py-3 px-3">ID KAN</th>
                                <th className="py-3 px-3">Talento</th>
                                <th className="py-3 px-3">Cargo / Função</th>
                                <th className="py-3 px-3">Departamento</th>
                                <th className="py-3 px-3">Perfil KAN</th>
                                <th className="py-3 pl-3 pr-6 text-right">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
                              {filteredTalentos.map((t) => (
                                <tr
                                  key={t.id}
                                  className="hover:bg-slate-50/90 dark:hover:bg-slate-900/40 transition-colors group"
                                >
                                  <td className="py-3.5 pl-6 pr-3">
                                    <input
                                      type="checkbox"
                                      className="rounded border-slate-300"
                                    />
                                  </td>
                                  <td className="py-3.5 px-3 font-mono text-slate-500">
                                    {t.codigo}
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={t.avatar}
                                        alt={t.nome}
                                        className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                      />
                                      <div>
                                        <div
                                          onClick={() =>
                                            handleInspectTalento(t)
                                          }
                                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#510851] dark:hover:text-[#a78bfa] cursor-pointer"
                                        >
                                          {t.nome}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                          {t.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                                    {t.cargo}
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <Badge
                                      variant="secondary"
                                      className="font-normal"
                                    >
                                      {t.departamento}
                                    </Badge>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <Badge
                                      variant={
                                        t.status === "Ativo"
                                          ? "success"
                                          : t.status === "Em Avaliação"
                                          ? "orange"
                                          : "purple"
                                      }
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                      KAN {t.kan_numero} •{" "}
                                      {t.perfil_dominante.split(" ")[0]}
                                    </Badge>
                                  </td>
                                  <td className="py-3.5 pl-3 pr-6 text-right">
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        onClick={() => handleInspectTalento(t)}
                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-[#510851]/10 hover:text-[#510851] dark:hover:text-[#a78bfa] transition-colors"
                                        title="Abrir Diagnóstico Comportamental"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setActiveRoute("Talentos")
                                        }
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Editar Talento"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* RIGHT 4 COLUMNS */}
                  <div className="xl:col-span-4 space-y-6">
                    <Card className="p-4 space-y-3">
                      <button
                        onClick={() => setActiveRoute("Talentos")}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 hover:border-[#510851]/40 hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-all text-left"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              Cadastro de Talentos & OCR
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Leitura de RG/CNH com Gemini 2.5
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => setActiveRoute("Equipes")}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 hover:border-[#510851]/40 hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-all text-left"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8b5cf6]/15 text-[#510851] dark:text-[#a78bfa]">
                            <UsersRound className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              Equipes & Triângulos Harmônicos
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Geometria no Plano KAN • {equipes.length} Equipes
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    </Card>

                    {/* Active Selection Process */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">
                            Comitê de Seleção em Destaque
                          </CardTitle>
                          <Badge variant="orange">Fit 94%</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {vagas[0]?.nome_vaga} ({vagas[0]?.senioridade})
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {vagas[0]?.departamento} •{" "}
                            {vagas[0]?.candidatos_associados.length} Candidatos
                            Associados
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2.5 overflow-hidden">
                            {talentos.slice(0, 4).map((m) => (
                              <img
                                key={m.id}
                                src={m.avatar}
                                alt={m.nome}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">
                            Matching KAN + Triângulos
                          </span>
                        </div>

                        <Button
                          onClick={() => setActiveRoute("Processo seletivo")}
                          className="w-full bg-slate-950 hover:bg-[#510851] dark:bg-[#8b5cf6] dark:hover:bg-[#7c3aed] text-white font-semibold h-10 rounded-xl"
                        >
                          Analisar Processo Seletivo
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Heatmap Card (Shadcn UI Kit Rounded Squircle Style - 20% Compact) */}
                    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <CardHeader className="flex flex-row items-center justify-between pb-1">
                        <CardTitle className="text-sm font-semibold">
                          Matriz de Aderência & Sinergia KAN
                        </CardTitle>
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </CardHeader>
                      <CardContent className="space-y-3.5 pt-1">
                        <div>
                          <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            88.4%
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Taxa de Sinergia Comportamental{" "}
                            <span className="font-bold text-[#009e3c] dark:text-emerald-400">
                              +3.42%
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-0.5">
                          {heatmapRows.map((rowLabel, rIdx) => (
                            <div
                              key={rowLabel}
                              className="grid grid-cols-[38px_1fr] items-center gap-2.5"
                            >
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {rowLabel}
                              </span>
                              <div className="grid grid-cols-6 gap-2">
                                {heatmapMatrix[rIdx].map((level, cIdx) => {
                                  const bgColors: Record<number, string> = {
                                    1: "#e6f7ed",
                                    2: "#c3eed4",
                                    3: "#8ce2ad",
                                    4: "#42d374",
                                    5: "#009e3c",
                                  };
                                  const scorePct =
                                    level === 5
                                      ? 96
                                      : level === 4
                                      ? 88
                                      : level === 3
                                      ? 79
                                      : level === 2
                                      ? 68
                                      : 58;
                                  return (
                                    <div
                                      key={cIdx}
                                      title={`${heatmapEixos[rIdx]} (${heatmapCols[cIdx]}): ${scorePct}% de Sinergia`}
                                      style={{
                                        backgroundColor: bgColors[level],
                                      }}
                                      className="h-[35px] w-full rounded-[11px] transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer"
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          {/* X-Axis Labels at Bottom */}
                          <div className="grid grid-cols-[38px_1fr] items-center gap-2.5 pt-0.5">
                            <span />
                            <div className="grid grid-cols-6 gap-2 text-center">
                              {heatmapCols.map((colLabel) => (
                                <span
                                  key={colLabel}
                                  className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
                                >
                                  {colLabel}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: CADASTROS -> TALENTOS */}
            {activeRoute === "Talentos" && (
              <TalentosView
                talentos={talentos}
                setTalentos={setTalentos}
                equipes={equipes}
                onInspectTalento={handleInspectTalento}
                onNavigateEquipe={handleNavigateEquipe}
              />
            )}

            {/* VIEW 3: CADASTROS -> EQUIPES & TRIÂNGULOS HARMÔNICOS */}
            {activeRoute === "Equipes" && (
              <EquipesView
                equipes={equipes}
                setEquipes={setEquipes}
                talentos={talentos}
                initialOpenEquipe={initialOpenEquipe}
                onInspectTalento={handleInspectTalento}
              />
            )}

            {/* VIEW 4: CADASTROS -> VAGAS */}
            {activeRoute === "Vagas" && (
              <VagasView
                vagas={vagas}
                setVagas={setVagas}
                onAnalisarProcesso={handleAnalisarProcesso}
              />
            )}

            {/* VIEW 5: ANÁLISES -> PROCESSO SELETIVO (MATCHING + HARMONIA DE EQUIPE) */}
            {activeRoute === "Processo seletivo" && (
              <ProcessoSeletivoView
                vagas={vagas}
                setVagas={setVagas}
                talentos={talentos}
                equipes={equipes}
                selectedVagaId={selectedVagaId}
                setSelectedVagaId={setSelectedVagaId}
                onInspectTalento={handleInspectTalento}
                onGoToVagas={() => setActiveRoute("Vagas")}
              />
            )}

            {/* VIEW 6: DIAGNÓSTICOS COMPORTAMENTAIS */}
            {activeRoute === "Diagnósticos" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">Motor mam-kantechrh</Badge>
                      <span className="text-xs text-slate-400">
                        Diagnóstico Comportamental Instantâneo • Sem Manipulação
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mt-1">
                      Diagnóstico Comportamental KAN
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={selectedTalento.id}
                      onChange={(e) => {
                        const found = talentos.find(
                          (t) => t.id === e.target.value
                        );
                        if (found) setSelectedTalento(found);
                      }}
                      className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#510851]"
                    >
                      {talentos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome} ({t.cargo})
                        </option>
                      ))}
                    </select>

                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      Exportar CSV
                    </Button>
                    <Button size="sm">
                      <FileText className="h-3.5 w-3.5" />
                      Baixar Relatório PDF
                    </Button>
                  </div>
                </div>

                <Card className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <img
                        src={selectedTalento.avatar}
                        alt={selectedTalento.nome}
                        className="h-20 w-20 rounded-2xl object-cover ring-4 ring-[#510851]/10 dark:ring-[#8b5cf6]/20"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {selectedTalento.nome}
                          </h2>
                          <Badge variant="success">
                            KAN: {selectedTalento.kan_nome}
                          </Badge>
                          <Badge variant="secondary">
                            ID #{selectedTalento.codigo}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedTalento.data_nascimento} •{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {selectedTalento.profissao}
                          </span>{" "}
                          • {selectedTalento.departamento} (
                          {selectedTalento.empresa})
                        </p>
                        {selectedTalento.experiencias && (
                          <p className="text-xs text-slate-500 max-w-2xl pt-1">
                            {selectedTalento.experiencias}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 shrink-0">
                      <div className="rounded-xl border border-[#510851]/20 bg-[#510851]/5 dark:bg-[#8b5cf6]/10 px-4 py-3 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#510851] dark:text-[#a78bfa]">
                          Índice KAN
                        </div>
                        <div className="text-2xl font-black text-[#510851] dark:text-white mt-0.5">
                          {selectedTalento.kan_numero}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {selectedTalento.kan_nome}
                        </div>
                      </div>
                      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c]">
                          Estrutural
                        </div>
                        <div className="text-2xl font-black text-[#ea580c] mt-0.5">
                          {selectedTalento.estrutural}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Base Inata
                        </div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          Direcionamento
                        </div>
                        <div className="text-2xl font-black text-emerald-600 mt-0.5">
                          {selectedTalento.direcionamento}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Missão/Fluxo
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <Card className="lg:col-span-7">
                    <CardHeader>
                      <CardTitle>
                        Mapeamento de Competências & Indicadores KAN
                      </CardTitle>
                      <CardDescription>
                        Leitura técnica gerada pelas matrizes proprietárias
                        KantechRH
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedTalento.indicadores_perfil.map((ind, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 hover:border-[#510851]/30 transition-colors"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              {ind.Campo}
                            </span>
                            <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#510851] to-[#6c0e6c] px-3 py-1 text-xs font-bold text-white shadow-2xs">
                              {ind.Valor}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {ind.Descricao}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-5 space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>
                          Distribuição dos 7 Vetores de Soft Skills
                        </CardTitle>
                        <CardDescription>
                          Pontuação ponderada (`MATRIZ_DB` × `PESO_DB`)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3.5">
                        {selectedTalento.soft_skills.map((sk) => (
                          <div key={sk.perfil} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {sk.perfil}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {sk.score}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${sk.score}%`,
                                  backgroundColor: sk.cor,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-[#510851]/25 dark:border-[#8b5cf6]/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#510851] text-white">
                              <Sparkles className="h-4 w-4 text-[#ea580c]" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">
                                Parecer Executivo com IA (Gemini 2.5)
                              </CardTitle>
                              <CardDescription>
                                Linguagem 100% corporativa focada em RH e Gestão
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSimulateAI}
                            disabled={isGeneratingIA}
                          >
                            {isGeneratingIA ? "Analisando..." : "Regerar IA"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {selectedTalento.ai_diagnosis.map((paragraph, i) => (
                          <p
                            key={i}
                            className="rounded-lg bg-slate-50/90 dark:bg-slate-900/60 p-3 border border-slate-200/60 dark:border-slate-800"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: PAINEL DE CONTROLE ADMINISTRATIVO & SAAS MULTI-TENANT */}
            {activeRoute === "Painel de Controle" && (
              <PainelControleView
                key="admin-main"
                talentos={talentos}
                setTalentos={setTalentos}
                equipes={equipes}
                initialTab="diagnostico_ampliado"
              />
            )}

            {activeRoute === "SaaS Multi-Tenant" && (
              <PainelControleView
                key="admin-saas"
                talentos={talentos}
                setTalentos={setTalentos}
                equipes={equipes}
                initialTab="usuarios_saas"
              />
            )}

            {/* VIEW: EMPRESA E ORGANOGRAMA */}
            {activeRoute === "Empresa e Organograma" && (
              <OrganogramaView
                talentos={talentos}
                setTalentos={setTalentos}
                equipes={equipes}
                setEquipes={setEquipes}
                onInspectTalento={handleInspectTalento}
              />
            )}

            {/* VIEW: PEOPLE ANALYTICS */}
            {activeRoute === "Analytics" && (
              <PeopleAnalyticsView
                talentos={talentos}
                onInspectTalento={handleInspectTalento}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================================
   HELPER SUBCOMPONENTS
============================================================================ */
function SidebarItem({
  icon,
  label,
  active,
  collapsed,
  badge,
  badgeVariant = "emerald",
  hasChevron,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: string;
  badgeVariant?: "emerald" | "orange" | "purple";
  hasChevron?: boolean;
  onClick: () => void;
}) {
  const badgeClasses = {
    emerald:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    orange:
      "border-orange-500/30 bg-orange-500/10 text-[#ea580c] dark:text-orange-400",
    purple:
      "border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#510851] dark:text-[#a78bfa]",
  }[badgeVariant];

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
        active
          ? "bg-slate-100/90 dark:bg-slate-800/90 text-[#510851] dark:text-white font-semibold shadow-2xs"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <span
          className={`${
            active
              ? "text-[#510851] dark:text-[#a78bfa]"
              : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
          }`}
        >
          {icon}
        </span>
        {!collapsed && <span className="truncate">{label}</span>}
      </div>

      {!collapsed && (
        <div className="flex items-center gap-1">
          {badge && (
            <span
              className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${badgeClasses}`}
            >
              {badge}
            </span>
          )}
          {hasChevron && (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-70" />
          )}
        </div>
      )}
    </button>
  );
}

function KpiMetricCard({
  title,
  value,
  trend,
  subtitle,
  accentColor,
  icon,
}: {
  title: string;
  value: string;
  trend: string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          {trend}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
    </Card>
  );
}
