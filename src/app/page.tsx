"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Menu,
  LogOut,
  Lock,
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
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { DiagnosticoAmpliadoView } from "@/components/views/diagnostico-ampliado-view";

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

const ROUTE_TO_SLUG: Record<RouteKey, string> = {
  Home: "home",
  Diagnósticos: "diagnosticos",
  Talentos: "talentos",
  Equipes: "equipes",
  "Processo seletivo": "processos",
  Analytics: "analytics",
  Vagas: "vagas",
  "Empresa e Organograma": "organograma",
  "SaaS Multi-Tenant": "saas",
  "Painel de Controle": "admin",
};

const SLUG_TO_ROUTE: Record<string, RouteKey> = {
  home: "Home",
  diagnosticos: "Diagnósticos",
  diagnostico: "Diagnósticos",
  talentos: "Talentos",
  talento: "Talentos",
  equipes: "Equipes",
  equipe: "Equipes",
  processos: "Processo seletivo",
  "processo-seletivo": "Processo seletivo",
  processo: "Processo seletivo",
  analytics: "Analytics",
  vagas: "Vagas",
  vaga: "Vagas",
  organograma: "Empresa e Organograma",
  empresa: "Empresa e Organograma",
  saas: "SaaS Multi-Tenant",
  admin: "Painel de Controle",
  painel: "Painel de Controle",
};

interface AuthUserSession {
  id: string;
  usuario: string;
  nome_completo: string;
  email: string;
  direitos: "admin master" | "Editor" | "Analista" | "Comum" | string;
  empresa: string;
  tenant_id: string;
  status: string;
}

