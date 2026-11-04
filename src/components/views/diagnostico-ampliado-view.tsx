"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Target,
  Zap,
  Compass,
  AlertTriangle,
  Cpu,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Crown,
  Users,
  Search,
  Heart,
  MessageSquare,
  Layers,
  RefreshCw,
  BarChart2,
  UserCheck,
  Award,
  FileText,
  Download,
  User,
  Activity,
} from "lucide-react";
import { TalentoProfile, EquipeData } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KanTrianglesSvg } from "@/components/kan-triangles-svg";

export interface DiagnosticoAmpliadoResponse {
  nome: string;
  perfil_predominante: string;
  resumo: string;
  forcas: string;
  contexto: string;
  risco_prior: string;
  desc_risco: string;
  kan_nome: string;
  kan_desc: string;
  desc_completa: string;
  score_eixos: Record<string, number>;
  eixos_config: Array<{
    nome: string;
    icon_class: string;
    icon_color: string;
    desc: string;
  }>;
  sorted_skills: Array<[string, number]>;
  perfil_top: string;
  cat_top: string;
  eixo_perfil_top: string;
  eixo_cat_top: string;
  maior_peso: number;
  colunas_score: string[];
  colunas_eixos_score: string[];
  score_eixos_matrix: Record<string, Record<string, number>>;
  origens_eixos_list: Array<{
    Eixo: string;
    Origem: string;
    "Valor Mapa": string;
    Atributo: string;
    "Perfil Mapeado": string;
    "Categoria Mapeada": string;
    Pontos: number;
  }>;
  score_perf_matrix: Record<string, Record<string, number>>;
  score_cat_matrix: Record<string, Record<string, number>>;
  detalhes_atributos_list: Array<{
    Campo: string;
    Valor: string;
    "Atributo Ampliado": string;
    Perfil: string;
    Categoria: string;
    Eixo: string;
    Polaridade: string;
    "Área de Suporte": string;
    "Soft Skills": string;
    "Risco Prioritário": string;
  }>;
}

interface DiagnosticoAmpliadoViewProps {
  talentos: TalentoProfile[];
  equipes: EquipeData[];
  selectedTalento?: TalentoProfile;
  onSelectTalento?: (talento: TalentoProfile) => void;
  /**
   * Quando `true` (exclusivo do Painel de Controle Admin), exibe também:
   * - Ver Todas as Soft Skills Mapeadas e Pontuações
   * - Pontuação de Eixos (Diagnóstico Ampliado)
   * - Ver Origem e Rastreabilidade Completa dos Eixos (+ matrizes de Perfil, Categoria e Atributos)
   */
  showAdminSections?: boolean;
}

const EIXOS_RESUMO_ORDEM = [
  "Liderança",
  "Relacionamento",
  "Criação",
  "Organização",
  "Flexibilidade",
  "Comunicação",
  "Análise",
  "Resultado",
  "Empatia",
];

function renderEixoIcon(iconClass: string, color: string) {
  const style = { color };
  switch (iconClass) {
    case "icon-lightbulb":
      return <Lightbulb className="h-4 w-4 shrink-0" style={style} />;
    case "icon-crown":
      return <Crown className="h-4 w-4 shrink-0" style={style} />;
    case "icon-target":
      return <Target className="h-4 w-4 shrink-0" style={style} />;
    case "icon-users":
      return <Users className="h-4 w-4 shrink-0" style={style} />;
    case "icon-search":
      return <Search className="h-4 w-4 shrink-0" style={style} />;
    case "icon-heart":
      return <Heart className="h-4 w-4 shrink-0" style={style} />;
    case "icon-message-square":
      return <MessageSquare className="h-4 w-4 shrink-0" style={style} />;
    case "icon-layers":
      return <Layers className="h-4 w-4 shrink-0" style={style} />;
    case "icon-refresh-cw":
      return <RefreshCw className="h-4 w-4 shrink-0" style={style} />;
    default:
      return <Target className="h-4 w-4 shrink-0" style={style} />;
  }
}

