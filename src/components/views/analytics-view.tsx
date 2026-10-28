"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Users,
  Sparkles,
  Award,
  Layers,
  Filter,
  Download,
  RotateCcw,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TalentoProfile } from "@/lib/mock-data";

interface PeopleAnalyticsViewProps {
  talentos: TalentoProfile[];
  onInspectTalento?: (talento: TalentoProfile) => void;
}

const SOFT_SKILLS_DICTIONARY = [
  {
    nome: "Liderança Estratégica",
    kan: ["Movimento", "Finalidade"],
    perfis: ["Lider", "Resultado"],
    categorias: ["Visionário", "Realizador"],
    qualidades: ["Execução", "Justiça"],
  },
  {
    nome: "Inovação & Criatividade",
    kan: ["Criação"],
    perfis: ["Criativo", "Influenciador"],
    categorias: ["Inovador", "Versátil"],
    qualidades: ["Versatilidade", "Intuição"],
  },
  {
    nome: "Pensamento Analítico",
    kan: ["Finalidade"],
    perfis: ["Executor", "Resultado"],
    categorias: ["Analítico", "Organizado", "Conhecimento"],
    qualidades: ["Análise", "Organização", "Praticidade e disciplina"],
  },
  {
    nome: "Comunicação & Influência",
    kan: ["Criação", "Movimento"],
    perfis: ["Comunicador", "Influenciador", "Vendedor"],
    categorias: ["Comunicativo", "Magnético", "Diplomático"],
    qualidades: ["Comunicação", "Relacionamento"],
  },
  {
    nome: "Orientação para Resultados",
    kan: ["Movimento", "Finalidade"],
    perfis: ["Resultado", "Executor"],
    categorias: ["Realizador", "Organizado"],
    qualidades: ["Execução", "Praticidade e disciplina"],
  },
  {
    nome: "Inteligência Emocional & Empatia",
    kan: ["Movimento"],
    perfis: ["Comunicador", "Lider"],
    categorias: ["Diplomático", "Harmônico", "Justo"],
    qualidades: ["Relacionamento", "Coletividade", "Serviço"],
  },
];

const ORDEM_GERACOES = [
  "Baby Boomers",
  "Geração X",
  "Geração Y / Millennials",
  "Geração Z",
  "Geração Alpha",
];

function getGeracao(dataNasc: string): string {
  const match = dataNasc?.match(/\b(19\d{2}|20\d{2})\b/);
  if (!match) return "Geração Y / Millennials";
  const ano = parseInt(match[1], 10);
  if (ano <= 1964) return "Baby Boomers";
  if (ano <= 1980) return "Geração X";
  if (ano <= 1996) return "Geração Y / Millennials";
  if (ano <= 2009) return "Geração Z";
  return "Geração Alpha";
}

const CHART_PALETTE = [
  "#ea580c",
  "#510851",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
];

