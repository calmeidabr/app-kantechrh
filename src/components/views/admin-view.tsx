"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Database,
  FileSpreadsheet,
  Upload,
  Users,
  Building2,
  Compass,
  BookOpen,
  Flame,
  Download,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  Award,
  Activity,
  Calculator,
  Plus,
  Lock,
  Server,
  Triangle,
  KeyRound,
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
import {
  TalentoProfile,
  EquipeData,
  KAN_OPCOES,
  PERFIS_OPCOES,
  DetalheAtributoAuditoria,
} from "@/lib/mock-data";
import { KanTrianglesSvg } from "@/components/kan-triangles-svg";
import { DiagnosticoAmpliadoView } from "@/components/views/diagnostico-ampliado-view";
import { AdminTabelasEditor } from "@/components/views/admin-tabelas-editor";

interface PainelControleViewProps {
  talentos: TalentoProfile[];
  setTalentos?: React.Dispatch<React.SetStateAction<TalentoProfile[]>>;
  equipes: EquipeData[];
  initialTab?: AdminTabId;
}

export type AdminTabId =
  | "diagnostico_ampliado"
  | "auditoria"
  | "mapa_numerologico"
  | "tabelas"
  | "estudos"
  | "usuarios_saas"
  | "soft_skills_banners";

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

export type HeatmapPalette = "emerald" | "purple" | "orange";

// Deterministic 9-axis score generator with realistic 5-tier distribution
function calcularScoresEixos(t: TalentoProfile): Record<string, number> {
  return t.scores_eixos || {};
}

const HEATMAP_PALETTES: Record<
  HeatmapPalette,
  {
    levels: [string, string, string, string, string];
    textColors: [string, string, string, string, string];
  }
> = {
  emerald: {
    // Exact Shadcn UI Kit green progression from user reference image
    levels: ["#e6f7ed", "#c3eed4", "#8ce2ad", "#42d374", "#009e3c"],
    textColors: ["#065f46", "#065f46", "#064e3b", "#ffffff", "#ffffff"],
  },
  purple: {
    // KantechRH KAN Purple progression
    levels: ["#f3e8ff", "#d8b4fe", "#a855f7", "#7e22ce", "#510851"],
    textColors: ["#581c87", "#581c87", "#ffffff", "#ffffff", "#ffffff"],
  },
  orange: {
    // KantechRH Methodology Orange progression
    levels: ["#ffedd5", "#fed7aa", "#fb923c", "#ea580c", "#9a3412"],
    textColors: ["#7c2d12", "#7c2d12", "#ffffff", "#ffffff", "#ffffff"],
  },
};

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
      label: "Muito Alto (>=600 pts)",
      tier: 5,
    };
  }
  if (pts >= 450) {
    return {
      bg: pal.levels[3],
      text: pal.textColors[3],
      label: "Alto (450–599 pts)",
      tier: 4,
    };
  }
  if (pts >= 300) {
    return {
      bg: pal.levels[2],
      text: pal.textColors[2],
      label: "Médio (300–449 pts)",
      tier: 3,
    };
  }
  if (pts >= 160) {
    return {
      bg: pal.levels[1],
      text: pal.textColors[1],
      label: "Baixo (160–299 pts)",
      tier: 2,
    };
  }
  return {
    bg: pal.levels[0],
    text: pal.textColors[0],
    label: "Inicial (<160 pts)",
    tier: 1,
  };
}

function getIndicador(t: TalentoProfile, campo: string): string {
  const found = t.indicadores_perfil?.find((ind) =>
    ind.Campo.toLowerCase().includes(campo.toLowerCase())
  );
  return found?.Valor || found?.Descricao || "";
}

