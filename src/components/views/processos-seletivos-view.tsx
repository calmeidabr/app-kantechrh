"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Sparkles,
  UserCheck,
  UserMinus,
  UsersRound,
  Triangle,
  SlidersHorizontal,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Calendar,
  Award,
  Save,
  RotateCcw,
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
  KAN_OPCOES,
  PERFIS_OPCOES,
  CATEGORIAS_OPCOES,
  QUALIDADES_OPCOES,
  type VagaData,
  type TalentoProfile,
  type EquipeData,
} from "@/lib/mock-data";

/* ============================================================================
   PARTE A: CADASTRO E GESTÃO DE VAGAS (Antigo processos_menu.py)
============================================================================ */
export function VagasView({
  vagas,
  setVagas,
  onAnalisarProcesso,
}: {
  vagas: VagaData[];
  setVagas: React.Dispatch<React.SetStateAction<VagaData[]>>;
  onAnalisarProcesso: (vagaId: number) => void;
}) {
  const [empresaSel, setEmpresaSel] = useState(EMPRESAS_TENANT[0].nome);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedVagaId, setExpandedVagaId] = useState<number | null>(
    vagas[0]?.id || null
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Vaga Form State
  const [nomeVaga, setNomeVaga] = useState("");
  const [senioridade, setSenioridade] = useState<
    "Junior" | "Pleno" | "Senior" | "Executivo"
  >("Senior");
  const [linkVaga, setLinkVaga] = useState("");
  const [depto, setDepto] = useState(DEPARTAMENTOS_OPCOES[1]);
  const [kanIdeal, setKanIdeal] = useState<string[]>(["Movimento"]);
  const [perfisIdeais, setPerfisIdeais] = useState<string[]>([
    "Lider",
    "Resultado",
  ]);
  const [catsIdeais, setCatsIdeais] = useState<string[]>([
    "Realizador",
    "Inovador",
  ]);
  const [qualsIdeais, setQualsIdeais] = useState<string[]>([
    "Execução",
    "Comunicação",
  ]);
  const [descVaga, setDescVaga] = useState("");

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSaveVaga = async () => {
    if (!nomeVaga.trim()) {
      setToastMsg("⚠️ O Nome da Vaga é obrigatório.");
      return;
    }

    const nova: VagaData = {
      id: Date.now(),
      nome_vaga: nomeVaga.trim(),
      senioridade,
      link_vaga: linkVaga.trim() || undefined,
      empresa: empresaSel,
      departamento: depto,
      kan_ideal: kanIdeal,
      perfis_ideais: perfisIdeais,
      categorias_ideais: catsIdeais,
      qualidades_ideais: qualsIdeais,
      descricao_vaga: descVaga.trim(),
      candidatos_associados: [],
      created_at: new Date().toISOString().slice(0, 10),
    };

    try {
      await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nova),
      });
    } catch {
      // Keep local state if offline
    }

    setVagas((prev) => [nova, ...prev]);
    setFormOpen(false);
    setNomeVaga("");
    setDescVaga("");
    setExpandedVagaId(nova.id);
    setToastMsg(`✅ Vaga "${nova.nome_vaga}" cadastrada e sincronizada no Supabase!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDeleteVaga = (id: number) => {
    setVagas((prev) => prev.filter((v) => v.id !== id));
    setToastMsg("Vaga excluída.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Cadastros • Perfis Ideais de Vagas</Badge>
            <span className="text-xs text-slate-400">
              Tabela: <code className="font-mono">public.vagas</code>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Gestão de Vagas & Requisitos Comportamentais
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre e consulte perfis ideais de vagas (KAN, Perfis, Categorias e Qualidades) para alinhamento comportamental.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={empresaSel}
            onChange={(e) => setEmpresaSel(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-semibold"
          >
            {EMPRESAS_TENANT.map((emp) => (
              <option key={emp.id} value={emp.nome}>
                {emp.nome}
              </option>
            ))}
          </select>

          <Button onClick={() => setFormOpen(!formOpen)}>
            <Plus className="h-4 w-4" />
            {formOpen ? "Fechar Formulário" : "Cadastrar Nova Vaga"}
          </Button>
        </div>
      </div>

      {toastMsg && (
        <div className="rounded-xl border border-[#510851]/20 bg-[#510851]/5 px-4 py-3 text-xs font-semibold text-[#510851] dark:text-white flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)}>✕</button>
        </div>
      )}

      {/* Formulário Cadastrar Nova Vaga */}
      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Vaga</CardTitle>
            <CardDescription>
              Defina os requisitos técnicos e a matriz comportamental ideal para o processo seletivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold">Nome da Vaga *</label>
                <Input
                  value={nomeVaga}
                  onChange={(e) => setNomeVaga(e.target.value)}
                  placeholder="Ex.: Gerente de Engenharia de Software"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Senioridade *</label>
                <select
                  value={senioridade}
                  onChange={(e) => setSenioridade(e.target.value as any)}
                  className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs"
                >
                  <option value="Junior">Junior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Senior">Senior</option>
                  <option value="Executivo">Executivo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Departamento *</label>
                <select
                  value={depto}
                  onChange={(e) => setDepto(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs"
                >
                  {DEPARTAMENTOS_OPCOES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seletores de Pílulas: KAN, Perfis, Categorias, Qualidades */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PillMultiSelect
                label="KAN Ideal"
                options={KAN_OPCOES}
                selected={kanIdeal}
                onToggle={(v) => toggleItem(kanIdeal, setKanIdeal, v)}
                accent="orange"
              />
              <PillMultiSelect
                label="Tipos de Perfis Ideais"
                options={PERFIS_OPCOES}
                selected={perfisIdeais}
                onToggle={(v) => toggleItem(perfisIdeais, setPerfisIdeais, v)}
                accent="purple"
              />
              <PillMultiSelect
                label="Categorias de Perfil Ideais"
                options={CATEGORIAS_OPCOES}
                selected={catsIdeais}
                onToggle={(v) => toggleItem(catsIdeais, setCatsIdeais, v)}
                accent="purple"
              />
              <PillMultiSelect
                label="Qualidades Ideais"
                options={QUALIDADES_OPCOES}
                selected={qualsIdeais}
                onToggle={(v) => toggleItem(qualsIdeais, setQualsIdeais, v)}
                accent="emerald"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold">
                  Descrição da Vaga (Usada pela IA para sugerir requisitos)
                </label>
                <textarea
                  value={descVaga}
                  onChange={(e) => setDescVaga(e.target.value)}
                  rows={2}
                  placeholder="Responsabilidades, desafios da posição e cultura da área..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card p-3 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">
                  Link da Vaga (URL Opcional)
                </label>
                <Input
                  value={linkVaga}
                  onChange={(e) => setLinkVaga(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSaveVaga}>Salvar Vaga</Button>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Vagas Cadastradas */}
      <div className="space-y-3">
        {vagas.map((vg) => {
          const isOpen = expandedVagaId === vg.id;
          return (
            <Card key={vg.id} className="p-5 space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {vg.nome_vaga} ({vg.senioridade})
                    </h3>
                    <Badge variant="secondary">{vg.departamento}</Badge>
                    <Badge variant="success">
                      {vg.candidatos_associados.length} Candidatos
                    </Badge>
                  </div>

                  {/* Resumo de badges igual ao processos_menu.py */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-bold text-[#ea580c]">KAN:</span>
                    {vg.kan_ideal.map((k) => (
                      <Badge key={k} variant="orange">
                        {k}
                      </Badge>
                    ))}
                    <span className="mx-1 text-slate-300">|</span>
                    <span className="font-bold text-[#510851] dark:text-[#a78bfa]">
                      PERFIL:
                    </span>
                    {vg.perfis_ideais.map((p) => (
                      <Badge key={p} variant="purple">
                        {p}
                      </Badge>
                    ))}
                    <span className="mx-1 text-slate-300">|</span>
                    <span className="font-bold text-slate-500">QUALIDADES:</span>
                    {vg.qualidades_ideais.slice(0, 3).map((q) => (
                      <Badge key={q} variant="secondary">
                        {q}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedVagaId(isOpen ? null : vg.id)}
                  >
                    {isOpen ? "Ocultar Detalhes" : "Ver Detalhes"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAnalisarProcesso(vg.id)}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#ea580c]" />
                    Abrir Processo Seletivo
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-200/80 dark:border-slate-800 pt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between text-xs">
                  <div className="space-y-2 max-w-3xl">
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">
                        Categorias Ideais:
                      </strong>{" "}
                      {vg.categorias_ideais.join(", ")}
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">
                        Qualidades Completas:
                      </strong>{" "}
                      {vg.qualidades_ideais.join(", ")}
                    </div>
                    {vg.descricao_vaga && (
                      <p className="text-slate-500 leading-relaxed pt-1">
                        {vg.descricao_vaga}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {vg.link_vaga && (
                      <a
                        href={vg.link_vaga}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#510851] hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Link da Vaga
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVaga(vg.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir Vaga
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   PARTE B: PROCESSO SELETIVO & MATCHING INTELIGENTE (Antigo processo_seletivo_analise_menu.py)
============================================================================ */
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
  const vagaAtiva =
    vagas.find((v) => v.id === selectedVagaId) || vagas[0];

  const [activeTab, setActiveTab] = useState<"aderencia" | "harmonia">(
    "aderencia"
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [assocTalentosOpen, setAssocTalentosOpen] = useState(false);
  const [assocAderenciaOpen, setAssocAderenciaOpen] = useState(false);
  const [minAderenciaPct, setMinAderenciaPct] = useState(65);
  const [candDestaqueHarmonia, setCandDestaqueHarmonia] = useState<string>(
    vagaAtiva?.candidatos_associados[0] || talentos[0].nome
  );
  const [obsAnalista, setObsAnalista] = useState(
    "Candidato demonstrou excelente abertura para colaborar com a liderança no KAN de Finalidade, confirmando a estabilidade indicada na geometria de triângulos."
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!vagaAtiva) return null;

  // Calculate exact MundoKAN matching score for every talent against active vaga
  const calcularMatchTalento = (t: TalentoProfile) => {
    // 1. KAN Match (25% / +3 pts)
    const kanCompativel =
      vagaAtiva.kan_ideal.length === 0 ||
      vagaAtiva.kan_ideal.some(
        (k) => k.toLowerCase() === t.kan_nome.toLowerCase()
      );
    const kanScore = kanCompativel ? 25 : 0;
    const ptsKan = kanCompativel ? 3 : 0;

    // 2. Perfis Match (25% / +2 pts per match)
    const perfisHits = vagaAtiva.perfis_ideais.filter((p) =>
      t.perfis_lista.some((tp) => tp.toLowerCase() === p.toLowerCase())
    );
    const perfilScore =
      vagaAtiva.perfis_ideais.length > 0
        ? (perfisHits.length / vagaAtiva.perfis_ideais.length) * 25
        : 25;
    const ptsPerfil = perfisHits.length * 2;

    // 3. Categorias Match (25%)
    const catsHits = vagaAtiva.categorias_ideais.filter((c) =>
      t.categorias_lista.some((tc) => tc.toLowerCase() === c.toLowerCase())
    );
    const catScore =
      vagaAtiva.categorias_ideais.length > 0
        ? (catsHits.length / vagaAtiva.categorias_ideais.length) * 25
        : 25;

    // 4. Qualidades Match (25% / +1 pt per match)
    const qualsHits = vagaAtiva.qualidades_ideais.filter((q) =>
      t.qualidades_lista.some((tq) => tq.toLowerCase() === q.toLowerCase())
    );
    const qualScore =
      vagaAtiva.qualidades_ideais.length > 0
        ? (qualsHits.length / vagaAtiva.qualidades_ideais.length) * 25
        : 25;
    const ptsQual = qualsHits.length * 1;

    const aderenciaPct = Math.round(
      kanScore + perfilScore + catScore + qualScore
    );
    const totalPts = ptsKan + ptsPerfil + ptsQual;

    return {
      talento: t,
      aderenciaPct,
      totalPts,
      ptsKan,
      ptsPerfil,
      ptsQual,
      kanStatus: kanCompativel ? "✓ Compatível" : "✗ Incompatível",
      perfilStatus: `${perfisHits.length}/${vagaAtiva.perfis_ideais.length} compatíveis`,
      catStatus: `${catsHits.length}/${vagaAtiva.categorias_ideais.length} compatíveis`,
      qualStatus: `${qualsHits.length}/${vagaAtiva.qualidades_ideais.length} compatíveis`,
    };
  };

  const todosRankeados = talentos
    .map(calcularMatchTalento)
    .sort((a, b) => b.aderenciaPct - a.aderenciaPct);

  const candidatosAssociadosRank = todosRankeados
    .filter((r) => vagaAtiva.candidatos_associados.includes(r.talento.nome))
    .sort((a, b) => b.totalPts - a.totalPts);

  const handleToggleAssociarCandidato = (nome: string) => {
    setVagas((prev) =>
      prev.map((vg) => {
        if (vg.id !== vagaAtiva.id) return vg;
        const exists = vg.candidatos_associados.includes(nome);
        return {
          ...vg,
          candidatos_associados: exists
            ? vg.candidatos_associados.filter((c) => c !== nome)
            : [...vg.candidatos_associados, nome],
        };
      })
    );
  };

  const handleSugerirRequisitosIA = () => {
    setVagas((prev) =>
      prev.map((vg) =>
        vg.id === vagaAtiva.id
          ? {
              ...vg,
              kan_ideal: ["Finalidade", "Movimento"],
              perfis_ideais: ["Lider", "Resultado", "Comunicador"],
              categorias_ideais: ["Realizador", "Visionário"],
              qualidades_ideais: [
                "Execução",
                "Comunicação",
                "Organização",
                "Análise",
              ],
            }
          : vg
      )
    );
    setToastMsg(
      "✨ Requisitos comportamentais sugeridos pelo Gemini 2.5 Flash com base no cargo e senioridade!"
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Team Harmony data for Tab 2
  const equipeDaVaga =
    equipes.find((e) => e.nome === vagaAtiva.equipe_associada) || equipes[0];

  const candDestaqueObj =
    talentos.find((t) => t.nome === candDestaqueHarmonia) || talentos[0];

  const triangleMembersWithCandidate = [
    ...equipeDaVaga.membros
      .map((m) => {
        const info = talentos.find((t) => t.nome === m.nome);
        if (!info) return null;
        return {
          nome: m.nome,
          vertices: info.vertices_triangulo,
          isLider: Boolean(m.lider),
          isCandidatoDestaque: false,
        };
      })
      .filter(Boolean),
    {
      nome: candDestaqueObj.nome,
      vertices: candDestaqueObj.vertices_triangulo,
      isLider: false,
      isCandidatoDestaque: true,
    },
  ] as {
    nome: string;
    vertices: [number, number, number];
    isLider?: boolean;
    isCandidatoDestaque?: boolean;
  }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="orange">Matching Comportamental & Triângulos</Badge>
            <span className="text-xs text-slate-400">
              Tabela: <code className="font-mono">public.processos_seletivos</code>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Processo Seletivo & Aderência KAN
          </h1>
          <p className="text-xs text-slate-500">
            Compare candidatos pelos requisitos da vaga (KAN, Perfil, Categorias e Qualidades) e avalie o encaixe geométrico na equipe de destino.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={onGoToVagas}>
          <Briefcase className="h-3.5 w-3.5" />
          Gerenciar Cadastro de Vagas
        </Button>
      </div>

      {toastMsg && (
        <div className="rounded-xl border border-[#ea580c]/30 bg-orange-500/10 px-4 py-3 text-xs font-semibold text-[#ea580c] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)}>✕</button>
        </div>
      )}

      {/* ===================================================================
          1. SELETOR DE PROCESSOS SELETIVOS CADASTRADOS (VAGAS)
      ==================================================================== */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {vagas.map((vg) => {
          const isSelected = vg.id === vagaAtiva.id;
          return (
            <button
              key={vg.id}
              onClick={() => {
                setSelectedVagaId(vg.id);
                if (vg.candidatos_associados[0]) {
                  setCandDestaqueHarmonia(vg.candidatos_associados[0]);
                }
              }}
              className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? "border-[#510851] dark:border-[#8b5cf6] bg-white dark:bg-slate-900 shadow-md ring-2 ring-[#510851]/15"
                  : "border-slate-200/80 dark:border-slate-800 bg-card hover:border-slate-300"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={isSelected ? "orange" : "secondary"}>
                    {isSelected ? "● Processo Selecionado" : vg.senioridade}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    {vg.candidatos_associados.length} candidatos
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {vg.nome_vaga} ({vg.senioridade})
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  {vg.departamento} • Equipe: {vg.equipe_associada || "Geral"}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {vg.kan_ideal.map((k) => (
                  <span
                    key={k}
                    className="rounded bg-[#ea580c]/10 px-2 py-0.5 text-[10px] font-bold text-[#ea580c]"
                  >
                    KAN {k}
                  </span>
                ))}
                {vg.perfis_ideais.slice(0, 2).map((p) => (
                  <span
                    key={p}
                    className="rounded bg-[#510851]/10 dark:bg-[#8b5cf6]/20 px-2 py-0.5 text-[10px] font-semibold text-[#510851] dark:text-[#a78bfa]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          2. PERFIL COMPORTAMENTAL DESEJADO PARA A VAGA + SUGESTÃO IA
      ==================================================================== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                Perfil Comportamental Desejado — {vagaAtiva.nome_vaga} (
                {vagaAtiva.senioridade})
              </CardTitle>
              <CardDescription>
                Critérios ponderados em tempo real (25% KAN • 25% Perfis • 25% Categorias • 25% Qualidades)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="orange"
                size="sm"
                onClick={handleSugerirRequisitosIA}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Sugerir Requisitos com IA
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomizeOpen(!customizeOpen)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {customizeOpen ? "Ocultar Ajustes" : "Personalizar Requisitos"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Editorial Requirements Table matching processo_seletivo_analise_menu.py */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center py-2.5 gap-2">
              <span className="sm:col-span-2 font-bold uppercase tracking-wider text-slate-400">
                KAN Ideal
              </span>
              <div className="sm:col-span-10 flex flex-wrap gap-1.5">
                {vagaAtiva.kan_ideal.map((k) => (
                  <Badge key={k} variant="orange" className="uppercase">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 items-center py-2.5 gap-2">
              <span className="sm:col-span-2 font-bold uppercase tracking-wider text-slate-400">
                Perfis Ideais
              </span>
              <div className="sm:col-span-10 flex flex-wrap gap-1.5">
                {vagaAtiva.perfis_ideais.map((p) => (
                  <Badge key={p} variant="purple" className="uppercase">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 items-center py-2.5 gap-2">
              <span className="sm:col-span-2 font-bold uppercase tracking-wider text-slate-400">
                Categorias
              </span>
              <div className="sm:col-span-10 flex flex-wrap gap-1.5">
                {vagaAtiva.categorias_ideais.map((c) => (
                  <Badge key={c} variant="secondary" className="uppercase">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 items-center py-2.5 gap-2">
              <span className="sm:col-span-2 font-bold uppercase tracking-wider text-slate-400">
                Qualidades
              </span>
              <div className="sm:col-span-10 flex flex-wrap gap-1.5">
                {vagaAtiva.qualidades_ideais.map((q) => (
                  <Badge key={q} variant="outline" className="uppercase">
                    {q}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Personalizar Requisitos */}
          {customizeOpen && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-4">
              <p className="text-xs text-slate-500">
                Clique nas pílulas abaixo para adicionar ou remover requisitos específicos deste processo seletivo e recalcular o ranking instantaneamente:
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PillMultiSelect
                  label="KAN Ideal"
                  options={KAN_OPCOES}
                  selected={vagaAtiva.kan_ideal}
                  onToggle={(item) =>
                    setVagas((prev) =>
                      prev.map((v) =>
                        v.id === vagaAtiva.id
                          ? {
                              ...v,
                              kan_ideal: v.kan_ideal.includes(item)
                                ? v.kan_ideal.filter((x) => x !== item)
                                : [...v.kan_ideal, item],
                            }
                          : v
                      )
                    )
                  }
                  accent="orange"
                />
                <PillMultiSelect
                  label="Perfis Ideais"
                  options={PERFIS_OPCOES}
                  selected={vagaAtiva.perfis_ideais}
                  onToggle={(item) =>
                    setVagas((prev) =>
                      prev.map((v) =>
                        v.id === vagaAtiva.id
                          ? {
                              ...v,
                              perfis_ideais: v.perfis_ideais.includes(item)
                                ? v.perfis_ideais.filter((x) => x !== item)
                                : [...v.perfis_ideais, item],
                            }
                          : v
                      )
                    )
                  }
                  accent="purple"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================================================================
          3. BARRA DE ASSOCIAÇÃO DE CANDIDATOS & ABAS (ADERÊNCIA VS HARMONIA)
      ==================================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs Selector */}
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          <button
            onClick={() => setActiveTab("aderencia")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "aderencia"
                ? "bg-[#510851] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            1. Aderência aos Requisitos da Vaga ({candidatosAssociadosRank.length})
          </button>
          <button
            onClick={() => setActiveTab("harmonia")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "harmonia"
                ? "bg-[#ea580c] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Triangle className="h-3.5 w-3.5" />
            2. Escolha por Harmonia de Equipe
          </button>
        </div>

        {/* Botões Associar Talentos / Associar por Aderência */}
        <div className="flex items-center gap-2">
          <Button
            variant="orange"
            size="sm"
            onClick={() => {
              setAssocTalentosOpen(!assocTalentosOpen);
              setAssocAderenciaOpen(false);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Associar Talentos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssocAderenciaOpen(!assocAderenciaOpen);
              setAssocTalentosOpen(false);
            }}
          >
            Associar por Aderência (%)
          </Button>
        </div>
      </div>

      {/* Drawer: Associar Talentos Manualmente */}
      {assocTalentosOpen && (
        <Card className="p-4 space-y-3 border-[#510851]/30">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Selecionar Talentos Participantes do Processo Seletivo
            </h4>
            <button
              onClick={() => setAssocTalentosOpen(false)}
              className="text-xs text-slate-400"
            >
              ✕ Fechar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {todosRankeados.map((r) => {
              const isAssoc = vagaAtiva.candidatos_associados.includes(
                r.talento.nome
              );
              return (
                <button
                  key={r.talento.id}
                  onClick={() => handleToggleAssociarCandidato(r.talento.nome)}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs ${
                    isAssoc
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={r.talento.avatar}
                      alt={r.talento.nome}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <div className="truncate">
                      <div className="font-bold truncate">{r.talento.nome}</div>
                      <div className="text-[10px] text-slate-400">
                        Aderência: {r.aderenciaPct}%
                      </div>
                    </div>
                  </div>
                  <Badge variant={isAssoc ? "success" : "outline"}>
                    {isAssoc ? "✓ Associado" : "+ Incluir"}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Drawer: Associar por Slider de Aderência (%) */}
      {assocAderenciaOpen && (
        <Card className="p-4 space-y-4 border-[#ea580c]/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 flex-1 max-w-md">
              <label className="text-xs font-bold">
                Percentual mínimo de aderência desejado:{" "}
                <span className="text-[#ea580c]">{minAderenciaPct}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={minAderenciaPct}
                onChange={(e) => setMinAderenciaPct(Number(e.target.value))}
                className="w-full accent-[#ea580c]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="orange"
                onClick={() => {
                  const aprovados = todosRankeados
                    .filter((r) => r.aderenciaPct >= minAderenciaPct)
                    .map((r) => r.talento.nome);
                  setVagas((prev) =>
                    prev.map((v) =>
                      v.id === vagaAtiva.id
                        ? {
                            ...v,
                            candidatos_associados: Array.from(
                              new Set([
                                ...v.candidatos_associados,
                                ...aprovados,
                              ])
                            ),
                          }
                        : v
                    )
                  );
                  setAssocAderenciaOpen(false);
                  setToastMsg(
                    `✅ ${aprovados.length} talento(s) com aderência >= ${minAderenciaPct}% associados ao processo!`
                  );
                  setTimeout(() => setToastMsg(null), 3500);
                }}
              >
                Associar Todos &gt;= {minAderenciaPct}% (
                {
                  todosRankeados.filter((r) => r.aderenciaPct >= minAderenciaPct)
                    .length
                }{" "}
                talentos)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAssocAderenciaOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ===================================================================
          ABA 1: ADERÊNCIA AOS REQUISITOS DA VAGA (4-COL CARDS + RANKING TABLE)
      ==================================================================== */}
      {activeTab === "aderencia" && (
        <div className="space-y-6">
          {/* 4-Column Candidate Cards matching processo_seletivo_analise_menu.py */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {candidatosAssociadosRank.map((item) => {
              const c = item.talento;
              return (
                <Card
                  key={c.id}
                  className="relative p-5 flex flex-col justify-between space-y-4 hover:border-[#510851]/40 transition-all"
                >
                  {/* Top-left remove button */}
                  <button
                    onClick={() => handleToggleAssociarCandidato(c.nome)}
                    title="Remover do processo"
                    className="absolute left-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>

                  {/* Avatar with Purple-Orange Halo */}
                  <div className="flex flex-col items-center text-center pt-2">
                    <div className="rounded-full bg-gradient-to-tr from-[#510851] via-[#8b5cf6] to-[#ea580c] p-[3px] shadow-md">
                      <img
                        src={c.avatar}
                        alt={c.nome}
                        className="h-18 w-18 rounded-full object-cover border-2 border-white dark:border-slate-900"
                      />
                    </div>
                    <button
                      onClick={() => onInspectTalento(c)}
                      className="mt-3 text-sm font-bold text-slate-900 dark:text-white hover:text-[#ea580c] transition-colors"
                    >
                      {c.nome}
                    </button>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3 text-[#8b5cf6]" />
                      Nascimento: {c.data_nascimento}
                    </span>
                  </div>

                  {/* Candidate Attributes Mini-Table */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-slate-400">
                        KAN
                      </span>
                      <Badge variant="orange">
                        {c.kan_nome.toUpperCase()} ({c.kan_numero})
                      </Badge>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold uppercase text-slate-400 shrink-0">
                        Perfis
                      </span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {c.perfis_lista.map((p) => (
                          <span
                            key={p}
                            className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-slate-400">
                        Aderência %
                      </span>
                      <span className="font-extrabold text-sm text-[#ea580c]">
                        {item.aderenciaPct}%
                      </span>
                    </div>
                  </div>

                  {/* Compatibility Breakdown Widget (+KAN, +Perfil, +Qualidades) */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Compatibilidade
                      </span>
                      <span className="rounded-md bg-[#ea580c]/15 px-2 py-0.5 text-xs font-extrabold text-[#ea580c]">
                        ⚡ {item.totalPts} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200/70 dark:border-slate-800 pt-2 text-center">
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400">
                          KAN
                        </span>
                        <span className="text-xs font-extrabold">
                          +{item.ptsKan}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400">
                          Perfil
                        </span>
                        <span className="text-xs font-extrabold">
                          +{item.ptsPerfil}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400">
                          Qualid.
                        </span>
                        <span className="text-xs font-extrabold">
                          +{item.ptsQual}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Tabela Geral de Ranking por Aderência (com botão circular + / ✓) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                Ranking Geral da Base de Talentos por Aderência à Vaga
              </CardTitle>
              <CardDescription>
                Clique no botão circular à esquerda para associar (+) ou remover (✓) qualquer talento do processo seletivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 pl-6 pr-3 text-center">Ação</th>
                      <th className="py-3 px-3">Talento</th>
                      <th className="py-3 px-3">Profissão</th>
                      <th className="py-3 px-3">Aderência (%)</th>
                      <th className="py-3 px-3">KAN</th>
                      <th className="py-3 px-3">Perfil</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 pl-3 pr-6">Qualidades</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                    {todosRankeados.map((r) => {
                      const isAssoc = vagaAtiva.candidatos_associados.includes(
                        r.talento.nome
                      );
                      return (
                        <tr
                          key={r.talento.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                        >
                          <td className="py-3 pl-6 pr-3 text-center">
                            <button
                              onClick={() =>
                                handleToggleAssociarCandidato(r.talento.nome)
                              }
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold transition-transform hover:scale-110 ${
                                isAssoc
                                  ? "bg-emerald-500 text-white"
                                  : "border-2 border-[#ea580c] text-[#ea580c] hover:bg-[#ea580c] hover:text-white"
                              }`}
                            >
                              {isAssoc ? "✓" : "+"}
                            </button>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {r.talento.nome}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {r.talento.profissao}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                r.aderenciaPct >= 85 ? "success" : "orange"
                              }
                            >
                              {r.aderenciaPct}%
                            </Badge>
                          </td>
                          <td className="py-3 px-3">{r.kanStatus}</td>
                          <td className="py-3 px-3">{r.perfilStatus}</td>
                          <td className="py-3 px-3">{r.catStatus}</td>
                          <td className="py-3 pl-3 pr-6">{r.qualStatus}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================
          ABA 2: ESCOLHA POR HARMONIA DE EQUIPE (TRIÂNGULOS + 5 CRITÉRIOS)
      ==================================================================== */}
      {activeTab === "harmonia" && (
        <div className="space-y-6">
          {/* Seletor de Equipe Associada + Seletor de Candidato em Análise */}
          <Card className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Equipe de Destino Associada à Vaga
                </div>
                <div className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5 text-[#ea580c]" />
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {equipeDaVaga.nome}
                  </span>
                  <Badge variant="success">
                    {equipeDaVaga.membros.length} membros atuais
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    Alterar Equipe de Destino:
                  </label>
                  <select
                    value={equipeDaVaga.nome}
                    onChange={(e) =>
                      setVagas((prev) =>
                        prev.map((v) =>
                          v.id === vagaAtiva.id
                            ? { ...v, equipe_associada: e.target.value }
                            : v
                        )
                      )
                    }
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-semibold"
                  >
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.nome}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    Candidato Projetado no Plano KAN:
                  </label>
                  <select
                    value={candDestaqueObj.nome}
                    onChange={(e) => setCandDestaqueHarmonia(e.target.value)}
                    className="h-9 rounded-lg border border-[#ea580c] bg-orange-500/5 px-3 text-xs font-bold text-[#ea580c]"
                  >
                    {vagaAtiva.candidatos_associados.map((cNome) => (
                      <option key={cNome} value={cNome}>
                        ★ {cNome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Projeção SVG Interativa: Equipe Atual + Candidato (★) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Simulação Geométrica de Encaixe: {equipeDaVaga.nome} + ★{" "}
                  {candDestaqueObj.nome}
                </h3>
                <p className="text-xs text-slate-500">
                  O triângulo laranja (★) representa o candidato selecionado sobreposto aos integrantes atuais da equipe e ao líder (👑).
                </p>
              </div>
              <Badge variant="orange">Encaixe Muito Alto • 91.8%</Badge>
            </div>

            <KanTrianglesSvg membros={triangleMembersWithCandidate} />
          </Card>

          {/* Card Executivo dos 5 Critérios de Equipe (Idêntico ao bloco de Harmonia do MundoKAN) */}
          <Card className="overflow-hidden border-[#ea580c]/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-950 text-white px-6 py-4 gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-[#ea580c] px-3 py-1 text-xs font-extrabold text-white">
                  Análise de {candDestaqueObj.nome}
                </span>
                <span className="text-xs text-slate-300">
                  Integração com a liderança e membros de{" "}
                  <strong>{equipeDaVaga.nome}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">
                  Encaixe Muito Alto
                </span>
                <span className="rounded-full bg-[#ea580c] px-3.5 py-1 text-xs font-black text-white">
                  91.8%
                </span>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>
                  Análise Consolidada de Equipe ({equipeDaVaga.membros.length}{" "}
                  membros):
                </strong>{" "}
                A entrada de <strong>{candDestaqueObj.nome}</strong> (KAN de{" "}
                {candDestaqueObj.kan_nome}, vértices{" "}
                {candDestaqueObj.vertices_triangulo.join("-")}) promove alta
                sinergia geométrica com a equipe atual, ampliando a cobertura
                dos planos de realização prática e mantendo excelente segurança
                relacional com a liderança da equipe.
              </p>

              {/* 5 Critérios de Equipe Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  {
                    titulo: "Complementaridade",
                    nota: "4.7/5.0",
                    sub: "Equilíbrio de KANs",
                  },
                  {
                    titulo: "Integração Geométrica",
                    nota: "4.6/5.0",
                    sub: "Conexões de Triângulos",
                  },
                  {
                    titulo: "Balanceamento",
                    nota: "4.5/5.0",
                    sub: "Cobertura de Planos",
                  },
                  {
                    titulo: "Potencial de Entrega",
                    nota: "4.8/5.0",
                    sub: "Materialidade/Praticidade",
                  },
                  {
                    titulo: "Segurança Relacional",
                    nota: "4.4/5.0",
                    sub: "Mitigação de Conflitos",
                  },
                ].map((crit) => (
                  <div
                    key={crit.titulo}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 p-3.5 text-center space-y-1.5"
                  >
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      {crit.titulo}
                    </span>
                    <div className="rounded-lg bg-[#ea580c] py-2 text-base font-black text-white shadow-xs">
                      {crit.nota}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {crit.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* Observações Manuais do Analista */}
              <div className="space-y-2 border-t border-slate-200/80 dark:border-slate-800 pt-4">
                <label className="text-xs font-bold">
                  Observações Manuais do Analista (Histórico da Vaga)
                </label>
                <textarea
                  value={obsAnalista}
                  onChange={(e) => setObsAnalista(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card p-3 text-xs"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      setToastMsg(
                        `💾 Análise de harmonia de "${candDestaqueObj.nome}" confirmada e salva no histórico do processo!`
                      );
                      setTimeout(() => setToastMsg(null), 4000);
                    }}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Confirmar e Salvar Análise de Harmonia
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   HELPER: PILL MULTISELECT
============================================================================ */
function PillMultiSelect({
  label,
  options,
  selected,
  onToggle,
  accent = "purple",
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
  accent?: "purple" | "orange" | "emerald";
}) {
  const activeClass = {
    purple: "bg-[#510851] text-white border-[#510851]",
    orange: "bg-[#ea580c] text-white border-[#ea580c]",
    emerald: "bg-emerald-600 text-white border-emerald-600",
  }[accent];

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} ({selected.length})
      </label>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5">
        {options.map((opt) => {
          const isSel = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                isSel
                  ? activeClass
                  : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              {isSel ? `✓ ${opt}` : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
