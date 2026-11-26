"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Briefcase,
  Sparkles,
  UserCheck,
  UsersRound,
  Building2,
  Crown,
  SlidersHorizontal,
  Trash2,
  CheckCircle2,
  Award,
  Save,
  Loader2,
  History,
  Eye,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { KanTrianglesSvg } from "@/components/kan-triangles-svg";
import {
  EMPRESAS_TENANT,
  DEPARTAMENTOS_OPCOES,
  KAN_OPCOES,
  PERFIS_OPCOES,
  CATEGORIAS_OPCOES,
  QUALIDADES_OPCOES,
  SOFT_SKILLS_OPCOES,
  getScoresEixos,
  type VagaData,
  type AnaliseHarmoniaItem,
  type TalentoProfile,
  type EquipeData,
} from "@/lib/mock-data";

const normText = (s?: string | null) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function getHeatTierStyle(pts: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (pts >= 600) return { bg: "#009e3c", text: "#ffffff", label: "Muito Alto" };
  if (pts >= 450) return { bg: "#42d374", text: "#052e16", label: "Alto" };
  if (pts >= 300) return { bg: "#8ce2ad", text: "#064e3b", label: "Médio" };
  if (pts >= 150) return { bg: "#c3eed4", text: "#065f46", label: "Discreto" };
  return { bg: "#e6f7ed", text: "#065f46", label: "Inicial" };
}

interface MatchRankServerItem {
  talento_id: string;
  aderenciaPct: number;
  totalPts: number;
  tierLabel: string;
  tierBadgeVariant: "secondary" | "orange" | "success";
  ptsKan: number;
  ptsPerfil: number;
  ptsSoft: number;
  ptsQual: number;
  kanStatus: string;
  perfilStatus: string;
  softStatus: string;
  catStatus: string;
  qualStatus: string;
  scoresEixos: Record<string, number>;
}

interface HarmoniaAlerta {
  severidade: "critico" | "atencao";
  talentoA?: string;
  talentoB?: string;
  mesmoKan?: boolean;
  texto: string;
}

interface HarmoniaCriterio {
  titulo: string;
  nota: string;
  pts?: number;
  sub: string;
}

interface HarmoniaResultado {
  totalPts: number;
  maxPts: number;
  scorePct: number;
  classificacao: string;
  alertas: HarmoniaAlerta[];
  temSobreposicaoTotal: boolean;
  temSobreposicaoMesmoKan: boolean;
  criterios: HarmoniaCriterio[];
}

