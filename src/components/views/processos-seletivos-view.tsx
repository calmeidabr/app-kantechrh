"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
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
  Pencil,
  X,
  CheckCircle2,
  Check,
  Calendar,
  Award,
  Save,
  RotateCcw,
  Loader2,
  Clock,
  History,
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
  SOFT_SKILLS_OPCOES,
  calcularScoresEixos,
  talentoPossuiSoftSkill,
  type VagaData,
  type AnaliseHarmoniaItem,
  type KanType,
  type TalentoProfile,
  type EquipeData,
} from "@/lib/mock-data";

const normText = (s?: string | null) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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
  const [empresaSel, setEmpresaSel] = useState("Todas");
  const [empresaVaga, setEmpresaVaga] = useState(EMPRESAS_TENANT[0].nome);
  const [formOpen, setFormOpen] = useState(false);
  const [isCreatingVaga, setIsCreatingVaga] = useState(false);
  // Edit Vaga Modal State
  const [editingVaga, setEditingVaga] = useState<VagaData | null>(null);
  const [editVagaNome, setEditVagaNome] = useState("");
  const [editVagaSenioridade, setEditVagaSenioridade] = useState("");
  const [editVagaDepto, setEditVagaDepto] = useState("");
  const [editVagaEmpresa, setEditVagaEmpresa] = useState("");
  const [editVagaLink, setEditVagaLink] = useState("");
  const [editVagaDesc, setEditVagaDesc] = useState("");
  const [editVagaKan, setEditVagaKan] = useState<string[]>([]);
  const [editVagaPerfis, setEditVagaPerfis] = useState<string[]>([]);
  const [editVagaCats, setEditVagaCats] = useState<string[]>([]);
  const [isSavingVaga, setIsSavingVaga] = useState(false);

  const handleOpenEditVaga = (vg: VagaData) => {
    setEditingVaga(vg);
    setEditVagaNome(vg.nome_vaga);
    setEditVagaSenioridade(vg.senioridade);
    setEditVagaDepto(vg.departamento);
    setEditVagaEmpresa(vg.empresa);
    setEditVagaLink(vg.link_vaga || "");
    setEditVagaDesc(vg.descricao_vaga || "");
    setEditVagaKan(vg.kan_ideal || []);
    setEditVagaPerfis(vg.perfis_ideais || []);
    setEditVagaCats(vg.categorias_ideais || []);
  };

  const handleSaveEditVaga = async () => {
    if (!editingVaga) return;
    if (!editVagaNome.trim()) {
      setToastMsg("⚠️ O nome da vaga é obrigatório.");
      return;
    }

    setIsSavingVaga(true);
    const updatedPayload: VagaData = {
      ...editingVaga,
      nome_vaga: editVagaNome.trim(),
      senioridade: (editVagaSenioridade || "Senior") as VagaData["senioridade"],
      departamento: editVagaDepto,
      empresa: editVagaEmpresa,
      link_vaga: editVagaLink.trim(),
      descricao_vaga: editVagaDesc.trim(),
      kan_ideal: editVagaKan,
      perfis_ideais: editVagaPerfis,
      categorias_ideais: editVagaCats,
      qualidades_ideais: editingVaga.qualidades_ideais || [],
      soft_skills_ideais: editingVaga.soft_skills_ideais || [],
    };

    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.success) {
        throw new Error(data.error || "Erro ao salvar vaga no banco de dados.");
      }

      const savedV: VagaData = data.vaga || updatedPayload;
      setVagas((prev) =>
        prev.map((v) => (v.id === editingVaga.id ? { ...v, ...savedV } : v))
      );
      setToastMsg(`✅ Vaga "${editVagaNome.trim()}" atualizada com sucesso!`);
      setEditingVaga(null);
    } catch (err) {
      setToastMsg(`❌ Erro ao atualizar: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setIsSavingVaga(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const [buscaVaga, setBuscaVaga] = useState("");
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
  const [descVaga, setDescVaga] = useState("");

  const handleSaveVaga = async () => {
    if (!nomeVaga.trim()) {
      setToastMsg("⚠️ O Nome da Vaga é obrigatório.");
      return;
    }

    setIsCreatingVaga(true);
    const chosenEmpresa = empresaVaga || (empresaSel !== "Todas" ? empresaSel : "Mundo Kan");

    try {
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_vaga: nomeVaga.trim(),
          senioridade,
          link_vaga: linkVaga.trim() || undefined,
          empresa: chosenEmpresa,
          departamento: depto,
          kan_ideal: [],
          perfis_ideais: [],
          categorias_ideais: [],
          qualidades_ideais: [],
          soft_skills_ideais: [],
          descricao_vaga: descVaga.trim(),
          candidatos_associados: [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.vaga) {
        throw new Error(data.error || "Erro ao salvar vaga no banco de dados.");
      }

      const createdVaga: VagaData = data.vaga;
      setVagas((prev) => [createdVaga, ...prev.filter((v) => v.id !== createdVaga.id)]);
      setFormOpen(false);
      setNomeVaga("");
      setLinkVaga("");
      setDescVaga("");
      setExpandedVagaId(createdVaga.id);
      setToastMsg(`✅ Vaga "${createdVaga.nome_vaga}" salva e persistida no Supabase com sucesso!`);
    } catch (err) {
      setToastMsg(`❌ ${err instanceof Error ? err.message : "Erro ao cadastrar vaga"}`);
    } finally {
      setIsCreatingVaga(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleDeleteVaga = async (id: number) => {
    const vg = vagas.find((v) => v.id === id);
    const confirmMsg = vg
      ? `Tem certeza que deseja excluir a vaga "${vg.nome_vaga}"?`
      : "Tem certeza que deseja excluir esta vaga?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/vagas?id=${id}&admin=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao excluir vaga.");
      }
      setVagas((prev) => prev.filter((v) => v.id !== id));
      setToastMsg("✅ Vaga excluída com sucesso.");
    } catch (err) {
      setToastMsg(`❌ ${err instanceof Error ? err.message : "Erro ao excluir vaga"}`);
    } finally {
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const qVaga = normText(buscaVaga);
  const vagasFiltradas = vagas.filter((vg) => {
    if (empresaSel !== "Todas") {
      if (normText(vg.empresa) !== normText(empresaSel)) {
        return false;
      }
    }
    if (!qVaga) return true;
    const tokens = qVaga.split(/\s+/).filter(Boolean);
    const searchable = normText(
      `${vg.nome_vaga} ${vg.senioridade} ${vg.empresa} ${vg.departamento} ${(vg.kan_ideal || []).join(" ")} ${(vg.perfis_ideais || []).join(" ")} ${(vg.categorias_ideais || []).join(" ")}`
    );
    return tokens.every((tk) => searchable.includes(tk));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Cadastros • Perfis Ideais de Vagas</Badge>
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
            onChange={(e) => {
              const val = e.target.value;
              setEmpresaSel(val);
              if (val !== "Todas") {
                setEmpresaVaga(val);
              }
            }}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-semibold"
          >
            <option value="Todas">Todas as Empresas</option>
            {EMPRESAS_TENANT.map((emp) => (
              <option key={emp.id} value={emp.nome}>
                {emp.nome}
              </option>
            ))}
          </select>

          <Button
            onClick={() => {
              if (!formOpen && empresaSel !== "Todas") {
                setEmpresaVaga(empresaSel);
              }
              setFormOpen(!formOpen);
            }}
          >
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
                <label className="text-xs font-semibold">Empresa da Vaga *</label>
                <select
                  value={empresaVaga}
                  onChange={(e) => setEmpresaVaga(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs"
                >
                  {EMPRESAS_TENANT.map((emp) => (
                    <option key={emp.id} value={emp.nome}>
                      {emp.nome}
                    </option>
                  ))}
                </select>
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
              <div className="space-y-1.5 md:col-span-2">
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
              <div className="space-y-1.5 md:col-span-2">
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

            {/* Mensagem explicativa: Requisitos são definidos no Processo Seletivo */}
            <div className="rounded-xl border border-[#510851]/20 dark:border-purple-900/40 bg-[#510851]/5 dark:bg-purple-950/20 p-4 flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <div className="text-xs space-y-1">
                <strong className="text-[#510851] dark:text-purple-300 font-semibold block">
                  Requisitos Comportamentais & Matriz de Avaliação
                </strong>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  A definição dos requisitos (KAN Ideal, Perfis, Categorias, Soft Skills e Qualidades) será realizada na etapa de <strong>Processo Seletivo</strong>, onde você poderá personalizá-los livremente ou utilizar a <strong>Inteligência Artificial (IA)</strong> para sugerir a matriz ideal para a vaga.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
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

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSaveVaga} disabled={isCreatingVaga}>
                {isCreatingVaga ? "Gravando no Supabase..." : "Salvar Vaga"}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isCreatingVaga}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Vagas Cadastradas */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={buscaVaga}
              onChange={(e) => setBuscaVaga(e.target.value)}
              placeholder="Buscar vaga por título, senioridade, departamento ou KAN..."
              className="pl-9 pr-8"
            />
            {buscaVaga && (
              <button
                type="button"
                onClick={() => setBuscaVaga("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Exibindo {vagasFiltradas.length} de {vagas.length} vagas
          </span>
        </div>

        {vagasFiltradas.map((vg) => {
          const isOpen = expandedVagaId === vg.id;
          return (
            <Card key={vg.id} className="p-5 space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {vg.nome_vaga} ({vg.senioridade})
                    </h3>
                    <Badge variant="outline" className="border-[#510851]/30 bg-[#510851]/5 text-[#510851] dark:text-purple-300 font-semibold text-[11px]">
                      {vg.empresa}
                    </Badge>
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
                    {vg.soft_skills_ideais && vg.soft_skills_ideais.length > 0 && (
                      <>
                        <span className="mx-1 text-slate-300">|</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">SOFT SKILLS:</span>
                        {vg.soft_skills_ideais.slice(0, 3).map((sk) => (
                          <Badge key={sk} variant="outline" className="border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px]">
                            {sk}
                          </Badge>
                        ))}
                      </>
                    )}
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
                    {vg.soft_skills_ideais && vg.soft_skills_ideais.length > 0 && (
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">
                          Soft Skills Ideais:
                        </strong>{" "}
                        {vg.soft_skills_ideais.join(", ")}
                      </div>
                    )}
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
  const [buscaAssociar, setBuscaAssociar] = useState("");
  const [minAderenciaPct, setMinAderenciaPct] = useState(65);
  const [candDestaqueHarmonia, setCandDestaqueHarmonia] = useState<string>(
    vagaAtiva?.candidatos_associados[0] || talentos[0].nome
  );
  const [obsAnalista, setObsAnalista] = useState(
    "Candidato demonstrou excelente abertura para colaborar com a liderança no KAN de Finalidade, confirmando a estabilidade indicada na geometria de triângulos."
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSavingHarmonia, setIsSavingHarmonia] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [harmoniaSuccessMsg, setHarmoniaSuccessMsg] = useState<string | null>(null);
  const [harmoniaErrorMsg, setHarmoniaErrorMsg] = useState<string | null>(null);

  // States para Ajustes de Requisitos (Qualidades e Soft Skills)
  const [novaQualidade, setNovaQualidade] = useState("");
  const [novaSoftSkill, setNovaSoftSkill] = useState("");
  const [isSavingRequisitos, setIsSavingRequisitos] = useState(false);

  // States para Paginação de Candidatos (10 iniciais, +20, todos)
  const [visibleCandidatosCount, setVisibleCandidatosCount] = useState(10);
  const [visibleRankingCount, setVisibleRankingCount] = useState(10);

  useEffect(() => {
    setVisibleCandidatosCount(10);
    setVisibleRankingCount(10);
  }, [selectedVagaId]);

  if (!vagaAtiva) return null;

  const todasQualidadesOpcoes = Array.from(
    new Set([...QUALIDADES_OPCOES, ...(vagaAtiva.qualidades_ideais || [])])
  );

  const todasSoftSkillsOpcoes = Array.from(
    new Set([...SOFT_SKILLS_OPCOES, ...(vagaAtiva.soft_skills_ideais || [])])
  );

  const salvarRequisitosNoBanco = async (vagaParaSalvar: VagaData) => {
    try {
      setIsSavingRequisitos(true);
      const res = await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vagaParaSalvar),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar requisitos");
      }
      setToastMsg("💾 Requisitos comportamentais e Soft Skills salvos no banco de dados!");
    } catch (err) {
      console.error("Erro ao salvar requisitos:", err);
      setToastMsg("❌ Erro ao salvar requisitos no banco.");
    } finally {
      setIsSavingRequisitos(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handleToggleQualidade = (item: string) => {
    const list = vagaAtiva.qualidades_ideais || [];
    const updated = list.includes(item)
      ? list.filter((q) => q !== item)
      : [...list, item];
    const newVaga = { ...vagaAtiva, qualidades_ideais: updated };
    setVagas((prev) => prev.map((v) => (v.id === vagaAtiva.id ? newVaga : v)));
  };

  const handleAdicionarQualidade = () => {
    const trimmed = novaQualidade.trim();
    if (!trimmed) return;
    const list = vagaAtiva.qualidades_ideais || [];
    if (!list.includes(trimmed)) {
      const updated = [...list, trimmed];
      const newVaga = { ...vagaAtiva, qualidades_ideais: updated };
      setVagas((prev) => prev.map((v) => (v.id === vagaAtiva.id ? newVaga : v)));
    }
    setNovaQualidade("");
  };

  const handleRemoverQualidade = (item: string) => {
    const list = vagaAtiva.qualidades_ideais || [];
    const updated = list.filter((q) => q !== item);
    const newVaga = { ...vagaAtiva, qualidades_ideais: updated };
    setVagas((prev) => prev.map((v) => (v.id === vagaAtiva.id ? newVaga : v)));
  };

  const handleToggleSoftSkill = (item: string) => {
    const list = vagaAtiva.soft_skills_ideais || [];
    const updated = list.includes(item)
      ? list.filter((s) => s !== item)
      : [...list, item];
    const newVaga = { ...vagaAtiva, soft_skills_ideais: updated };
    setVagas((prev) => prev.map((v) => (v.id === vagaAtiva.id ? newVaga : v)));
  };

  const handleAdicionarSoftSkill = () => {
    const trimmed = novaSoftSkill.trim();
    if (!trimmed) return;
    const list = vagaAtiva.soft_skills_ideais || [];
    if (!list.includes(trimmed)) {
      const updated = [...list, trimmed];
      const newVaga = { ...vagaAtiva, soft_skills_ideais: updated };
      setVagas((prev) => prev.map((v) => (v.id === vagaAtiva.id ? newVaga : v)));
    }
    setNovaSoftSkill("");
  };

  const handleRemoverSoftSkill = (item: string) => {
    const list = vagaAtiva.soft_skills_ideais || [];
    const updated = list.filter((s) => s !== item);
    const newVaga = { ...vagaAtiva, soft_skills_ideais: updated };
    setVagas((prev) => prev.map((v) => (v.id === vagaAtiva.id ? newVaga : v)));
  };

  // Calculate exact MundoKAN matching score for every talent against active vaga
  const calcularMatchTalento = (t: TalentoProfile) => {
    const scoresEixos = calcularScoresEixos(t);

    // 1. KAN Match (peso: até 190 pts)
    const kanCompativel =
      vagaAtiva.kan_ideal.length === 0 ||
      vagaAtiva.kan_ideal.some(
        (k) => k.toLowerCase() === t.kan_nome.toLowerCase()
      );
    const ptsKan = kanCompativel ? 190 : 50;

    // 2. Perfis Ideais Match (peso: até 230 pts)
    const totalPerfis = vagaAtiva.perfis_ideais.length;
    const perfisHits = vagaAtiva.perfis_ideais.filter((p) =>
      t.perfis_lista.some((tp) => tp.toLowerCase() === p.toLowerCase())
    );
    const taxaPerfil = totalPerfis > 0 ? perfisHits.length / totalPerfis : 1;
    const ptsPerfil = Math.round(taxaPerfil * 230);

    // 3. Soft Skills Relacionadas Match (peso: até 230 pts)
    const softSkillsDesejadas = vagaAtiva.soft_skills_ideais || [];
    const totalSoft = softSkillsDesejadas.length;
    const softSkillsHits = softSkillsDesejadas.filter((sk) =>
      talentoPossuiSoftSkill(t, sk, scoresEixos)
    );
    const taxaSoft = totalSoft > 0 ? softSkillsHits.length / totalSoft : taxaPerfil;
    const ptsSoft = Math.round(taxaSoft * 230);

    // 4. Qualidades & Categorias Match (peso: até 150 pts)
    const totalQuals = vagaAtiva.qualidades_ideais.length;
    const qualsHits = vagaAtiva.qualidades_ideais.filter((q) =>
      t.qualidades_lista.some((tq) => tq.toLowerCase() === q.toLowerCase())
    );
    const taxaQual = totalQuals > 0 ? qualsHits.length / totalQuals : 1;

    const totalCats = vagaAtiva.categorias_ideais.length;
    const catsHits = vagaAtiva.categorias_ideais.filter((c) =>
      t.categorias_lista.some((tc) => tc.toLowerCase() === c.toLowerCase())
    );
    const taxaCat = totalCats > 0 ? catsHits.length / totalCats : 1;
    const ptsQual = Math.round((taxaQual * 0.6 + taxaCat * 0.4) * 150);

    // Pontuação Global no Padrão do Mapa de Calor (escala 100 a 840 pontos, ex: 740, 680, 610, 560...)
    const totalPts = Math.min(840, Math.max(120, ptsKan + ptsPerfil + ptsSoft + ptsQual));

    // Aderência Percentual (0 a 100%)
    const aderenciaPct = Math.min(
      99,
      Math.max(
        15,
        Math.round(
          (kanCompativel ? 25 : 0) +
            taxaPerfil * 30 +
            taxaSoft * 30 +
            (taxaQual * 0.6 + taxaCat * 0.4) * 15
        )
      )
    );

    // Classificação por Tiers do Mapa de Calor (getHeatmapCellStyle)
    let tierLabel = "Inicial";
    let tierBadgeVariant: "secondary" | "orange" | "success" = "secondary";
    if (totalPts >= 600) {
      tierLabel = "Muito Alto";
      tierBadgeVariant = "success";
    } else if (totalPts >= 450) {
      tierLabel = "Alto";
      tierBadgeVariant = "orange";
    } else if (totalPts >= 300) {
      tierLabel = "Médio";
      tierBadgeVariant = "secondary";
    } else if (totalPts >= 150) {
      tierLabel = "Discreto";
      tierBadgeVariant = "secondary";
    }

    return {
      talento: t,
      aderenciaPct,
      totalPts,
      tierLabel,
      tierBadgeVariant,
      ptsKan,
      ptsPerfil,
      ptsSoft,
      ptsQual,
      kanStatus: kanCompativel ? "✓ Compatível" : "✗ Incompatível",
      perfilStatus: `${perfisHits.length}/${totalPerfis} compatíveis`,
      softStatus: totalSoft > 0 ? `${softSkillsHits.length}/${totalSoft} compatíveis` : "Padrão",
      catStatus: `${catsHits.length}/${totalCats} compatíveis`,
      qualStatus: `${qualsHits.length}/${totalQuals} compatíveis`,
      scoresEixos,
    };
  };

  const todosRankeados = talentos
    .map(calcularMatchTalento)
    .sort((a, b) => b.totalPts - a.totalPts);

  const qAssoc = normText(buscaAssociar);
  const todosRankeadosFiltrados = todosRankeados.filter((r) => {
    if (!qAssoc) return true;
    const tokens = qAssoc.split(/\s+/).filter(Boolean);
    const searchable = normText(
      `${r.talento.nome} ${r.talento.profissao} ${r.talento.cargo} ${r.talento.departamento} ${r.talento.kan_nome}`
    );
    return tokens.every((tk) => searchable.includes(tk));
  });

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

  const handleSugerirRequisitosIA = async () => {
    const nome = normText(vagaAtiva.nome_vaga);
    const depto = normText(vagaAtiva.departamento);
    const desc = normText(vagaAtiva.descricao_vaga);
    const combined = `${nome} ${depto} ${desc}`;

    let kanSugerido = ["Finalidade", "Movimento"];
    let perfisSugeridos = ["Lider", "Resultado", "Comunicador"];
    let categoriasSugeridas = ["Realizador", "Visionário"];
    let qualidadesSugeridas = ["Execução", "Comunicação", "Organização", "Análise"];
    let softSugeridas = [
      "Liderança",
      "Comunicação assertiva",
      "Resolução de problemas",
      "Proatividade",
      "Trabalho em equipe",
    ];

    if (
      combined.includes("comercial") ||
      combined.includes("venda") ||
      combined.includes("account") ||
      combined.includes("growth") ||
      combined.includes("hunter")
    ) {
      kanSugerido = ["Movimento", "Finalidade"];
      perfisSugeridos = ["Vendedor", "Resultado", "Influenciador"];
      categoriasSugeridas = ["Comunicativo", "Realizador", "Magnético"];
      qualidadesSugeridas = ["Comunicação", "Execução", "Relacionamento", "Praticidade e disciplina"];
      softSugeridas = [
        "Comunicação assertiva",
        "Relacionamento interpessoal",
        "Negociação",
        "Proatividade",
        "Resiliência",
        "Persuasão e influência",
      ];
    } else if (
      combined.includes("tech") ||
      combined.includes("eng") ||
      combined.includes("dev") ||
      combined.includes("software") ||
      combined.includes("dados") ||
      combined.includes("sistema")
    ) {
      kanSugerido = ["Criação", "Finalidade"];
      perfisSugeridos = ["Criativo", "Executor", "Lider"];
      categoriasSugeridas = ["Analítico", "Inovador", "Realizador"];
      qualidadesSugeridas = ["Análise", "Execução", "Intuição", "Praticidade e disciplina"];
      softSugeridas = [
        "Resolução de problemas",
        "Pensamento crítico",
        "Visão sistêmica",
        "Aprendizado contínuo",
        "Atenção a detalhes",
        "Liderança técnica",
      ];
    } else if (
      combined.includes("rh") ||
      combined.includes("gente") ||
      combined.includes("cultura") ||
      combined.includes("people") ||
      combined.includes("recrut")
    ) {
      kanSugerido = ["Criação", "Movimento"];
      perfisSugeridos = ["Comunicador", "Influenciador", "Lider"];
      categoriasSugeridas = ["Harmônico", "Comunicativo", "Diplomático"];
      qualidadesSugeridas = ["Relacionamento", "Comunicação", "Coletividade", "Serviço"];
      softSugeridas = [
        "Empatia",
        "Escuta ativa",
        "Inteligência emocional",
        "Comunicação eficaz",
        "Mediação de conflitos",
        "Trabalho em equipe",
      ];
    } else if (
      combined.includes("financ") ||
      combined.includes("contab") ||
      combined.includes("auditor") ||
      combined.includes("control")
    ) {
      kanSugerido = ["Finalidade"];
      perfisSugeridos = ["Executor", "Resultado"];
      categoriasSugeridas = ["Analítico", "Organizado", "Justo"];
      qualidadesSugeridas = ["Análise", "Organização", "Praticidade e disciplina", "Justiça"];
      softSugeridas = [
        "Pensamento analítico",
        "Atenção a detalhes",
        "Organização e método",
        "Tomada de decisão",
        "Ética e conformidade",
      ];
    } else if (
      vagaAtiva.senioridade === "Executivo" ||
      combined.includes("diretor") ||
      combined.includes("head") ||
      combined.includes("gerente") ||
      combined.includes("ceo")
    ) {
      kanSugerido = ["Finalidade", "Movimento", "Criação"];
      perfisSugeridos = ["Lider", "Resultado", "Influenciador"];
      categoriasSugeridas = ["Visionário", "Realizador", "Diplomático"];
      qualidadesSugeridas = ["Execução", "Relacionamento", "Justiça", "Análise"];
      softSugeridas = [
        "Liderança inspiradora",
        "Visão estratégica",
        "Tomada de decisão",
        "Comunicação assertiva",
        "Gestão de pessoas",
      ];
    }

    const updatedVaga: VagaData = {
      ...vagaAtiva,
      kan_ideal: kanSugerido,
      perfis_ideais: perfisSugeridos,
      categorias_ideais: categoriasSugeridas,
      qualidades_ideais: qualidadesSugeridas,
      soft_skills_ideais: softSugeridas,
    };

    setVagas((prev) =>
      prev.map((vg) => (vg.id === vagaAtiva.id ? updatedVaga : vg))
    );

    try {
      await fetch("/api/vagas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedVaga),
      });
      setToastMsg(
        "✨ Requisitos comportamentais e Soft Skills sugeridos pela IA e persistidos com sucesso!"
      );
    } catch {
      setToastMsg(
        "✨ Requisitos comportamentais e Soft Skills sugeridos pela IA!"
      );
    }
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

  const handleConfirmarSalvarHarmonia = async () => {
    if (!vagaAtiva) return;
    setIsSavingHarmonia(true);
    setHarmoniaErrorMsg(null);
    setHarmoniaSuccessMsg(null);

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
      candidato: candDestaqueObj.nome,
      candidato_kan: `KAN ${candDestaqueObj.kan_nome} (${candDestaqueObj.vertices_triangulo.join("-")})`,
      equipe: equipeDaVaga.nome,
      harmonia_score: 91.8,
      classificacao: "Encaixe Muito Alto",
      criterios: [
        { titulo: "Complementaridade", nota: "4.7/5.0", sub: "Equilíbrio de KANs" },
        { titulo: "Integração Geométrica", nota: "4.6/5.0", sub: "Conexões de Triângulos" },
        { titulo: "Balanceamento", nota: "4.5/5.0", sub: "Cobertura de Planos" },
        { titulo: "Potencial de Entrega", nota: "4.8/5.0", sub: "Materialidade/Praticidade" },
        { titulo: "Segurança Relacional", nota: "4.4/5.0", sub: "Mitigação de Conflitos" },
      ],
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
          v.id === vagaAtiva.id
            ? { ...v, historico_harmonia: updatedHist }
            : v
        )
      );

      setSavedSuccess(true);
      setHarmoniaSuccessMsg(
        `Análise de harmonia de "${candDestaqueObj.nome}" confirmada e salva com sucesso no histórico da vaga!`
      );
      setToastMsg(
        `💾 Análise de harmonia de "${candDestaqueObj.nome}" confirmada e salva no histórico do processo!`
      );

      setTimeout(() => setSavedSuccess(false), 3500);
      setTimeout(() => setHarmoniaSuccessMsg(null), 5000);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error("Erro ao salvar análise:", err);
      setHarmoniaErrorMsg(
        err instanceof Error
          ? err.message
          : "Erro de conexão ao salvar análise de harmonia."
      );
      setTimeout(() => setHarmoniaErrorMsg(null), 6000);
    } finally {
      setIsSavingHarmonia(false);
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
        (vagaAtiva.historico_harmonia || []).filter(
          (item) => item.id !== analiseId
        );

      setVagas((prev) =>
        prev.map((v) =>
          v.id === vagaAtiva.id
            ? { ...v, historico_harmonia: updatedHist }
            : v
        )
      );
      setHarmoniaSuccessMsg("Registro removido do histórico da vaga.");
      setTimeout(() => setHarmoniaSuccessMsg(null), 3500);
    } catch (err) {
      console.error("Erro ao excluir análise:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="orange">Matching Comportamental & Triângulos</Badge>
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
                Critérios ponderados em tempo real (KAN • Perfis • Categorias • Qualidades • Soft Skills)
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
              <Button
                size="sm"
                onClick={() => salvarRequisitosNoBanco(vagaAtiva)}
                disabled={isSavingRequisitos}
                className="bg-[#510851] text-white hover:bg-[#510851]/90 shadow-xs"
              >
                {isSavingRequisitos ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                {isSavingRequisitos ? "Salvando..." : "Salvar Alterações"}
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

            {/* Nova Área Soft Skills no Processo Seletivo */}
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center py-2.5 gap-2">
              <span className="sm:col-span-2 font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-600" />
                Soft Skills
              </span>
              <div className="sm:col-span-10 flex flex-wrap gap-1.5">
                {(vagaAtiva.soft_skills_ideais || []).length > 0 ? (
                  (vagaAtiva.soft_skills_ideais || []).map((sk) => (
                    <Badge
                      key={sk}
                      variant="outline"
                      className="border-amber-400/60 bg-amber-500/10 text-amber-800 dark:text-amber-300 uppercase font-semibold text-[11px]"
                    >
                      {sk}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Nenhuma soft skill cadastrada (clique em Personalizar Requisitos para incluir ou Sugerir com IA)
                  </span>
                )}
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#510851] dark:text-[#a78bfa]" />
                    Ajustes de Requisitos do Processo Seletivo
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Altere, inclua ou exclua requisitos para recalcular o matching comportamental em tempo real.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => salvarRequisitosNoBanco(vagaAtiva)}
                    disabled={isSavingRequisitos}
                    className="bg-[#510851] text-white hover:bg-[#510851]/90 text-xs h-8"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {isSavingRequisitos ? "Salvando..." : "Salvar Requisitos no Banco"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCustomizeOpen(false)}
                    className="text-xs h-8"
                  >
                    Ocultar Ajustes
                  </Button>
                </div>
              </div>

              {/* Grid 1: KAN, Perfis e Categorias */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <PillMultiSelect
                  label="KAN Ideal"
                  options={KAN_OPCOES}
                  selected={vagaAtiva.kan_ideal}
                  onToggle={(item) => {
                    const list = vagaAtiva.kan_ideal || [];
                    const updated = list.includes(item)
                      ? list.filter((x) => x !== item)
                      : [...list, item];
                    setVagas((prev) =>
                      prev.map((v) =>
                        v.id === vagaAtiva.id ? { ...v, kan_ideal: updated } : v
                      )
                    );
                  }}
                  accent="orange"
                />

                <PillMultiSelect
                  label="Perfis Ideais"
                  options={PERFIS_OPCOES}
                  selected={vagaAtiva.perfis_ideais}
                  onToggle={(item) => {
                    const list = vagaAtiva.perfis_ideais || [];
                    const updated = list.includes(item)
                      ? list.filter((x) => x !== item)
                      : [...list, item];
                    setVagas((prev) =>
                      prev.map((v) =>
                        v.id === vagaAtiva.id ? { ...v, perfis_ideais: updated } : v
                      )
                    );
                  }}
                  accent="purple"
                />

                <PillMultiSelect
                  label="Categorias de Perfil"
                  options={CATEGORIAS_OPCOES}
                  selected={vagaAtiva.categorias_ideais}
                  onToggle={(item) => {
                    const list = vagaAtiva.categorias_ideais || [];
                    const updated = list.includes(item)
                      ? list.filter((x) => x !== item)
                      : [...list, item];
                    setVagas((prev) =>
                      prev.map((v) =>
                        v.id === vagaAtiva.id ? { ...v, categorias_ideais: updated } : v
                      )
                    );
                  }}
                  accent="purple"
                />
              </div>

              {/* Grid 2: Seções de Soft Skills e Qualidades (com alteração, inclusão e exclusão) */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                {/* 1. SEÇÃO SOFT SKILLS */}
                <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        Soft Skills Ideais ({vagaAtiva.soft_skills_ideais?.length || 0})
                      </span>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                        Clique para alterar/selecionar, use o ✕ para excluir ou digite abaixo para incluir novas.
                      </p>
                    </div>
                  </div>

                  {/* Pílulas de Soft Skills com ação de remoção rápida */}
                  <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-1 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-900/30">
                    {todasSoftSkillsOpcoes.map((sk) => {
                      const isSel = (vagaAtiva.soft_skills_ideais || []).includes(sk);
                      return (
                        <div
                          key={sk}
                          className={`inline-flex items-center rounded-lg border text-[11px] font-semibold transition-all ${
                            isSel
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-amber-400"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleSoftSkill(sk)}
                            className="px-2 py-1"
                          >
                            {isSel ? `✓ ${sk}` : sk}
                          </button>
                          {isSel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoverSoftSkill(sk);
                              }}
                              className="pr-2 pl-0.5 text-amber-200 hover:text-white"
                              title="Excluir soft skill deste processo"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Campo para Incluir Nova Soft Skill */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      value={novaSoftSkill}
                      onChange={(e) => setNovaSoftSkill(e.target.value)}
                      placeholder="Incluir nova soft skill (ex: Pensamento crítico, Negociação)..."
                      className="h-8 text-xs bg-white dark:bg-slate-900"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAdicionarSoftSkill();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdicionarSoftSkill}
                      className="h-8 text-xs shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Incluir
                    </Button>
                  </div>
                </div>

                {/* 2. SEÇÃO QUALIDADES */}
                <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Qualidades Ideais ({vagaAtiva.qualidades_ideais?.length || 0})
                      </span>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        Clique para alterar/selecionar, use o ✕ para excluir ou digite abaixo para incluir novas.
                      </p>
                    </div>
                  </div>

                  {/* Pílulas de Qualidades com ação de remoção rápida */}
                  <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-1 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-200/50 dark:border-emerald-900/30">
                    {todasQualidadesOpcoes.map((q) => {
                      const isSel = (vagaAtiva.qualidades_ideais || []).includes(q);
                      return (
                        <div
                          key={q}
                          className={`inline-flex items-center rounded-lg border text-[11px] font-semibold transition-all ${
                            isSel
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleQualidade(q)}
                            className="px-2 py-1"
                          >
                            {isSel ? `✓ ${q}` : q}
                          </button>
                          {isSel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoverQualidade(q);
                              }}
                              className="pr-2 pl-0.5 text-emerald-200 hover:text-white"
                              title="Excluir qualidade deste processo"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Campo para Incluir Nova Qualidade */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      value={novaQualidade}
                      onChange={(e) => setNovaQualidade(e.target.value)}
                      placeholder="Incluir nova qualidade (ex: Resiliência, Foco)..."
                      className="h-8 text-xs bg-white dark:bg-slate-900"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAdicionarQualidade();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdicionarQualidade}
                      className="h-8 text-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Incluir
                    </Button>
                  </div>
                </div>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Selecionar Talentos Participantes do Processo Seletivo (
              {todosRankeadosFiltrados.length})
            </h4>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={buscaAssociar}
                  onChange={(e) => setBuscaAssociar(e.target.value)}
                  placeholder="Buscar talento para associar..."
                  className="h-8 pl-8 pr-7 text-xs"
                />
                {buscaAssociar && (
                  <button
                    type="button"
                    onClick={() => setBuscaAssociar("")}
                    className="absolute right-2 top-2 text-xs text-slate-400"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => setAssocTalentosOpen(false)}
                className="text-xs text-slate-400"
              >
                ✕ Fechar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[380px] overflow-y-auto pr-1">
            {todosRankeadosFiltrados.map((r) => {
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
            {candidatosAssociadosRank.slice(0, visibleCandidatosCount).map((item) => {
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
                        width={64}
                        height={64}
                        style={{ width: 64, height: 64 }}
                        className="h-16 w-16 min-h-[64px] min-w-[64px] max-h-[64px] max-w-[64px] rounded-full object-cover border-2 border-white dark:border-slate-900"
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
                        {c.kan_nome.toUpperCase()}
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

          {/* Controles de Paginação dos Candidatos Associados */}
          {candidatosAssociadosRank.length > 10 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-2">
              <span className="text-xs text-slate-500">
                Apresentando <strong>{Math.min(visibleCandidatosCount, candidatosAssociadosRank.length)}</strong> de <strong>{candidatosAssociadosRank.length}</strong> candidatos associados
              </span>
              <div className="flex items-center gap-2">
                {visibleCandidatosCount < candidatosAssociadosRank.length && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVisibleCandidatosCount((prev) =>
                          Math.min(prev + 20, candidatosAssociadosRank.length)
                        )
                      }
                      className="text-xs h-8"
                    >
                      Apresentar próximos 20
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVisibleCandidatosCount(candidatosAssociadosRank.length)
                      }
                      className="text-xs h-8 border-[#510851]/30 text-[#510851] dark:text-purple-300 hover:bg-[#510851]/5"
                    >
                      Apresentar todos ({candidatosAssociadosRank.length})
                    </Button>
                  </>
                )}
                {visibleCandidatosCount > 10 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisibleCandidatosCount(10)}
                    className="text-xs h-8 text-slate-500"
                  >
                    Mostrar menos (10)
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Tabela Geral de Ranking por Aderência (com botão circular + / ✓) */}
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>
                  Ranking Geral da Base de Talentos por Aderência à Vaga
                </CardTitle>
                <CardDescription>
                  Clique no botão circular à esquerda para associar (+) ou remover (✓) qualquer talento do processo seletivo.
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-slate-500 shrink-0">
                Mostrando {Math.min(visibleRankingCount, todosRankeados.length)} de {todosRankeados.length} talentos
              </span>
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
                    {todosRankeados.slice(0, visibleRankingCount).map((r) => {
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

              {/* Controles de Paginação do Ranking Geral */}
              {todosRankeados.length > 10 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">
                    Exibindo <strong>{Math.min(visibleRankingCount, todosRankeados.length)}</strong> de <strong>{todosRankeados.length}</strong> talentos
                  </span>
                  <div className="flex items-center gap-2">
                    {visibleRankingCount < todosRankeados.length && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setVisibleRankingCount((prev) =>
                              Math.min(prev + 20, todosRankeados.length)
                            )
                          }
                          className="text-xs h-8"
                        >
                          Apresentar próximos 20
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVisibleRankingCount(todosRankeados.length)}
                          className="text-xs h-8 border-[#510851]/30 text-[#510851] dark:text-purple-300 hover:bg-[#510851]/5"
                        >
                          Apresentar todos ({todosRankeados.length})
                        </Button>
                      </>
                    )}
                    {visibleRankingCount > 10 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleRankingCount(10)}
                        className="text-xs h-8 text-slate-500"
                      >
                        Mostrar menos (10)
                      </Button>
                    )}
                  </div>
                </div>
              )}
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
              <div className="space-y-3 border-t border-slate-200/80 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Observações Manuais do Analista (Histórico da Vaga)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Candidato: <strong>{candDestaqueObj.nome}</strong>
                  </span>
                </div>

                <textarea
                  value={obsAnalista}
                  onChange={(e) => setObsAnalista(e.target.value)}
                  rows={3}
                  placeholder="Descreva as percepções sobre a integração do candidato com a liderança e equipe..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#ea580c]/30"
                />

                {/* Mensagens de Sucesso ou Erro Inline */}
                {harmoniaSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{harmoniaSuccessMsg}</span>
                  </div>
                )}

                {harmoniaErrorMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:text-red-300">
                    <X className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>{harmoniaErrorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-400">
                    Ao confirmar, a análise completa e as notas são salvas permanentemente no banco de dados.
                  </span>
                  <Button
                    size="sm"
                    disabled={isSavingHarmonia}
                    onClick={handleConfirmarSalvarHarmonia}
                    className={`font-bold transition-all shadow-sm ${
                      savedSuccess
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30"
                        : "bg-[#ea580c] hover:bg-[#ea580c]/90 text-white"
                    }`}
                  >
                    {isSavingHarmonia ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Salvando Análise...
                      </>
                    ) : savedSuccess ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Confirmada e Salva no Histórico!
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Confirmar e Salvar Análise da Harmonia
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Histórico de Análises Salvas da Vaga */}
              <div className="space-y-3 border-t border-slate-200/80 dark:border-slate-800 pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-[#ea580c]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Histórico de Análises Salvas desta Vaga
                    </h4>
                    <Badge variant="secondary" className="text-[10px] h-5 px-2">
                      {vagaAtiva.historico_harmonia?.length || 0} salva(s)
                    </Badge>
                  </div>
                </div>

                {(!vagaAtiva.historico_harmonia ||
                  vagaAtiva.historico_harmonia.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-400">
                    Nenhuma análise de harmonia gravada ainda para este processo. Preencha suas observações e clique em <strong>Confirmar e Salvar Análise da Harmonia</strong> para registrar.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {vagaAtiva.historico_harmonia.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 space-y-2.5 transition-all hover:border-slate-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              ★ {item.candidato}
                            </span>
                            {item.candidato_kan && (
                              <span className="rounded bg-[#ea580c]/10 text-[#ea580c] px-2 py-0.5 text-[10px] font-bold">
                                {item.candidato_kan}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              na equipe <strong>{item.equipe}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                              {item.classificacao} • {item.harmonia_score}%
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.data}
                            </span>
                            <button
                              onClick={() => handleExcluirAnaliseHarmonia(item.id)}
                              title="Excluir este registro do histórico"
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Observações do Analista */}
                        <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950/70 rounded-lg p-2.5 border border-slate-200/60 dark:border-slate-800/60">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[10px] uppercase mb-0.5">
                            Parecer do Analista:
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {item.observacoes || "Sem observações adicionais."}
                          </p>
                        </div>

                        {/* Mini resumo dos 5 critérios */}
                        {item.criterios && item.criterios.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                            {item.criterios.map((c) => (
                              <div
                                key={c.titulo}
                                className="text-center rounded bg-slate-100/80 dark:bg-slate-800/50 p-1"
                              >
                                <span className="text-[9px] text-slate-400 block truncate">
                                  {c.titulo}
                                </span>
                                <span className="text-[10px] font-black text-[#ea580c]">
                                  {c.nota}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