export function DiagnosticoAmpliadoView({
  talentos,
  equipes,
  selectedTalento,
  onSelectTalento,
  showAdminSections = false,
}: DiagnosticoAmpliadoViewProps) {
  const [equipeSelNome, setEquipeSelNome] = useState<string>(
    "Nenhuma equipe selecionada"
  );
  const [talentoSelNome, setTalentoSelNome] = useState<string>(
    selectedTalento?.nome || talentos[0]?.nome || ""
  );
  const [buscaEquipeDiag, setBuscaEquipeDiag] = useState<string>("");
  const [buscaTalentoDiag, setBuscaTalentoDiag] = useState<string>("");

  const normText = (s?: string | null) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // Sync when parent selectedTalento changes
  useEffect(() => {
    if (selectedTalento?.nome) {
      setTalentoSelNome(selectedTalento.nome);
    } else if (!talentoSelNome && talentos.length > 0) {
      setTalentoSelNome(talentos[0].nome);
    }
  }, [selectedTalento?.nome, talentos]);

  // Individual diagnosis state
  const [diagInd, setDiagInd] = useState<DiagnosticoAmpliadoResponse | null>(
    null
  );
  const [loadingInd, setLoadingInd] = useState<boolean>(false);

  // Team diagnosis state
  const [diagEquipeMap, setDiagEquipeMap] = useState<
    Record<string, DiagnosticoAmpliadoResponse>
  >({});
  const [loadingEquipe, setLoadingEquipe] = useState<boolean>(false);

  // Expanders state
  const [openDescCompleta, setOpenDescCompleta] = useState(false);
  const [openDetalhamento9Eixos, setOpenDetalhamento9Eixos] = useState(false);
  const [openTodasSoftSkills, setOpenTodasSoftSkills] = useState(false);
  const [openOrigemRastreabilidade, setOpenOrigemRastreabilidade] =
    useState(false);
  const [openRankingSkillsEquipe, setOpenRankingSkillsEquipe] = useState(false);

  // Fetch individual diagnosis when in individual mode
  useEffect(() => {
    if (equipeSelNome !== "Nenhuma equipe selecionada") return;
    if (!talentoSelNome) return;

    let cancelled = false;
    setLoadingInd(true);
    const tObj = talentos.find((t) => t.nome === talentoSelNome);
    const dtParam = tObj?.data_nascimento
      ? `&data_nascimento=${encodeURIComponent(tObj.data_nascimento)}`
      : "";

    fetch(
      `/api/diagnostico-ampliado?nome=${encodeURIComponent(
        talentoSelNome
      )}${dtParam}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.diagnostico) {
          setDiagInd(data.diagnostico);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingInd(false);
      });

    return () => {
      cancelled = true;
    };
  }, [talentoSelNome, equipeSelNome, talentos]);

  // Fetch team batch diagnosis when a team is selected
  const selectedEquipeObj = useMemo(
    () => equipes.find((e) => e.nome === equipeSelNome) || null,
    [equipes, equipeSelNome]
  );

  const equipeMembrosTalentos = useMemo(() => {
    if (!selectedEquipeObj) return [];
    return selectedEquipeObj.membros.map((m) => {
      const found = talentos.find(
        (t) => t.nome.toLowerCase().trim() === m.nome.toLowerCase().trim()
      );
      if (found) return found;
      return {
        id: `eq-m-${m.nome}`,
        codigo: "10000000",
        nome: m.nome,
        email: "",
        data_nascimento: "01/01/1990",
        profissao: "Especialista",
        cargo: "Especialista",
        grupo: selectedEquipeObj.nome,
        departamento: selectedEquipeObj.departamento || "Geral",
        empresa: "Mundo Kan",
        status: "Ativo" as const,
        avatar: `/api/talentos/foto?nome=${encodeURIComponent(m.nome)}`,
        kan_numero: 9,
        kan_nome: "Finalidade" as const,
        estrutural: 1,
        direcionamento: 7,
        perfil_dominante: "Líder Realizador",
        perfis_lista: ["Líder"],
        categorias_lista: ["Realizador"],
        qualidades_lista: ["Execução", "Análise"],
        vertices_triangulo: [8, 4, 1] as [number, number, number],
        aderencia_vaga: 90,
        indicadores_perfil: [],
        soft_skills: [],
        ai_diagnosis: [],
      } satisfies TalentoProfile;
    });
  }, [selectedEquipeObj, talentos]);

  useEffect(() => {
    if (!selectedEquipeObj || equipeMembrosTalentos.length === 0) return;
    let cancelled = false;
    setLoadingEquipe(true);

    const nomesParam = equipeMembrosTalentos.map((m) => m.nome).join("||");
    fetch(`/api/diagnostico-ampliado?nomes=${encodeURIComponent(nomesParam)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.diagnosticos) {
          setDiagEquipeMap(data.diagnosticos);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingEquipe(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedEquipeObj, equipeMembrosTalentos]);

  const handleExportarAtributosCsv = () => {
    if (!diagInd?.detalhes_atributos_list?.length) return;
    const headers = [
      "Campo",
      "Valor",
      "Atributo Ampliado",
      "Perfil",
      "Categoria",
      "Eixo",
      "Polaridade",
      "Área de Suporte",
      "Soft Skills",
      "Risco Prioritário",
    ];
    const rows = diagInd.detalhes_atributos_list.map((r) =>
      headers
        .map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`)
        .join(";")
    );
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostico_ampliado_${diagInd.nome
      .toLowerCase()
      .replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Computed values for Individual Chart Cards
  const refMaxScore = useMemo(() => {
    if (!diagInd) return 800;
    const vals = Object.values(diagInd.score_eixos || {});
    return Math.max(...vals, 800);
  }, [diagInd]);

  const activeEixosRows = useMemo(() => {
    if (!diagInd) return [];
    return EIXOS_RESUMO_ORDEM.map((eNome) => ({
      nome: eNome,
      pts: diagInd.score_eixos[eNome] || 0,
    })).filter((r) => r.pts > 0);
  }, [diagInd]);

  const top8SoftSkills = useMemo(() => {
    if (!diagInd?.sorted_skills) return [];
    const pos = diagInd.sorted_skills.filter((s) => s[1] > 0).slice(0, 8);
    return pos.length > 0 ? pos : diagInd.sorted_skills.slice(0, 8);
  }, [diagInd]);

  const refMaxSk = useMemo(() => {
    if (!top8SoftSkills.length) return 600;
    return Math.max(...top8SoftSkills.map((s) => s[1]), 600, refMaxScore);
  }, [top8SoftSkills, refMaxScore]);

  const maxEixoVal = useMemo(() => {
    if (!diagInd) return 600;
    const vals = Object.values(diagInd.score_eixos || {});
    return Math.max(...vals, 600);
  }, [diagInd]);

  const eixoTopGeral = useMemo(() => {
    if (!diagInd) return { nome: "Resultado", pts: 0 };
    const entries = Object.entries(diagInd.score_eixos || {}).sort(
      (a, b) => b[1] - a[1]
    );
    return entries[0]
      ? { nome: entries[0][0], pts: entries[0][1] }
      : { nome: "Resultado", pts: 0 };
  }, [diagInd]);

  const talentoIndividualObj = useMemo(() => {
    return (
      talentos.find(
        (t) => normText(t.nome) === normText(diagInd?.nome || talentoSelNome)
      ) ||
      talentos.find((t) => t.nome === talentoSelNome) ||
      selectedTalento ||
      null
    );
  }, [talentos, diagInd, talentoSelNome, selectedTalento]);

  return (
    <div className="space-y-6">
      {/* Header idêntico ao app.mundokan */}
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          <Compass className="h-6 w-6 text-[#ea580c]" />
          <span>Diagnóstico Ampliado</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Cruzamento da base de <strong>Atributos Ampliados</strong> e{" "}
          <strong>Perfil/Categoria</strong> com os mapas calculados dos talentos
          e equipes.
        </p>
      </div>

      {/* Dual Selector: Equipe vs Talento Individual */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Selecione a equipe para diagnóstico comparativo:
          </label>
          <div className="relative">
            <input
              type="text"
              value={buscaEquipeDiag}
              onChange={(e) => {
                const v = e.target.value;
                setBuscaEquipeDiag(v);
                const terms = normText(v).split(/\s+/).filter(Boolean);
                if (terms.length === 0) return;
                const match = equipes.find((eq) =>
                  terms.every((t) => normText(eq.nome).includes(t))
                );
                if (match) setEquipeSelNome(match.nome);
              }}
              placeholder="Buscar equipe pelo nome..."
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 pr-8 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            />
            {buscaEquipeDiag && (
              <button
                type="button"
                onClick={() => setBuscaEquipeDiag("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Limpar busca de equipe"
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={equipeSelNome}
            onChange={(e) => setEquipeSelNome(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-3 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
          >
            <option value="Nenhuma equipe selecionada">
              Nenhuma equipe selecionada
            </option>
            {equipes
              .filter((eq) => {
                const terms = normText(buscaEquipeDiag).split(/\s+/).filter(Boolean);
                if (terms.length === 0 || eq.nome === equipeSelNome) return true;
                return terms.every((t) => normText(eq.nome).includes(t));
              })
              .map((eq) => (
              <option key={eq.id} value={eq.nome}>
                {eq.nome} ({eq.membros.length} membros)
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ou selecione um talento para diagnóstico individual:
          </label>
          <div className="relative">
            <input
              type="text"
              value={buscaTalentoDiag}
              disabled={equipeSelNome !== "Nenhuma equipe selecionada"}
              onChange={(e) => {
                const v = e.target.value;
                setBuscaTalentoDiag(v);
                const terms = normText(v).split(/\s+/).filter(Boolean);
                if (terms.length === 0) return;
                const match = talentos.find((t) =>
                  terms.every((term) => normText(t.nome).includes(term))
                );
                if (match) {
                  setTalentoSelNome(match.nome);
                  if (onSelectTalento) onSelectTalento(match);
                }
              }}
              placeholder="Buscar talento pelo nome..."
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 pr-8 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            />
            {buscaTalentoDiag && (
              <button
                type="button"
                onClick={() => setBuscaTalentoDiag("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Limpar busca de talento"
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={talentoSelNome}
            disabled={equipeSelNome !== "Nenhuma equipe selecionada"}
            onChange={(e) => {
              const val = e.target.value;
              setTalentoSelNome(val);
              const found = talentos.find((t) => t.nome === val);
              if (found && onSelectTalento) {
                onSelectTalento(found);
              }
            }}
            className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-3 text-xs font-medium text-slate-800 dark:text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
          >
            {talentos
              .filter((t) => {
                const terms = normText(buscaTalentoDiag).split(/\s+/).filter(Boolean);
                if (terms.length === 0 || t.nome === talentoSelNome) return true;
                return terms.every((term) => normText(t.nome).includes(term));
              })
              .map((t) => (
              <option key={t.id} value={t.nome}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="border-slate-200/80 dark:border-slate-800" />

      {/* =====================================================================
          MODO 1: DIAGNÓSTICO COMPARATIVO DE EQUIPE
         ===================================================================== */}
      {equipeSelNome !== "Nenhuma equipe selecionada" && selectedEquipeObj ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Users className="h-5 w-5 text-[#ea580c]" />
              <span>
                Diagnóstico Comparativo da Equipe:{" "}
                <strong className="text-[#ea580c]">
                  {selectedEquipeObj.nome}
                </strong>
              </span>
            </h3>
            {loadingEquipe && (
              <span className="text-xs text-slate-400 animate-pulse">
                Calculando matrizes da equipe...
              </span>
            )}
          </div>

          {/* 1. PERFIL COMPORTAMENTAL DA EQUIPE (Estilo Resumo do Diagnóstico Ampliado — Fundo Branco no Modo Claro) */}
          <div className="overflow-hidden rounded-xl border-[1.5px] border-[#fb923c] bg-white dark:bg-[#0d111d] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fb923c]/35 bg-[#fb923c]/[0.03] px-5 py-3.5">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[1.5px] text-[#f97316]">
                  PERFIL COMPORTAMENTAL — {selectedEquipeObj.nome}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Matriz executiva consolidada ({equipeMembrosTalentos.length}{" "}
                  membros vinculados)
                </p>
              </div>
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
                      const isLider = selectedEquipeObj.membros.find(
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
                  {/* Linha 1: Perfil Predominante */}
                  <tr className="border-b border-[#fb923c]/35">
                    <td className="border-r border-[#fb923c]/35 bg-[#fb923c]/[0.02] px-4 py-4 align-top">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Target className="h-4 w-4 shrink-0 text-[#38bdf8]" />
                        <span>Perfil Predominante</span>
                      </div>
                    </td>
                    {equipeMembrosTalentos.map((m, cIdx) => {
                      const d = diagEquipeMap[m.nome];
                      const isLastCol =
                        cIdx === equipeMembrosTalentos.length - 1;
                      return (
                        <td
                          key={m.id}
                          className={`p-4 align-top ${
                            !isLastCol ? "border-r border-[#fb923c]/35" : ""
                          }`}
                        >
                          <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                            {d?.perfil_predominante || m.perfil_dominante}
                          </div>
                          {d?.resumo && (
                            <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                              {d.resumo}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Linha 2: Forças Centrais */}
                  <tr className="border-b border-[#fb923c]/35">
                    <td className="border-r border-[#fb923c]/35 bg-[#fb923c]/[0.02] px-4 py-4 align-top">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Zap className="h-4 w-4 shrink-0 text-[#fbbf24]" />
                        <span>Forças Centrais</span>
                      </div>
                    </td>
                    {equipeMembrosTalentos.map((m, cIdx) => {
                      const d = diagEquipeMap[m.nome];
                      const isLastCol =
                        cIdx === equipeMembrosTalentos.length - 1;
                      return (
                        <td
                          key={m.id}
                          className={`p-4 align-top ${
                            !isLastCol ? "border-r border-[#fb923c]/35" : ""
                          }`}
                        >
                          <div className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                            {d?.forcas ||
                              "Liderança, resultados, execução, disciplina e persistência"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Linha 3: Contexto de Maior Aderência */}
                  <tr className="border-b border-[#fb923c]/35">
                    <td className="border-r border-[#fb923c]/35 bg-[#fb923c]/[0.02] px-4 py-4 align-top">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Compass className="h-4 w-4 shrink-0 text-[#34d399]" />
                        <span>Contexto de Maior Aderência</span>
                      </div>
                    </td>
                    {equipeMembrosTalentos.map((m, cIdx) => {
                      const d = diagEquipeMap[m.nome];
                      const isLastCol =
                        cIdx === equipeMembrosTalentos.length - 1;
                      return (
                        <td
                          key={m.id}
                          className={`p-4 align-top ${
                            !isLastCol ? "border-r border-[#fb923c]/35" : ""
                          }`}
                        >
                          <div className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                            {d?.contexto ||
                              "Projetos críticos, operações e implantação"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Linha 4: Risco Prioritário */}
                  <tr className="border-b border-[#fb923c]/35">
                    <td className="border-r border-[#fb923c]/35 bg-[#fb923c]/[0.02] px-4 py-4 align-top">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[#f87171]" />
                        <span>Risco Prioritário</span>
                      </div>
                    </td>
                    {equipeMembrosTalentos.map((m, cIdx) => {
                      const d = diagEquipeMap[m.nome];
                      const isLastCol =
                        cIdx === equipeMembrosTalentos.length - 1;
                      return (
                        <td
                          key={m.id}
                          className={`p-4 align-top ${
                            !isLastCol ? "border-r border-[#fb923c]/35" : ""
                          }`}
                        >
                          <div className="text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                            {d?.risco_prior ||
                              "Pressão Excessiva por Resultados e Centralização"}
                          </div>
                          {d?.desc_risco && (
                            <div className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {d.desc_risco}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Linha 5: Faixa Inferior KAN */}
                  <tr className="bg-[#fb923c]/[0.03]">
                    <td className="border-r border-[#fb923c]/35 px-4 py-4 align-top">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Cpu className="h-4 w-4 shrink-0 text-[#f97316]" />
                        <span>KAN</span>
                      </div>
                    </td>
                    {equipeMembrosTalentos.map((m, cIdx) => {
                      const d = diagEquipeMap[m.nome];
                      const isLastCol =
                        cIdx === equipeMembrosTalentos.length - 1;
                      return (
                        <td
                          key={m.id}
                          className={`p-4 align-top ${
                            !isLastCol ? "border-r border-[#fb923c]/35" : ""
                          }`}
                        >
                          <div className="text-base font-bold tracking-tight text-[#f97316]">
                            {d?.kan_nome || m.kan_nome.toUpperCase()}
                          </div>
                          {d?.kan_desc && (
                            <div className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {d.kan_desc}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. MAPA DE CALOR INTERATIVO — EIXOS COMPORTAMENTAIS DA EQUIPE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Mapa de Calor Interativo — Eixos Comportamentais da Equipe
              </CardTitle>
              <CardDescription className="text-xs">
                Intensidade comportamental por membro nos 9 eixos do Diagnóstico
                Ampliado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 pr-4 text-left font-bold text-slate-600 dark:text-slate-300">
                        Eixo Comportamental
                      </th>
                      {equipeMembrosTalentos.map((m) => (
                        <th
                          key={m.id}
                          className="px-2 py-2.5 text-center font-bold text-slate-700 dark:text-slate-200"
                        >
                          {m.nome.split(" ")[0]}
                        </th>
                      ))}
                      <th className="px-2 py-2.5 text-center font-extrabold text-[#ea580c]">
                        Média
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {EIXOS_RESUMO_ORDEM.map((eixo) => {
                      const scores = equipeMembrosTalentos.map(
                        (m) => diagEquipeMap[m.nome]?.score_eixos?.[eixo] ?? 0
                      );
                      const avg =
                        scores.length > 0
                          ? Math.round(
                              scores.reduce((a, b) => a + b, 0) / scores.length
                            )
                          : 0;
                      return (
                        <tr key={eixo}>
                          <td className="py-2 pr-4 font-semibold text-slate-700 dark:text-slate-200">
                            {eixo}
                          </td>
                          {scores.map((pts, idx) => {
                            const bg =
                              pts >= 450
                                ? "#009e3c"
                                : pts >= 300
                                ? "#42d374"
                                : pts >= 150
                                ? "#8ce2ad"
                                : "#e6f7ed";
                            const fg = pts >= 300 ? "#ffffff" : "#064e3b";
                            return (
                              <td key={idx} className="p-1.5 text-center">
                                <div
                                  style={{ backgroundColor: bg, color: fg }}
                                  className="mx-auto flex h-8 w-16 items-center justify-center rounded-lg font-bold shadow-2xs"
                                >
                                  {pts}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-1.5 text-center">
                            <div className="mx-auto flex h-8 w-16 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-800 font-extrabold">
                              {avg}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 3. TABELA 3: SOFT SKILLS PREDOMINANTES + TRIÂNGULOS HARMÔNICOS */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Tabela 3 — Comparativo com Soft Skills Predominantes
                </CardTitle>
                <CardDescription className="text-xs">
                  Top Soft Skills mapeadas por membro e eixo dominante
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="pb-2 font-semibold">Talento</th>
                        <th className="pb-2 font-semibold">Perfil Predominante</th>
                        <th className="pb-2 font-semibold">Eixo Dominante</th>
                        <th className="pb-2 font-semibold">
                          Soft Skills Predominantes (Top 5)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {equipeMembrosTalentos.map((m) => {
                        const d = diagEquipeMap[m.nome];
                        const eixosEntries = Object.entries(
                          d?.score_eixos || {}
                        ).sort((a, b) => b[1] - a[1]);
                        const topEixo = eixosEntries[0] || ["Resultado", 0];
                        const top5Sk = (d?.sorted_skills || [])
                          .filter((s) => s[1] > 0)
                          .slice(0, 5)
                          .map(([n, p]) => `${n} (${p} pts)`)
                          .join(", ");
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                            <td className="py-2.5 font-semibold">{m.nome}</td>
                            <td className="py-2.5">
                              {d?.perfil_predominante || m.perfil_dominante}
                            </td>
                            <td className="py-2.5 font-bold text-[#ea580c]">
                              {topEixo[0]} ({topEixo[1]} pts)
                            </td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-300">
                              {top5Sk || "N/D"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ranking Consolidado de Soft Skills da Equipe */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRankingSkillsEquipe(!openRankingSkillsEquipe)
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {openRankingSkillsEquipe ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                      Ver Ranking Consolidado de Soft Skills da Equipe
                    </span>
                  </button>
                  {openRankingSkillsEquipe && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b text-slate-500">
                            <th className="pb-2">Soft Skill</th>
                            <th className="pb-2">Pontuação Acumulada na Equipe</th>
                            <th className="pb-2">Membros com a Skill</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(() => {
                            const mapSk: Record<
                              string,
                              { pts: number; count: number }
                            > = {};
                            for (const m of equipeMembrosTalentos) {
                              const d = diagEquipeMap[m.nome];
                              for (const [sk, pts] of d?.sorted_skills || []) {
                                if (pts > 0) {
                                  if (!mapSk[sk])
                                    mapSk[sk] = { pts: 0, count: 0 };
                                  mapSk[sk].pts += pts;
                                  mapSk[sk].count += 1;
                                }
                              }
                            }
                            return Object.entries(mapSk)
                              .sort((a, b) => b[1].pts - a[1].pts)
                              .slice(0, 15)
                              .map(([sk, info]) => (
                                <tr key={sk}>
                                  <td className="py-2 font-medium">{sk}</td>
                                  <td className="py-2 font-bold text-[#ea580c]">
                                    {info.pts} pts
                                  </td>
                                  <td className="py-2 text-slate-500">
                                    {info.count} de {equipeMembrosTalentos.length}
                                  </td>
                                </tr>
                              ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-[#ea580c]" />
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
                    isLider: selectedEquipeObj.membros.find(
                      (em) => em.nome === m.nome
                    )?.lider,
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* =====================================================================
           MODO 2: DIAGNÓSTICO INDIVIDUAL DO TALENTO (IDÊNTICO AO APP.MUNDOKAN)
           ===================================================================== */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {talentoIndividualObj?.avatar ? (
                <img
                  src={talentoIndividualObj.avatar}
                  alt={diagInd?.nome || talentoSelNome}
                  className="h-12 w-12 rounded-full border-2 border-[#ea580c] object-cover shadow-xs shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#ea580c] bg-[#ea580c]/10 text-base font-bold text-[#ea580c] shadow-xs shrink-0">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Diagnóstico Individual:{" "}
                  <span className="text-[#ea580c]">
                    {diagInd?.nome || talentoSelNome}
                  </span>
                </h3>
                {talentoIndividualObj?.data_nascimento && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Nascimento:</span>
                    <strong className="text-slate-700 dark:text-slate-200">
                      {talentoIndividualObj.data_nascimento}
                    </strong>
                    {talentoIndividualObj.cargo && (
                      <>
                        <span>•</span>
                        <span>{talentoIndividualObj.cargo}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            {loadingInd && (
              <span className="text-xs text-slate-400 animate-pulse">
                Calculando diagnóstico ampliado...
              </span>
            )}
          </div>

          {diagInd && (
            <>
              {/* 1. BOX PARTIDO RESPONSIVO COM BORDA LARANJA (4 QUADRANTES + FAIXA INFERIOR KAN) */}
              <div className="overflow-hidden rounded-xl border-[1.5px] border-[#fb923c] bg-white dark:bg-[#0d111d] shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Quadrante Superior Esquerdo: Perfil Predominante */}
                  <div className="flex flex-col justify-center p-5 md:p-6 border-b border-[#fb923c]/35 md:border-r">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Target className="h-4 w-4 text-[#38bdf8]" />
                      <span>Perfil Predominante</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {diagInd.perfil_predominante}
                    </div>
                    {diagInd.resumo && (
                      <div className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {diagInd.resumo}
                      </div>
                    )}
                  </div>

                  {/* Quadrante Superior Direito: Forças Centrais */}
                  <div className="flex flex-col justify-center p-5 md:p-6 border-b border-[#fb923c]/35">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Zap className="h-4 w-4 text-[#fbbf24]" />
                      <span>Forças Centrais</span>
                    </div>
                    <div className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                      {diagInd.forcas}
                    </div>
                  </div>

                  {/* Quadrante Inferior Esquerdo: Contexto de Maior Aderência */}
                  <div className="flex flex-col justify-center p-5 md:p-6 border-b border-[#fb923c]/35 md:border-r">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Compass className="h-4 w-4 text-[#34d399]" />
                      <span>Contexto de Maior Aderência</span>
                    </div>
                    <div className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                      {diagInd.contexto}
                    </div>
                  </div>

                  {/* Quadrante Inferior Direito: Risco Prioritário */}
                  <div className="flex flex-col justify-center p-5 md:p-6 border-b border-[#fb923c]/35">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <AlertTriangle className="h-4 w-4 text-[#f87171]" />
                      <span>Risco Prioritário</span>
                    </div>
                    {diagInd.risco_prior && (
                      <div className="mb-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                        {diagInd.risco_prior}
                      </div>
                    )}
                    <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {diagInd.desc_risco}
                    </div>
                  </div>
                </div>

                {/* Faixa Inferior Total: KAN (Sem valores numéricos) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-[#fb923c]/[0.03] px-5 py-4 md:px-6">
                  <div className="min-w-[170px]">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Cpu className="h-4 w-4 text-[#f97316]" />
                      <span>KAN</span>
                    </div>
                    <div className="text-xl font-bold tracking-tight text-[#f97316]">
                      {diagInd.kan_nome}
                    </div>
                  </div>
                  <div className="flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 md:border-l md:border-[#fb923c]/25 md:pl-5">
                    {diagInd.kan_desc}
                  </div>
                </div>
              </div>

              {/* 2. EXPANDER: Ver Descrição Completa do Perfil */}
              {diagInd.desc_completa &&
                diagInd.desc_completa !== diagInd.resumo && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d111d]">
                    <button
                      type="button"
                      onClick={() => setOpenDescCompleta(!openDescCompleta)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {openDescCompleta ? (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                        Ver Descrição Completa do Perfil
                      </span>
                    </button>
                    {openDescCompleta && (
                      <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {diagInd.desc_completa}
                      </div>
                    )}
                  </div>
                )}

              <hr className="border-slate-200/80 dark:border-slate-800" />

              {/* 3. DOIS CARDS LADO A LADO: EIXOS COMPORTAMENTAIS & SOFT SKILLS PREDOMINANTES */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Card Esquerdo: Eixos Comportamentais */}
                <div className="w-full max-w-[420px] rounded-xl border-[1.2px] border-[#fb923c] bg-white dark:bg-[#0d111d] p-4 shadow-2xs">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Eixos Comportamentais
                  </div>
                  <div className="mb-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {activeEixosRows.length} eixos
                  </div>

                  <div className="space-y-2.5">
                    {activeEixosRows.length > 0 ? (
                      activeEixosRows.map((row) => {
                        const isHigh = row.pts >= 400;
                        const isMed = row.pts >= 100 && row.pts < 400;
                        const barColor = isHigh
                          ? "#f97316"
                          : isMed
                          ? "#eab308"
                          : "#ef4444";
                        const textColor = isHigh
                          ? "text-[#c2410c] dark:text-[#fb923c]"
                          : isMed
                          ? "text-[#a16207] dark:text-[#facc15]"
                          : "text-[#dc2626] dark:text-[#f87171]";
                        const pct = Math.min(
                          100,
                          Math.max(4, Math.round((row.pts / refMaxScore) * 100))
                        );
                        return (
                          <div key={row.nome}>
                            <div className="mb-1 flex items-baseline justify-between">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {row.nome}
                              </span>
                              <span
                                className={`text-[11px] font-bold ${textColor}`}
                              >
                                {row.pts} pts
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-400/15">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-3 text-xs text-slate-400">
                        Nenhum eixo mapeado com pontuação positiva.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Direito: Soft Skills Predominantes */}
                <div className="w-full max-w-[420px] rounded-xl border-[1.2px] border-[#38bdf8] bg-white dark:bg-[#0d111d] p-4 shadow-2xs">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Soft Skills Predominantes
                  </div>
                  <div className="mb-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Top 8 soft skills
                  </div>

                  <div className="space-y-2.5">
                    {top8SoftSkills.length > 0 ? (
                      top8SoftSkills.map(([skNome, skPts]) => {
                        const isHigh = skPts >= 400;
                        const isMed = skPts >= 100 && skPts < 400;
                        const barColor = isHigh
                          ? "#f97316"
                          : isMed
                          ? "#eab308"
                          : "#ef4444";
                        const textColor = isHigh
                          ? "text-[#c2410c] dark:text-[#fb923c]"
                          : isMed
                          ? "text-[#a16207] dark:text-[#facc15]"
                          : "text-[#dc2626] dark:text-[#f87171]";
                        const pct =
                          skPts >= 100
                            ? Math.min(
                                100,
                                Math.max(4, Math.round((skPts / refMaxSk) * 100))
                              )
                            : 4;
                        return (
                          <div key={skNome}>
                            <div className="mb-1 flex items-baseline justify-between gap-2">
                              <span
                                className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[230px]"
                                title={skNome}
                              >
                                {skNome}
                              </span>
                              <span
                                className={`shrink-0 text-[11px] font-bold ${textColor}`}
                              >
                                {skPts} pts
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-400/15">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-3 text-xs text-slate-400">
                        Nenhuma soft skill mapeada com pontuação positiva.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Caption de bonificação e legenda */}
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Pontuação consolidada com bonificação de maior peso (
                <strong>+{diagInd.maior_peso} pts</strong>) para os eixos
                predominantes (
                {diagInd.eixo_perfil_top && (
                  <>
                    Perfil <strong>{diagInd.perfil_top}</strong> ➔ Eixo{" "}
                    <strong>{diagInd.eixo_perfil_top}</strong> (+
                    {diagInd.maior_peso} pts)
                  </>
                )}
                {diagInd.eixo_perfil_top && diagInd.eixo_cat_top && " | "}
                {diagInd.eixo_cat_top && (
                  <>
                    Categoria <strong>{diagInd.cat_top}</strong> ➔ Eixo{" "}
                    <strong>{diagInd.eixo_cat_top}</strong> (+
                    {diagInd.maior_peso} pts)
                  </>
                )}
                ). Classificação:{" "}
                <strong>Alta (≥ 300 pts - Laranja)</strong>,{" "}
                <strong>Média (100 a 299 pts - Amarelo)</strong> e{" "}
                <strong>Baixa / 0 pts (Vermelho)</strong>.
              </p>

              {/* 4. EXPANDER: Ver Detalhamento dos 9 Eixos em Cards e Níveis (LIMITE DO MENU DIAGNÓSTICO) */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d111d]">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDetalhamento9Eixos(!openDetalhamento9Eixos)
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {openDetalhamento9Eixos ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                    Ver Detalhamento dos 9 Eixos em Cards e Níveis
                  </span>
                </button>

                {openDetalhamento9Eixos && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(diagInd.eixos_config || []).map((eItem) => {
                        const pts = diagInd.score_eixos[eItem.nome] || 0;
                        const isAlta = pts >= 300;
                        const isMedia = pts >= 100 && pts < 300;
                        const nivel = isAlta
                          ? "Alta"
                          : isMedia
                          ? "Média"
                          : "Baixa";
                        const badgeBg = isAlta
                          ? "rgba(16, 185, 129, 0.2)"
                          : isMedia
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(148, 163, 184, 0.15)";
                        const badgeText = isAlta
                          ? "#10b981"
                          : isMedia
                          ? "#f59e0b"
                          : "#64748b";
                        const barColorD = isAlta
                          ? "#10b981"
                          : isMedia
                          ? "#f59e0b"
                          : "#64748b";
                        const barPctD =
                          pts > 0
                            ? Math.min(
                                100,
                                Math.max(8, Math.round((pts / maxEixoVal) * 100))
                              )
                            : 4;

                        return (
                          <div
                            key={eItem.nome}
                            className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-4"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                {renderEixoIcon(
                                  eItem.icon_class,
                                  eItem.icon_color
                                )}
                                {eItem.nome}
                              </span>
                              <span
                                style={{
                                  backgroundColor: badgeBg,
                                  color: badgeText,
                                }}
                                className="rounded-xl px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                              >
                                {nivel}
                              </span>
                            </div>
                            <div className="mb-2.5 h-8 overflow-hidden text-xs leading-snug text-slate-500 dark:text-slate-400">
                              {eItem.desc}
                            </div>
                            <div className="mb-1.5 flex items-baseline justify-between">
                              <span
                                className="text-lg font-extrabold"
                                style={{ color: barColorD }}
                              >
                                {pts}{" "}
                                <span className="text-xs font-medium text-slate-400">
                                  pts
                                </span>
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800">
                              <div
                                className="h-full rounded-md transition-all duration-300"
                                style={{
                                  width: `${barPctD}%`,
                                  backgroundColor: barColorD,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================================
                  SEÇÕES EXCLUSIVAS DO PAINEL DE CONTROLE (ADMIN MASTER)
                  1. Ver Todas as Soft Skills Mapeadas e Pontuações
                  2. Pontuação de Eixos (Diagnóstico Ampliado)
                  3. Ver Origem e Rastreabilidade Completa dos Eixos
                 ================================================================= */}
              {showAdminSections && (
                <div className="space-y-6 pt-2">
                  {/* 5. EXPANDER ADMIN: Ver Todas as Soft Skills Mapeadas e Pontuações */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d111d]">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenTodasSoftSkills(!openTodasSoftSkills)
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {openTodasSoftSkills ? (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                        Ver Todas as Soft Skills Mapeadas e Pontuações
                      </span>
                    </button>

                    {openTodasSoftSkills && (
                      <div className="border-t border-slate-200 dark:border-slate-800 p-4 overflow-x-auto">
                        {diagInd.sorted_skills?.length > 0 ? (
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                                <th className="pb-2 font-semibold">
                                  Soft Skill
                                </th>
                                <th className="pb-2 font-semibold">
                                  Pontuação Acumulada
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {diagInd.sorted_skills.map(([sk, pts]) => (
                                <tr key={sk}>
                                  <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                                    {sk}
                                  </td>
                                  <td className="py-2 font-mono font-bold text-[#ea580c]">
                                    {pts}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-xs text-slate-400">
                            Nenhuma soft skill diretamente mapeada para os
                            atributos deste perfil.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-200/80 dark:border-slate-800" />

                  {/* 6. SEÇÃO ADMIN: Pontuação de Eixos (Diagnóstico Ampliado) */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                      <BarChart2 className="h-5 w-5 text-[#ea580c]" />
                      <span>Pontuação de Eixos (Diagnóstico Ampliado)</span>
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d111d]">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                            <th className="px-3 py-2.5 font-bold">Eixo</th>
                            {(diagInd.colunas_eixos_score || []).map((col) => (
                              <th
                                key={col}
                                className="px-2.5 py-2.5 text-right font-semibold whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                            <th className="px-3 py-2.5 text-right font-extrabold text-[#ea580c]">
                              TOTAL
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {Object.entries(diagInd.score_eixos_matrix || {}).map(
                            ([eixoNome, rowVals]) => (
                              <tr
                                key={eixoNome}
                                className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                              >
                                <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  {eixoNome}
                                </td>
                                {(diagInd.colunas_eixos_score || []).map(
                                  (col) => {
                                    const val = rowVals[col] || 0;
                                    return (
                                      <td
                                        key={col}
                                        className={`px-2.5 py-2 text-right font-mono ${
                                          val > 0
                                            ? "font-bold text-slate-900 dark:text-white"
                                            : "text-slate-400"
                                        }`}
                                      >
                                        {val}
                                      </td>
                                    );
                                  }
                                )}
                                <td className="px-3 py-2 text-right font-mono font-extrabold text-[#ea580c]">
                                  {rowVals.TOTAL || 0}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong>Eixo com maior pontuação geral:</strong>{" "}
                      <strong>{eixoTopGeral.nome}</strong> ({eixoTopGeral.pts}{" "}
                      pts). A pontuação consolida os atributos mapeados em cada
                      campo e adiciona a bonificação de maior peso (+
                      {diagInd.maior_peso} pts) para o Perfil Predominante (
                      <strong>{diagInd.perfil_top}</strong> ➔{" "}
                      <strong>{diagInd.eixo_perfil_top || "N/D"}</strong>) e
                      Categoria Predominante (<strong>{diagInd.cat_top}</strong>{" "}
                      ➔ <strong>{diagInd.eixo_cat_top || "N/D"}</strong>).
                    </p>
                  </div>

                  {/* 7. EXPANDER ADMIN: Ver Origem e Rastreabilidade Completa dos Eixos */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d111d]">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenOrigemRastreabilidade(!openOrigemRastreabilidade)
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {openOrigemRastreabilidade ? (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                        Ver Origem e Rastreabilidade Completa dos Eixos
                      </span>
                    </button>

                    {openOrigemRastreabilidade && (
                      <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-6">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                                <th className="pb-2 pr-3 font-semibold">Eixo</th>
                                <th className="pb-2 pr-3 font-semibold">
                                  Origem
                                </th>
                                <th className="pb-2 pr-3 font-semibold">
                                  Valor Mapa
                                </th>
                                <th className="pb-2 pr-3 font-semibold">
                                  Atributo
                                </th>
                                <th className="pb-2 pr-3 font-semibold">
                                  Perfil Mapeado
                                </th>
                                <th className="pb-2 pr-3 font-semibold">
                                  Categoria Mapeada
                                </th>
                                <th className="pb-2 text-right font-semibold">
                                  Pontos
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {(diagInd.origens_eixos_list || []).map(
                                (item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2 pr-3 font-bold text-slate-800 dark:text-slate-200">
                                      {item.Eixo}
                                    </td>
                                    <td className="py-2 pr-3">{item.Origem}</td>
                                    <td className="py-2 pr-3 font-mono">
                                      {item["Valor Mapa"]}
                                    </td>
                                    <td className="py-2 pr-3">
                                      {item.Atributo}
                                    </td>
                                    <td className="py-2 pr-3">
                                      {item["Perfil Mapeado"]}
                                    </td>
                                    <td className="py-2 pr-3">
                                      {item["Categoria Mapeada"]}
                                    </td>
                                    <td className="py-2 text-right font-mono font-bold text-[#ea580c]">
                                      {item.Pontos}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pontuação de Perfil (Atributos Ampliado) */}
                        <div className="space-y-2 pt-2">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                            <UserCheck className="h-4 w-4 text-[#ea580c]" />
                            <span>
                              Pontuação de Perfil (Atributos Ampliado)
                            </span>
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
                                  <th className="px-2.5 py-2 font-bold">
                                    Perfil
                                  </th>
                                  {(diagInd.colunas_score || []).map((c) => (
                                    <th
                                      key={c}
                                      className="px-2 py-2 text-right font-semibold whitespace-nowrap"
                                    >
                                      {c}
                                    </th>
                                  ))}
                                  <th className="px-2.5 py-2 text-right font-extrabold text-[#ea580c]">
                                    TOTAL
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {Object.entries(
                                  diagInd.score_perf_matrix || {}
                                ).map(([perf, rVals]) => (
                                  <tr key={perf}>
                                    <td className="px-2.5 py-1.5 font-bold">
                                      {perf}
                                    </td>
                                    {(diagInd.colunas_score || []).map((c) => (
                                      <td
                                        key={c}
                                        className="px-2 py-1.5 text-right font-mono"
                                      >
                                        {rVals[c] || 0}
                                      </td>
                                    ))}
                                    <td className="px-2.5 py-1.5 text-right font-mono font-extrabold text-[#ea580c]">
                                      {rVals.TOTAL || 0}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pontuação de Categoria (Atributos Ampliado) */}
                        <div className="space-y-2 pt-2">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                            <Award className="h-4 w-4 text-[#ea580c]" />
                            <span>
                              Pontuação de Categoria (Atributos Ampliado)
                            </span>
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
                                  <th className="px-2.5 py-2 font-bold">
                                    Categoria
                                  </th>
                                  {(diagInd.colunas_score || []).map((c) => (
                                    <th
                                      key={c}
                                      className="px-2 py-2 text-right font-semibold whitespace-nowrap"
                                    >
                                      {c}
                                    </th>
                                  ))}
                                  <th className="px-2.5 py-2 text-right font-extrabold text-[#ea580c]">
                                    TOTAL
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {Object.entries(
                                  diagInd.score_cat_matrix || {}
                                ).map(([cat, rVals]) => (
                                  <tr key={cat}>
                                    <td className="px-2.5 py-1.5 font-bold">
                                      {cat}
                                    </td>
                                    {(diagInd.colunas_score || []).map((c) => (
                                      <td
                                        key={c}
                                        className="px-2 py-1.5 text-right font-mono"
                                      >
                                        {rVals[c] || 0}
                                      </td>
                                    ))}
                                    <td className="px-2.5 py-1.5 text-right font-mono font-extrabold text-[#ea580c]">
                                      {rVals.TOTAL || 0}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Detalhamento dos Atributos Ampliados do Talento */}
                        <div className="space-y-2 pt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                              <FileText className="h-4 w-4 text-[#ea580c]" />
                              <span>
                                Detalhamento dos Atributos Ampliados do Talento
                              </span>
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleExportarAtributosCsv}
                            >
                              <Download className="mr-1.5 h-3.5 w-3.5 text-[#ea580c]" />
                              Exportar Diagnóstico Ampliado em CSV
                            </Button>
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
                                  <th className="px-2.5 py-2 font-bold">
                                    Campo
                                  </th>
                                  <th className="px-2 py-2 font-bold">Valor</th>
                                  <th className="px-2.5 py-2 font-bold">
                                    Atributo Ampliado
                                  </th>
                                  <th className="px-2.5 py-2 font-bold">
                                    Perfil
                                  </th>
                                  <th className="px-2.5 py-2 font-bold">
                                    Categoria
                                  </th>
                                  <th className="px-2.5 py-2 font-bold">Eixo</th>
                                  <th className="px-2.5 py-2 font-bold">
                                    Polaridade
                                  </th>
                                  <th className="px-2.5 py-2 font-bold">
                                    Soft Skills
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {(diagInd.detalhes_atributos_list || []).map(
                                  (attr, idx) => (
                                    <tr key={idx}>
                                      <td className="px-2.5 py-1.5 font-semibold whitespace-nowrap">
                                        {attr.Campo}
                                      </td>
                                      <td className="px-2 py-1.5 font-mono font-bold text-[#ea580c]">
                                        {attr.Valor}
                                      </td>
                                      <td className="px-2.5 py-1.5">
                                        {attr["Atributo Ampliado"]}
                                      </td>
                                      <td className="px-2.5 py-1.5 font-semibold">
                                        {attr.Perfil}
                                      </td>
                                      <td className="px-2.5 py-1.5">
                                        {attr.Categoria}
                                      </td>
                                      <td className="px-2.5 py-1.5 font-bold text-[#510851] dark:text-purple-300">
                                        {attr.Eixo}
                                      </td>
                                      <td className="px-2.5 py-1.5">
                                        <Badge
                                          variant={
                                            attr.Polaridade === "POSITIVA"
                                              ? "success"
                                              : "secondary"
                                          }
                                          className="text-[10px]"
                                        >
                                          {attr.Polaridade}
                                        </Badge>
                                      </td>
                                      <td className="px-2.5 py-1.5 text-slate-500 max-w-xs truncate">
                                        {attr["Soft Skills"]}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