export function ProcessoSeletivoView({
  vagas,
  setVagas,
  talentos,
  equipes,
  selectedVagaId,
  setSelectedVagaId,
  onInspectTalento,
  onGoToVagas,
}: {
  vagas: VagaData[];
  setVagas: React.Dispatch<React.SetStateAction<VagaData[]>>;
  talentos: TalentoProfile[];
  equipes: EquipeData[];
  selectedVagaId: number;
  setSelectedVagaId: (id: number) => void;
  onInspectTalento: (t: TalentoProfile) => void;
  onGoToVagas: () => void;
}) {
  // Navegação em 2 telas: Hub Resumido -> Workspace do Processo
  const [screen, setScreen] = useState<"hub" | "processo">("hub");
  const [activeMode, setActiveMode] = useState<
    "ranking" | "harmonia" | "shortlist_final"
  >("ranking");

  // Estado do Modo 3 (Shortlist Final — Seleção e Fechamento/Reabertura)
  const [candidatoEmSelecao, setCandidatoEmSelecao] = useState<string>("");
  const [isSavingCandidatoSelecionado, setIsSavingCandidatoSelecionado] =
    useState(false);

  // Filtros do Hub
  const [hubBusca, setHubBusca] = useState("");
  const [hubEmpresa, setHubEmpresa] = useState("Todas");

  // Estado do Modo 1 (Ranking — Pontuação Mapa de Calor)
  const [minPontos, setMinPontos] = useState<number>(300);
  const [buscaRanking, setBuscaRanking] = useState("");
  const [visibleRankingCount, setVisibleRankingCount] = useState(10);
  const [matchResultsMap, setMatchResultsMap] = useState<
    Record<string, MatchRankServerItem>
  >({});
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Estado de Ajustes de Requisitos (recolhível)
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [novaQualidade, setNovaQualidade] = useState("");
  const [novaSoftSkill, setNovaSoftSkill] = useState("");
  const [isSavingRequisitos, setIsSavingRequisitos] = useState(false);

  // Estado do Modo 2 (Harmonia de Equipe — Short List 1 a 1)
  const [harmoniaTargetMode, setHarmoniaTargetMode] = useState<
    "equipe" | "departamento"
  >("equipe");
  const [selectedEquipeNome, setSelectedEquipeNome] = useState<string>(
    equipes[0]?.nome || ""
  );
  const [selectedDeptNome, setSelectedDeptNome] = useState<string>(
    DEPARTAMENTOS_OPCOES[0]
  );
  const [departamentosHierarquia, setDepartamentosHierarquia] = useState<
    { departamento_id: string; nome: string; empresa?: string }[]
  >([]);
  const [shortlistHarmoniaMap, setShortlistHarmoniaMap] = useState<
    Record<string, HarmoniaResultado>
  >({});
  const [loadingHarmonia, setLoadingHarmonia] = useState(false);
  const [activeHarmoniaIdx, setActiveHarmoniaIdx] = useState(0);
  const [obsAnalista, setObsAnalista] = useState("");
  const [showHistorico, setShowHistorico] = useState(false);
  const [isSavingHarmonia, setIsSavingHarmonia] = useState(false);
  const [isAllocatingCandidato, setIsAllocatingCandidato] = useState(false);

  // Feedbacks
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const vagaAtiva = useMemo(
    () => vagas.find((v) => v.id === selectedVagaId) || vagas[0] || null,
    [vagas, selectedVagaId]
  );

  // Carregar departamentos reais do organograma
  useEffect(() => {
    fetch("/api/empresas")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.hierarquia)) {
          setDepartamentosHierarquia(res.hierarquia);
        }
      })
      .catch(() => {});
  }, []);

  // Sincronizar equipe/departamento padrão quando muda a vaga ativa
  useEffect(() => {
    if (!vagaAtiva) return;
    setVisibleRankingCount(10);
    setActiveHarmoniaIdx(0);
    setCandidatoEmSelecao(vagaAtiva.candidato_selecionado || "");
    const eqAssociada = equipes.find(
      (e) => e.nome === vagaAtiva.equipe_associada
    );
    const eqPadrao = eqAssociada?.nome || equipes[0]?.nome || "";
    setSelectedEquipeNome(eqPadrao);
    if (vagaAtiva.departamento) {
      setSelectedDeptNome(vagaAtiva.departamento);
    }
    if (!vagaAtiva.equipe_associada && vagaAtiva.departamento) {
      setHarmoniaTargetMode("departamento");
    } else if (vagaAtiva.equipe_associada) {
      setHarmoniaTargetMode("equipe");
    }
  }, [vagaAtiva?.id, vagaAtiva?.candidato_selecionado, equipes]);

  // Calcular Ranking (Mapa de Calor) exclusivamente no container mam-kantechrh
  useEffect(() => {
    let active = true;
    if (screen !== "processo" || !vagaAtiva || talentos.length === 0) return;

    setLoadingMatch(true);
    fetch("/api/calculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "calcular-match-vaga",
        payload: {
          vaga: {
            id: vagaAtiva.id,
            kan_ideal: vagaAtiva.kan_ideal || [],
            perfis_ideais: vagaAtiva.perfis_ideais || [],
            soft_skills_ideais: vagaAtiva.soft_skills_ideais || [],
            qualidades_ideais: vagaAtiva.qualidades_ideais || [],
            categorias_ideais: vagaAtiva.categorias_ideais || [],
          },
          talentos: talentos.map((t) => ({
            id: t.id,
            nome: t.nome,
            kan_nome: t.kan_nome,
            perfis_lista: t.perfis_lista,
            qualidades_lista: t.qualidades_lista,
            categorias_lista: t.categorias_lista,
            scores_eixos: t.scores_eixos,
          })),
        },
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (active && res.success && Array.isArray(res.result?.resultados)) {
          const map: Record<string, MatchRankServerItem> = {};
          for (const item of res.result.resultados) {
            map[item.talento_id] = item;
          }
          setMatchResultsMap(map);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingMatch(false);
      });

    return () => {
      active = false;
    };
  }, [
    screen,
    vagaAtiva?.id,
    vagaAtiva?.kan_ideal,
    vagaAtiva?.perfis_ideais,
    vagaAtiva?.soft_skills_ideais,
    vagaAtiva?.qualidades_ideais,
    vagaAtiva?.categorias_ideais,
    talentos,
  ]);

  // Opções unificadas de Departamentos
  const opcoesDepartamentos = useMemo(
    () =>
      Array.from(
        new Set(
          [
            vagaAtiva?.departamento,
            ...departamentosHierarquia.map((d) => d.nome),
            ...DEPARTAMENTOS_OPCOES,
            ...talentos
              .map((t) => (t.departamento || "").trim())
              .filter((d) => d && !d.startsWith("dept-")),
          ].filter(Boolean) as string[]
        )
      ),
    [vagaAtiva?.departamento, departamentosHierarquia, talentos]
  );

  // Resolver membros do Alvo da Harmonia (Equipe ou Departamento)
  const equipeSelecionadaObj = useMemo(
    () =>
      equipes.find((e) => e.nome === selectedEquipeNome) || equipes[0] || null,
    [equipes, selectedEquipeNome]
  );

  const deptoHierarquiaAtivo = useMemo(
    () =>
      departamentosHierarquia.find(
        (d) =>
          normText(d.nome) === normText(selectedDeptNome) ||
          normText(d.departamento_id) === normText(selectedDeptNome)
      ),
    [departamentosHierarquia, selectedDeptNome]
  );

  const membrosDaEquipe = useMemo(() => {
    return (equipeSelecionadaObj?.membros || [])
      .map((m) => {
        const info = talentos.find((t) => t.nome === m.nome);
        if (!info) return null;
        return { talento: info, isLider: Boolean(m.lider) };
      })
      .filter(Boolean) as { talento: TalentoProfile; isLider: boolean }[];
  }, [equipeSelecionadaObj, talentos]);

  const membrosDoDepartamento = useMemo(() => {
    return talentos
      .filter((t) => {
        const tDept = normText(t.departamento);
        if (!tDept) return false;
        if (tDept === normText(selectedDeptNome)) return true;
        if (
          deptoHierarquiaAtivo &&
          (tDept === normText(deptoHierarquiaAtivo.departamento_id) ||
            tDept === normText(deptoHierarquiaAtivo.nome))
        ) {
          return true;
        }
        return false;
      })
      .map((t, idx) => {
        const cNorm = normText(`${t.cargo || ""} ${t.profissao || ""}`);
        const isLider =
          cNorm.includes("diretor") ||
          cNorm.includes("head") ||
          cNorm.includes("gerente") ||
          cNorm.includes("ceo") ||
          cNorm.includes("coordenador") ||
          t.perfis_lista.includes("Lider") ||
          idx === 0;
        return { talento: t, isLider };
      });
  }, [talentos, selectedDeptNome, deptoHierarquiaAtivo]);

  const alvoMembrosAtuais =
    harmoniaTargetMode === "departamento"
      ? membrosDoDepartamento
      : membrosDaEquipe;

  const alvoNomeExibicao =
    harmoniaTargetMode === "departamento"
      ? selectedDeptNome
      : equipeSelecionadaObj?.nome || "Selecione uma Equipe";

  const alvoRotuloSalvo =
    harmoniaTargetMode === "departamento"
      ? `Depto: ${selectedDeptNome}`
      : `Equipe: ${equipeSelecionadaObj?.nome || "Geral"}`;

  // Talentos do Short List da vaga ativa
  const shortlistTalentos = useMemo(() => {
    if (!vagaAtiva) return [];
    const nomes = vagaAtiva.candidatos_associados || [];
    return talentos.filter((t) => nomes.includes(t.nome));
  }, [vagaAtiva, talentos]);

  // Ranking ordenado (Modo 1)
  const todosRankeados = useMemo(() => {
    return talentos
      .map((t) => {
        const m = matchResultsMap[t.id];
        return {
          talento: t,
          aderenciaPct: m?.aderenciaPct ?? 0,
          totalPts: m?.totalPts ?? 0,
          tierLabel: m?.tierLabel ?? (loadingMatch ? "Calculando..." : "Inicial"),
          kanStatus: m?.kanStatus ?? "—",
          perfilStatus: m?.perfilStatus ?? "—",
          softStatus: m?.softStatus ?? "—",
          qualStatus: m?.qualStatus ?? "—",
          scoresEixos: m?.scoresEixos ?? getScoresEixos(t),
        };
      })
      .sort((a, b) => b.totalPts - a.totalPts);
  }, [talentos, matchResultsMap, loadingMatch]);

  // Candidatos base para o Shortlist Final (usa Short List marcado ou Top 10 do Ranking se nenhum marcado)
  const shortlistFinalCandidatosBase = useMemo(() => {
    if (shortlistTalentos.length > 0) {
      return shortlistTalentos;
    }
    return todosRankeados.slice(0, 10).map((r) => r.talento);
  }, [shortlistTalentos, todosRankeados]);

  // Lista unificada de candidatos para cálculo de Harmonia (Modo 2 + Modo 3)
  const candidatosParaCalculoHarmonia = useMemo(() => {
    if (activeMode === "shortlist_final") {
      return shortlistFinalCandidatosBase;
    }
    return shortlistTalentos;
  }, [activeMode, shortlistFinalCandidatosBase, shortlistTalentos]);

  const alvoMembrosKey = alvoMembrosAtuais.map((m) => m.talento.id).join(",");
  const shortlistKey = candidatosParaCalculoHarmonia
    .map((t) => t.id)
    .join(",");

  // Calcular Harmonia de toda a Short List em lote no container mam-kantechrh
  useEffect(() => {
    let active = true;
    if (
      screen !== "processo" ||
      (activeMode !== "harmonia" && activeMode !== "shortlist_final") ||
      candidatosParaCalculoHarmonia.length === 0
    ) {
      return;
    }

    setLoadingHarmonia(true);
    fetch("/api/calculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "calcular-harmonia-shortlist",
        payload: {
          membros_atuais: alvoMembrosAtuais.map((m) => ({
            id: m.talento.id,
            nome: m.talento.nome,
            kan_nome: m.talento.kan_nome,
            vertices_triangulo: m.talento.vertices_triangulo,
            scores_eixos: m.talento.scores_eixos,
          })),
          candidatos: candidatosParaCalculoHarmonia.map((t) => ({
            id: t.id,
            nome: t.nome,
            kan_nome: t.kan_nome,
            vertices_triangulo: t.vertices_triangulo,
            scores_eixos: t.scores_eixos,
          })),
        },
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (active && res.success && Array.isArray(res.result?.resultados)) {
          const map: Record<string, HarmoniaResultado> = {};
          for (const item of res.result.resultados) {
            if (item.id && item.harmonia) {
              map[item.id] = item.harmonia as HarmoniaResultado;
            }
          }
          setShortlistHarmoniaMap((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingHarmonia(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeMode, alvoMembrosKey, shortlistKey]);

  const rankingFiltrado = useMemo(() => {
    const q = normText(buscaRanking);
    return todosRankeados.filter((r) => {
      if (r.totalPts < minPontos) return false;
      if (!q) return true;
      const tokens = q.split(/\s+/).filter(Boolean);
      const searchable = normText(
        `${r.talento.nome} ${r.talento.cargo} ${r.talento.profissao} ${r.talento.departamento} ${r.talento.kan_nome}`
      );
      return tokens.every((tk) => searchable.includes(tk));
    });
  }, [todosRankeados, minPontos, buscaRanking]);

  // Short List ranqueada por Harmonia (Modo 2)
  const shortlistOrdenada = useMemo(() => {
    return shortlistTalentos
      .map((t) => {
        const harm = shortlistHarmoniaMap[t.id];
        const rank = matchResultsMap[t.id];
        return {
          talento: t,
          rankingPts: rank?.totalPts ?? 0,
          harmonia: harm || {
            totalPts: 0,
            maxPts: 550,
            scorePct: 0,
            classificacao: loadingHarmonia ? "Calculando..." : "Aguardando",
            alertas: [],
            temSobreposicaoTotal: false,
            temSobreposicaoMesmoKan: false,
            criterios: [
              { titulo: "Complementariedade", nota: "—", pts: 0, sub: "Calculando..." },
              { titulo: "Integração Geométrica", nota: "—", pts: 0, sub: "Calculando..." },
              { titulo: "Balanceamento", nota: "—", pts: 0, sub: "Calculando..." },
              { titulo: "Tração Operacional", nota: "—", pts: 0, sub: "Calculando..." },
              { titulo: "Segurança Relacional", nota: "—", pts: 0, sub: "Calculando..." },
            ],
          },
        };
      })
      .sort((a, b) => {
        const penA = a.harmonia.temSobreposicaoMesmoKan ? 0 : 1;
        const penB = b.harmonia.temSobreposicaoMesmoKan ? 0 : 1;
        if (penA !== penB) return penB - penA;
        return b.harmonia.totalPts - a.harmonia.totalPts;
      });
  }, [shortlistTalentos, shortlistHarmoniaMap, matchResultsMap, loadingHarmonia]);

  const safeHarmoniaIdx =
    shortlistOrdenada.length > 0
      ? Math.min(activeHarmoniaIdx, shortlistOrdenada.length - 1)
      : 0;
  const candAtualItem = shortlistOrdenada[safeHarmoniaIdx] || null;
  const melhorHarmoniaId =
    shortlistOrdenada[0] && !shortlistOrdenada[0].harmonia.temSobreposicaoMesmoKan
      ? shortlistOrdenada[0].talento.id
      : null;

  // Indica se há Equipe ou Departamento com integrantes associado para compor o Shortlist Final
  const temGrupoAssociado = Boolean(
    (vagaAtiva?.equipe_associada || vagaAtiva?.departamento) &&
      alvoMembrosAtuais.length > 0
  );

  // Shortlist Final consolidada: maiores pontuadores no Ranking + Harmonia de Equipe/Departamento (quando houver)
  const shortlistFinalOrdenada = useMemo(() => {
    return shortlistFinalCandidatosBase
      .map((t) => {
        const rank = matchResultsMap[t.id];
        const harm = shortlistHarmoniaMap[t.id];
        const rankingPts = rank?.totalPts ?? 0;
        const harmoniaObj: HarmoniaResultado = harm || {
          totalPts: 0,
          maxPts: 550,
          scorePct: 0,
          classificacao: loadingHarmonia ? "Calculando..." : "Aguardando",
          alertas: [],
          temSobreposicaoTotal: false,
          temSobreposicaoMesmoKan: false,
          criterios: [],
        };
        const harmoniaPts = temGrupoAssociado ? harmoniaObj.totalPts : 0;
        const totalCombinadoPts = temGrupoAssociado
          ? rankingPts + harmoniaPts
          : rankingPts;

        return {
          talento: t,
          rankingPts,
          aderenciaPct: rank?.aderenciaPct ?? 0,
          tierLabel: rank?.tierLabel ?? "Inicial",
          perfilStatus: rank?.perfilStatus ?? "—",
          softStatus: rank?.softStatus ?? "—",
          harmonia: harmoniaObj,
          harmoniaPts,
          totalCombinadoPts,
          inShortlistManual: (vagaAtiva?.candidatos_associados || []).includes(
            t.nome
          ),
        };
      })
      .sort((a, b) => {
        if (temGrupoAssociado) {
          const penA = a.harmonia.temSobreposicaoMesmoKan ? 0 : 1;
          const penB = b.harmonia.temSobreposicaoMesmoKan ? 0 : 1;
          if (penA !== penB) return penB - penA;
        }
        if (b.totalCombinadoPts !== a.totalCombinadoPts) {
          return b.totalCombinadoPts - a.totalCombinadoPts;
        }
        return b.rankingPts - a.rankingPts;
      });
  }, [
    shortlistFinalCandidatosBase,
    matchResultsMap,
    shortlistHarmoniaMap,
    loadingHarmonia,
    temGrupoAssociado,
    vagaAtiva?.candidatos_associados,
  ]);

  const melhorRankingFinalId = useMemo(() => {
    if (shortlistFinalOrdenada.length === 0) return null;
    const sorted = [...shortlistFinalOrdenada].sort(
      (a, b) => b.rankingPts - a.rankingPts
    );
    return sorted[0]?.rankingPts > 0 ? sorted[0].talento.id : null;
  }, [shortlistFinalOrdenada]);

  const melhorHarmoniaFinalId = useMemo(() => {
    if (!temGrupoAssociado || shortlistFinalOrdenada.length === 0) return null;
    const valid = shortlistFinalOrdenada.filter(
      (i) => !i.harmonia.temSobreposicaoMesmoKan && i.harmoniaPts > 0
    );
    const sorted = [...valid].sort((a, b) => b.harmoniaPts - a.harmoniaPts);
    return sorted[0]?.talento.id || null;
  }, [shortlistFinalOrdenada, temGrupoAssociado]);

  // Helpers de persistência
  const showToast = (msg: string, ms = 4000) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), ms);
  };

  const persistirVagaNoBanco = async (vagaAtualizada: VagaData, silent = false) => {
    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vagaAtualizada),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar alterações da vaga.");
      }
      if (!silent) {
        showToast("💾 Alterações salvas no Supabase com sucesso!");
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        showToast("❌ Erro ao salvar alterações no banco.");
      }
    }
  };

  const handleToggleShortlist = (nomeTalento: string) => {
    if (!vagaAtiva) return;
    const exists = (vagaAtiva.candidatos_associados || []).includes(nomeTalento);
    const updatedLista = exists
      ? vagaAtiva.candidatos_associados.filter((n) => n !== nomeTalento)
      : [...(vagaAtiva.candidatos_associados || []), nomeTalento];
    const updatedVaga: VagaData = {
      ...vagaAtiva,
      candidatos_associados: updatedLista,
    };
    setVagas((prev) =>
      prev.map((v) => (v.id === vagaAtiva.id ? updatedVaga : v))
    );
    void persistirVagaNoBanco(updatedVaga, true);
  };

  const handleOpenProcesso = (
    vagaId: number,
    mode: "ranking" | "harmonia" | "shortlist_final"
  ) => {
    const targetVaga = vagas.find((v) => v.id === vagaId);
    setSelectedVagaId(vagaId);
    setActiveMode(mode);
    setScreen("processo");
    setActiveHarmoniaIdx(0);
    setCustomizeOpen(false);
    if (targetVaga) {
      setCandidatoEmSelecao(targetVaga.candidato_selecionado || "");
    }
  };

  const handleSalvarCandidatoSelecionado = async (nomeOverride?: string) => {
    if (!vagaAtiva) return;
    const nomeEscolhido = (nomeOverride ?? candidatoEmSelecao).trim();
    if (!nomeEscolhido) {
      showToast("⚠️ Selecione um candidato no Shortlist Final antes de salvar.");
      return;
    }
    setIsSavingCandidatoSelecionado(true);
    try {
      const listaAtual = vagaAtiva.candidatos_associados || [];
      const listaComEscolhido = listaAtual.includes(nomeEscolhido)
        ? listaAtual
        : [...listaAtual, nomeEscolhido];

      const updatedVaga: VagaData = {
        ...vagaAtiva,
        candidatos_associados: listaComEscolhido,
        candidato_selecionado: nomeEscolhido,
      };
      setCandidatoEmSelecao(nomeEscolhido);
      setVagas((prev) =>
        prev.map((v) => (v.id === vagaAtiva.id ? updatedVaga : v))
      );
      await persistirVagaNoBanco(updatedVaga, true);
      showToast(
        `🏆 Candidato "${nomeEscolhido}" selecionado e salvo no processo "${vagaAtiva.nome_vaga}"!`
      );
    } finally {
      setIsSavingCandidatoSelecionado(false);
    }
  };

  const handleReabrirProcesso = async (vagaAlvo?: VagaData) => {
    const vg = vagaAlvo || vagaAtiva;
    if (!vg) return;
    const candidatoAnterior = vg.candidato_selecionado || "";
    const updatedVaga: VagaData = {
      ...vg,
      candidato_selecionado: undefined,
    };
    setVagas((prev) => prev.map((v) => (v.id === vg.id ? updatedVaga : v)));
    setSelectedVagaId(vg.id);
    setCandidatoEmSelecao(candidatoAnterior);
    setActiveMode("shortlist_final");
    setScreen("processo");
    setCustomizeOpen(false);
    await persistirVagaNoBanco(updatedVaga, true);
    showToast(
      `🔄 Processo "${vg.nome_vaga}" reaberto! Apresentando o Shortlist Final para nova decisão.`
    );
  };

  const handleSugerirRequisitosIA = async () => {
    if (!vagaAtiva) return;
    try {
      setIsSavingRequisitos(true);
      const calcRes = await fetch("/api/calculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sugerir-requisitos-vaga",
          payload: {
            nome_vaga: vagaAtiva.nome_vaga,
            departamento: vagaAtiva.departamento,
            descricao_vaga: vagaAtiva.descricao_vaga,
            senioridade: vagaAtiva.senioridade,
          },
        }),
      });
      const calcJson = await calcRes.json();
      if (!calcRes.ok || !calcJson.success || !calcJson.result) {
        throw new Error(calcJson.error || "Motor de sugestão indisponível");
      }
      const sug = calcJson.result as {
        kan_ideal: string[];
        perfis_ideais: string[];
        categorias_ideais: string[];
        qualidades_ideais: string[];
        soft_skills_ideais: string[];
      };
      const updatedVaga: VagaData = {
        ...vagaAtiva,
        kan_ideal: sug.kan_ideal,
        perfis_ideais: sug.perfis_ideais,
        categorias_ideais: sug.categorias_ideais,
        qualidades_ideais: sug.qualidades_ideais,
        soft_skills_ideais: sug.soft_skills_ideais,
      };
      setVagas((prev) =>
        prev.map((v) => (v.id === vagaAtiva.id ? updatedVaga : v))
      );
      await persistirVagaNoBanco(updatedVaga, true);
      showToast("✨ Requisitos comportamentais e Soft Skills sugeridos pela IA e salvos!");
    } catch {
      showToast("⚠️ Motor de cálculo indisponível para sugerir requisitos.");
    } finally {
      setIsSavingRequisitos(false);
    }
  };

  const handleToggleReqField = (
    field:
      | "kan_ideal"
      | "perfis_ideais"
      | "categorias_ideais"
      | "qualidades_ideais"
      | "soft_skills_ideais",
    value: string
  ) => {
    if (!vagaAtiva) return;
    const current = vagaAtiva[field] || [];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    const updatedVaga = { ...vagaAtiva, [field]: next };
    setVagas((prev) =>
      prev.map((v) => (v.id === vagaAtiva.id ? updatedVaga : v))
    );
  };

  const handleConfirmarSalvarHarmonia = async () => {
    if (!vagaAtiva || !candAtualItem) return;
    setIsSavingHarmonia(true);
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const novaAnalise: AnaliseHarmoniaItem = {
      id: `harmonia-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      data: dataFormatada,
      candidato: candAtualItem.talento.nome,
      candidato_kan: `KAN ${candAtualItem.talento.kan_nome}`,
      equipe: alvoRotuloSalvo,
      harmonia_score: candAtualItem.harmonia.totalPts,
      classificacao: candAtualItem.harmonia.classificacao,
      criterios: candAtualItem.harmonia.criterios.map((c) => ({
        titulo: c.titulo,
        nota: c.nota,
        sub: c.sub,
      })),
      observacoes: obsAnalista.trim(),
      salvo_em: agora.toISOString(),
    };

    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "salvar_analise_harmonia",
          vaga_id: vagaAtiva.id,
          analise: novaAnalise,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar análise de harmonia.");
      }
      const updatedHist = (data.historico_harmonia as AnaliseHarmoniaItem[]) || [
        novaAnalise,
        ...(vagaAtiva.historico_harmonia || []),
      ];
      setVagas((prev) =>
        prev.map((v) =>
          v.id === vagaAtiva.id ? { ...v, historico_harmonia: updatedHist } : v
        )
      );
      showToast(
        `💾 Análise de ${candAtualItem.talento.nome} com ${alvoRotuloSalvo} (${candAtualItem.harmonia.totalPts} pts) salva no histórico!`
      );
    } catch (err) {
      showToast(
        `❌ ${err instanceof Error ? err.message : "Erro ao salvar análise."}`
      );
    } finally {
      setIsSavingHarmonia(false);
    }
  };

  const handleSelecionarEAlocarCandidato = async () => {
    if (!candAtualItem) return;
    setIsAllocatingCandidato(true);
    const cand = candAtualItem.talento;
    try {
      if (harmoniaTargetMode === "departamento") {
        const deptValueToSave =
          deptoHierarquiaAtivo?.departamento_id || selectedDeptNome;
        const res = await fetch("/api/talentos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: cand.id,
            departamento: deptValueToSave,
          }),
        });
        if (!res.ok) {
          throw new Error("Não foi possível alocar o talento no departamento.");
        }
        cand.departamento = deptValueToSave;
        showToast(
          `🎉 "${cand.nome}" alocado com sucesso no departamento "${selectedDeptNome}"!`
        );
      } else if (equipeSelecionadaObj) {
        const jaMembro = equipeSelecionadaObj.membros.some(
          (m) => m.nome === cand.nome
        );
        if (!jaMembro) {
          const novosMembros = [
            ...equipeSelecionadaObj.membros,
            { nome: cand.nome, lider: false },
          ];
          const res = await fetch("/api/equipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...equipeSelecionadaObj,
              membros: novosMembros,
            }),
          });
          if (!res.ok) {
            throw new Error("Não foi possível incluir o candidato na equipe.");
          }
          equipeSelecionadaObj.membros = novosMembros;
        }
        showToast(
          `🎉 "${cand.nome}" integrado com sucesso à equipe "${equipeSelecionadaObj.nome}"!`
        );
      }
    } catch (err) {
      showToast(
        `❌ ${err instanceof Error ? err.message : "Erro ao alocar candidato."}`
      );
    } finally {
      setIsAllocatingCandidato(false);
    }
  };

  const handleExcluirAnaliseHarmonia = async (analiseId: string) => {
    if (!vagaAtiva) return;
    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "excluir_analise_harmonia",
          vaga_id: vagaAtiva.id,
          analise_id: analiseId,
        }),
      });
      const data = await res.json();
      const updatedHist =
        (data.historico_harmonia as AnaliseHarmoniaItem[]) ||
        (vagaAtiva.historico_harmonia || []).filter((i) => i.id !== analiseId);
      setVagas((prev) =>
        prev.map((v) =>
          v.id === vagaAtiva.id ? { ...v, historico_harmonia: updatedHist } : v
        )
      );
      showToast("Registro removido do histórico da vaga.");
    } catch {
      showToast("Erro ao remover registro do histórico.");
    }
  };

  // ============================================================================
  // TELA 1: HUB RESUMIDO DE PROCESSOS SELETIVOS
  // ============================================================================
  if (screen === "hub" || !vagaAtiva) {
    const qHub = normText(hubBusca);
    const vagasHubFiltradas = vagas.filter((vg) => {
      if (
        hubEmpresa !== "Todas" &&
        normText(vg.empresa) !== normText(hubEmpresa)
      ) {
        return false;
      }
      if (!qHub) return true;
      const searchable = normText(
        `${vg.nome_vaga} ${vg.empresa} ${vg.departamento} ${vg.senioridade} ${(vg.kan_ideal || []).join(" ")} ${(vg.perfis_ideais || []).join(" ")} ${(vg.soft_skills_ideais || []).join(" ")}`
      );
      return qHub
        .split(/\s+/)
        .filter(Boolean)
        .every((tk) => searchable.includes(tk));
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="orange">Processos Seletivos • Visão Executiva</Badge>
              <Badge variant="purple">{vagas.length} ativos</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              Processos Seletivos
            </h1>
            <p className="text-xs text-slate-500">
              Visualize o resumo de cada processo (Perfil, KAN e Soft Skills) e entre para selecionar talentos por <strong>Ranking (Mapa de Calor)</strong> ou <strong>Harmonia de Equipe</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={hubEmpresa}
              onChange={(e) => setHubEmpresa(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-semibold"
            >
              <option value="Todas">Todas as Empresas</option>
              {EMPRESAS_TENANT.map((emp) => (
                <option key={emp.id} value={emp.nome}>
                  {emp.nome}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={onGoToVagas}>
              <Briefcase className="h-3.5 w-3.5" />
              Gerenciar Vagas
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={hubBusca}
            onChange={(e) => setHubBusca(e.target.value)}
            placeholder="Buscar processo por título, departamento, KAN, perfil ou soft skill..."
            className="pl-9"
          />
        </div>

        {vagasHubFiltradas.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum processo seletivo encontrado.
            </p>
            <Button size="sm" onClick={onGoToVagas}>
              <Plus className="h-4 w-4" />
              Cadastrar Nova Vaga
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vagasHubFiltradas.map((vg) => {
              const shortListCount = (vg.candidatos_associados || []).length;
              const histCount = (vg.historico_harmonia || []).length;
              return (
                <Card
                  key={vg.id}
                  className="p-5 flex flex-col justify-between gap-4 hover:border-[#ea580c]/60 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#ea580c]">
                          {vg.departamento} • {vg.senioridade}
                        </div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">
                          {vg.nome_vaga}
                        </h2>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {vg.empresa}
                          {vg.equipe_associada
                            ? ` • Equipe: ${vg.equipe_associada}`
                            : ""}
                        </div>
                      </div>
                      <Badge variant="orange" className="shrink-0">
                        {shortListCount} Short List
                      </Badge>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          KAN Ideal
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(vg.kan_ideal || []).length > 0 ? (
                            vg.kan_ideal.map((k) => (
                              <Badge key={k} variant="purple">
                                {k}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Não definido
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Perfil Ideal
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(vg.perfis_ideais || []).length > 0 ? (
                            vg.perfis_ideais.map((pf) => (
                              <Badge key={pf} variant="secondary">
                                {pf}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Não definido
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Soft Skills
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(vg.soft_skills_ideais || []).length > 0 ? (
                            (vg.soft_skills_ideais || [])
                              .slice(0, 4)
                              .map((sk) => (
                                <Badge
                                  key={sk}
                                  variant="outline"
                                  className="border-amber-300/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px]"
                                >
                                  {sk}
                                </Badge>
                              ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Definir no processo
                            </span>
                          )}
                          {(vg.soft_skills_ideais || []).length > 4 && (
                            <Badge variant="outline" className="text-[11px]">
                              +{(vg.soft_skills_ideais || []).length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {vg.candidato_selecionado && (
                      <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            <Award className="h-3.5 w-3.5" />
                            Candidato Selecionado
                          </span>
                          <Badge variant="success" className="text-[10px]">
                            Concluído
                          </Badge>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{vg.candidato_selecionado}</span>
                        </div>
                        <div className="pt-1 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-bold border-emerald-500/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/15 w-full"
                            onClick={() => void handleReabrirProcesso(vg)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reabrir Processo
                          </Button>
                        </div>
                      </div>
                    )}

                    {histCount > 0 && (
                      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-between">
                        <span>Análises de harmonia salvas</span>
                        <strong>{histCount}</strong>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="bg-[#18345B] hover:bg-[#18345B]/90 text-white text-xs font-bold"
                        onClick={() => handleOpenProcesso(vg.id, "ranking")}
                      >
                        Ranking (pts)
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white text-xs font-bold"
                        onClick={() => handleOpenProcesso(vg.id, "harmonia")}
                      >
                        Harmonia ({shortListCount})
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      onClick={() =>
                        handleOpenProcesso(vg.id, "shortlist_final")
                      }
                    >
                      <Award className="h-3.5 w-3.5" />
                      Shortlist Final
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // TELA 2: WORKSPACE DO PROCESSO (MODO 1: RANKING | MODO 2: HARMONIA)
  // ============================================================================
  const minTierStyle = getHeatTierStyle(minPontos);
  const todasQualidadesOpcoes = Array.from(
    new Set([...QUALIDADES_OPCOES, ...(vagaAtiva.qualidades_ideais || [])])
  );
  const todasSoftSkillsOpcoes = Array.from(
    new Set([...SOFT_SKILLS_OPCOES, ...(vagaAtiva.soft_skills_ideais || [])])
  );

  // Triângulos para plotagem sobre o Plano de Tesla (Candidato laranja + Equipe/Depto)
  const triangleMembersWithCandidate = candAtualItem
    ? ([
        ...alvoMembrosAtuais
          .filter((m) => m.talento.nome !== candAtualItem.talento.nome)
          .map((m) => ({
            nome: m.talento.nome,
            vertices: m.talento.vertices_triangulo,
            isLider: m.isLider,
            isCandidatoDestaque: false,
          })),
        {
          nome: candAtualItem.talento.nome,
          vertices: candAtualItem.talento.vertices_triangulo,
          isLider: false,
          isCandidatoDestaque: true,
        },
      ] as {
        nome: string;
        vertices: [number, number, number];
        isLider?: boolean;
        isCandidatoDestaque?: boolean;
      }[])
    : [];

  return (
    <div className="space-y-5">
      {toastMsg && (
        <div className="rounded-xl border border-[#ea580c]/30 bg-orange-500/10 px-4 py-3 text-xs font-semibold text-[#ea580c] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Cabeçalho Compacto do Processo + Seletor de Modo */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScreen("hub")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Todos os Processos
            </Button>
            <div>
              <h1 className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white">
                {vagaAtiva.nome_vaga}
              </h1>
              <div className="text-xs text-slate-500">
                {vagaAtiva.empresa} • {vagaAtiva.departamento} •{" "}
                {vagaAtiva.senioridade}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(vagaAtiva.kan_ideal || []).map((k) => (
              <Badge key={k} variant="purple">
                KAN: {k}
              </Badge>
            ))}
            {(vagaAtiva.perfis_ideais || []).map((pf) => (
              <Badge key={pf} variant="secondary">
                {pf}
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomizeOpen(!customizeOpen)}
              className="ml-1"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Requisitos / IA
              {customizeOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Painel Recolhível de Ajuste de Requisitos & IA */}
        {customizeOpen && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Ajustar Matriz Comportamental da Vaga
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSugerirRequisitosIA}
                  disabled={isSavingRequisitos}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#ea580c]" />
                  Sugerir com IA
                </Button>
                <Button
                  size="sm"
                  onClick={() => persistirVagaNoBanco(vagaAtiva)}
                  disabled={isSavingRequisitos}
                >
                  <Save className="h-3.5 w-3.5" />
                  Salvar Requisitos
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  KAN Ideal
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {KAN_OPCOES.map((opt) => {
                    const active = (vagaAtiva.kan_ideal || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleToggleReqField("kan_ideal", opt)}
                        className={`rounded-lg border px-2.5 py-1 font-semibold transition ${
                          active
                            ? "bg-[#18345B] text-white border-[#18345B]"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {active ? `✓ ${opt}` : opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Perfis Ideais
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PERFIS_OPCOES.map((opt) => {
                    const active = (vagaAtiva.perfis_ideais || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          handleToggleReqField("perfis_ideais", opt)
                        }
                        className={`rounded-lg border px-2.5 py-1 font-semibold transition ${
                          active
                            ? "bg-[#ea580c] text-white border-[#ea580c]"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {active ? `✓ ${opt}` : opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Soft Skills Ideais
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {todasSoftSkillsOpcoes.map((opt) => {
                    const active = (vagaAtiva.soft_skills_ideais || []).includes(
                      opt
                    );
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          handleToggleReqField("soft_skills_ideais", opt)
                        }
                        className={`rounded-lg border px-2.5 py-1 font-semibold transition ${
                          active
                            ? "bg-amber-600 text-white border-amber-600"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {active ? `✓ ${opt}` : opt}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1 max-w-sm">
                  <Input
                    value={novaSoftSkill}
                    onChange={(e) => setNovaSoftSkill(e.target.value)}
                    placeholder="Adicionar Soft Skill personalizada..."
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const v = novaSoftSkill.trim();
                      if (v) {
                        handleToggleReqField("soft_skills_ideais", v);
                        setNovaSoftSkill("");
                      }
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Categorias Ideais
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIAS_OPCOES.map((opt) => {
                    const active = (vagaAtiva.categorias_ideais || []).includes(
                      opt
                    );
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          handleToggleReqField("categorias_ideais", opt)
                        }
                        className={`rounded-lg border px-2 py-0.5 font-semibold transition ${
                          active
                            ? "bg-[#18345B] text-white border-[#18345B]"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {active ? `✓ ${opt}` : opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Qualidades Ideais
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {todasQualidadesOpcoes.slice(0, 14).map((opt) => {
                    const active = (vagaAtiva.qualidades_ideais || []).includes(
                      opt
                    );
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          handleToggleReqField("qualidades_ideais", opt)
                        }
                        className={`rounded-lg border px-2 py-0.5 font-semibold transition ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {active ? `✓ ${opt}` : opt}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1 max-w-sm">
                  <Input
                    value={novaQualidade}
                    onChange={(e) => setNovaQualidade(e.target.value)}
                    placeholder="Adicionar qualidade..."
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const v = novaQualidade.trim();
                      if (v) {
                        handleToggleReqField("qualidades_ideais", v);
                        setNovaQualidade("");
                      }
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner de Candidato Selecionado no Processo (com opção de Reabrir) */}
        {vagaAtiva.candidato_selecionado && (
          <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-full bg-emerald-600 text-white p-1.5">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Processo Concluído • Candidato Selecionado
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {vagaAtiva.candidato_selecionado}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/15 font-bold text-xs"
                onClick={() => void handleReabrirProcesso(vagaAtiva)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reabrir Processo
              </Button>
            </div>
          </div>
        )}

        {/* Seletor de Modo: Ranking (Mapa de Calor) vs Harmonia de Equipe vs Shortlist Final */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode("ranking")}
            className={`rounded-xl px-4 py-3 text-left border transition-all cursor-pointer ${
              activeMode === "ranking"
                ? "bg-[#18345B] text-white border-[#18345B] shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#18345B]/50"
            }`}
          >
            <div className="text-xs font-extrabold">
              1. Seleção por Ranking (Mapa de Calor)
            </div>
            <div
              className={`text-[11px] mt-0.5 ${
                activeMode === "ranking"
                  ? "text-blue-100"
                  : "text-slate-500"
              }`}
            >
              Escala em pontos (120–840 pts) + Fine-Tune por pontuação para montar o Short List
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("harmonia")}
            className={`rounded-xl px-4 py-3 text-left border transition-all cursor-pointer ${
              activeMode === "harmonia"
                ? "bg-[#ea580c] text-white border-[#ea580c] shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#ea580c]/50"
            }`}
          >
            <div className="text-xs font-extrabold">
              2. Harmonia de Equipe (Short List — {shortlistTalentos.length})
            </div>
            <div
              className={`text-[11px] mt-0.5 ${
                activeMode === "harmonia"
                  ? "text-orange-100"
                  : "text-slate-500"
              }`}
            >
              Escolha Equipe ou Departamento e plote os triângulos 1 a 1 no Plano de Tesla
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("shortlist_final")}
            className={`rounded-xl px-4 py-3 text-left border transition-all cursor-pointer ${
              activeMode === "shortlist_final"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 hover:border-emerald-600/50"
            }`}
          >
            <div className="text-xs font-extrabold flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              3. Shortlist Final ({shortlistFinalOrdenada.length})
            </div>
            <div
              className={`text-[11px] mt-0.5 ${
                activeMode === "shortlist_final"
                  ? "text-emerald-100"
                  : "text-slate-500"
              }`}
            >
              Maiores pontuadores em Ranking + Harmonia e seleção do candidato
            </div>
          </button>
        </div>
      </Card>

      {/* ====================================================================
          MODO 1: SELEÇÃO POR RANKING (PONTUAÇÃO MAPA DE CALOR + FINE-TUNE PTS)
      ==================================================================== */}
      {activeMode === "ranking" && (
        <Card className="p-4 sm:p-5 space-y-4">
          {/* Fine-Tune por Pontuação */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Fine-Tune (Pontuação):
              </span>
              <input
                type="range"
                min={0}
                max={750}
                step={10}
                value={minPontos}
                onChange={(e) => setMinPontos(Number(e.target.value))}
                className="w-36 accent-[#ea580c] cursor-pointer"
              />
              <span
                className="rounded-md px-2.5 py-0.5 text-xs font-extrabold"
                style={{
                  backgroundColor: minTierStyle.bg,
                  color: minTierStyle.text,
                }}
              >
                ≥ {minPontos} pts • {minTierStyle.label}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { pts: 0, lbl: "Todos" },
                  { pts: 150, lbl: "150+ Discreto" },
                  { pts: 300, lbl: "300+ Médio" },
                  { pts: 450, lbl: "450+ Alto" },
                  { pts: 600, lbl: "600+ Muito Alto" },
                ].map((preset) => (
                  <button
                    key={preset.pts}
                    type="button"
                    onClick={() => setMinPontos(preset.pts)}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-bold transition cursor-pointer ${
                      minPontos === preset.pts
                        ? "bg-[#18345B] text-white border-[#18345B]"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {preset.lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={buscaRanking}
                  onChange={(e) => setBuscaRanking(e.target.value)}
                  placeholder="Filtrar talento..."
                  className="h-8 pl-8 text-xs w-44"
                />
              </div>
              <Button
                size="sm"
                className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-bold text-xs"
                onClick={() => setActiveMode("harmonia")}
              >
                Analisar Harmonia ({shortlistTalentos.length})
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                onClick={() => setActiveMode("shortlist_final")}
              >
                <Award className="h-3.5 w-3.5" />
                Shortlist Final
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {loadingMatch
                ? "Calculando pontuação no motor mam-kantechrh..."
                : `Exibindo ${Math.min(visibleRankingCount, rankingFiltrado.length)} de ${rankingFiltrado.length} talento(s) com ≥ ${minPontos} pts`}
            </span>
            <span>
              <strong>{shortlistTalentos.length}</strong> selecionado(s) no Short List
            </span>
          </div>

          {/* Tabela de Ranking com Checkboxes -> Short List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-2 w-12">Short List</th>
                  <th className="py-2.5 px-2">Talento</th>
                  <th className="py-2.5 px-2">KAN</th>
                  <th className="py-2.5 px-2">Perfis</th>
                  <th className="py-2.5 px-2">Soft Skills</th>
                  <th className="py-2.5 px-2 text-right">
                    Pontuação (Mapa de Calor)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {rankingFiltrado.slice(0, visibleRankingCount).map((row) => {
                  const inSL = (vagaAtiva.candidatos_associados || []).includes(
                    row.talento.nome
                  );
                  const tier = getHeatTierStyle(row.totalPts);
                  return (
                    <tr
                      key={row.talento.id}
                      className={`transition-colors ${
                        inSL
                          ? "bg-orange-50/70 dark:bg-orange-950/20"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <td className="py-2.5 px-2">
                        <input
                          type="checkbox"
                          checked={inSL}
                          onChange={() =>
                            handleToggleShortlist(row.talento.nome)
                          }
                          className="h-4 w-4 accent-[#ea580c] cursor-pointer rounded"
                          aria-label={`Adicionar ${row.talento.nome} ao Short List`}
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {row.talento.nome}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {row.talento.cargo || row.talento.profissao}
                              {row.talento.departamento
                                ? ` • ${row.talento.departamento}`
                                : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onInspectTalento(row.talento)}
                            title="Abrir Diagnóstico Individual"
                            className="rounded-md p-1 text-slate-400 hover:text-[#18345B] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge variant="purple">{row.talento.kan_nome}</Badge>
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                        <div>{row.talento.perfis_lista.slice(0, 3).join(", ")}</div>
                        <div className="text-[10px] text-slate-400">
                          {row.perfilStatus}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-300">
                        {row.softStatus}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-extrabold"
                          style={{
                            backgroundColor: tier.bg,
                            color: tier.text,
                          }}
                        >
                          {row.totalPts} pts • {tier.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rankingFiltrado.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-slate-400 text-xs"
                    >
                      Nenhum talento atingiu o corte de ≥ {minPontos} pts. Reduza o Fine-Tune para visualizar mais talentos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {rankingFiltrado.length > visibleRankingCount && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleRankingCount((c) => c + 40)}
              >
                Mostrar mais 40 talentos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisibleRankingCount(rankingFiltrado.length)}
              >
                Ver todos ({rankingFiltrado.length})
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ====================================================================
          MODO 2: HARMONIA DE EQUIPE (EQUIPE/DEPTO + SHORT LIST 1 A 1 + PLANO DE TESLA)
      ==================================================================== */}
      {activeMode === "harmonia" && (
        <div className="space-y-4">
          {/* Seletor de Alvo da Harmonia: Equipe vs Departamento */}
          <Card className="p-4 border-[#ea580c]/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#ea580c]">
                  Alvo da Harmonia:
                </span>
                <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setHarmoniaTargetMode("equipe");
                      setActiveHarmoniaIdx(0);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      harmoniaTargetMode === "equipe"
                        ? "bg-[#18345B] text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    <UsersRound className="h-3.5 w-3.5" />
                    Equipe
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHarmoniaTargetMode("departamento");
                      setActiveHarmoniaIdx(0);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      harmoniaTargetMode === "departamento"
                        ? "bg-[#18345B] text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Departamento
                  </button>
                </div>

                {harmoniaTargetMode === "equipe" ? (
                  <select
                    value={selectedEquipeNome}
                    onChange={(e) => {
                      setSelectedEquipeNome(e.target.value);
                      setActiveHarmoniaIdx(0);
                    }}
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-bold"
                  >
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.nome}>
                        {eq.nome} ({eq.membros.length} integrantes)
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedDeptNome}
                    onChange={(e) => {
                      setSelectedDeptNome(e.target.value);
                      setActiveHarmoniaIdx(0);
                    }}
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-bold"
                  >
                    {opcoesDepartamentos.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500">
                  Integrantes no mapa ({alvoMembrosAtuais.length}):
                </span>
                {alvoMembrosAtuais.length === 0 ? (
                  <span className="text-amber-600 font-semibold">
                    Nenhum colaborador encontrado neste grupo
                  </span>
                ) : (
                  alvoMembrosAtuais.slice(0, 8).map((m) => (
                    <span
                      key={m.talento.id}
                      className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold"
                    >
                      {m.isLider ? "👑 " : ""}
                      {m.talento.nome.split(" ")[0]}{" "}
                      <span className="text-slate-400">
                        ({m.talento.kan_nome})
                      </span>
                    </span>
                  ))
                )}
                {alvoMembrosAtuais.length > 8 && (
                  <span className="text-[11px] text-slate-400">
                    +{alvoMembrosAtuais.length - 8}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {shortlistOrdenada.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Seu Short List está vazio
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Volte ao modo <strong>1. Seleção por Ranking</strong> e marque os talentos desejados na tabela para analisá-los 1 a 1 sobre o Plano de Tesla.
              </p>
              <Button
                size="sm"
                className="bg-[#18345B] text-white"
                onClick={() => setActiveMode("ranking")}
              >
                Ir para Seleção por Ranking
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Coluna Esquerda: Short List Ranqueado por Harmonia (1 a 1) */}
              <Card className="lg:col-span-5 p-4 space-y-3 h-fit">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Short List — {alvoNomeExibicao}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Clique ou navegue 1 a 1 para plotar os triângulos
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setActiveHarmoniaIdx(
                          (i) =>
                            (i - 1 + shortlistOrdenada.length) %
                            shortlistOrdenada.length
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-mono px-1.5">
                      {safeHarmoniaIdx + 1}/{shortlistOrdenada.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setActiveHarmoniaIdx(
                          (i) => (i + 1) % shortlistOrdenada.length
                        )
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {loadingHarmonia && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ea580c]" />
                    Calculando geometria de harmonia no motor mam-kantechrh...
                  </div>
                )}

                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {shortlistOrdenada.map((item, idx) => {
                    const isSelected =
                      candAtualItem?.talento.id === item.talento.id;
                    const isBest = item.talento.id === melhorHarmoniaId;
                    const h = item.harmonia;
                    return (
                      <button
                        key={item.talento.id}
                        type="button"
                        onClick={() => setActiveHarmoniaIdx(idx)}
                        className={`w-full rounded-xl border p-3 text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "border-[#ea580c] bg-orange-50/70 dark:bg-orange-950/25 ring-1 ring-[#ea580c]"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold truncate text-slate-900 dark:text-white">
                              {idx + 1}º {item.talento.nome}
                            </span>
                            {isBest && (
                              <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-extrabold">
                                ★ Mais Harmoniza
                              </span>
                            )}
                            {h.temSobreposicaoTotal && (
                              <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-extrabold">
                                ⚠ Alerta Repulsão
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            KAN {item.talento.kan_nome}
                            {item.rankingPts > 0
                              ? ` • Ranking: ${item.rankingPts} pts`
                              : ""}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-base font-extrabold ${
                              h.temSobreposicaoMesmoKan
                                ? "text-red-600"
                                : isBest
                                ? "text-emerald-600"
                                : "text-[#ea580c]"
                            }`}
                          >
                            {h.totalPts} pts
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {h.classificacao}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Coluna Direita: Plano de Tesla + Alertas + 5 Critérios Oficiais */}
              {candAtualItem && (
                <Card className="lg:col-span-7 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Plano de Tesla: ★ {candAtualItem.talento.nome} +{" "}
                          {harmoniaTargetMode === "departamento"
                            ? "Depto."
                            : "Equipe"}{" "}
                          {alvoNomeExibicao}
                        </h3>
                        {candAtualItem.talento.id === melhorHarmoniaId && (
                          <Badge variant="success">Melhor Encaixe</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Triângulo laranja = candidato • Demais triângulos ={" "}
                        {alvoMembrosAtuais.length} integrante(s) • Ponto escuro =
                        vértice KAN
                      </p>
                    </div>
                    <span
                      className={`rounded-xl px-3 py-1.5 text-sm font-extrabold text-white ${
                        candAtualItem.harmonia.temSobreposicaoMesmoKan
                          ? "bg-red-600"
                          : "bg-[#ea580c]"
                      }`}
                    >
                      {candAtualItem.harmonia.totalPts} pts Harmonia
                    </span>
                  </div>

                  {/* Plotagem Oficial sobre o Plano de Tesla (plano_kan_fundo.jpg + esfera preta exclusiva no KAN) */}
                  <KanTrianglesSvg membros={triangleMembersWithCandidate} />

                  {/* Banners de Alerta de Repulsão (Sobreposição Total de Vértices) */}
                  {candAtualItem.harmonia.alertas.length > 0 && (
                    <div className="space-y-2">
                      {candAtualItem.harmonia.alertas.map((al, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold flex items-start gap-2.5 ${
                            al.severidade === "critico"
                              ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"
                              : "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-extrabold uppercase tracking-wider text-[10px]">
                              {al.severidade === "critico"
                                ? "Alerta Máximo de Repulsão (Sobreposição Total + Mesmo KAN)"
                                : "Alerta de Repulsão (Sobreposição Total de Vértices)"}
                            </div>
                            <div className="mt-0.5">{al.texto}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 5 Critérios Oficiais da Análise de Harmonia */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {candAtualItem.harmonia.criterios.map((c) => {
                      const ptsVal = c.pts ?? 0;
                      return (
                        <div
                          key={c.titulo}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-2.5 text-center"
                        >
                          <div
                            className="text-[10px] font-bold uppercase text-slate-500 truncate"
                            title={c.titulo}
                          >
                            {c.titulo}
                          </div>
                          <div
                            className={`text-base font-extrabold mt-0.5 ${
                              ptsVal >= 150
                                ? "text-emerald-600"
                                : ptsVal === 0
                                ? "text-red-500"
                                : "text-[#ea580c]"
                            }`}
                          >
                            {c.nota}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            {c.sub}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Observação + Ações de Salvamento e Alocação */}
                  <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                    <textarea
                      value={obsAnalista}
                      onChange={(e) => setObsAnalista(e.target.value)}
                      rows={2}
                      placeholder="Observações do recrutador / gestor sobre o encaixe comportamental..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-2.5 text-xs"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistorico(!showHistorico)}
                      >
                        <History className="h-3.5 w-3.5" />
                        Histórico ({(vagaAtiva.historico_harmonia || []).length})
                      </Button>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelecionarEAlocarCandidato}
                          disabled={isAllocatingCandidato}
                        >
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          {isAllocatingCandidato
                            ? "Alocando..."
                            : harmoniaTargetMode === "departamento"
                            ? "Alocar no Depto."
                            : "Integrar à Equipe"}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#18345B] hover:bg-[#18345B]/90 text-white font-bold"
                          onClick={handleConfirmarSalvarHarmonia}
                          disabled={isSavingHarmonia}
                        >
                          <Save className="h-3.5 w-3.5" />
                          {isSavingHarmonia
                            ? "Salvando..."
                            : "Confirmar e Salvar Análise"}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          onClick={() => setActiveMode("shortlist_final")}
                        >
                          <Award className="h-3.5 w-3.5" />
                          Shortlist Final
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Histórico Recolhível de Análises Salvas */}
                  {showHistorico && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3 space-y-2">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Análises Salvas neste Processo
                      </div>
                      {(vagaAtiva.historico_harmonia || []).length === 0 ? (
                        <p className="text-xs text-slate-400">
                          Nenhuma análise salva ainda.
                        </p>
                      ) : (
                        (vagaAtiva.historico_harmonia || []).map((h) => (
                          <div
                            key={h.id}
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 flex items-start justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold">
                                {h.candidato} • {h.equipe} •{" "}
                                <span className="text-[#ea580c]">
                                  {h.harmonia_score} pts ({h.classificacao})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {h.data}
                                {h.observacoes ? ` — ${h.observacoes}` : ""}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleExcluirAnaliseHarmonia(h.id)}
                              className="text-slate-400 hover:text-red-600 p-1"
                              title="Remover do histórico"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          MODO 3: SHORTLIST FINAL (MAIORES PONTUADORES EM RANKING + HARMONIA E SELEÇÃO FINAL)
      ==================================================================== */}
      {activeMode === "shortlist_final" && (
        <div className="space-y-4">
          {/* Barra Superior: Contexto de Equipe/Departamento Associado e Destaques */}
          <Card className="p-4 sm:p-5 space-y-4 border-emerald-500/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="success">Shortlist Final Consolidado</Badge>
                  {shortlistTalentos.length > 0 ? (
                    <Badge variant="orange">
                      {shortlistTalentos.length} candidato(s) no Short List
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Top {shortlistFinalOrdenada.length} do Ranking Geral
                    </Badge>
                  )}
                </div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  Ranking Final de Decisão — {vagaAtiva.nome_vaga}
                </h2>
                <p className="text-xs text-slate-500">
                  {temGrupoAssociado
                    ? `Consolidando os candidatos que mais pontuaram no Ranking da Vaga e na Harmonia com ${
                        harmoniaTargetMode === "departamento"
                          ? `o Departamento "${alvoNomeExibicao}"`
                          : `a Equipe "${alvoNomeExibicao}"`
                      } (${alvoMembrosAtuais.length} integrante(s)).`
                    : "Exibindo os candidatos que mais pontuaram no Ranking da Vaga (nenhuma equipe ou departamento com integrantes associado no momento)."}
                </p>
              </div>

              {/* Seletor rápido de Equipe / Departamento para compor a Harmonia do Shortlist Final */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => setHarmoniaTargetMode("equipe")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      harmoniaTargetMode === "equipe"
                        ? "bg-[#18345B] text-white"
                        : "text-slate-500"
                    }`}
                  >
                    <UsersRound className="h-3.5 w-3.5" />
                    Equipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setHarmoniaTargetMode("departamento")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      harmoniaTargetMode === "departamento"
                        ? "bg-[#18345B] text-white"
                        : "text-slate-500"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Departamento
                  </button>
                </div>

                {harmoniaTargetMode === "equipe" ? (
                  <select
                    value={selectedEquipeNome}
                    onChange={(e) => setSelectedEquipeNome(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-2.5 text-xs font-bold"
                  >
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.nome}>
                        {eq.nome} ({eq.membros.length} integrantes)
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedDeptNome}
                    onChange={(e) => setSelectedDeptNome(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-2.5 text-xs font-bold"
                  >
                    {opcoesDepartamentos.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Cards de Destaque: 1º Consolidado, Maior Ranking e Maior Harmonia */}
            {shortlistFinalOrdenada.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    🏆 1º Colocado no Shortlist Final
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {shortlistFinalOrdenada[0].talento.nome}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
                    {shortlistFinalOrdenada[0].totalCombinadoPts} pts totais
                    {temGrupoAssociado
                      ? ` (${shortlistFinalOrdenada[0].rankingPts} Ranking + ${shortlistFinalOrdenada[0].harmoniaPts} Harmonia)`
                      : ""}
                  </div>
                </div>

                {(() => {
                  const topRankItem = shortlistFinalOrdenada.find(
                    (i) => i.talento.id === melhorRankingFinalId
                  );
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#18345B] dark:text-blue-300">
                        🎯 Maior Pontuação no Ranking
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {topRankItem?.talento.nome || "—"}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-bold mt-0.5">
                        {topRankItem
                          ? `${topRankItem.rankingPts} pts • ${topRankItem.tierLabel}`
                          : "—"}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const topHarmItem = shortlistFinalOrdenada.find(
                    (i) => i.talento.id === melhorHarmoniaFinalId
                  );
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c]">
                        🤝 Maior Harmonia ({alvoNomeExibicao})
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {temGrupoAssociado
                          ? topHarmItem?.talento.nome || "Calculando..."
                          : "Sem equipe/depto. associado"}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-bold mt-0.5">
                        {temGrupoAssociado && topHarmItem
                          ? `${topHarmItem.harmoniaPts} pts • ${topHarmItem.harmonia.classificacao}`
                          : "—"}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>

          {/* Tabela do Shortlist Final com Seleção de Candidato e Botão Salvar */}
          <Card className="p-4 sm:p-5 space-y-4">
            {(loadingMatch || (temGrupoAssociado && loadingHarmonia)) && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ea580c]" />
                Atualizando pontuações de Ranking e Harmonia no motor mam-kantechrh...
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-2 w-12">Pos.</th>
                    <th className="py-2.5 px-2">Candidato</th>
                    <th className="py-2.5 px-2">KAN & Perfis</th>
                    <th className="py-2.5 px-2 text-right">
                      Pontuação Ranking
                    </th>
                    {temGrupoAssociado && (
                      <th className="py-2.5 px-2 text-right">
                        Harmonia ({alvoNomeExibicao})
                      </th>
                    )}
                    <th className="py-2.5 px-2 text-right">
                      Pontuação Consolidada
                    </th>
                    <th className="py-2.5 px-2 text-right">
                      Selecionar Candidato
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {shortlistFinalOrdenada.map((item, idx) => {
                    const isMarked = candidatoEmSelecao === item.talento.nome;
                    const isSavedOfficial =
                      vagaAtiva.candidato_selecionado === item.talento.nome;
                    const isTopRank =
                      item.talento.id === melhorRankingFinalId;
                    const isTopHarm =
                      temGrupoAssociado &&
                      item.talento.id === melhorHarmoniaFinalId;
                    const tier = getHeatTierStyle(item.rankingPts);

                    return (
                      <tr
                        key={item.talento.id}
                        onClick={() => setCandidatoEmSelecao(item.talento.nome)}
                        className={`transition-colors cursor-pointer ${
                          isSavedOfficial
                            ? "bg-emerald-50/90 dark:bg-emerald-950/30"
                            : isMarked
                            ? "bg-orange-50/70 dark:bg-orange-950/20"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                        }`}
                      >
                        <td className="py-3 px-2 font-extrabold text-slate-700 dark:text-slate-200">
                          {idx + 1}º
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                <span>{item.talento.nome}</span>
                                {isSavedOfficial && (
                                  <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-extrabold">
                                    🏆 Candidato Selecionado
                                  </span>
                                )}
                                {isTopRank && (
                                  <span className="rounded-full bg-[#18345B] text-white px-2 py-0.5 text-[10px] font-bold">
                                    ★ Top Ranking
                                  </span>
                                )}
                                {isTopHarm && (
                                  <span className="rounded-full bg-[#ea580c] text-white px-2 py-0.5 text-[10px] font-bold">
                                    ★ Top Harmonia
                                  </span>
                                )}
                                {temGrupoAssociado &&
                                  item.harmonia.temSobreposicaoTotal && (
                                    <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold">
                                      ⚠ Repulsão
                                    </span>
                                  )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.talento.cargo || item.talento.profissao}
                                {item.talento.departamento
                                  ? ` • ${item.talento.departamento}`
                                  : ""}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onInspectTalento(item.talento);
                              }}
                              title="Abrir Diagnóstico Individual"
                              className="rounded-md p-1 text-slate-400 hover:text-[#18345B] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="purple">
                              {item.talento.kan_nome}
                            </Badge>
                            <span className="text-slate-600 dark:text-slate-300">
                              {item.talento.perfis_lista.slice(0, 2).join(", ")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-extrabold"
                            style={{
                              backgroundColor: tier.bg,
                              color: tier.text,
                            }}
                          >
                            {item.rankingPts} pts • {tier.label}
                          </span>
                        </td>
                        {temGrupoAssociado && (
                          <td className="py-3 px-2 text-right">
                            <div
                              className={`text-xs font-extrabold ${
                                item.harmonia.temSobreposicaoMesmoKan
                                  ? "text-red-600"
                                  : isTopHarm
                                  ? "text-emerald-600"
                                  : "text-[#ea580c]"
                              }`}
                            >
                              {item.harmoniaPts} pts
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {item.harmonia.classificacao}
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-2 text-right">
                          <span className="inline-flex items-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2.5 py-1 text-xs font-extrabold">
                            {item.totalCombinadoPts} pts
                          </span>
                        </td>
                        <td
                          className="py-3 px-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCandidatoEmSelecao(item.talento.nome)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                              isMarked
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-600"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shortlist-final-candidato"
                              checked={isMarked}
                              onChange={() =>
                                setCandidatoEmSelecao(item.talento.nome)
                              }
                              className="h-3.5 w-3.5 accent-emerald-600 cursor-pointer"
                            />
                            {isMarked ? "Selecionado" : "Selecionar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Barra de Decisão Final: Salvar Candidato Selecionado e Reabrir Processo */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="text-xs">
                <span className="text-slate-500">
                  Candidato marcado para fechamento da vaga:
                </span>{" "}
                {candidatoEmSelecao ? (
                  <strong className="text-slate-900 dark:text-white text-sm ml-1">
                    {candidatoEmSelecao}
                  </strong>
                ) : (
                  <span className="italic text-slate-400 ml-1">
                    Clique em &ldquo;Selecionar&rdquo; em um candidato da lista acima
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {vagaAtiva.candidato_selecionado && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleReabrirProcesso(vagaAtiva)}
                    className="border-amber-500/50 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 font-bold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reabrir Processo
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={
                    !candidatoEmSelecao || isSavingCandidatoSelecionado
                  }
                  onClick={() => void handleSalvarCandidatoSelecionado()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSavingCandidatoSelecionado
                    ? "Salvando..."
                    : "Salvar Candidato Selecionado"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