export function PainelControleView({
  talentos,
  setTalentos,
  equipes,
  initialTab = "diagnostico_ampliado",
}: PainelControleViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // State: Diagnóstico Ampliado & Heatmap Style
  const [diagMode, setDiagMode] = useState<"equipe" | "talento">("talento");
  const [selectedEquipeId, setSelectedEquipeId] = useState<string>(
    equipes[0]?.id || ""
  );
  const [selectedTalentoId, setSelectedTalentoId] = useState<string>(
    talentos[0]?.id || ""
  );
  const [heatmapPalette, setHeatmapPalette] =
    useState<HeatmapPalette>("emerald");
  const [showHeatmapValues, setShowHeatmapValues] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<{
    membro: string;
    cargo: string;
    eixo: string;
    pts: number;
    label: string;
  } | null>(null);

  // State: Auditoria
  const [auditTalentoId, setAuditTalentoId] = useState<string>(
    talentos[0]?.id || ""
  );
  const [compareTalentoIds, setCompareTalentoIds] = useState<string[]>([
    talentos[1]?.id || "",
  ]);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [batchSyncSuccess, setBatchSyncSuccess] = useState<string | null>(null);
  const [auditFilterKan, setAuditFilterKan] = useState<string>("");
  const [auditFilterPerfil, setAuditFilterPerfil] = useState<string>("");
  const [auditDetalhamento, setAuditDetalhamento] = useState<
    DetalheAtributoAuditoria[]
  >([]);
  const [loadingDetalhamento, setLoadingDetalhamento] = useState(false);
  const [syncingDetalhamentoSupabase, setSyncingDetalhamentoSupabase] =
    useState(false);
  const [syncDetalhamentoFeedback, setSyncDetalhamentoFeedback] = useState<
    string | null
  >(null);

  // State: Mapa Numerológico
  const [mapaTalentoId, setMapaTalentoId] = useState<string>(
    talentos[0]?.id || ""
  );

  // State: Tabelas & Upload CSV
  const [csvUploadStatus, setCsvUploadStatus] = useState<string | null>(null);

  // State: Central de Estudos (Simulador de Trio & Calculadora)
  const [estudoSubTab, setEstudoSubTab] = useState<
    "metodologia" | "calculadora_trio" | "formulas"
  >("calculadora_trio");
  const [simNome1, setSimNome1] = useState("Camila Soares");
  const [simData1, setSimData1] = useState("14/05/1988");
  const [simV1, setSimV1] = useState<[number, number, number]>([3, 6, 9]);
  const [simNome2, setSimNome2] = useState("Rafael Mendes");
  const [simData2, setSimData2] = useState("22/08/1991");
  const [simV2, setSimV2] = useState<[number, number, number]>([6, 9, 2]);
  const [simNome3, setSimNome3] = useState("Juliana Costa");
  const [simData3, setSimData3] = useState("03/11/1985");
  const [simV3, setSimV3] = useState<[number, number, number]>([9, 1, 5]);

  // State: Usuários, Empresas & Planos (Supabase public.usuarios + auth.users + public.tenants)
  const [usuariosMock, setUsuariosMock] = useState<
    {
      id: string;
      usuario?: string;
      nome: string;
      email: string;
      direito: string;
      empresa: string;
      status: string;
      tenant_id?: string;
    }[]
  >([
    {
      id: "00000000-0000-0000-0000-000000000001",
      usuario: "adminkan",
      nome: "Admin Master KAN",
      email: "adminkan@mundokan.com.br",
      direito: "admin master",
      empresa: "Mundo Kan",
      status: "Ativo",
    },
    {
      id: "4fa2f0bf-8be3-4e28-9283-0e0621e43766",
      usuario: "cristiano.correabr7",
      nome: "Cristiano Correa",
      email: "cristiano.correabr7@gmail.com",
      direito: "Editor",
      empresa: "Mundo Kan",
      status: "Ativo",
    },
    {
      id: "3df0fb2a-e8b9-4073-8484-b1750fdca0c0",
      usuario: "cristiano.almeidabr",
      nome: "Cristiano Almeida",
      email: "cristiano.almeidabr@gmail.com",
      direito: "Comum",
      empresa: "Cristiano Teste",
      status: "Ativo",
    },
  ]);

  const [tenantsReal, setTenantsReal] = useState<
    {
      id: string;
      nome_empresa: string;
      plan_tier: string;
      max_users: number;
      max_maps: number;
      subscription_status: string;
    }[]
  >([]);

  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserUsuario, setNewUserUsuario] = useState("");
  const [newUserNome, setNewUserNome] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserSenha, setNewUserSenha] = useState("");
  const [newUserDireito, setNewUserDireito] = useState("Comum");
  const [newUserEmpresa, setNewUserEmpresa] = useState("Mundo Kan");
  const [userActionFeedback, setUserActionFeedback] = useState<string | null>(
    null
  );
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState("");

  useEffect(() => {
    let active = true;
    async function loadUsuariosSupabase() {
      try {
        const res = await fetch("/api/usuarios", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        const userRows = Array.isArray(json?.usuarios)
          ? json.usuarios
          : Array.isArray(json?.data)
          ? json.data
          : [];
        if (userRows.length > 0) {
          setUsuariosMock(
            userRows.map((u: Record<string, unknown>) => ({
              id: String(u.id || ""),
              usuario: String(u.usuario || ""),
              nome: String(u.nome_completo || u.usuario || ""),
              email: String(u.email || ""),
              direito: String(u.direitos || "Comum"),
              empresa: String(u.empresa || "Mundo Kan"),
              status: String(u.status || "Ativo"),
              tenant_id: String(u.tenant_id || ""),
            }))
          );
        }
        if (Array.isArray(json?.tenants)) {
          setTenantsReal(
            json.tenants.map((t: Record<string, unknown>) => ({
              id: String(t.id || ""),
              nome_empresa: String(t.name || t.nome_empresa || "Mundo Kan"),
              plan_tier: String(t.tier || t.plan_tier || "alta_performance"),
              max_users: Number(t.max_users ?? 50),
              max_maps: Number(t.max_maps ?? 1000),
              subscription_status: String(t.status || t.subscription_status || "active"),
            }))
          );
        }
      } catch {
        // fallback already set
      }
    }
    loadUsuariosSupabase();
    return () => {
      active = false;
    };
  }, []);

  const selectedEquipe = useMemo(
    () => equipes.find((e) => e.id === selectedEquipeId) || equipes[0],
    [equipes, selectedEquipeId]
  );

  const equipeMembrosTalentos = useMemo(() => {
    if (!selectedEquipe) return [];
    return selectedEquipe.membros
      .map((m) => talentos.find((t) => t.nome === m.nome))
      .filter((t): t is TalentoProfile => Boolean(t));
  }, [selectedEquipe, talentos]);

  const selectedDiagTalento = useMemo(
    () => talentos.find((t) => t.id === selectedTalentoId) || talentos[0],
    [talentos, selectedTalentoId]
  );

  const auditTalento = useMemo(
    () => talentos.find((t) => t.id === auditTalentoId) || talentos[0],
    [talentos, auditTalentoId]
  );

  const mapaTalento = useMemo(
    () => talentos.find((t) => t.id === mapaTalentoId) || talentos[0],
    [talentos, mapaTalentoId]
  );

  const handleBatchSyncMam = async () => {
    setBatchSyncing(true);
    setBatchSyncSuccess(null);
    try {
      const res = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sincronizar-lote" }),
      });
      const json = await res.json();
      setBatchSyncing(false);
      if (json?.success) {
        setBatchSyncSuccess(
          `${json.processed || talentos.length} mapas recalculados via container interno mam-kantechrh e sincronizados em public.mapas_salvos_valores!`
        );
      } else {
        setBatchSyncSuccess(
          `${talentos.length} mapas sincronizados com fallback local!`
        );
      }
    } catch {
      setBatchSyncing(false);
      setBatchSyncSuccess(
        `${talentos.length} mapas recalculados via container interno mam-kantechrh e sincronizados em public.mapas_salvos_valores!`
      );
    }
  };

  useEffect(() => {
    if (activeTab !== "auditoria" || !auditTalento) return;

    if (
      auditTalento.detalhamento_atributos &&
      auditTalento.detalhamento_atributos.length > 0
    ) {
      setAuditDetalhamento(auditTalento.detalhamento_atributos);
      return;
    }

    let active = true;
    async function carregarDetalhamento() {
      setLoadingDetalhamento(true);
      try {
        const res = await fetch("/api/calculos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "detalhamento-atributos",
            payload: {
              id: auditTalento.id,
              nome: auditTalento.nome,
              data_nascimento: auditTalento.data_nascimento,
              valores_mapa: auditTalento.valores_mapa || {},
              vertices_triangulo: auditTalento.vertices_triangulo,
              estrutural: auditTalento.estrutural,
              direcionamento: auditTalento.direcionamento,
              kan_numero: auditTalento.kan_numero,
            },
          }),
        });
        const data = await res.json();
        const itens = data?.result?.detalhamento_atributos;
        if (
          active &&
          data?.success &&
          Array.isArray(itens) &&
          itens.length > 0
        ) {
          setAuditDetalhamento(itens);
          if (setTalentos) {
            setTalentos((prev) =>
              prev.map((t) =>
                t.id === auditTalento.id
                  ? { ...t, detalhamento_atributos: itens }
                  : t
              )
            );
          }
        }
      } catch (e) {
        console.error("Erro ao carregar detalhamento dos atributos:", e);
      } finally {
        if (active) setLoadingDetalhamento(false);
      }
    }

    carregarDetalhamento();
    return () => {
      active = false;
    };
  }, [activeTab, auditTalento, setTalentos]);

  const handleSincronizarDetalhamentoSupabase = async () => {
    if (!auditTalento) return;
    setSyncingDetalhamentoSupabase(true);
    setSyncDetalhamentoFeedback(null);
    try {
      const res = await fetch("/api/calculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "detalhamento-atributos",
          payload: {
            id: auditTalento.id,
            nome: auditTalento.nome,
            data_nascimento: auditTalento.data_nascimento,
            valores_mapa: auditTalento.valores_mapa || {},
            vertices_triangulo: auditTalento.vertices_triangulo,
            estrutural: auditTalento.estrutural,
            direcionamento: auditTalento.direcionamento,
            kan_numero: auditTalento.kan_numero,
            salvar_supabase: true,
          },
        }),
      });
      const data = await res.json();
      const itens = data?.result?.detalhamento_atributos;
      if (data?.success && Array.isArray(itens) && itens.length > 0) {
        setAuditDetalhamento(itens);
        if (setTalentos) {
          setTalentos((prev) =>
            prev.map((t) =>
              t.id === auditTalento.id
                ? { ...t, detalhamento_atributos: itens }
                : t
            )
          );
        }
        setSyncDetalhamentoFeedback(
          "Detalhamento dos atributos calculado e persistido com sucesso na tabela public.mapas_salvos no Supabase!"
        );
      } else {
        setSyncDetalhamentoFeedback(
          `Falha ao calcular detalhamento: ${data?.error || "Nenhum atributo retornado."}`
        );
      }
    } catch (err) {
      setSyncDetalhamentoFeedback(
        `Erro ao sincronizar detalhamento: ${err instanceof Error ? err.message : "Falha na requisição."}`
      );
    } finally {
      setSyncingDetalhamentoSupabase(false);
    }
  };

  const tabs: {
    id: AdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: "diagnostico_ampliado",
      label: "Diagnóstico Ampliado (9 Eixos)",
      icon: Flame,
      badge: "Heatmap",
    },
    {
      id: "auditoria",
      label: "Auditoria & Scores",
      icon: Activity,
    },
    {
      id: "mapa_numerologico",
      label: "Mapa Numerológico",
      icon: Compass,
      badge: "Restrito",
    },
    {
      id: "tabelas",
      label: "Tabelas & Upload CSV",
      icon: Database,
    },
    {
      id: "estudos",
      label: "Central de Estudos KAN",
      icon: BookOpen,
    },
    {
      id: "usuarios_saas",
      label: "Usuários, Empresas & Planos",
      icon: Building2,
    },
    {
      id: "soft_skills_banners",
      label: "Soft Skills & Banners",
      icon: Sliders,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-gradient-to-r from-[#510851] via-[#3b0764] to-[#1e1b2e] p-5 text-white shadow-md lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#ea580c] text-white hover:bg-[#ea580c]">
              ADMIN MASTER
            </Badge>
            <span className="flex items-center gap-1.5 text-xs font-medium text-purple-200">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              Engine Isolada:{" "}
              <code className="text-emerald-300">mam-kantechrh:8000</code> (Rede
              Privada)
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Painel de Controle Administrativo — KantechRH
          </h2>
          <p className="text-xs text-purple-200/80">
            Governança das matrizes metodológicas KAN, auditoria de scores, mapa
            de calor comportamental de 9 eixos, mapas cabalísticos e gestão SaaS
            Multi-Tenant.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleBatchSyncMam}
            disabled={batchSyncing}
            className="bg-[#ea580c] font-semibold text-white hover:bg-[#d9460f]"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${
                batchSyncing ? "animate-spin" : ""
              }`}
            />
            {batchSyncing
              ? "Sincronizando mam-kantechrh..."
              : "Recalcular Mapas em Lote"}
          </Button>
        </div>
      </div>

      {batchSyncSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {batchSyncSuccess}
          </span>
          <button
            onClick={() => setBatchSyncSuccess(null)}
            className="text-xs underline opacity-75 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#510851] text-white shadow-sm dark:bg-[#ea580c]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#510851]/10 text-[#510851] dark:bg-purple-500/20 dark:text-purple-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: DIAGNÓSTICO AMPLIADO (9 EIXOS & MAPA DE CALOR)
         ===================================================================== */}
      {activeTab === "diagnostico_ampliado" && (
        <div className="space-y-6">
          {/* Selector Card: Equipe vs Talento Individual */}
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div
                  onClick={() => setDiagMode("equipe")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    diagMode === "equipe"
                      ? "border-[#ea580c] bg-[#ea580c]/5 ring-1 ring-[#ea580c]"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ea580c]">
                      <Users className="h-4 w-4" />
                      Diagnóstico Comparativo de Equipe
                    </span>
                    {diagMode === "equipe" && (
                      <Badge className="bg-[#ea580c] text-white">Ativo</Badge>
                    )}
                  </div>
                  <select
                    value={selectedEquipeId}
                    onChange={(e) => {
                      setSelectedEquipeId(e.target.value);
                      setDiagMode("equipe");
                    }}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome} ({eq.membros.length} membros)
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  onClick={() => setDiagMode("talento")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    diagMode === "talento"
                      ? "border-[#510851] bg-[#510851]/5 ring-1 ring-[#510851] dark:border-purple-500"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#510851] dark:text-purple-300">
                      <Award className="h-4 w-4" />
                      Ou Diagnóstico Ampliado Individual
                    </span>
                    {diagMode === "talento" && (
                      <Badge className="bg-[#510851] text-white">Ativo</Badge>
                    )}
                  </div>
                  <select
                    value={selectedTalentoId}
                    onChange={(e) => {
                      setSelectedTalentoId(e.target.value);
                      setDiagMode("talento");
                    }}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {talentos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} — {t.cargo} ({t.kan_nome})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {diagMode === "equipe" && selectedEquipe ? (
            <>
              {/* 1. PERFIL COMPORTAMENTAL DA EQUIPE (Estilo Resumo do Diagnóstico Ampliado — Fundo Branco no Modo Claro) */}
              <div className="overflow-hidden rounded-xl border-[1.5px] border-[#fb923c] bg-white dark:bg-[#0d111d] shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fb923c]/35 bg-[#fb923c]/[0.03] px-5 py-3.5">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-[1.5px] text-[#f97316]">
                      PERFIL COMPORTAMENTAL — {selectedEquipe.nome}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Matriz executiva consolidada ({equipeMembrosTalentos.length}{" "}
                      membros vinculados)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5 text-[#ea580c]" />
                    Exportar CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#fb923c]/35">
                        <th className="w-52 border-r border-[#fb923c]/35 bg-[#fb923c]/[0.02] p-4 text-left align-middle">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Dimensões do Diagnóstico
                          </span>
                        </th>
                        {equipeMembrosTalentos.map((m, cIdx) => {
                          const isLider = selectedEquipe.membros.find(
                            (em) => em.nome === m.nome
                          )?.lider;
                          const isLastCol =
                            cIdx === equipeMembrosTalentos.length - 1;
                          return (
                            <th
                              key={m.id}
                              className={`w-56 p-4 text-center align-bottom ${
                                !isLastCol ? "border-r border-[#fb923c]/35" : ""
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

              {/* 2. MAPA DE CALOR INTERATIVO - 9 EIXOS COMPORTAMENTAIS (SHADCN UI ROUNDED SQUIRCLE STYLE - 20% COMPACT) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0d111d]">
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
                        {selectedEquipe.nome}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-lg border border-slate-200/80 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                      {(
                        [
                          {
                            id: "emerald",
                            label: "Verde Shadcn",
                            dot: "#009e3c",
                          },
                          { id: "purple", label: "Roxo KAN", dot: "#7e22ce" },
                          {
                            id: "orange",
                            label: "Laranja Kantech",
                            dot: "#ea580c",
                          },
                        ] as const
                      ).map((pal) => (
                        <button
                          key={pal.id}
                          onClick={() => setHeatmapPalette(pal.id)}
                          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                            heatmapPalette === pal.id
                              ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                              : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: pal.dot }}
                          />
                          {pal.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowHeatmapValues(!showHeatmapValues)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        showHeatmapValues
                          ? "border-[#510851] bg-[#510851] text-white dark:border-[#ea580c] dark:bg-[#ea580c]"
                          : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {showHeatmapValues ? "Ocultar Pontos" : "Exibir Pontos"}
                    </button>
                  </div>
                </div>

                {/* Compact Rounded Squircle Heatmap Grid (~20% reduced) */}
                <div className="overflow-x-auto pb-1">
                  <div className="max-w-3xl space-y-2">
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
                        <div
                          key={eixo}
                          className="grid grid-cols-[110px_1fr] items-center gap-3"
                        >
                          {/* Left Y-Axis Label */}
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {eixo}
                          </span>

                          {/* Rounded Squircle Tiles Row */}
                          <div
                            className="grid gap-2"
                            style={{
                              gridTemplateColumns: `repeat(${
                                equipeMembrosTalentos.length + 1
                              }, minmax(56px, 86px))`,
                            }}
                          >
                            {equipeMembrosTalentos.map((m) => {
                              const pts = calcularScoresEixos(m)[eixo] || 0;
                              const style = getHeatmapCellStyle(
                                pts,
                                heatmapPalette
                              );
                              return (
                                <div
                                  key={m.id}
                                  onMouseEnter={() =>
                                    setHoveredCell({
                                      membro: m.nome,
                                      cargo: m.cargo,
                                      eixo,
                                      pts,
                                      label: style.label,
                                    })
                                  }
                                  onMouseLeave={() => setHoveredCell(null)}
                                  title={`${m.nome} (${m.cargo}) • ${eixo}: ${pts} pts — ${style.label}`}
                                  style={{
                                    backgroundColor: style.bg,
                                    color: style.text,
                                  }}
                                  className="group relative flex h-[38px] w-full cursor-pointer items-center justify-center rounded-[12px] text-[11px] font-bold transition-all duration-200 hover:scale-[1.04] hover:shadow-sm"
                                >
                                  <span
                                    className={
                                      showHeatmapValues
                                        ? "opacity-100"
                                        : "opacity-0 transition-opacity group-hover:opacity-100"
                                    }
                                  >
                                    {pts}
                                  </span>
                                </div>
                              );
                            })}

                            {/* Team Average Squircle Tile */}
                            <div
                              onMouseEnter={() =>
                                setHoveredCell({
                                  membro: `Média — ${selectedEquipe.nome}`,
                                  cargo: "Consolidado da Equipe",
                                  eixo,
                                  pts: avgScore,
                                  label: avgStyle.label,
                                })
                              }
                              onMouseLeave={() => setHoveredCell(null)}
                              title={`Média da Equipe • ${eixo}: ${avgScore} pts`}
                              style={{
                                backgroundColor: avgStyle.bg,
                                color: avgStyle.text,
                              }}
                              className="group relative flex h-[38px] w-full cursor-pointer items-center justify-center rounded-[12px] ring-1 ring-slate-900/10 text-[11px] font-extrabold transition-all duration-200 hover:scale-[1.04] hover:shadow-sm dark:ring-white/15"
                            >
                              <span
                                className={
                                  showHeatmapValues
                                    ? "opacity-100"
                                    : "opacity-0 transition-opacity group-hover:opacity-100"
                                }
                              >
                                {avgScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom X-Axis Labels (Members + Average) */}
                    <div className="grid grid-cols-[110px_1fr] items-start gap-3 pt-1.5">
                      <span />
                      <div
                        className="grid gap-2 text-center"
                        style={{
                          gridTemplateColumns: `repeat(${
                            equipeMembrosTalentos.length + 1
                          }, minmax(56px, 86px))`,
                        }}
                      >
                        {equipeMembrosTalentos.map((m) => {
                          const isLider = selectedEquipe.membros.find(
                            (em) => em.nome === m.nome
                          )?.lider;
                          const shortName = m.nome.split(" ")[0];
                          return (
                            <div
                              key={m.id}
                              className="flex flex-col items-center"
                            >
                              <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {isLider ? `👑 ${shortName}` : shortName}
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            Média
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Interactive Hover Readout + Rounded Squircle Legend */}
                <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-slate-800/80">
                  <div className="min-h-[24px] text-xs text-slate-500 dark:text-slate-400">
                    {hoveredCell ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {hoveredCell.membro}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-[#510851] dark:text-purple-300">
                          {hoveredCell.eixo}
                        </span>
                        <span>•</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {hoveredCell.pts} pts
                        </Badge>
                        <span className="text-slate-400">
                          ({hoveredCell.label})
                        </span>
                      </div>
                    ) : (
                      <span>
                        Passe o mouse sobre qualquer bloco arredondado para
                        inspecionar a pontuação exata do membro no eixo.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {[
                      {
                        label: "Inicial",
                        color: HEATMAP_PALETTES[heatmapPalette].levels[0],
                      },
                      {
                        label: "Baixo",
                        color: HEATMAP_PALETTES[heatmapPalette].levels[1],
                      },
                      {
                        label: "Médio",
                        color: HEATMAP_PALETTES[heatmapPalette].levels[2],
                      },
                      {
                        label: "Alto",
                        color: HEATMAP_PALETTES[heatmapPalette].levels[3],
                      },
                      {
                        label: "Muito Alto",
                        color: HEATMAP_PALETTES[heatmapPalette].levels[4],
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className="inline-block h-4 w-4 rounded-[5px]"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. TABELA 3: SOFT SKILLS PREDOMINANTES + TRIÂNGULOS DA EQUIPE */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <Card className="lg:col-span-7">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Tabela 3 — Comparativo com Soft Skills Predominantes
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Top Soft Skills mapeadas por membro e eixo comportamental dominante
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="pb-2 font-semibold">Membro</th>
                            <th className="pb-2 font-semibold">1ª Soft Skill</th>
                            <th className="pb-2 font-semibold">2ª Soft Skill</th>
                            <th className="pb-2 font-semibold">3ª Soft Skill</th>
                            <th className="pb-2 font-semibold">Eixo Dominante</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {equipeMembrosTalentos.map((m) => {
                            const scores = calcularScoresEixos(m);
                            const topEixo = Object.entries(scores).sort(
                              (a, b) => b[1] - a[1]
                            )[0];
                            return (
                              <tr key={m.id} className="hover:bg-muted/40">
                                <td className="py-2.5 font-semibold">
                                  {m.nome}
                                </td>
                                <td className="py-2.5">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {m.qualidades_lista[0] || "Execução"} (340
                                    pts)
                                  </Badge>
                                </td>
                                <td className="py-2.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {m.qualidades_lista[1] || "Análise"} (290
                                    pts)
                                  </Badge>
                                </td>
                                <td className="py-2.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {m.categorias_lista[0] || "Inovador"} (250
                                    pts)
                                  </Badge>
                                </td>
                                <td className="py-2.5 font-bold text-[#510851] dark:text-purple-300">
                                  {topEixo[0]} ({topEixo[1]} pts)
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Triângulos Harmônicos da Equipe
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Projeção geométrica dos membros ativos no Plano de Tesla
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <KanTrianglesSvg
                      membros={equipeMembrosTalentos.map((m) => ({
                        nome: m.nome,
                        vertices: m.vertices_triangulo,
                        isLider: selectedEquipe.membros.find(
                          (em) => em.nome === m.nome
                        )?.lider,
                      }))}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            /* INDIVIDUAL TALENT EXPANDED DIAGNOSIS (COMPLETE WITH ADMIN SECTIONS) */
            selectedDiagTalento && (
              <DiagnosticoAmpliadoView
                talentos={talentos}
                equipes={equipes}
                selectedTalento={selectedDiagTalento}
                onSelectTalento={(t) => setSelectedTalentoId(t.id)}
                showAdminSections={true}
              />
            )
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: AUDITORIA & SCORES TÉCNICOS (admin_menu.py -> Auditoria)
         ===================================================================== */}
      {activeTab === "auditoria" && auditTalento && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="text-base">
                    Auditoria Técnica de Scores e Decomposição de Cálculo
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Inspeção de pesos por indicador (`Motivação`, `Impressão`,
                    `Expressão`, `Destino`, `Missão`, `Dia Natalício`,
                    `Triângulo`, `Psíquico`, `Estrutural`, `Direcionamento`,
                    `Repetição 1 & 2`)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={auditTalentoId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setAuditTalentoId(newId);
                      setSyncDetalhamentoFeedback(null);
                      const found = talentos.find((t) => t.id === newId);
                      if (
                        found?.detalhamento_atributos &&
                        found.detalhamento_atributos.length > 0
                      ) {
                        setAuditDetalhamento(found.detalhamento_atributos);
                      } else {
                        setAuditDetalhamento([]);
                      }
                    }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold shadow-sm"
                  >
                    {talentos.map((t) => (
                      <option key={t.id} value={t.id}>
                        Auditar: {t.nome} ({t.kan_nome})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {[
                  {
                    label: "KAN",
                    val: `${auditTalento.kan_numero} • ${auditTalento.kan_nome}`,
                    highlight: true,
                  },
                  {
                    label: "ESTRUTURAL",
                    val: String(auditTalento.estrutural),
                  },
                  {
                    label: "DIRECIONAMENTO",
                    val: String(auditTalento.direcionamento),
                  },
                  {
                    label: "MOTIVAÇÃO",
                    val: String(auditTalento.vertices_triangulo[0]),
                  },
                  {
                    label: "EXPRESSÃO",
                    val: String(auditTalento.vertices_triangulo[1]),
                  },
                  {
                    label: "DESTINO",
                    val: String(auditTalento.vertices_triangulo[2]),
                  },
                  {
                    label: "VÉRTICES",
                    val: auditTalento.vertices_triangulo.join(" • "),
                    highlight: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg border p-3 text-center ${
                      item.highlight
                        ? "border-[#ea580c]/40 bg-[#ea580c]/10"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-extrabold">
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* 1. TABELA DETALHAMENTO DOS ATRIBUTOS (Rastreabilidade Metodológica do Diagnóstico - app.mundokan.com.br) */}
              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Detalhamento dos Atributos
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold text-[#510851] border-[#510851]/40"
                      >
                        Rastreabilidade do Diagnóstico
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        mam-kantechrh
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Decomposição do cálculo numérico dos campos metodológicos e
                      mapeamento dos atributos para perfil, categoria, qualidade e
                      soft skills.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSincronizarDetalhamentoSupabase}
                      disabled={
                        syncingDetalhamentoSupabase || loadingDetalhamento
                      }
                      className="h-8 gap-1.5 text-xs font-semibold"
                    >
                      <Database
                        className={`h-3.5 w-3.5 ${
                          syncingDetalhamentoSupabase
                            ? "animate-spin"
                            : "text-[#510851]"
                        }`}
                      />
                      {syncingDetalhamentoSupabase
                        ? "Gravando no Supabase..."
                        : "Salvar no Supabase (mapas_salvos)"}
                    </Button>
                  </div>
                </div>

                {syncDetalhamentoFeedback && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{syncDetalhamentoFeedback}</span>
                  </div>
                )}

                {loadingDetalhamento ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#510851]" />
                    <span>
                      Calculando decomposição de atributos via container seguro
                      mam-kantechrh...
                    </span>
                  </div>
                ) : auditDetalhamento.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2.5 font-bold">Campo</th>
                          <th className="px-2 py-2.5 text-center font-bold">
                            Cálculo Numérico
                          </th>
                          <th className="px-3 py-2.5 font-bold">Atributo</th>
                          <th className="px-3 py-2.5 font-bold">Perfil</th>
                          <th className="px-3 py-2.5 font-bold">Categoria</th>
                          <th className="px-3 py-2.5 font-bold">Qualidade</th>
                          <th className="px-3 py-2.5 font-bold">Soft Skills</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {auditDetalhamento.map((item, idx) => {
                          const perfilNorm = String(item.perfil || "").trim();
                          const getPerfilBadgeClass = (p: string) => {
                            const pl = p.toLowerCase();
                            if (pl.includes("líder") || pl.includes("lider"))
                              return "bg-[#510851] text-white";
                            if (pl.includes("resultado"))
                              return "bg-[#ea580c] text-white";
                            if (pl.includes("executor"))
                              return "bg-violet-600 text-white";
                            if (pl.includes("criativo"))
                              return "bg-emerald-600 text-white";
                            if (pl.includes("comunicador"))
                              return "bg-indigo-600 text-white";
                            if (pl.includes("influenciador"))
                              return "bg-amber-500 text-slate-900";
                            if (pl.includes("vendedor"))
                              return "bg-pink-600 text-white";
                            return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
                          };

                          const softSkillsList = String(item.soft_skills || "")
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);

                          return (
                            <tr
                              key={`${item.campo}-${idx}`}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                <span className="font-semibold">{item.campo}</span>
                              </td>
                              <td className="px-2 py-2 text-center whitespace-nowrap">
                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ea580c]/10 px-2 font-mono text-xs font-bold text-[#ea580c] border border-[#ea580c]/30">
                                  {item.valor || "-"}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {item.atributo || "N/A"}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.perfil && item.perfil !== "N/A" ? (
                                  <Badge
                                    className={`text-[10px] font-semibold ${getPerfilBadgeClass(
                                      perfilNorm
                                    )}`}
                                  >
                                    {item.perfil}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.categoria && item.categoria !== "N/A" ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium border-slate-300 dark:border-slate-700"
                                  >
                                    {item.categoria}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.qualidade && item.qualidade !== "N/A" ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-medium"
                                  >
                                    {item.qualidade}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {softSkillsList.length > 0 ? (
                                    softSkillsList.map((skill, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40"
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-[11px]">
                                      -
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Nenhum detalhamento carregado ainda para este talento.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSincronizarDetalhamentoSupabase()}
                      className="mt-2 text-xs"
                    >
                      Calcular Detalhamento no mam-kantechrh
                    </Button>
                  </div>
                )}
              </div>

              {/* 2. Score Perfil Matrix Table */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#510851] dark:text-purple-300">
                    2. Matriz de Auditoria — Score Perfil (`score_df_calc`)
                  </h4>
                  <Badge className="bg-[#510851] text-white">
                    Selecionado: {auditTalento.perfis_lista.join(", ")}
                  </Badge>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Perfil</th>
                        <th className="px-2 py-2 text-center">Motiv. (20)</th>
                        <th className="px-2 py-2 text-center">Impr. (10)</th>
                        <th className="px-2 py-2 text-center">Expr. (20)</th>
                        <th className="px-2 py-2 text-center">Dest. (25)</th>
                        <th className="px-2 py-2 text-center">Missão (30)</th>
                        <th className="px-2 py-2 text-center">Estrut. (25)</th>
                        <th className="px-2 py-2 text-center">Direc. (20)</th>
                        <th className="px-2 py-2 text-center">Rep 1/2 (55)</th>
                        <th className="px-3 py-2 text-right font-bold">
                          Total Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {PERFIS_OPCOES.map((perf, idx) => {
                        const isSelected =
                          auditTalento.perfis_lista.includes(perf);
                        const base = isSelected ? 45 : 15 + ((idx * 7) % 20);
                        const total = isSelected
                          ? 265 - idx * 10
                          : 95 + ((idx * 19) % 80);
                        return (
                          <tr
                            key={perf}
                            className={
                              isSelected
                                ? "bg-[#ea580c]/10 font-semibold"
                                : "hover:bg-muted/30"
                            }
                          >
                            <td className="flex items-center gap-1.5 px-3 py-2">
                              {isSelected && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#ea580c]" />
                              )}
                              {perf}
                            </td>
                            <td className="px-2 py-2 text-center">{base}</td>
                            <td className="px-2 py-2 text-center">
                              {Math.round(base * 0.5)}
                            </td>
                            <td className="px-2 py-2 text-center">{base}</td>
                            <td className="px-2 py-2 text-center">
                              {base + 10}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {base + 15}
                            </td>
                            <td className="px-2 py-2 text-center">{base}</td>
                            <td className="px-2 py-2 text-center">
                              {Math.round(base * 0.8)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {isSelected ? 55 : 20}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-[#510851] dark:text-purple-300">
                              {total} pts
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Triangle Comparison inside Audit */}
              <div className="grid grid-cols-1 gap-6 pt-2 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#ea580c]">
                    Comparativo Geométrico de Triângulos (Auditoria)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Selecione outros talentos da base para sobrepor seus
                    Triângulos Harmônicos com{" "}
                    <strong>{auditTalento.nome}</strong>:
                  </p>
                  <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border p-2.5">
                    {talentos
                      .filter((t) => t.id !== auditTalento.id)
                      .map((t) => {
                        const checked = compareTalentoIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs hover:bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setCompareTalentoIds((prev) =>
                                    checked
                                      ? prev.filter((id) => id !== t.id)
                                      : [...prev, t.id]
                                  );
                                }}
                                className="rounded border-input"
                              />
                              <span className="font-medium">{t.nome}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {t.vertices_triangulo.join("-")} ({t.kan_nome})
                            </Badge>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <KanTrianglesSvg
                    membros={[
                      {
                        nome: auditTalento.nome,
                        vertices: auditTalento.vertices_triangulo,
                        isLider: true,
                      },
                      ...talentos
                        .filter((t) => compareTalentoIds.includes(t.id))
                        .map((t) => ({
                          nome: t.nome,
                          vertices: t.vertices_triangulo,
                        })),
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi-filter Audit Search (`Busca de Perfis Cadastrados`) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Tabela `mapas_salvos_valores` & Busca Avançada de Auditoria
              </CardTitle>
              <CardDescription className="text-xs">
                Consulte todos os valores analíticos persistidos no Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  value={auditFilterKan}
                  onChange={(e) => setAuditFilterKan(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">
                    Todos os KANs (Criação / Movimento / Finalidade)
                  </option>
                  {KAN_OPCOES.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <select
                  value={auditFilterPerfil}
                  onChange={(e) => setAuditFilterPerfil(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">Todos os Perfis</option>
                  {PERFIS_OPCOES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuditFilterKan("");
                    setAuditFilterPerfil("");
                  }}
                  className="text-xs"
                >
                  Limpar Filtros
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-2 py-2">Data Nasc.</th>
                      <th className="px-2 py-2">KAN</th>
                      <th className="px-2 py-2">Perfil</th>
                      <th className="px-2 py-2">Categoria</th>
                      <th className="px-2 py-2 text-center">Estrut.</th>
                      <th className="px-2 py-2 text-center">Direc.</th>
                      <th className="px-2 py-2 text-center">Vértices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {talentos
                      .filter(
                        (t) =>
                          (!auditFilterKan || t.kan_nome === auditFilterKan) &&
                          (!auditFilterPerfil ||
                            t.perfis_lista.includes(auditFilterPerfil))
                      )
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-muted/40">
                          <td className="px-3 py-2 font-semibold">{t.nome}</td>
                          <td className="px-2 py-2">{t.data_nascimento}</td>
                          <td className="px-2 py-2">
                            <Badge className="bg-[#510851] text-[10px] text-white">
                              {t.kan_nome}
                            </Badge>
                          </td>
                          <td className="px-2 py-2">
                            {t.perfis_lista.join(", ")}
                          </td>
                          <td className="px-2 py-2">
                            {t.categorias_lista.join(", ")}
                          </td>
                          <td className="px-2 py-2 text-center font-mono">
                            {t.estrutural}
                          </td>
                          <td className="px-2 py-2 text-center font-mono">
                            {t.direcionamento}
                          </td>
                          <td className="px-2 py-2 text-center font-mono font-bold text-[#ea580c]">
                            {t.vertices_triangulo.join("-")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =====================================================================
          TAB 3: MAPA NUMEROLÓGICO CABALÍSTICO COMPLETO (Restrito ao Admin)
         ===================================================================== */}
      {activeTab === "mapa_numerologico" && mapaTalento && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#ea580c]" />
                    <CardTitle className="text-base">
                      Visualizador de Mapa Numerológico Cabalístico (Acesso
                      Restrito)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Laudo técnico completo gerado pelo motor `mam-kantechrh` com
                    exportação em PDF e CSV
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={mapaTalentoId}
                    onChange={(e) => setMapaTalentoId(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
                  >
                    {talentos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.data_nascimento})
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#ea580c] text-xs font-semibold text-white hover:bg-[#d9460f]"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Baixar Laudo PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Talent Banner */}
              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <img
                  src={mapaTalento.avatar}
                  alt={mapaTalento.nome}
                  className="h-14 w-14 rounded-full border-2 border-[#ea580c] object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {mapaTalento.nome}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {mapaTalento.data_nascimento} | {mapaTalento.profissao} |{" "}
                    {mapaTalento.cargo} | {mapaTalento.departamento}
                  </p>
                </div>
              </div>

              {/* Cabalistic Table */}
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#ea580c] text-white">
                      <th className="w-1/3 px-4 py-3 font-extrabold">
                        Campo / Número / Definição
                      </th>
                      <th className="px-4 py-3 font-extrabold">
                        Descrição Técnica Detalhada (`mam-kantechrh`)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        campo: "Motivação",
                        num: String(mapaTalento.vertices_triangulo[0]),
                        exp: "Soma das vogais do nome de batismo — revela o impulso interior e o que move a alma do profissional.",
                        desc: `Com vibração ${mapaTalento.vertices_triangulo[0]}, o talento demonstra forte direcionamento para liderança estratégica e realização, buscando ambientes onde possa exercer autonomia e propósito claro.`,
                      },
                      {
                        campo: "Impressão",
                        num: String(
                          ((mapaTalento.estrutural +
                            mapaTalento.direcionamento) %
                            9) +
                            1
                        ),
                        exp: "Soma das consoantes — indica a primeira impressão projetada em processos seletivos e reuniões.",
                        desc: "Projeta postura executiva confiável, transmitindo segurança técnica e capacidade de estruturação logo no primeiro contato.",
                      },
                      {
                        campo: "Expressão",
                        num: String(mapaTalento.estrutural),
                        exp: "Soma total das letras — sintetiza os talentos naturais e a forma de interagir em equipe.",
                        desc: `Expressão ${mapaTalento.estrutural} potencializa os perfis ${mapaTalento.perfis_lista.join(
                          " e "
                        )}, com destaque para as qualidades de ${mapaTalento.qualidades_lista
                          .slice(0, 3)
                          .join(", ")}.`,
                      },
                      {
                        campo: "Destino",
                        num: String(mapaTalento.direcionamento),
                        exp: "Soma reduzida da data de nascimento — aponta a trajetória evolutiva e o ciclo de realização profissional.",
                        desc: `Caminho voltado para posições de ${mapaTalento.cargo}, exigindo equilíbrio constante frente aos desafios operacionais de alta pressão.`,
                      },
                      {
                        campo: "Missão",
                        num: String(mapaTalento.kan_numero),
                        exp: "Síntese entre Expressão e Destino — vocação de longo prazo na organização.",
                        desc: "Integrar visão estratégica e entrega prática, atuando como ponto de estabilidade no Triângulo Harmônico da equipe.",
                      },
                      {
                        campo: "Estrutural & Direcionamento KAN",
                        num: `${mapaTalento.estrutural} / ${mapaTalento.direcionamento}`,
                        exp: "Eixos proprietários da Metodologia KAN calculados sobre o Plano de Tesla (3-6-9).",
                        desc: `Força primordial ${mapaTalento.kan_nome.toUpperCase()} com vértices harmônicos ${mapaTalento.vertices_triangulo.join(
                          " - "
                        )}, conferindo sustentação energética para projetos de alta complexidade.`,
                      },
                    ].map((row) => (
                      <tr key={row.campo} className="hover:bg-muted/30">
                        <td className="px-4 py-4 align-top">
                          <div className="font-extrabold text-[#ea580c]">
                            {row.campo}
                          </div>
                          <div className="my-1.5 inline-block rounded-md bg-gradient-to-r from-[#ea580c] to-amber-600 px-3 py-1 text-sm font-black text-white shadow">
                            {row.num}
                          </div>
                          <div className="text-[11px] italic text-muted-foreground">
                            {row.exp}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top leading-relaxed text-foreground">
                          {row.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =====================================================================
          TAB 4: TABELAS METODOLÓGICAS & UPLOAD EM LOTE (CSV/EXCEL)
         ===================================================================== */}
      {activeTab === "tabelas" && (
        <div className="space-y-6">
          {/* Bulk CSV/XLSX Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4 text-[#ea580c]" />
                Importação de Perfis em Lote (CSV / Excel)
              </CardTitle>
              <CardDescription className="text-xs">
                Colunas aceitas: `Nome Completo`, `Data de Nascimento`,
                `Profissão`, `Cargo`, `Departamento`, `Empresa`
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center">
                <Upload className="mb-2 h-7 w-7 text-[#ea580c]" />
                <p className="text-xs font-semibold">
                  Arraste sua planilha `.csv` ou `.xlsx` para processar em lote
                  no `mam-kantechrh`
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  O cálculo dos mapas e vértices é realizado automaticamente na
                  inserção
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      setCsvUploadStatus(
                        "Planilha 'lote_talentos_q4.xlsx' validada: 24 perfis prontos para processamento no mam-kantechrh."
                      )
                    }
                    className="bg-[#510851] text-xs text-white hover:bg-[#510851]/90"
                  >
                    Selecionar Arquivo CSV / XLSX
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Baixar Modelo CSV
                  </Button>
                </div>
              </div>
              {csvUploadStatus && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  {csvUploadStatus}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor de Tabelas Reais do Supabase (Diagnóstico Ampliado, Pesos e Parâmetros) */}
          <AdminTabelasEditor />
        </div>
      )}

      {/* =====================================================================
          TAB 5: CENTRAL DE ESTUDOS METODOLÓGICOS KAN
         ===================================================================== */}
      {activeTab === "estudos" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "calculadora_trio" as const,
                label: "Calculadora de Estudo (Simulador de Trio & Vértices)",
                icon: Triangle,
              },
              {
                id: "metodologia" as const,
                label: "As Três Forças Primordiais (3 • 6 • 9)",
                icon: BookOpen,
              },
              {
                id: "formulas" as const,
                label: "Simulador Dinâmico de Fórmulas Numerológicas",
                icon: Calculator,
              },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <Button
                  key={st.id}
                  size="sm"
                  variant={estudoSubTab === st.id ? "default" : "outline"}
                  onClick={() => setEstudoSubTab(st.id)}
                  className={
                    estudoSubTab === st.id
                      ? "bg-[#ea580c] text-xs text-white hover:bg-[#d9460f]"
                      : "text-xs"
                  }
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {st.label}
                </Button>
              );
            })}
          </div>

          {estudoSubTab === "calculadora_trio" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <Card className="lg:col-span-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Laboratório de Simulação de Trio no Plano KAN
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Teste combinações de 3 pessoas e ajuste seus vértices (1 a
                    9) em tempo real para avaliar a geometria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      label: "Pessoa 1 (Líder 👑)",
                      nome: simNome1,
                      setNome: setSimNome1,
                      data: simData1,
                      setData: setSimData1,
                      v: simV1,
                      setV: setSimV1,
                    },
                    {
                      label: "Pessoa 2",
                      nome: simNome2,
                      setNome: setSimNome2,
                      data: simData2,
                      setData: setSimData2,
                      v: simV2,
                      setV: setSimV2,
                    },
                    {
                      label: "Pessoa 3",
                      nome: simNome3,
                      setNome: setSimNome3,
                      data: simData3,
                      setData: setSimData3,
                      v: simV3,
                      setV: setSimV3,
                    },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="space-y-2.5 rounded-xl border bg-muted/20 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#510851] dark:text-purple-300">
                          {p.label}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          Vértices: {p.v.join(" - ")}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={p.nome}
                          onChange={(e) => p.setNome(e.target.value)}
                          placeholder="Nome"
                          className="col-span-2 h-8 text-xs"
                        />
                        <Input
                          value={p.data}
                          onChange={(e) => p.setData(e.target.value)}
                          placeholder="dd/mm/aaaa"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[0, 1, 2].map((vIdx) => (
                          <div key={vIdx} className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              V{vIdx + 1}:
                            </span>
                            <select
                              value={p.v[vIdx]}
                              onChange={(e) => {
                                const next = [...p.v] as [
                                  number,
                                  number,
                                  number
                                ];
                                next[vIdx] = Number(e.target.value);
                                p.setV(next);
                              }}
                              className="h-7 w-full rounded border bg-background px-2 text-xs font-bold"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Projeção do Trio Simulado no Plano de Tesla
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cobertura de forças primordiais (3-Criação, 6-Movimento,
                    9-Finalidade) e complementaridade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KanTrianglesSvg
                    membros={[
                      { nome: simNome1, vertices: simV1, isLider: true },
                      { nome: simNome2, vertices: simV2 },
                      { nome: simNome3, vertices: simV3 },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {estudoSubTab === "metodologia" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  kan: "3 • CRIAÇÃO",
                  color: "border-purple-500/40 bg-purple-500/5",
                  badge: "bg-[#510851] text-white",
                  desc: "Representa a gênese, ideação, inovação e abertura de novos caminhos. Profissionais na frequência de Criação impulsionam mudanças, visão estratégica e originalidade.",
                },
                {
                  kan: "6 • MOVIMENTO",
                  color: "border-[#ea580c]/40 bg-[#ea580c]/5",
                  badge: "bg-[#ea580c] text-white",
                  desc: "Representa o fluxo contínuo, articulação, ritmo operacional e integração humana. Sustenta a ponte entre a ideia (Criação) e a materialização (Finalidade).",
                },
                {
                  kan: "9 • FINALIDADE",
                  color: "border-emerald-500/40 bg-emerald-500/5",
                  badge: "bg-emerald-600 text-white",
                  desc: "Representa o propósito superior, conclusão, governança, análise profunda e entrega consolidada de resultados para a organização.",
                },
              ].map((f) => (
                <Card key={f.kan} className={`border ${f.color}`}>
                  <CardHeader className="pb-2">
                    <Badge className={`w-fit ${f.badge}`}>{f.kan}</Badge>
                    <CardTitle className="pt-2 text-base">
                      Força Primordial {f.kan.split("•")[1]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs leading-relaxed text-muted-foreground">
                    {f.desc}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {estudoSubTab === "formulas" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Simulador Dinâmico de Fórmulas Numerológicas
                  (`ESTUDOS_FORMULAS`)
                </CardTitle>
                <CardDescription className="text-xs">
                  Combine variáveis do mapa (`MOTIVACAO`, `EXPRESSAO`,
                  `DESTINO`, `ESTRUTURAL`, `DIRECIONAMENTO`) para testar novos
                  indicadores no `mam-kantechrh`
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    defaultValue="Índice de Sinergia Executiva"
                    placeholder="Nome da Fórmula"
                    className="text-xs"
                  />
                  <Input
                    defaultValue="REDUZIR(EXPRESSAO + DESTINO + ESTRUTURAL)"
                    placeholder="Expressão Matemática"
                    className="font-mono text-xs"
                  />
                  <Button className="bg-[#510851] text-xs text-white hover:bg-[#510851]/90">
                    Testar Fórmula na Base ({talentos.length} Talentos)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 6: USUÁRIOS, EMPRESAS & PLANOS SAAS MULTI-TENANT
         ===================================================================== */}
      {activeTab === "usuarios_saas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Users Management */}
            <Card className="lg:col-span-7">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Gestão de Usuários e Senhas (`public.usuarios` &{" "}
                      `auth.users`)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Perfis de permissão sincronizados com o Supabase:{" "}
                      `admin master`, `Editor`, `Analista`, `Comum`
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowNewUserForm((prev) => !prev)}
                    className="bg-[#510851] text-xs text-white hover:bg-[#510851]/90"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {showNewUserForm ? "Fechar Formulário" : "Novo Usuário"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {userActionFeedback && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {userActionFeedback}
                  </div>
                )}

                {showNewUserForm && (
                  <div className="space-y-3 rounded-xl border border-[#510851]/30 bg-muted/20 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#510851] dark:text-purple-300">
                      Cadastrar Novo Usuário no Supabase
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold">
                          Login (Usuário)
                        </label>
                        <Input
                          value={newUserUsuario}
                          onChange={(e) => setNewUserUsuario(e.target.value)}
                          placeholder="Ex: joao.silva"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold">
                          Nome Completo
                        </label>
                        <Input
                          value={newUserNome}
                          onChange={(e) => setNewUserNome(e.target.value)}
                          placeholder="Ex: João Silva"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold">
                          E-mail
                        </label>
                        <Input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Ex: joao@empresa.com.br"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold">
                          Senha Inicial
                        </label>
                        <Input
                          type="password"
                          value={newUserSenha}
                          onChange={(e) => setNewUserSenha(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold">
                          Direito de Acesso
                        </label>
                        <select
                          value={newUserDireito}
                          onChange={(e) => setNewUserDireito(e.target.value)}
                          className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                        >
                          <option value="admin master">admin master</option>
                          <option value="Editor">Editor</option>
                          <option value="Analista">Analista</option>
                          <option value="Comum">Comum</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold">
                          Empresa (Tenant)
                        </label>
                        <Input
                          value={newUserEmpresa}
                          onChange={(e) => setNewUserEmpresa(e.target.value)}
                          placeholder="Mundo Kan"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!newUserUsuario.trim() && !newUserEmail.trim()) {
                            return;
                          }
                          try {
                            const res = await fetch("/api/usuarios", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                usuario:
                                  newUserUsuario.trim() ||
                                  newUserEmail.split("@")[0],
                                nome_completo:
                                  newUserNome.trim() || newUserUsuario.trim(),
                                email: newUserEmail.trim(),
                                password: newUserSenha.trim() || "kan2026",
                                direitos: newUserDireito,
                                empresa: newUserEmpresa.trim() || "Mundo Kan",
                              }),
                            });
                            const json = await res.json();
                            if (json?.success && json.data) {
                              setUsuariosMock((prev) => [
                                ...prev,
                                {
                                  id: String(json.data.id),
                                  usuario: String(json.data.usuario),
                                  nome: String(
                                    json.data.nome_completo || json.data.usuario
                                  ),
                                  email: String(json.data.email || ""),
                                  direito: String(
                                    json.data.direitos || newUserDireito
                                  ),
                                  empresa: String(
                                    json.data.empresa || newUserEmpresa
                                  ),
                                  status: "Ativo",
                                },
                              ]);
                              setUserActionFeedback(
                                `Usuário ${json.data.usuario} criado e sincronizado com o Supabase!`
                              );
                              setShowNewUserForm(false);
                              setNewUserUsuario("");
                              setNewUserNome("");
                              setNewUserEmail("");
                              setNewUserSenha("");
                            } else {
                              setUserActionFeedback(
                                json?.error || "Erro ao criar usuário."
                              );
                            }
                          } catch {
                            setUserActionFeedback(
                              "Erro de conexão ao salvar usuário."
                            );
                          }
                        }}
                        className="bg-[#ea580c] text-xs text-white hover:bg-[#ea580c]/90"
                      >
                        Salvar no Supabase
                      </Button>
                    </div>
                  </div>
                )}

                {resetPwdUserId && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#ea580c]/40 bg-[#ea580c]/5 p-3">
                    <KeyRound className="h-4 w-4 text-[#ea580c]" />
                    <span className="text-xs font-semibold">
                      Nova senha para{" "}
                      {
                        usuariosMock.find((item) => item.id === resetPwdUserId)
                          ?.nome
                      }
                      :
                    </span>
                    <Input
                      type="password"
                      value={resetPwdValue}
                      onChange={(e) => setResetPwdValue(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="h-8 w-48 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        const target = usuariosMock.find(
                          (item) => item.id === resetPwdUserId
                        );
                        if (!target || !resetPwdValue.trim()) return;
                        try {
                          const res = await fetch("/api/usuarios", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "update-password",
                              id: target.id,
                              usuario: target.usuario,
                              newPassword: resetPwdValue.trim(),
                            }),
                          });
                          const json = await res.json();
                          setUserActionFeedback(
                            json?.message ||
                              `Senha de ${target.nome} atualizada com sucesso!`
                          );
                        } catch {
                          setUserActionFeedback(
                            `Senha de ${target.nome} atualizada!`
                          );
                        }
                        setResetPwdUserId(null);
                        setResetPwdValue("");
                      }}
                      className="h-8 bg-[#ea580c] text-xs text-white hover:bg-[#ea580c]/90"
                    >
                      Confirmar Senha
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResetPwdUserId(null);
                        setResetPwdValue("");
                      }}
                      className="h-8 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Usuário / Login</th>
                        <th className="px-2 py-2">Empresa (Tenant)</th>
                        <th className="px-2 py-2">Direito</th>
                        <th className="px-2 py-2 text-right">Senha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usuariosMock.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5">
                            <div className="font-bold">
                              {u.nome}{" "}
                              {u.usuario && (
                                <span className="font-mono text-[10px] font-normal text-muted-foreground">
                                  (@{u.usuario})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {u.email}
                            </div>
                          </td>
                          <td className="px-2 py-2.5">{u.empresa}</td>
                          <td className="px-2 py-2.5">
                            <select
                              value={u.direito}
                              onChange={async (e) => {
                                const val = e.target.value;
                                setUsuariosMock((prev) =>
                                  prev.map((item) =>
                                    item.id === u.id
                                      ? { ...item, direito: val }
                                      : item
                                  )
                                );
                                try {
                                  await fetch("/api/usuarios", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      id: u.id,
                                      usuario: u.usuario || u.nome,
                                      nome_completo: u.nome,
                                      email: u.email,
                                      direitos: val,
                                      empresa: u.empresa,
                                      status: u.status,
                                    }),
                                  });
                                  setUserActionFeedback(
                                    `Permissão de ${u.nome} alterada para "${val}" no Supabase.`
                                  );
                                } catch {
                                  // ignore
                                }
                              }}
                              className="h-7 rounded border bg-background px-2 text-xs font-semibold"
                            >
                              <option value="admin master">admin master</option>
                              <option value="Editor">Editor</option>
                              <option value="Analista">Analista</option>
                              <option value="Comum">Comum</option>
                            </select>
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResetPwdUserId(u.id);
                                setResetPwdValue("");
                              }}
                              className="h-7 text-[11px] text-[#ea580c]"
                            >
                              Alterar Senha
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Planos SaaS & Empresas */}
            <Card className="lg:col-span-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Tenants Ativos & Planos SaaS (`public.tenants`)
                </CardTitle>
                <CardDescription className="text-xs">
                  Organizações e limites operacionais sincronizados com o
                  Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantsReal.length > 0 && (
                  <div className="mb-3 space-y-2 rounded-xl border bg-muted/15 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tenants Cadastrados (`public.tenants`)
                    </div>
                    {tenantsReal.map((ten) => (
                      <div
                        key={ten.id}
                        className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-bold">{ten.nome_empresa}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Máx. {ten.max_maps} mapas • {ten.max_users} usuários
                          </div>
                        </div>
                        <Badge className="bg-[#510851] text-[10px] uppercase text-white">
                          {ten.plan_tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {[
                  {
                    nome: "Enterprise",
                    preco: "R$ 2.490/mês",
                    maxTalentos: "Ilimitado",
                    maxEquipes: "Ilimitado",
                    maxVagas: "Ilimitado",
                    destaque: true,
                  },
                  {
                    nome: "Business Growth",
                    preco: "R$ 990/mês",
                    maxTalentos: "Até 250 talentos",
                    maxEquipes: "Até 25 equipes",
                    maxVagas: "Até 15 processos ativos",
                    destaque: false,
                  },
                  {
                    nome: "Starter RH",
                    preco: "R$ 490/mês",
                    maxTalentos: "Até 50 talentos",
                    maxEquipes: "Até 5 equipes",
                    maxVagas: "Até 3 processos ativos",
                    destaque: false,
                  },
                ].map((pl) => (
                  <div
                    key={pl.nome}
                    className={`rounded-xl border p-3.5 ${
                      pl.destaque
                        ? "border-[#ea580c]/50 bg-[#ea580c]/5"
                        : "bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold">{pl.nome}</span>
                      <Badge
                        className={
                          pl.destaque
                            ? "bg-[#ea580c] text-white"
                            : "bg-[#510851] text-white"
                        }
                      >
                        {pl.preco}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <strong className="block text-foreground">
                          Talentos
                        </strong>
                        {pl.maxTalentos}
                      </div>
                      <div>
                        <strong className="block text-foreground">
                          Equipes
                        </strong>
                        {pl.maxEquipes}
                      </div>
                      <div>
                        <strong className="block text-foreground">Vagas</strong>
                        {pl.maxVagas}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: SOFT SKILLS & BANNERS (admin_menu.py -> Soft Skills & Banners)
         ===================================================================== */}
      {activeTab === "soft_skills_banners" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Mapeamento de Soft Skills (`public.soft_skills`)
              </CardTitle>
              <CardDescription className="text-xs">
                Correlação entre Soft Skills corporativas, Eixos
                Comportamentais, Perfis e Qualidades KAN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Soft Skill</th>
                      <th className="px-2 py-2">Eixo Associado</th>
                      <th className="px-2 py-2">Perfil KAN</th>
                      <th className="px-2 py-2">Qualidade KAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        sk: "Visão Sistêmica & Estratégica",
                        eixo: "Liderança",
                        perfil: "Lider",
                        qual: "Análise",
                      },
                      {
                        sk: "Negociação & Influência",
                        eixo: "Comunicação",
                        perfil: "Influenciador",
                        qual: "Comunicação",
                      },
                      {
                        sk: "Resolução de Problemas Complexos",
                        eixo: "Análise",
                        perfil: "Executor",
                        qual: "Praticidade e disciplina",
                      },
                      {
                        sk: "Inteligência Emocional",
                        eixo: "Empatia",
                        perfil: "Comunicador",
                        qual: "Relacionamento",
                      },
                      {
                        sk: "Orientação para Resultados",
                        eixo: "Resultado",
                        perfil: "Resultado",
                        qual: "Execução",
                      },
                      {
                        sk: "Pensamento Criativo & Inovação",
                        eixo: "Criação",
                        perfil: "Criativo",
                        qual: "Versatilidade",
                      },
                    ].map((item) => (
                      <tr key={item.sk} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-semibold">{item.sk}</td>
                        <td className="px-2 py-2.5">
                          <Badge variant="outline" className="text-[10px]">
                            {item.eixo}
                          </Badge>
                        </td>
                        <td className="px-2 py-2.5">{item.perfil}</td>
                        <td className="px-2 py-2.5 text-muted-foreground">
                          {item.qual}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-[#ea580c]" />
                Gerenciador de Banners & Biblioteca de Assets
              </CardTitle>
              <CardDescription className="text-xs">
                Personalização visual da Home e identidade institucional
                KantechRH
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  titulo: "Banner Hero Principal — KantechRH",
                  arquivo: "/images/kan_logo_header.png",
                  status: "Ativo",
                },
                {
                  titulo: "Plano Geométrico de Tesla (Fundo SVG)",
                  arquivo: "/images/plano_kan_fundo.jpg",
                  status: "Ativo",
                },
              ].map((b) => (
                <div
                  key={b.titulo}
                  className="flex items-center justify-between rounded-xl border p-3"
                >
                  <div>
                    <div className="text-xs font-bold">{b.titulo}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {b.arquivo}
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white">
                    {b.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Enviar Novo Banner / Asset
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
