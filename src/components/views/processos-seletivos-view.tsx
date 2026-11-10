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
  Building2,
  Crown,
  Flame,
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
  EIXOS_COMPORTAMENTAIS,
  calcularScoresEixos,
  talentoPossuiSoftSkill,
  type VagaData,
  type AnaliseHarmoniaItem,
  type KanType,
  type TalentoProfile,
  type EquipeData,
} from "@/lib/mock-data";

type HeatmapPalette = "emerald" | "purple" | "orange";

const HEATMAP_PALETTES: Record<
  HeatmapPalette,
  {
    levels: [string, string, string, string, string];
    textColors: [string, string, string, string, string];
  }
> = {
  emerald: {
    levels: ["#e6f7ed", "#c3eed4", "#8ce2ad", "#42d374", "#009e3c"],
    textColors: ["#065f46", "#065f46", "#064e3b", "#ffffff", "#ffffff"],
  },
  purple: {
    levels: ["#f3e8ff", "#d8b4fe", "#a855f7", "#7e22ce", "#510851"],
    textColors: ["#581c87", "#581c87", "#ffffff", "#ffffff", "#ffffff"],
  },
  orange: {
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
    label: "Inicial",
    tier: 1,
  };
}

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
  const [assocDeptoOpen, setAssocDeptoOpen] = useState(false);
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
  const [isAllocatingCandidato, setIsAllocatingCandidato] = useState(false);

  // Modo de Diagnóstico na Aba 2: Equipe ou Departamento
  const [harmoniaTargetMode, setHarmoniaTargetMode] = useState<"equipe" | "departamento">("equipe");
  const [selectedHarmoniaDept, setSelectedHarmoniaDept] = useState<string>(
    vagaAtiva?.departamento || DEPARTAMENTOS_OPCOES[0]
  );
  const [departamentosHierarquia, setDepartamentosHierarquia] = useState<
    { departamento_id: string; nome: string; empresa?: string }[]
  >([]);
  const [showDiagnosticoCompletoHarmonia, setShowDiagnosticoCompletoHarmonia] =
    useState(true);

  // Estados do Mapa de Calor Interativo na Aba 2
  const [heatmapPalette, setHeatmapPalette] = useState<HeatmapPalette>("emerald");
  const [showHeatmapValues, setShowHeatmapValues] = useState(true);
  const [revealedAverageRows, setRevealedAverageRows] = useState<Record<string, boolean>>({});
  const [hoveredCell, setHoveredCell] = useState<{
    eixo: string;
    membro: string;
    pts: number;
    label: string;
    tier: number;
  } | null>(null);

  // States para Ajustes de Requisitos (Qualidades e Soft Skills)
  const [novaQualidade, setNovaQualidade] = useState("");
  const [novaSoftSkill, setNovaSoftSkill] = useState("");
  const [isSavingRequisitos, setIsSavingRequisitos] = useState(false);

  // States para Paginação de Candidatos (10 iniciais, +20, todos)
  const [visibleCandidatosCount, setVisibleCandidatosCount] = useState(10);
  const [visibleRankingCount, setVisibleRankingCount] = useState(10);

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

  useEffect(() => {
    setVisibleCandidatosCount(10);
    setVisibleRankingCount(10);
    if (vagaAtiva?.departamento) {
      setSelectedHarmoniaDept(vagaAtiva.departamento);
    }
  }, [selectedVagaId, vagaAtiva?.departamento]);

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

  // Team / Department Harmony data for Tab 2
  const equipeDaVaga =
    equipes.find((e) => e.nome === vagaAtiva.equipe_associada) || equipes[0];

  // Opções unificadas de Departamentos (Hierarquia do Organograma + Opções Padrão + Departamentos dos Talentos)
  const opcoesDepartamentos = Array.from(
    new Set(
      [
        vagaAtiva.departamento,
        ...departamentosHierarquia.map((d) => d.nome),
        ...DEPARTAMENTOS_OPCOES,
        ...talentos
          .map((t) => (t.departamento || "").trim())
          .filter((d) => d && !d.startsWith("dept-")),
      ].filter(Boolean)
    )
  );

  // Resolver membros do Departamento selecionado (comparando tanto pelo nome quanto pelo departamento_id da hierarquia)
  const deptoHierarquiaAtivo = departamentosHierarquia.find(
    (d) =>
      normText(d.nome) === normText(selectedHarmoniaDept) ||
      normText(d.departamento_id) === normText(selectedHarmoniaDept)
  );

  const membrosDoDepartamento: { talento: TalentoProfile; isLider: boolean }[] =
    talentos
      .filter((t) => {
        const tDept = normText(t.departamento);
        if (!tDept) return false;
        if (tDept === normText(selectedHarmoniaDept)) return true;
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

  const membrosDaEquipe: { talento: TalentoProfile; isLider: boolean }[] = (
    equipeDaVaga?.membros || []
  )
    .map((m) => {
      const info = talentos.find((t) => t.nome === m.nome);
      if (!info) return null;
      return { talento: info, isLider: Boolean(m.lider) };
    })
    .filter(Boolean) as { talento: TalentoProfile; isLider: boolean }[];

  const alvoMembrosAtuais =
    harmoniaTargetMode === "departamento"
      ? membrosDoDepartamento
      : membrosDaEquipe;

  const alvoNomeExibicao =
    harmoniaTargetMode === "departamento"
      ? selectedHarmoniaDept
      : equipeDaVaga?.nome || "Equipe";

  const alvoRotuloSalvo =
    harmoniaTargetMode === "departamento"
      ? `Depto: ${selectedHarmoniaDept}`
      : `Equipe: ${equipeDaVaga?.nome || "Geral"}`;

  const candDestaqueObj =
    talentos.find((t) => t.nome === candDestaqueHarmonia) || talentos[0];

  const triangleMembersWithCandidate = [
    ...alvoMembrosAtuais
      .filter((m) => m.talento.nome !== candDestaqueObj.nome)
      .map((m) => ({
        nome: m.talento.nome,
        vertices: m.talento.vertices_triangulo,
        isLider: m.isLider,
        isCandidatoDestaque: false,
      })),
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

  // Lista completa para Tabela Comparativa e Mapa de Calor: ★ Candidato em 1º lugar + Membros atuais do Departamento/Equipe
  const membrosSimulacaoComCandidato: {
    talento: TalentoProfile;
    isLider: boolean;
    isCandidato: boolean;
  }[] = [
    {
      talento: candDestaqueObj,
      isLider: false,
      isCandidato: true,
    },
    ...alvoMembrosAtuais
      .filter((m) => m.talento.nome !== candDestaqueObj.nome)
      .map((m) => ({
        talento: m.talento,
        isLider: m.isLider,
        isCandidato: false,
      })),
  ];

  // Cálculo dinâmico dos 5 critérios e score de Harmonia com base no grupo alvo (Equipe ou Departamento) + Candidato
  const calcularMetricasHarmoniaGrupo = () => {
    const todosSim = membrosSimulacaoComCandidato.map((m) => m.talento);
    const kansPresentes = new Set(todosSim.map((t) => t.kan_nome));
    const qtdKans = kansPresentes.size;

    // 1. Complementaridade (diversidade de KANs no grupo com o candidato)
    const notaComp = qtdKans >= 3 ? 4.8 : qtdKans === 2 ? 4.5 : 4.1;

    // 2. Integração Geométrica (conexão de vértices do candidato com o grupo)
    const verticesGrupo = new Set(
      alvoMembrosAtuais.flatMap((m) => m.talento.vertices_triangulo)
    );
    const verticesCompartilhados = candDestaqueObj.vertices_triangulo.filter(
      (v) => verticesGrupo.has(v)
    ).length;
    const notaGeom =
      alvoMembrosAtuais.length === 0
        ? 4.6
        : verticesCompartilhados >= 2
        ? 4.7
        : verticesCompartilhados === 1
        ? 4.6
        : 4.4;

    // 3. Balanceamento (cobertura dos 9 eixos comportamentais)
    const mediasEixos = EIXOS_COMPORTAMENTAIS.map((eixo) => {
      const soma = todosSim.reduce(
        (acc, t) => acc + (calcularScoresEixos(t)[eixo] || 300),
        0
      );
      return soma / Math.max(1, todosSim.length);
    });
    const eixosFortes = mediasEixos.filter((m) => m >= 400).length;
    const notaBal = Math.min(
      4.9,
      Math.max(4.2, Number((4.0 + (eixosFortes / 9) * 0.9).toFixed(1)))
    );

    // 4. Potencial de Entrega (Eixos Resultado + Organização + Análise do candidato)
    const scoresCand = calcularScoresEixos(candDestaqueObj);
    const mediaEntrega =
      ((scoresCand["Resultado"] || 450) +
        (scoresCand["Organização"] || 450) +
        (scoresCand["Análise"] || 450)) /
      3;
    const notaEntrega =
      mediaEntrega >= 550 ? 4.9 : mediaEntrega >= 420 ? 4.7 : 4.4;

    // 5. Segurança Relacional (Empatia + Relacionamento + Comunicação)
    const mediaRel =
      ((scoresCand["Relacionamento"] || 450) +
        (scoresCand["Empatia"] || 450) +
        (scoresCand["Comunicação"] || 450)) /
      3;
    const notaRel = mediaRel >= 550 ? 4.8 : mediaRel >= 420 ? 4.6 : 4.4;

    const mediaFinal5 =
      (notaComp + notaGeom + notaBal + notaEntrega + notaRel) / 5;
    const scorePct = Number(((mediaFinal5 / 5) * 100).toFixed(1));
    const classificacao =
      scorePct >= 90
        ? "Encaixe Muito Alto"
        : scorePct >= 82
        ? "Encaixe Alto"
        : "Encaixe Adequado";

    return {
      scorePct,
      classificacao,
      criterios: [
        {
          titulo: "Complementaridade",
          nota: `${notaComp.toFixed(1)}/5.0`,
          sub: "Equilíbrio de KANs",
        },
        {
          titulo: "Integração Geométrica",
          nota: `${notaGeom.toFixed(1)}/5.0`,
          sub: "Conexões de Triângulos",
        },
        {
          titulo: "Balanceamento",
          nota: `${notaBal.toFixed(1)}/5.0`,
          sub: "Cobertura de Planos",
        },
        {
          titulo: "Potencial de Entrega",
          nota: `${notaEntrega.toFixed(1)}/5.0`,
          sub: "Materialidade/Praticidade",
        },
        {
          titulo: "Segurança Relacional",
          nota: `${notaRel.toFixed(1)}/5.0`,
          sub: "Mitigação de Conflitos",
        },
      ],
    };
  };

  const metricasHarmonia = calcularMetricasHarmoniaGrupo();

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
      equipe: alvoRotuloSalvo,
      harmonia_score: metricasHarmonia.scorePct,
      classificacao: metricasHarmonia.classificacao,
      criterios: metricasHarmonia.criterios,
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
        `Análise de harmonia de "${candDestaqueObj.nome}" (${alvoRotuloSalvo}) confirmada e salva com sucesso no histórico da vaga!`
      );
      setToastMsg(
        `💾 Análise de harmonia de "${candDestaqueObj.nome}" (${alvoRotuloSalvo}) confirmada e salva no histórico do processo!`
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

  // Selecionar e alocar o candidato diretamente no Departamento ou na Equipe escolhida
  const handleSelecionarEAlocarCandidato = async () => {
    if (!candDestaqueObj) return;
    setIsAllocatingCandidato(true);
    setHarmoniaErrorMsg(null);
    setHarmoniaSuccessMsg(null);

    try {
      if (harmoniaTargetMode === "departamento") {
        const deptValueToSave =
          deptoHierarquiaAtivo?.departamento_id || selectedHarmoniaDept;
        const res = await fetch("/api/talentos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: candDestaqueObj.id,
            departamento: deptValueToSave,
          }),
        });
        if (!res.ok) {
          throw new Error("Não foi possível alocar o talento no departamento.");
        }
        candDestaqueObj.departamento = deptValueToSave;
        setHarmoniaSuccessMsg(
          `🎉 Candidato "${candDestaqueObj.nome}" selecionado e alocado com sucesso no departamento "${selectedHarmoniaDept}"!`
        );
        setToastMsg(
          `🎉 "${candDestaqueObj.nome}" selecionado e alocado no departamento "${selectedHarmoniaDept}"!`
        );
      } else if (equipeDaVaga) {
        const jaMembro = equipeDaVaga.membros.some(
          (m) => m.nome === candDestaqueObj.nome
        );
        if (!jaMembro) {
          const novosMembros = [
            ...equipeDaVaga.membros,
            { nome: candDestaqueObj.nome, lider: false },
          ];
          const res = await fetch("/api/equipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...equipeDaVaga,
              membros: novosMembros,
            }),
          });
          if (!res.ok) {
            throw new Error("Não foi possível incluir o candidato na equipe.");
          }
          equipeDaVaga.membros = novosMembros;
        }
        setHarmoniaSuccessMsg(
          `🎉 Candidato "${candDestaqueObj.nome}" selecionado e integrado com sucesso à equipe "${equipeDaVaga.nome}"!`
        );
        setToastMsg(
          `🎉 "${candDestaqueObj.nome}" selecionado e integrado à equipe "${equipeDaVaga.nome}"!`
        );
      }
      setTimeout(() => setHarmoniaSuccessMsg(null), 5000);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      setHarmoniaErrorMsg(
        err instanceof Error
          ? err.message
          : "Erro ao alocar candidato selecionado."
      );
      setTimeout(() => setHarmoniaErrorMsg(null), 5000);
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
            2. Escolha por Harmonia (Equipe ou Departamento)
          </button>
        </div>

        {/* Botões Associar Talentos / Associar por Aderência / Associar por Departamento */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="orange"
            size="sm"
            onClick={() => {
              setAssocTalentosOpen(!assocTalentosOpen);
              setAssocAderenciaOpen(false);
              setAssocDeptoOpen(false);
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
              setAssocDeptoOpen(false);
            }}
          >
            Associar por Aderência (%)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssocDeptoOpen(!assocDeptoOpen);
              setAssocTalentosOpen(false);
              setAssocAderenciaOpen(false);
            }}
            className="border-[#510851]/40 text-[#510851] dark:text-purple-300 hover:bg-[#510851]/10"
          >
            <Building2 className="h-3.5 w-3.5 mr-1" />
            Associar por Departamento
          </Button>
        </div>
      </div>

      {/* Drawer: Associar por Departamento ou Avaliar Harmonia do Departamento */}
      {assocDeptoOpen && (
        <Card className="p-4 space-y-4 border-[#510851]/40 bg-purple-500/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 flex-1 max-w-md">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#510851] dark:text-purple-400" />
                Selecionar Departamento ({membrosDoDepartamento.length} talentos no setor):
              </label>
              <select
                value={selectedHarmoniaDept}
                onChange={(e) => setSelectedHarmoniaDept(e.target.value)}
                className="w-full h-9 rounded-lg border border-[#510851]/40 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {opcoesDepartamentos.map((dept) => (
                  <option key={dept} value={dept}>
                    🏢 {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const nomesDepto = membrosDoDepartamento.map(
                    (m) => m.talento.nome
                  );
                  setVagas((prev) =>
                    prev.map((v) =>
                      v.id === vagaAtiva.id
                        ? {
                            ...v,
                            departamento: selectedHarmoniaDept,
                            candidatos_associados: Array.from(
                              new Set([
                                ...v.candidatos_associados,
                                ...nomesDepto,
                              ])
                            ),
                          }
                        : v
                    )
                  );
                  setAssocDeptoOpen(false);
                  setToastMsg(
                    `✅ ${nomesDepto.length} talento(s) do departamento "${selectedHarmoniaDept}" associados ao processo!`
                  );
                  setTimeout(() => setToastMsg(null), 3500);
                }}
              >
                Associar Talentos do Departamento ({membrosDoDepartamento.length})
              </Button>
              <Button
                size="sm"
                variant="orange"
                onClick={() => {
                  setHarmoniaTargetMode("departamento");
                  setActiveTab("harmonia");
                  setAssocDeptoOpen(false);
                }}
              >
                <Triangle className="h-3.5 w-3.5 mr-1" />
                Diagnosticar Harmonia deste Departamento
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAssocDeptoOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </Card>
      )}

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
          ABA 2: ESCOLHA POR HARMONIA (EQUIPE OU DEPARTAMENTO) + DIAGNÓSTICO COMPLETO
      ==================================================================== */}
      {activeTab === "harmonia" && (
        <div className="space-y-6">
          {/* Seletor de Modo (Equipe vs Departamento) + Destino + Candidato em Análise */}
          <Card className="p-5 space-y-4 border-slate-200/90 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Escopo do Diagnóstico e Seleção por Harmonia
                </div>
                <p className="text-xs text-slate-500">
                  Escolha se deseja simular o encaixe comportamental e selecionar o candidato para uma <strong>Equipe</strong> ou para um <strong>Departamento</strong>.
                </p>
              </div>

              {/* Toggle Equipe vs Departamento */}
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setHarmoniaTargetMode("equipe")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    harmoniaTargetMode === "equipe"
                      ? "bg-[#ea580c] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <UsersRound className="h-3.5 w-3.5" />
                  Por Equipe
                </button>
                <button
                  type="button"
                  onClick={() => setHarmoniaTargetMode("departamento")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    harmoniaTargetMode === "departamento"
                      ? "bg-[#510851] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Por Departamento
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {harmoniaTargetMode === "departamento"
                    ? "Departamento Selecionado para Diagnóstico e Seleção"
                    : "Equipe de Destino Associada à Vaga"}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {harmoniaTargetMode === "departamento" ? (
                    <Building2 className="h-5 w-5 text-[#510851] dark:text-purple-400" />
                  ) : (
                    <UsersRound className="h-5 w-5 text-[#ea580c]" />
                  )}
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {alvoNomeExibicao}
                  </span>
                  <Badge variant="success">
                    {alvoMembrosAtuais.length}{" "}
                    {harmoniaTargetMode === "departamento"
                      ? "talentos no departamento"
                      : "membros atuais na equipe"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    Alterar Equipe de Destino:
                  </label>
                  <select
                    value={equipeDaVaga.nome}
                    onChange={(e) => {
                      setHarmoniaTargetMode("equipe");
                      setVagas((prev) =>
                        prev.map((v) =>
                          v.id === vagaAtiva.id
                            ? { ...v, equipe_associada: e.target.value }
                            : v
                        )
                      );
                    }}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
                      harmoniaTargetMode === "equipe"
                        ? "border-[#ea580c] bg-orange-500/5 text-[#ea580c]"
                        : "border-slate-200 dark:border-slate-800 bg-card"
                    }`}
                  >
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.nome}>
                        👥 {eq.nome} ({eq.membros.length} membros)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    Alterar Departamento de Destino:
                  </label>
                  <select
                    value={selectedHarmoniaDept}
                    onChange={(e) => {
                      setHarmoniaTargetMode("departamento");
                      setSelectedHarmoniaDept(e.target.value);
                    }}
                    className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
                      harmoniaTargetMode === "departamento"
                        ? "border-[#510851] dark:border-purple-500 bg-purple-500/10 text-[#510851] dark:text-purple-300"
                        : "border-slate-200 dark:border-slate-800 bg-card"
                    }`}
                  >
                    {opcoesDepartamentos.map((dept) => (
                      <option key={dept} value={dept}>
                        🏢 {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    Candidato Projetado no Diagnóstico KAN:
                  </label>
                  <select
                    value={candDestaqueObj.nome}
                    onChange={(e) => setCandDestaqueHarmonia(e.target.value)}
                    className="h-9 rounded-lg border border-[#ea580c] bg-orange-500/5 px-3 text-xs font-bold text-[#ea580c]"
                  >
                    {(vagaAtiva.candidatos_associados.length > 0
                      ? vagaAtiva.candidatos_associados
                      : talentos.slice(0, 30).map((t) => t.nome)
                    ).map((cNome) => (
                      <option key={cNome} value={cNome}>
                        ★ {cNome}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={showDiagnosticoCompletoHarmonia ? "default" : "outline"}
                  onClick={() =>
                    setShowDiagnosticoCompletoHarmonia((prev) => !prev)
                  }
                  className="h-9 text-xs font-bold"
                >
                  <Flame className="h-3.5 w-3.5 mr-1" />
                  {showDiagnosticoCompletoHarmonia
                    ? "Ocultar Tabela & Mapa de Calor"
                    : "Exibir Diagnóstico Completo"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isAllocatingCandidato}
                  onClick={handleSelecionarEAlocarCandidato}
                  className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  {isAllocatingCandidato ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Alocando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      Selecionar para{" "}
                      {harmoniaTargetMode === "departamento"
                        ? "o Departamento"
                        : "a Equipe"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* 1. Projeção SVG Interativa: Equipe/Departamento Atual + Candidato (★) */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">
                  Simulação Geométrica de Encaixe ({harmoniaTargetMode === "departamento" ? "Departamento" : "Equipe"}):{" "}
                  {alvoNomeExibicao} + ★ {candDestaqueObj.nome}
                </h3>
                <p className="text-xs text-slate-500">
                  O triângulo laranja (★) representa o candidato selecionado sobreposto aos integrantes atuais de{" "}
                  <strong>{alvoNomeExibicao}</strong> e à liderança (👑).
                </p>
              </div>
              <Badge variant="orange">
                {metricasHarmonia.classificacao} • {metricasHarmonia.scorePct}%
              </Badge>
            </div>

            <KanTrianglesSvg membros={triangleMembersWithCandidate} />
          </Card>

          {/* 2. DIAGNÓSTICO COMPLETO: TABELA COMPARATIVA + MAPA DE CALOR (EQUIPE OU DEPARTAMENTO + CANDIDATO ★) */}
          {showDiagnosticoCompletoHarmonia && (
            <div className="space-y-6">
              {/* Tabela Comparativa de Perfil Comportamental */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        Tabela Comparativa de Perfil Comportamental —{" "}
                        {alvoNomeExibicao} + ★ {candDestaqueObj.nome}
                      </CardTitle>
                      <CardDescription>
                        Comparação lado a lado do candidato selecionado (★) com os integrantes atuais{" "}
                        {harmoniaTargetMode === "departamento"
                          ? "do departamento"
                          : "da equipe"}
                        .
                      </CardDescription>
                    </div>
                    <Badge variant="purple">
                      1 Candidato (★) + {alvoMembrosAtuais.length} Integrantes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                          <th className="py-3 pl-6 pr-4 font-bold uppercase text-[11px] text-slate-500 min-w-[160px]">
                            Atributo / Talento
                          </th>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isLider, isCandidato }) => (
                              <th
                                key={`${m.id}-${isCandidato ? "cand" : "mem"}`}
                                className={`py-3 px-4 font-bold text-slate-900 dark:text-white min-w-[165px] ${
                                  isCandidato
                                    ? "bg-orange-500/10 border-x-2 border-[#ea580c]/40"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={m.avatar}
                                    alt={m.nome}
                                    className={`h-7 w-7 rounded-full object-cover border ${
                                      isCandidato
                                        ? "border-2 border-[#ea580c]"
                                        : "border-slate-200"
                                    }`}
                                  />
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => onInspectTalento(m)}
                                      className={`hover:text-[#ea580c] transition-colors flex items-center gap-1 text-left ${
                                        isCandidato
                                          ? "text-[#ea580c] font-extrabold"
                                          : ""
                                      }`}
                                    >
                                      {isCandidato && <span>★</span>}
                                      {m.nome}
                                      {isLider && (
                                        <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                      )}
                                    </button>
                                    {isCandidato && (
                                      <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[#ea580c]">
                                        Candidato em Simulação
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                        <tr>
                          <td className="py-3 pl-6 pr-4 font-bold text-slate-500">
                            Cargo / Profissão
                          </td>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isCandidato }) => (
                              <td
                                key={`${m.id}-prof`}
                                className={`py-3 px-4 text-slate-700 dark:text-slate-300 ${
                                  isCandidato
                                    ? "bg-orange-500/5 border-x-2 border-[#ea580c]/30 font-semibold"
                                    : ""
                                }`}
                              >
                                {m.cargo || m.profissao || "—"}
                              </td>
                            )
                          )}
                        </tr>
                        <tr>
                          <td className="py-3 pl-6 pr-4 font-bold text-slate-500">
                            KAN Dominante
                          </td>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isCandidato }) => (
                              <td
                                key={`${m.id}-kan`}
                                className={`py-3 px-4 ${
                                  isCandidato
                                    ? "bg-orange-500/5 border-x-2 border-[#ea580c]/30"
                                    : ""
                                }`}
                              >
                                <Badge
                                  variant={
                                    m.kan_nome === "Finalidade"
                                      ? "purple"
                                      : m.kan_nome === "Movimento"
                                      ? "orange"
                                      : "success"
                                  }
                                >
                                  KAN {m.kan_nome}
                                </Badge>
                              </td>
                            )
                          )}
                        </tr>
                        <tr>
                          <td className="py-3 pl-6 pr-4 font-bold text-slate-500">
                            Vértices do Triângulo
                          </td>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isCandidato }) => (
                              <td
                                key={`${m.id}-vert`}
                                className={`py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 ${
                                  isCandidato
                                    ? "bg-orange-500/5 border-x-2 border-[#ea580c]/30 text-[#ea580c]"
                                    : ""
                                }`}
                              >
                                ({m.vertices_triangulo.join(" - ")})
                              </td>
                            )
                          )}
                        </tr>
                        <tr>
                          <td className="py-3 pl-6 pr-4 font-bold text-slate-500">
                            Perfis Comportamentais
                          </td>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isCandidato }) => (
                              <td
                                key={`${m.id}-perf`}
                                className={`py-3 px-4 ${
                                  isCandidato
                                    ? "bg-orange-500/5 border-x-2 border-[#ea580c]/30"
                                    : ""
                                }`}
                              >
                                <div className="flex flex-wrap gap-1">
                                  {m.perfis_lista.map((p) => (
                                    <span
                                      key={p}
                                      className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold"
                                    >
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            )
                          )}
                        </tr>
                        <tr>
                          <td className="py-3 pl-6 pr-4 font-bold text-slate-500">
                            Categorias
                          </td>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isCandidato }) => (
                              <td
                                key={`${m.id}-cat`}
                                className={`py-3 px-4 ${
                                  isCandidato
                                    ? "bg-orange-500/5 border-x-2 border-[#ea580c]/30"
                                    : ""
                                }`}
                              >
                                <div className="flex flex-wrap gap-1">
                                  {m.categorias_lista.map((c) => (
                                    <span
                                      key={c}
                                      className="rounded bg-[#510851]/10 dark:bg-purple-950/60 text-[#510851] dark:text-purple-300 px-2 py-0.5 text-[10px] font-semibold"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            )
                          )}
                        </tr>
                        <tr>
                          <td className="py-3 pl-6 pr-4 font-bold text-slate-500">
                            Qualidades de Destaque
                          </td>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isCandidato }) => (
                              <td
                                key={`${m.id}-qual`}
                                className={`py-3 px-4 ${
                                  isCandidato
                                    ? "bg-orange-500/5 border-x-2 border-[#ea580c]/30"
                                    : ""
                                }`}
                              >
                                <div className="flex flex-wrap gap-1">
                                  {m.qualidades_lista.slice(0, 4).map((q) => (
                                    <span
                                      key={q}
                                      className="rounded bg-orange-500/10 text-[#ea580c] px-2 py-0.5 text-[10px] font-semibold"
                                    >
                                      {q}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            )
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Mapa de Calor Interativo dos 9 Eixos Comportamentais */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          Mapa de Calor — 9 Eixos Comportamentais ({alvoNomeExibicao} + ★ {candDestaqueObj.nome})
                        </CardTitle>
                        <Badge variant="success">Interativo</Badge>
                      </div>
                      <CardDescription>
                        Avalie o impacto de ★ {candDestaqueObj.nome} nos 9 eixos comportamentais{" "}
                        {harmoniaTargetMode === "departamento"
                          ? "do departamento"
                          : "da equipe"}
                        . Clique na coluna <strong>Média</strong> para revelar ou ocultar a média consolidada.
                      </CardDescription>
                    </div>

                    {/* Controles do Mapa de Calor */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setHeatmapPalette("emerald")}
                          className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                            heatmapPalette === "emerald"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Verde
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeatmapPalette("purple")}
                          className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                            heatmapPalette === "purple"
                              ? "bg-[#510851] text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Roxo
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeatmapPalette("orange")}
                          className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                            heatmapPalette === "orange"
                              ? "bg-[#ea580c] text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Laranja
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHeatmapValues(!showHeatmapValues)}
                      >
                        {showHeatmapValues
                          ? "Ocultar Pontuação"
                          : "Exibir Pontuação"}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const allRevealed = EIXOS_COMPORTAMENTAIS.every(
                            (e) => revealedAverageRows[e]
                          );
                          if (allRevealed) {
                            setRevealedAverageRows({});
                          } else {
                            const next: Record<string, boolean> = {};
                            EIXOS_COMPORTAMENTAIS.forEach(
                              (e) => (next[e] = true)
                            );
                            setRevealedAverageRows(next);
                          }
                        }}
                      >
                        {EIXOS_COMPORTAMENTAIS.every(
                          (e) => revealedAverageRows[e]
                        )
                          ? "Ocultar Médias"
                          : "Revelar Todas as Médias"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Legenda de 5 níveis + Status da Célula Inspecionada */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-4 py-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                        Escala de Intensidade:
                      </span>
                      {[
                        { label: "Inicial (<150)", idx: 0 },
                        { label: "Discreto (150-299)", idx: 1 },
                        { label: "Médio (300-449)", idx: 2 },
                        { label: "Alto (450-599)", idx: 3 },
                        { label: "Muito Alto (600+)", idx: 4 },
                      ].map((lvl) => (
                        <div
                          key={lvl.label}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-sm border border-black/10 inline-block"
                            style={{
                              backgroundColor:
                                HEATMAP_PALETTES[heatmapPalette].levels[lvl.idx],
                            }}
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            {lvl.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 min-h-[20px]">
                      {hoveredCell ? (
                        <span>
                          🔍 <strong>{hoveredCell.membro}</strong> em{" "}
                          <strong>{hoveredCell.eixo}</strong>:{" "}
                          <span className="text-[#ea580c] font-extrabold">
                            {hoveredCell.pts} pts ({hoveredCell.label} • Nível{" "}
                            {hoveredCell.tier}/5)
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Passe o mouse sobre qualquer célula para inspecionar o score detalhado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grid Table do Mapa de Calor */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="py-3 pl-4 pr-3 text-left font-bold uppercase tracking-wider text-[11px] min-w-[150px]">
                            Eixo Comportamental
                          </th>
                          {membrosSimulacaoComCandidato.map(
                            ({ talento: m, isLider, isCandidato }) => (
                              <th
                                key={`${m.id}-hm-head`}
                                className={`py-3 px-3 text-center font-bold text-[11px] min-w-[115px] ${
                                  isCandidato
                                    ? "bg-[#ea580c] text-white"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {isCandidato && <span>★</span>}
                                  <span className="truncate max-w-[110px]">
                                    {m.nome.split(" ").slice(0, 2).join(" ")}
                                  </span>
                                  {isLider && (
                                    <Crown className="h-3 w-3 text-amber-400 shrink-0" />
                                  )}
                                </div>
                              </th>
                            )
                          )}
                          <th className="py-3 px-4 text-center font-extrabold uppercase tracking-wider text-[11px] bg-slate-950 text-amber-400 min-w-[125px]">
                            Média c/ ★
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                        {EIXOS_COMPORTAMENTAIS.map((eixo) => {
                          const scoresMembros =
                            membrosSimulacaoComCandidato.map(
                              ({ talento: m, isCandidato }) => {
                                const sc = calcularScoresEixos(m)[eixo] || 200;
                                return { membro: m, pts: sc, isCandidato };
                              }
                            );
                          const mediaPts = Math.round(
                            scoresMembros.reduce((a, b) => a + b.pts, 0) /
                              Math.max(1, scoresMembros.length)
                          );
                          const mediaStyle = getHeatmapCellStyle(
                            mediaPts,
                            heatmapPalette
                          );
                          const isRevealed = Boolean(revealedAverageRows[eixo]);

                          return (
                            <tr key={eixo}>
                              <td className="py-3 pl-4 pr-3 font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                                {eixo}
                              </td>
                              {scoresMembros.map(
                                ({ membro, pts, isCandidato }) => {
                                  const cellStyle = getHeatmapCellStyle(
                                    pts,
                                    heatmapPalette
                                  );
                                  return (
                                    <td
                                      key={`${membro.id}-${eixo}`}
                                      onMouseEnter={() =>
                                        setHoveredCell({
                                          eixo,
                                          membro: isCandidato
                                            ? `★ ${membro.nome} (Candidato)`
                                            : membro.nome,
                                          pts,
                                          label: cellStyle.label,
                                          tier: cellStyle.tier,
                                        })
                                      }
                                      onMouseLeave={() => setHoveredCell(null)}
                                      style={{
                                        backgroundColor: cellStyle.bg,
                                        color: cellStyle.text,
                                      }}
                                      className={`py-3 px-2 text-center font-extrabold transition-transform hover:scale-[1.02] cursor-pointer select-none ${
                                        isCandidato
                                          ? "ring-2 ring-inset ring-[#ea580c]"
                                          : ""
                                      }`}
                                    >
                                      {showHeatmapValues ? (
                                        <div>
                                          <span className="text-xs">{pts}</span>
                                          <span className="block text-[9px] font-semibold opacity-85">
                                            {cellStyle.label}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[10px]">
                                          {cellStyle.label}
                                        </span>
                                      )}
                                    </td>
                                  );
                                }
                              )}

                              {/* Coluna Interativa de Média */}
                              <td
                                onClick={() =>
                                  setRevealedAverageRows((prev) => ({
                                    ...prev,
                                    [eixo]: !prev[eixo],
                                  }))
                                }
                                style={
                                  isRevealed
                                    ? {
                                        backgroundColor: mediaStyle.bg,
                                        color: mediaStyle.text,
                                      }
                                    : undefined
                                }
                                className={`py-3 px-3 text-center font-extrabold cursor-pointer select-none transition-all border-l-2 border-slate-900/20 ${
                                  isRevealed
                                    ? ""
                                    : "bg-slate-100 dark:bg-slate-800/90 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                                }`}
                              >
                                {isRevealed ? (
                                  <div>
                                    <span className="text-xs">
                                      ★ {mediaPts}
                                    </span>
                                    <span className="block text-[9px] font-semibold opacity-90">
                                      {mediaStyle.label}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-semibold underline decoration-dotted">
                                    Ver Média
                                  </span>
                                )}
                              </td>
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

          {/* 3. Card Executivo dos 5 Critérios (Equipe ou Departamento) */}
          <Card className="overflow-hidden border-[#ea580c]/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-950 text-white px-6 py-4 gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="rounded-lg bg-[#ea580c] px-3 py-1 text-xs font-extrabold text-white">
                  Análise de {candDestaqueObj.nome}
                </span>
                <span className="text-xs text-slate-300">
                  Integração com a liderança e membros de{" "}
                  <strong>
                    {harmoniaTargetMode === "departamento"
                      ? `Departamento: ${selectedHarmoniaDept}`
                      : `Equipe: ${equipeDaVaga.nome}`}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">
                  {metricasHarmonia.classificacao}
                </span>
                <span className="rounded-full bg-[#ea580c] px-3.5 py-1 text-xs font-black text-white">
                  {metricasHarmonia.scorePct}%
                </span>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>
                  Análise Consolidada de{" "}
                  {harmoniaTargetMode === "departamento"
                    ? "Departamento"
                    : "Equipe"}{" "}
                  ({alvoMembrosAtuais.length} integrantes atuais):
                </strong>{" "}
                A entrada de <strong>{candDestaqueObj.nome}</strong> (KAN de{" "}
                {candDestaqueObj.kan_nome}, vértices{" "}
                {candDestaqueObj.vertices_triangulo.join("-")}) promove alta
                sinergia geométrica com{" "}
                {harmoniaTargetMode === "departamento"
                  ? `o departamento ${selectedHarmoniaDept}`
                  : `a equipe ${equipeDaVaga.nome}`}
                , ampliando a cobertura dos planos de realização prática e
                mantendo excelente segurança relacional com a liderança.
              </p>

              {/* 5 Critérios Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {metricasHarmonia.criterios.map((crit) => (
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Observações Manuais do Analista (Histórico da Vaga)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Candidato: <strong>{candDestaqueObj.nome}</strong> •{" "}
                    <strong>{alvoRotuloSalvo}</strong>
                  </span>
                </div>

                <textarea
                  value={obsAnalista}
                  onChange={(e) => setObsAnalista(e.target.value)}
                  rows={3}
                  placeholder="Descreva as percepções sobre a integração do candidato com a liderança, equipe ou departamento..."
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isAllocatingCandidato}
                      onClick={handleSelecionarEAlocarCandidato}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                    >
                      {isAllocatingCandidato ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Alocando...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                          Selecionar e Alocar em {alvoNomeExibicao}
                        </>
                      )}
                    </Button>
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
                              em <strong>{item.equipe}</strong>
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