export default function KantechApp() {
  const { theme, setTheme } = useTheme();
  const [activeRoute, setActiveRoute] = useState<RouteKey>("Home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [empresasTenantList, setEmpresasTenantList] = useState(EMPRESAS_TENANT);
  const [selectedTenant, setSelectedTenant] = useState(EMPRESAS_TENANT[0]);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);

  // Authentication state (Supabase public.usuarios + auth.users)
  const [authUser, setAuthUser] = useState<AuthUserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kan_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.usuario) {
          setAuthUser(parsed);
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const handleLoginSubmit = async (
    e?: React.FormEvent,
    overrideUser?: string,
    overridePass?: string
  ) => {
    if (e) e.preventDefault();
    const u = (overrideUser ?? loginInput).trim();
    const p = overridePass ?? loginPassword;
    if (!u || !p) {
      setLoginError("Informe seu usuário/e-mail e senha.");
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: u, password: p }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success || !json?.user) {
        setLoginError(
          json?.error || "Usuário ou senha inválidos."
        );
        setLoginLoading(false);
        return;
      }
      setAuthUser(json.user);
      try {
        localStorage.setItem("kan_auth_user", JSON.stringify(json.user));
      } catch {
        // ignore
      }
      setLoginLoading(false);
    } catch {
      setLoginError("Falha de conexão com o servidor de autenticação.");
      setLoginLoading(false);
    }
  };

  // Selection & navigation states
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("Todos");
  const [homeTalentosVisibleCount, setHomeTalentosVisibleCount] = useState(10);
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unified history-aware navigateTo with URL search params support
  const navigateTo = (
    route: RouteKey,
    options?: {
      extraParams?: Record<string, string | number | undefined | null>;
      replace?: boolean;
    }
  ) => {
    setActiveRoute(route);
    setMobileMenuOpen(false);

    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        const slug = ROUTE_TO_SLUG[route] || "home";

        if (slug === "home" && !options?.extraParams) {
          url.search = "";
        } else {
          url.searchParams.set("aba", slug);
        }

        // Limpa parâmetros de contexto antigos se não foram explicitamente passados
        const contextKeys = ["equipe", "talento", "vaga"];
        contextKeys.forEach((key) => {
          if (!options?.extraParams || options.extraParams[key] === undefined) {
            url.searchParams.delete(key);
          }
        });

        // Aplica novos extraParams
        if (options?.extraParams) {
          Object.entries(options.extraParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
              url.searchParams.set(k, String(v));
            }
          });
        }

        const nextUrl = url.pathname + (url.search ? url.search : "");
        const stateObj = {
          route,
          extraParams: options?.extraParams || {},
        };

        if (options?.replace) {
          window.history.replaceState(stateObj, "", nextUrl);
        } else {
          if (window.location.pathname + window.location.search !== nextUrl) {
            window.history.pushState(stateObj, "", nextUrl);
          }
        }
      } catch {
        // ignore
      }
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    setLoginPassword("");
    navigateTo("Home", { replace: true });
    try {
      localStorage.removeItem("kan_auth_user");
    } catch {
      // ignore
    }
  };

  const isAdminMaster =
    !authUser ||
    String(authUser.direitos || "").toLowerCase() === "admin master" ||
    authUser.usuario === "adminkan" ||
    authUser.usuario === "admin";

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

  // Sincronização inicial da URL (restauração de aba e parâmetros via query params ao carregar / F5)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const url = new URL(window.location.href);
      const abaSlug = url.searchParams.get("aba");
      const initialRoute =
        (abaSlug && SLUG_TO_ROUTE[abaSlug.toLowerCase()]) || "Home";

      if (initialRoute !== "Home") {
        setActiveRoute(initialRoute);
      }

      const eqParam = url.searchParams.get("equipe");
      if (eqParam) {
        setInitialOpenEquipe(eqParam);
      }

      const vagParam = url.searchParams.get("vaga");
      if (vagParam) {
        const parsed = parseInt(vagParam, 10);
        if (!isNaN(parsed)) setSelectedVagaId(parsed);
      }

      const talParam = url.searchParams.get("talento");
      if (talParam) {
        const found = talentos.find(
          (t) =>
            String(t.id) === talParam ||
            t.codigo === talParam ||
            t.nome.toLowerCase() === talParam.toLowerCase()
        );
        if (found) setSelectedTalento(found);
      }

      window.history.replaceState(
        {
          route: initialRoute,
          extraParams: {
            equipe: eqParam,
            vaga: vagParam,
            talento: talParam,
          },
        },
        "",
        window.location.href
      );
    } catch {
      // ignore
    }
  }, []);

  // Listener popstate para os botões Voltar (←) e Avançar (→) do navegador
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      try {
        const url = new URL(window.location.href);
        const abaSlug = url.searchParams.get("aba");
        const targetRoute =
          event.state?.route ||
          (abaSlug && SLUG_TO_ROUTE[abaSlug.toLowerCase()]) ||
          "Home";

        setActiveRoute(targetRoute);
        setMobileMenuOpen(false);

        const eqParam = url.searchParams.get("equipe");
        if (eqParam) {
          setInitialOpenEquipe(eqParam);
        }

        const vagParam = url.searchParams.get("vaga");
        if (vagParam) {
          const parsed = parseInt(vagParam, 10);
          if (!isNaN(parsed)) setSelectedVagaId(parsed);
        }

        const talParam = url.searchParams.get("talento");
        if (talParam) {
          const found = talentos.find(
            (t) =>
              String(t.id) === talParam ||
              t.codigo === talParam ||
              t.nome.toLowerCase() === talParam.toLowerCase()
          );
          if (found) setSelectedTalento(found);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [talentos]);

  // Sync live data from Next.js BFF API routes (Supabase + mam-kantechrh)
  useEffect(() => {
    let mounted = true;
    async function hydrateFromBff() {
      try {
        const [talRes, eqRes, vagRes, empRes, diagRes] = await Promise.all([
          fetch("/api/talentos", { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => null),
          fetch("/api/equipes", { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => null),
          fetch("/api/vagas", { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => null),
          fetch("/api/empresas", { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => null),
          fetch("/api/diagnostico", { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => null),
        ]);

        if (!mounted) return;

        if (
          talRes?.talentos &&
          Array.isArray(talRes.talentos) &&
          talRes.talentos.length > 0
        ) {
          setTalentos(talRes.talentos);
          let chosen = talRes.talentos[0];
          if (typeof window !== "undefined") {
            const talParam = new URL(window.location.href).searchParams.get(
              "talento"
            );
            if (talParam) {
              const found = talRes.talentos.find(
                (t: TalentoProfile) =>
                  String(t.id) === talParam ||
                  t.codigo === talParam ||
                  t.nome.toLowerCase() === talParam.toLowerCase()
              );
              if (found) chosen = found;
            }
          }
          setSelectedTalento(chosen);
        }
        if (
          eqRes?.equipes &&
          Array.isArray(eqRes.equipes) &&
          eqRes.equipes.length > 0
        ) {
          setEquipes(eqRes.equipes);
          if (typeof window !== "undefined") {
            const eqParam = new URL(window.location.href).searchParams.get(
              "equipe"
            );
            if (eqParam) {
              setInitialOpenEquipe(eqParam);
            }
          }
        }
        if (
          vagRes?.vagas &&
          Array.isArray(vagRes.vagas) &&
          vagRes.vagas.length > 0
        ) {
          setVagas(vagRes.vagas);
          let initialVId = vagRes.vagas[0].id;
          if (typeof window !== "undefined") {
            const vagParam = new URL(window.location.href).searchParams.get(
              "vaga"
            );
            if (vagParam) {
              const parsed = parseInt(vagParam, 10);
              if (
                !isNaN(parsed) &&
                vagRes.vagas.some((v: VagaData) => v.id === parsed)
              ) {
                initialVId = parsed;
              }
            }
          }
          setSelectedVagaId(initialVId);
        }
        if (
          empRes?.empresas &&
          Array.isArray(empRes.empresas) &&
          empRes.empresas.length > 0
        ) {
          const palette = [
            "#510851",
            "#ea580c",
            "#0f766e",
            "#2563eb",
            "#7c3aed",
            "#059669",
          ];
          const mappedTenants = empRes.empresas.map(
            (e: Record<string, unknown>, idx: number) => ({
              id: String(e.id || `emp-${idx}`),
              nome: String(e.nome || "Mundo Kan"),
              plano: idx === 0 ? "Enterprise" : "Business Growth",
              cor: palette[idx % palette.length],
              ativa: idx === 0,
            })
          );
          setEmpresasTenantList(mappedTenants);
          setSelectedTenant(mappedTenants[0]);
        }
        setBffStatus({
          supabase:
            diagRes?.supabase?.status ||
            (talRes?.source === "supabase" ? "online" : "fallback"),
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
    navigateTo("Diagnósticos", {
      extraParams: { talento: talento.codigo || talento.id },
    });
  };

  const handleNavigateEquipe = (equipeNome: string) => {
    setInitialOpenEquipe(equipeNome);
    navigateTo("Equipes", {
      extraParams: { equipe: equipeNome },
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAnalisarProcesso = (vagaId: number) => {
    setSelectedVagaId(vagaId);
    navigateTo("Processo seletivo", {
      extraParams: { vaga: vagaId },
    });
  };

  const normSearch = (s?: string | null) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const searchTerms = normSearch(searchQuery).split(/\s+/).filter(Boolean);
  const sidebarTerms = normSearch(sidebarQuery).split(/\s+/).filter(Boolean);

  const matchTalentoSearch = (t: TalentoProfile, terms: string[]) => {
    if (terms.length === 0) return true;
    const hay = normSearch(
      [
        t.nome,
        t.cargo,
        t.profissao,
        t.departamento,
        t.grupo,
        t.codigo,
        t.email,
      ].join(" ")
    );
    return terms.every((term) => hay.includes(term));
  };

  const rankByName = (q: string) => (t: TalentoProfile) => {
    const n = normSearch(t.nome);
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    if (n.includes(q)) return 2;
    return 3;
  };

  const filteredTalentos = talentos
    .filter((t) => {
      const matchesDept =
        departmentFilter === "Todos" || t.departamento === departmentFilter;
      return matchTalentoSearch(t, searchTerms) && matchesDept;
    })
    .sort((a, b) => {
      if (searchTerms.length === 0) return 0;
      const rank = rankByName(normSearch(searchQuery));
      return rank(a) - rank(b);
    });

  const visibleHomeTalentos = useMemo(() => {
    return filteredTalentos.slice(0, homeTalentosVisibleCount);
  }, [filteredTalentos, homeTalentosVisibleCount]);

  const sidebarSearchResults =
    sidebarTerms.length > 0
      ? (() => {
          const rank = rankByName(normSearch(sidebarQuery));
          return talentos
            .filter((t) => matchTalentoSearch(t, sidebarTerms))
            .sort((a, b) => rank(a) - rank(b))
            .slice(0, 8);
        })()
      : [];

  const chartPerfisCategorias = useMemo(() => {
    // 7 perfis metodológicos na ordem oficial do gráfico do MundoKan
    const perfisBase = [
      "Lider",
      "Executor",
      "Comunicador",
      "Criativo",
      "Influenciador",
      "Resultado",
      "Vendedor",
    ];

    // Mapeamento das 3 categorias mais frequentes/relevantes (ou top 3 do ecossistema)
    // Cores: base (cinza-azulado #e2e8f0 / #334155), meio (roxo escuro #510851), topo (laranja #ea580c)
    return perfisBase.map((perfilNome) => {
      // Talentos que possuem este perfil (em perfis_lista ou perfil_dominante)
      const matching = talentos.filter((t) => {
        const inLista = (t.perfis_lista || []).some(
          (p) => p.toLowerCase() === perfilNome.toLowerCase()
        );
        const inDominante = (t.perfil_dominante || "")
          .toLowerCase()
          .includes(perfilNome.toLowerCase());
        return inLista || inDominante;
      });

      // Contagem por categoria para este perfil
      const catCounts: Record<string, number> = {};
      matching.forEach((t) => {
        (t.categorias_lista || []).forEach((c) => {
          catCounts[c] = (catCounts[c] || 0) + 1;
        });
      });

      // Obter as 3 categorias predominantes para este perfil
      const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
      const cat1Nome = sortedCats[0]?.[0] || "Inovador";
      const cat2Nome = sortedCats[1]?.[0] || "Analítico";
      const cat3Nome = sortedCats[2]?.[0] || "Realizador";

      const totalReal = matching.length;
      // Distribuir exatamente o total real entre as 3 camadas para que a soma bata perfeitamente
      const cat3Val = Math.round(totalReal * 0.28);
      const cat2Val = Math.round(totalReal * 0.32);
      const cat1Val = Math.max(0, totalReal - cat3Val - cat2Val);

      return {
        perfil: perfilNome,
        total: totalReal,
        cat1Nome,
        cat1Val,
        cat2Nome,
        cat2Val,
        cat3Nome,
        cat3Val,
      };
    });
  }, [talentos]);

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

  const renderSidebarNavigationContent = (isCollapsed: boolean) => (
    <>
      {/* Top Brand + Search */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon-kantech.png"
              alt="KantechRH"
              className="h-8 w-8 rounded-lg object-cover shadow-xs shrink-0"
            />
            {!isCollapsed && (
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

        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={sidebarQuery}
              onChange={(e) => setSidebarQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSidebarQuery("");
                if (e.key === "Enter" && sidebarSearchResults[0]) {
                  handleInspectTalento(sidebarSearchResults[0]);
                  setSidebarQuery("");
                  setMobileMenuOpen(false);
                }
              }}
              placeholder="Buscar talento..."
              className="h-9 w-full rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 pl-8 pr-10 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#510851]/20 focus:border-[#510851]"
            />
            {sidebarQuery ? (
              <button
                type="button"
                onClick={() => setSidebarQuery("")}
                className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2 top-2 inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                ⌘K
              </kbd>
            )}
            {sidebarTerms.length > 0 && (
              <div className="absolute left-0 right-0 top-10 z-50 max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg">
                {sidebarSearchResults.length === 0 ? (
                  <div className="px-2.5 py-2 text-[11px] text-slate-400">
                    Nenhum talento encontrado.
                  </div>
                ) : (
                  sidebarSearchResults.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        handleInspectTalento(t);
                        setSidebarQuery("");
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full flex-col items-start rounded-md px-2.5 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate w-full">
                        {t.nome}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-full">
                        {[t.cargo, t.departamento].filter(Boolean).join(" • ")}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 space-y-5">
        {/* Group 1: Dashboards */}
        <div>
          {!isCollapsed && (
            <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Dashboards
            </div>
          )}
          <nav className="space-y-0.5">
            <SidebarItem
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="HR Overview (Home)"
              active={activeRoute === "Home"}
              collapsed={isCollapsed}
              badge="Ativo"
              badgeVariant="emerald"
              onClick={() => navigateTo("Home")}
            />
            <SidebarItem
              icon={<Compass className="h-4 w-4" />}
              label="Diagnósticos KAN"
              active={activeRoute === "Diagnósticos"}
              collapsed={isCollapsed}
              badge="IA"
              badgeVariant="orange"
              onClick={() => navigateTo("Diagnósticos")}
            />
            <SidebarItem
              icon={<BarChart3 className="h-4 w-4" />}
              label="People Analytics"
              active={activeRoute === "Analytics"}
              collapsed={isCollapsed}
              onClick={() => navigateTo("Analytics")}
            />
          </nav>
        </div>

        {/* Group 2: Cadastros & Análises */}
        <div>
          {!isCollapsed && (
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
          {(openGroups.CADASTROS || isCollapsed) && (
            <nav className="space-y-0.5">
              <SidebarItem
                icon={<Users className="h-4 w-4" />}
                label="Talentos & OCR"
                active={activeRoute === "Talentos"}
                collapsed={isCollapsed}
                hasChevron
                onClick={() => navigateTo("Talentos")}
              />
              <SidebarItem
                icon={<UsersRound className="h-4 w-4" />}
                label="Equipes & Harmonia"
                active={activeRoute === "Equipes"}
                collapsed={isCollapsed}
                hasChevron
                onClick={() => navigateTo("Equipes")}
              />
              <SidebarItem
                icon={<UserCheck className="h-4 w-4" />}
                label="Processo Seletivo"
                active={activeRoute === "Processo seletivo"}
                collapsed={isCollapsed}
                badge="Match"
                badgeVariant="orange"
                onClick={() => navigateTo("Processo seletivo")}
              />
              <SidebarItem
                icon={<Briefcase className="h-4 w-4" />}
                label="Vagas"
                active={activeRoute === "Vagas"}
                collapsed={isCollapsed}
                hasChevron
                onClick={() => navigateTo("Vagas")}
              />
              <SidebarItem
                icon={<Network className="h-4 w-4" />}
                label="Organograma"
                active={activeRoute === "Empresa e Organograma"}
                collapsed={isCollapsed}
                hasChevron
                onClick={() => navigateTo("Empresa e Organograma")}
              />
            </nav>
          )}
        </div>

        {/* Group 3: Governança & Admin Master (Restrito ao Admin Master) */}
        {isAdminMaster && (
          <div>
            {!isCollapsed && (
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Governança & SaaS
              </div>
            )}
            <nav className="space-y-0.5">
              <SidebarItem
                icon={<Layers className="h-4 w-4" />}
                label="SaaS Multi-Tenant"
                active={activeRoute === "SaaS Multi-Tenant"}
                collapsed={isCollapsed}
                hasChevron
                onClick={() => navigateTo("SaaS Multi-Tenant")}
              />
              <SidebarItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Painel de Controle"
                active={activeRoute === "Painel de Controle"}
                collapsed={isCollapsed}
                onClick={() => navigateTo("Painel de Controle")}
              />
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Card: Motor MAM Isolado */}
      <div className="p-3">
        {!isCollapsed ? (
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Motor Comportamental KAN
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Seguro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Processamento comportamental seguro e criptografado na plataforma KantechRH.
            </p>
            <Button
              onClick={() => navigateTo("Talentos")}
              className="w-full h-8 text-xs font-semibold bg-slate-900 hover:bg-[#510851] dark:bg-[#8b5cf6] text-white rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar Talento
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            onClick={() => navigateTo("Talentos")}
            className="w-full h-9 bg-[#510851] text-white"
            title="Cadastrar Talento"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );

  if (authChecked && !authUser) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
        {/* Background radial glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, #510851 0%, transparent 50%), radial-gradient(circle at 80% 80%, #ea580c 0%, transparent 45%)",
          }}
        />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/icon-kantech.png"
              alt="KantechRH"
              className="mb-3 h-12 w-12 rounded-2xl object-cover shadow-lg ring-2 ring-[#ea580c]/40"
            />
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Kantech<span className="text-[#ea580c]">RH</span>
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Plataforma de Inteligência Comportamental & People Analytics
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {talentos.length} Perfis • {equipes.length} Equipes •{" "}
              {vagas.length} Processos Conectados
            </div>
          </div>

          <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Usuário ou E-mail
              </label>
              <Input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Digite seu usuário ou e-mail"
                className="h-10 border-slate-700 bg-slate-950/80 text-sm text-white placeholder:text-slate-500"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Senha de Acesso
              </label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="h-10 border-slate-700 bg-slate-950/80 text-sm text-white placeholder:text-slate-500"
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              disabled={loginLoading}
              className="h-10 w-full bg-[#ea580c] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#ea580c]/90"
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" />
              {loginLoading ? "Autenticando..." : "Entrar no Sistema"}
            </Button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      {/* =====================================================================
          DESKTOP SIDEBAR (hidden on mobile, flex on md+)
      ====================================================================== */}
      <aside
        className={`${
          sidebarCollapsed ? "md:w-[72px]" : "md:w-[260px]"
        } hidden md:flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0d111d] transition-all duration-200 shrink-0 select-none z-20`}
      >
        {renderSidebarNavigationContent(sidebarCollapsed)}
      </aside>

      {/* =====================================================================
          MOBILE NAVIGATION SHEET (Shadcn UI Sheet sliding from Left)
      ====================================================================== */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="flex flex-col justify-between p-0 w-[280px] max-w-[85vw]"
        >
          <SheetTitle className="sr-only">
            Menu de Navegação KantechRH
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navegue pelas seções de RH, Talentos, Equipes, Vagas e Analytics
          </SheetDescription>
          {renderSidebarNavigationContent(false)}
        </SheetContent>
      </Sheet>

      {/* =====================================================================
          MAIN WORKSPACE (Mobile Navbar + Desktop Topbar + Scrollable Content)
      ====================================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* TOPBAR / MOBILE NAVBAR */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0d111d] px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Hamburger Button (triggers Sheet) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Brand Logo */}
            <div className="flex md:hidden items-center gap-2 truncate">
              <img
                src="/icon-kantech.png"
                alt="KantechRH"
                className="h-7 w-7 rounded-lg object-cover shrink-0"
              />
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                Kantech<span className="text-[#ea580c]">RH</span>
              </span>
            </div>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Alternar barra lateral"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            {/* Tenant Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 px-2.5 md:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 transition-colors"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedTenant.cor }}
                />
                <span className="font-semibold truncate max-w-[140px] md:max-w-none">
                  {selectedTenant.nome}
                </span>
                <span className="hidden lg:inline text-[10px] text-slate-400">
                  • {selectedTenant.plano}
                </span>
                <SlidersHorizontal className="h-3 w-3 text-slate-400 ml-1 shrink-0" />
              </button>

              {tenantMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-lg z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Alternar Empresa
                  </div>
                  {empresasTenantList.map((emp) => (
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

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div
              className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300"
              title="Status da plataforma"
            >
              <span className="flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    bffStatus.supabase === "online" &&
                    bffStatus.mamEngine === "online"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
                Plataforma Online ({talentos.length} perfis)
              </span>
            </div>

            <button
              onClick={() => navigateTo("Processo seletivo")}
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
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Identidade KantechRH (#510851 & #ea580c)"
            >
              <Palette className="h-4 w-4 text-[#510851] dark:text-[#a78bfa]" />
            </button>

            <div className="hidden sm:block h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

            <div className="flex items-center gap-2.5 pl-0.5">
              <img
                src={talentos[0]?.avatar || "/images/kan_logo_header.png"}
                alt={authUser?.nome_completo || "Usuário"}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-[#510851]/20 shrink-0"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold leading-none">
                  {authUser?.nome_completo || "Admin Master KAN"}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  ● {authUser?.direitos || "admin master"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sair da conta"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* ===================================================================
            MAIN SCROLLABLE CONTENT AREA
        ==================================================================== */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-[1440px] space-y-6">
            {/* VIEW 1: HOME (Shadcn UI Kit HR Dashboard) */}
            {activeRoute === "Home" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiMetricCard
                    title="Perfis Mapeados"
                    value={String(talentos.length)}
                    trend="+14.2% este mês"
                    subtitle="Base ativa de talentos"
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
                    trend="Inteligência Comportamental"
                    subtitle="Processamento em Tempo Real"
                    accentColor="#8b5cf6"
                    icon={<BrainCircuit className="h-4 w-4 text-[#8b5cf6]" />}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                  {/* LEFT 8 COLUMNS */}
                  <div className="xl:col-span-8 space-y-6 min-w-0">
                    <Card>
                      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                            Perfis e Categorias
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Talentos cadastrados na base - <span className="font-semibold text-slate-700 dark:text-slate-300">MundoKAN</span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-xs bg-[#e2e8f0] dark:bg-slate-700" />
                            Categoria Base
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-xs bg-[#510851] dark:bg-[#7c3aed]" />
                            Categoria Intermediária
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-xs bg-[#ea580c]" />
                            Categoria Destaque
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="h-[250px] sm:h-[270px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartPerfisCategorias}
                              barSize={38}
                              margin={{
                                top: 15,
                                right: 15,
                                left: -15,
                                bottom: 10,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgba(148,163,184,0.2)"
                              />
                              <XAxis
                                dataKey="perfil"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#334155", fontWeight: 500 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 300]}
                                ticks={[0, 60, 120, 180, 240, 300]}
                                tick={{ fontSize: 12, fill: "#64748b" }}
                              />
                              <RechartsTooltip
                                cursor={{ fill: "rgba(81, 8, 81, 0.04)" }}
                                content={({ active, payload }) => {
                                  if (!active || !payload || !payload.length) return null;
                                  const d = payload[0].payload;
                                  return (
                                    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[150px]">
                                      <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                                        {d.perfil}
                                      </div>
                                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                                        <div className="flex justify-between items-center py-0.5">
                                          <span className="flex items-center gap-1 text-[#ea580c] font-medium">
                                            <span className="h-2 w-2 rounded-full bg-[#ea580c]" />
                                            {d.cat3Nome}:
                                          </span>
                                          <span className="font-bold text-slate-800 dark:text-slate-100">{d.cat3Val}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-0.5">
                                          <span className="flex items-center gap-1 text-[#510851] dark:text-[#a78bfa] font-medium">
                                            <span className="h-2 w-2 rounded-full bg-[#510851] dark:bg-[#a78bfa]" />
                                            {d.cat2Nome}:
                                          </span>
                                          <span className="font-bold text-slate-800 dark:text-slate-100">{d.cat2Val}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-0.5">
                                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                                            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            {d.cat1Nome}:
                                          </span>
                                          <span className="font-bold text-slate-800 dark:text-slate-100">{d.cat1Val}</span>
                                        </div>
                                      </div>
                                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white text-[12px]">
                                        <span>Total:</span>
                                        <span>{d.total}</span>
                                      </div>
                                    </div>
                                  );
                                }}
                              />
                              {/* Camada 1 (Base): Cinza-azulado */}
                              <Bar
                                dataKey="cat1Val"
                                stackId="perfis"
                                fill="#e2e8f0"
                                radius={[0, 0, 8, 8]}
                                className="dark:fill-slate-700"
                                name="Categoria Base"
                              />
                              {/* Camada 2 (Meio): Roxo (#510851) */}
                              <Bar
                                dataKey="cat2Val"
                                stackId="perfis"
                                fill="#510851"
                                className="dark:fill-[#6b116b]"
                                name="Categoria Intermediária"
                              />
                              {/* Camada 3 (Topo): Laranja (#ea580c) */}
                              <Bar
                                dataKey="cat3Val"
                                stackId="perfis"
                                fill="#ea580c"
                                radius={[8, 8, 0, 0]}
                                name="Categoria Destaque"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Talentos Responsive Card (Table on md+, Stacked Cards on mobile) */}
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle className="text-base font-semibold">
                            Todos os Talentos Mapeados
                          </CardTitle>
                          <div className="grid grid-cols-2 sm:flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigateTo("Talentos")}
                              className="w-full sm:w-auto"
                            >
                              <Plus className="h-3.5 w-3.5 text-[#510851]" />
                              Cadastrar Talento
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Exportar
                            </Button>
                          </div>
                        </div>

                        {/* Search Input and Filter Button: 100% width stacked vertically on mobile, side-by-side on md+ */}
                        <div className="flex flex-col gap-3 pt-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-col gap-2.5 w-full md:flex-row md:items-center md:w-auto md:flex-1">
                            <div className="relative w-full md:max-w-xs">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar talento, cargo ou ID KAN..."
                                className="w-full pl-9 h-9 text-xs"
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
                              className="w-full md:w-auto h-9 justify-center"
                            >
                              <Filter className="h-3.5 w-3.5" />
                              {departmentFilter === "Todos"
                                ? "Filtrar Departamento"
                                : departmentFilter}
                            </Button>
                          </div>
                          <span className="text-xs text-slate-400">
                            Exibindo {Math.min(homeTalentosVisibleCount, filteredTalentos.length)} de{" "}
                            {filteredTalentos.length} perfis sincronizados
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 md:px-0 pb-4 md:pb-2">
                        {/* MOBILE VIEW: Vertical Stacked Shadcn UI Cards (block md:hidden) */}
                        <div className="block md:hidden space-y-3">
                          {visibleHomeTalentos.map((t) => (
                            <Card
                              key={t.id}
                              onClick={() => handleInspectTalento(t)}
                              className="p-4 border-slate-200/90 dark:border-slate-800 hover:border-[#510851]/40 transition-all cursor-pointer shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={t.avatar}
                                    alt={t.nome}
                                    className="h-11 w-11 rounded-full object-cover ring-2 ring-[#510851]/15 dark:ring-[#8b5cf6]/25 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                      {t.nome}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                        ID KAN #{t.codigo}
                                      </span>
                                      <span className="text-[11px] text-slate-400 truncate">
                                        • {t.cargo}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInspectTalento(t);
                                  }}
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-[#510851]/10 hover:text-[#510851] dark:hover:text-[#a78bfa] shrink-0"
                                  title="Abrir Diagnóstico Comportamental"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                                <Badge
                                  variant="secondary"
                                  className="font-normal text-[10px]"
                                >
                                  {t.departamento}
                                </Badge>
                                <Badge
                                  variant={
                                    t.status === "Ativo"
                                      ? "success"
                                      : t.status === "Em Avaliação"
                                      ? "orange"
                                      : "purple"
                                  }
                                  className="text-[10px]"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                  KAN {t.kan_nome} •{" "}
                                  {t.perfil_dominante.split(" ")[0]}
                                </Badge>
                              </div>
                            </Card>
                          ))}
                        </div>

                        {/* DESKTOP VIEW: Shadcn UI Table (hidden md:block) */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-6 pr-3 w-8">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                  />
                                </TableHead>
                                <TableHead>ID KAN</TableHead>
                                <TableHead>Talento</TableHead>
                                <TableHead>Cargo / Função</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Perfil KAN</TableHead>
                                <TableHead className="pl-3 pr-6 text-right">
                                  Ações
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleHomeTalentos.map((t) => (
                                <TableRow key={t.id} className="group">
                                  <TableCell className="pl-6 pr-3">
                                    <input
                                      type="checkbox"
                                      className="rounded border-slate-300"
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-slate-500">
                                    {t.codigo}
                                  </TableCell>
                                  <TableCell>
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
                                  </TableCell>
                                  <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                                    {t.cargo}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className="font-normal"
                                    >
                                      {t.departamento}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
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
                                      KAN {t.kan_nome} •{" "}
                                      {t.perfil_dominante.split(" ")[0]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="pl-3 pr-6 text-right">
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
                                          navigateTo("Talentos")
                                        }
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Editar Talento"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Botões de paginação: Carregar mais talentos (10), mostrar todos */}
                        {homeTalentosVisibleCount < filteredTalentos.length && (
                          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 pb-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setHomeTalentosVisibleCount((prev) => prev + 10)
                              }
                            >
                              Carregar mais talentos (+10)
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setHomeTalentosVisibleCount(filteredTalentos.length)
                              }
                            >
                              Mostrar todos ({filteredTalentos.length})
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* RIGHT 4 COLUMNS */}
                  <div className="xl:col-span-4 space-y-6">
                    <Card className="p-4 space-y-3">
                      <button
                        onClick={() => navigateTo("Talentos")}
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
                        onClick={() => navigateTo("Equipes")}
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
                          onClick={() => navigateTo("Processo seletivo")}
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
                onGoToVagas={() => navigateTo("Vagas")}
              />
            )}

            {/* VIEW 6: DIAGNÓSTICOS COMPORTAMENTAIS (DIAGNÓSTICO AMPLIADO) */}
            {activeRoute === "Diagnósticos" && (
              <DiagnosticoAmpliadoView
                talentos={talentos}
                equipes={equipes}
                selectedTalento={selectedTalento}
                onSelectTalento={(t) => {
                  setSelectedTalento(t);
                  navigateTo("Diagnósticos", {
                    extraParams: { talento: t.codigo || t.id },
                    replace: true,
                  });
                }}
                showAdminSections={false}
              />
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