export function PeopleAnalyticsView({
  talentos,
  onInspectTalento,
}: PeopleAnalyticsViewProps) {
  // Global filters
  const [selectedGrupo, setSelectedGrupo] = useState<string>("Todos");
  const [selectedProfissao, setSelectedProfissao] = useState<string>("Todas");
  const [selectedCargo, setSelectedCargo] = useState<string>("Todos");
  const [selectedGeracao, setSelectedGeracao] = useState<string>("Todas");
  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>([]);

  const opcoesGrupos = useMemo(
    () =>
      Array.from(
        new Set(talentos.map((t) => t.departamento || t.grupo).filter(Boolean))
      ).sort(),
    [talentos]
  );

  const opcoesProfissoes = useMemo(
    () =>
      Array.from(
        new Set(talentos.map((t) => t.profissao).filter(Boolean))
      ).sort(),
    [talentos]
  );

  const opcoesCargos = useMemo(
    () =>
      Array.from(new Set(talentos.map((t) => t.cargo).filter(Boolean))).sort(),
    [talentos]
  );

  const opcoesGeracoes = useMemo(() => {
    const present = new Set(talentos.map((t) => getGeracao(t.data_nascimento)));
    return ORDEM_GERACOES.filter((g) => present.has(g));
  }, [talentos]);

  const toggleSoftSkill = (skName: string) => {
    setSelectedSoftSkills((prev) =>
      prev.includes(skName)
        ? prev.filter((s) => s !== skName)
        : [...prev, skName]
    );
  };

  // Filtered Talents (`df_filtered` logic from analytics_menu.py)
  const filteredTalentos = useMemo(() => {
    return talentos.filter((t) => {
      const grp = t.departamento || t.grupo;
      if (selectedGrupo !== "Todos" && grp !== selectedGrupo) return false;
      if (selectedProfissao !== "Todas" && t.profissao !== selectedProfissao)
        return false;
      if (selectedCargo !== "Todos" && t.cargo !== selectedCargo) return false;
      if (
        selectedGeracao !== "Todas" &&
        getGeracao(t.data_nascimento) !== selectedGeracao
      )
        return false;

      if (selectedSoftSkills.length > 0) {
        for (const skName of selectedSoftSkills) {
          const skDef = SOFT_SKILLS_DICTIONARY.find((s) => s.nome === skName);
          if (skDef) {
            const matchKan = skDef.kan.includes(t.kan_nome);
            const matchPerfil = t.perfis_lista.some((p) =>
              skDef.perfis.includes(p)
            );
            const matchCat = t.categorias_lista.some((c) =>
              skDef.categorias.includes(c)
            );
            const matchQual = t.qualidades_lista.some((q) =>
              skDef.qualidades.includes(q)
            );
            if (!matchKan && !matchPerfil && !matchCat && !matchQual) {
              return false;
            }
          }
        }
      }
      return true;
    });
  }, [
    talentos,
    selectedGrupo,
    selectedProfissao,
    selectedCargo,
    selectedGeracao,
    selectedSoftSkills,
  ]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredTalentos.length;
    const perfCounts: Record<string, number> = {};
    filteredTalentos.forEach((t) => {
      t.perfis_lista.forEach((p) => {
        perfCounts[p] = (perfCounts[p] || 0) + 1;
      });
    });
    const topPerfil =
      Object.entries(perfCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const comIA = filteredTalentos.filter(
      (t) => t.ai_diagnosis && t.ai_diagnosis.length > 0
    ).length;
    const pctIA = total > 0 ? Math.round((comIA / total) * 100) : 0;
    const gruposUnicos = new Set(
      filteredTalentos.map((t) => t.departamento || t.grupo)
    ).size;

    return { total, topPerfil, pctIA, gruposUnicos };
  }, [filteredTalentos]);

  // Chart 1: Distribuição de Perfis Comportamentais
  const chartPerfisData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTalentos.forEach((t) => {
      t.perfis_lista.forEach((p) => {
        counts[p] = (counts[p] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, Quantidade]) => ({ name, Quantidade }))
      .sort((a, b) => b.Quantidade - a.Quantidade);
  }, [filteredTalentos]);

  // Chart 2: Distribuição de Categorias Comportamentais
  const chartCategoriasData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTalentos.forEach((t) => {
      t.categorias_lista.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTalentos]);

  // Chart 3: Distribuição de Qualidades de Suporte
  const chartQualidadesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTalentos.forEach((t) => {
      t.qualidades_lista.forEach((q) => {
        counts[q] = (counts[q] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, Quantidade]) => ({ name, Quantidade }))
      .sort((a, b) => b.Quantidade - a.Quantidade);
  }, [filteredTalentos]);

  // Chart 4: Distribuição por KAN (Criação, Movimento, Finalidade)
  const chartKanData = useMemo(() => {
    const counts: Record<string, number> = {
      Criação: 0,
      Movimento: 0,
      Finalidade: 0,
    };
    filteredTalentos.forEach((t) => {
      counts[t.kan_nome] = (counts[t.kan_nome] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [filteredTalentos]);

  // Chart 5: Distribuição por Gerações Etárias
  const chartGeracoesData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTalentos.forEach((t) => {
      const g = getGeracao(t.data_nascimento);
      counts[g] = (counts[g] || 0) + 1;
    });
    return ORDEM_GERACOES.filter((g) => counts[g] > 0).map((name) => ({
      name,
      Quantidade: counts[name],
    }));
  }, [filteredTalentos]);

  const handleResetFilters = () => {
    setSelectedGrupo("Todos");
    setSelectedProfissao("Todas");
    setSelectedCargo("Todos");
    setSelectedGeracao("Todas");
    setSelectedSoftSkills([]);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#0d111d] lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#510851] text-white">PEOPLE ANALYTICS</Badge>
            <Badge variant="orange">BI Comportamental KAN</Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics & BI Comportamental Consolidado
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
             Inteligência demográfica, cruzamento de Soft Skills e distribuição
            de forças KAN (`mapas_salvos` & `mapas_salvos_valores`).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Limpar Filtros
          </Button>
          <Button
            size="sm"
            className="bg-[#ea580c] text-xs font-semibold text-white hover:bg-[#d9460f]"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar Relatório BI
          </Button>
        </div>
      </div>

      {/* GLOBAL FILTERS & SMART SOFT SKILLS FILTER */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Filter className="h-4 w-4 text-[#ea580c]" />
            Filtros Globais & Filtro Comportamental Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Filtrar por Departamento / Grupo:
              </label>
              <select
                value={selectedGrupo}
                onChange={(e) => setSelectedGrupo(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="Todos">Todos os Departamentos</option>
                {opcoesGrupos.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Filtrar por Profissão:
              </label>
              <select
                value={selectedProfissao}
                onChange={(e) => setSelectedProfissao(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="Todas">Todas as Profissões</option>
                {opcoesProfissoes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Filtrar por Cargo:
              </label>
              <select
                value={selectedCargo}
                onChange={(e) => setSelectedCargo(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="Todos">Todos os Cargos</option>
                {opcoesCargos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Filtrar por Geração Etária:
              </label>
              <select
                value={selectedGeracao}
                onChange={(e) => setSelectedGeracao(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium"
              >
                <option value="Todas">Todas as Gerações</option>
                {opcoesGeracoes.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#510851] dark:text-purple-300">
                Filtro Comportamental Inteligente por Soft Skills (Interseção de
                Traços KAN):
              </span>
              {selectedSoftSkills.length > 0 && (
                <span className="text-[11px] text-[#ea580c] font-semibold">
                  {selectedSoftSkills.length} Soft Skill(s) ativa(s)
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SOFT_SKILLS_DICTIONARY.map((sk) => {
                const active = selectedSoftSkills.includes(sk.nome);
                return (
                  <button
                    key={sk.nome}
                    onClick={() => toggleSoftSkill(sk.nome)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                      active
                        ? "border-[#ea580c] bg-[#ea580c] text-white shadow-2xs"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#510851]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    {active && <CheckCircle2 className="h-3 w-3" />}
                    {sk.nome}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total de Talentos",
            value: String(kpis.total),
            sub: `De ${talentos.length} cadastrados na base`,
            color: "#ea580c",
            icon: Users,
          },
          {
            label: "Perfil Dominante",
            value: kpis.topPerfil,
            sub: "Maior incidência no recorte atual",
            color: "#510851",
            icon: Award,
          },
          {
            label: "Cobertura de IA",
            value: `${kpis.pctIA}%`,
            sub: "Pareceres executivos Gemini 2.5",
            color: "#10b981",
            icon: Sparkles,
          },
          {
            label: "Departamentos Ativos",
            value: String(kpis.gruposUnicos),
            sub: "Áreas mapeadas no filtro",
            color: "#8b5cf6",
            icon: Layers,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="relative overflow-hidden p-5">
              <div
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {item.label}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {item.value}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{item.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* ROW 1 OF CHARTS: PERFIS COMPORTAMENTAIS & DISTRIBUIÇÃO KAN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              1. Distribuição de Perfis Comportamentais
            </CardTitle>
            <CardDescription className="text-xs">
              Incidência dos 7 perfis metodológicos nos talentos filtrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartPerfisData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="rgba(148,163,184,0.18)"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={95}
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="Quantidade"
                    fill="#ea580c"
                    radius={[0, 6, 6, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              2. Distribuição por Força Primordial KAN
            </CardTitle>
            <CardDescription className="text-xs">
              Equilíbrio entre Criação (3), Movimento (6) e Finalidade (9)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartKanData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartKanData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={
                          entry.name === "CRIAÇÃO"
                            ? "#510851"
                            : entry.name === "MOVIMENTO"
                            ? "#ea580c"
                            : "#10b981"
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-2 text-xs">
              {chartKanData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        item.name === "CRIAÇÃO"
                          ? "#510851"
                          : item.name === "MOVIMENTO"
                          ? "#ea580c"
                          : "#10b981",
                    }}
                  />
                  <span className="font-semibold">{item.name}:</span>
                  <span className="text-slate-500">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2 OF CHARTS: QUALIDADES DE SUPORTE, CATEGORIAS & GERAÇÕES ETÁRIAS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              3. Distribuição de Qualidades de Suporte
            </CardTitle>
            <CardDescription className="text-xs">
              Competências de sustentação operacional mapeadas na equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartQualidadesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148,163,184,0.18)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="Quantidade"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              4. Demografia por Gerações Etárias & Categorias
            </CardTitle>
            <CardDescription className="text-xs">
              Pirâmide geracional calculada a partir das datas de nascimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartGeracoesData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="rgba(148,163,184,0.18)"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="Quantidade"
                    fill="#06b6d4"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Top Categorias Comportamentais Mapeadas:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {chartCategoriasData.map((cat, idx) => (
                  <Badge
                    key={cat.name}
                    variant="secondary"
                    className="text-[11px]"
                  >
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_PALETTE[idx % CHART_PALETTE.length],
                      }}
                    />
                    {cat.name}: <strong>{cat.value}</strong>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ANALYTICAL TABLE OF TALENTS (`Tabela Analítica de Talentos`) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Tabela Analítica de Talentos ({filteredTalentos.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Visão consolidada dos indicadores comportamentais e status do
                Diagnóstico IA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-y border-slate-200/80 bg-slate-50/60 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                  <th className="py-3 pl-6 pr-3">Nome</th>
                  <th className="px-3 py-3">Departamento / Grupo</th>
                  <th className="px-3 py-3">Cargo</th>
                  <th className="px-3 py-3">Geração</th>
                  <th className="px-3 py-3">KAN</th>
                  <th className="px-3 py-3">Perfil Dominante</th>
                  <th className="px-3 py-3">Categoria</th>
                  <th className="px-3 py-3">Qualidades</th>
                  <th className="py-3 pl-3 pr-6 text-right">Diagnóstico IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {filteredTalentos.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                  >
                    <td className="py-3 pl-6 pr-3">
                      <button
                        onClick={() => onInspectTalento?.(t)}
                        className="font-bold text-slate-900 hover:text-[#ea580c] hover:underline dark:text-white"
                      >
                        {t.nome}
                      </button>
                    </td>
                    <td className="px-3 py-3">{t.departamento}</td>
                    <td className="px-3 py-3 font-medium">{t.cargo}</td>
                    <td className="px-3 py-3 text-slate-500">
                      {getGeracao(t.data_nascimento)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge className="bg-[#510851] text-[10px] text-white">
                        {t.kan_numero} • {t.kan_nome}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#ea580c]">
                      {t.perfis_lista.join(", ")}
                    </td>
                    <td className="px-3 py-3">
                      {t.categorias_lista.join(", ")}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {t.qualidades_lista.slice(0, 3).join(", ")}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right">
                      <Badge variant="success" className="text-[10px]">
                        Ativo
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
