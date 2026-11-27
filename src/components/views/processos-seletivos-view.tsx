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
  Eye,
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
import { TalentProcessosButton } from "@/components/talent-processos-button";
import {
  EMPRESAS_TENANT,
  DEPARTAMENTOS_OPCOES,
  KAN_OPCOES,
  PERFIS_OPCOES,
  CATEGORIAS_OPCOES,
  QUALIDADES_OPCOES,
  SOFT_SKILLS_OPCOES,
  EIXOS_COMPORTAMENTAIS,
  getScoresEixos,
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
    levels: ["#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8", "#18345B"],
    textColors: ["#1E3A8A", "#1E3A8A", "#ffffff", "#ffffff", "#ffffff"],
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
  const [limitReachedAlert, setLimitReachedAlert] = useState<{
    planName: string;
    currentCount: number;
    maxLimit: number;
    upgradeUrl: string;
    message: string;
  } | null>(null);

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
      if (res.status === 403 && data?.limitReached) {
        setToastMsg(null);
        setLimitReachedAlert({
          planName: String(data.planName || "Atual"),
          currentCount: Number(data.currentCount ?? 0),
          maxLimit: Number(data.maxLimit ?? 0),
          upgradeUrl: String(
            data.upgradeUrl || "https://www.kantechrh.com.br/#pricing"
          ),
          message: String(
            data.error ||
              "Limite máximo de criação mensal do plano atingido. Faça o upgrade para continuar criando novos processos seletivos."
          ),
        });
        setIsCreatingVaga(false);
        return;
      }
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

      {limitReachedAlert && (
        <div className="rounded-2xl border-2 border-[#ea580c] bg-orange-50/90 dark:bg-orange-950/30 p-5 shadow-md space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ea580c] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Limite Máximo Mensal Atingido • Plano {limitReachedAlert.planName}
              </div>
              <h3 className="mt-2 text-base font-extrabold text-slate-900 dark:text-white">
                Você atingiu o limite de {limitReachedAlert.maxLimit} processo(s) seletivos criados no mês ({limitReachedAlert.currentCount}/{limitReachedAlert.maxLimit})
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {limitReachedAlert.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLimitReachedAlert(null)}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={limitReachedAlert.upgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ea580c] hover:bg-[#ea580c]/90 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              Fazer Upgrade de Plano
            </a>
            <button
              type="button"
              onClick={() => {
                setLimitReachedAlert(null);
                setFormOpen(false);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
            >
              Continuar Acessando Minha Base
            </button>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="rounded-xl border border-[#18345B]/20 bg-[#18345B]/5 px-4 py-3 text-xs font-semibold text-[#18345B] dark:text-white flex items-center justify-between">
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
            <div className="rounded-xl border border-[#18345B]/20 dark:border-blue-900/40 bg-[#18345B]/5 dark:bg-blue-950/20 p-4 flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <div className="text-xs space-y-1">
                <strong className="text-[#18345B] dark:text-blue-300 font-semibold block">
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
                    <Badge variant="outline" className="border-[#18345B]/30 bg-[#18345B]/5 text-[#18345B] dark:text-blue-300 font-semibold text-[11px]">
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
                    <span className="font-bold text-[#18345B] dark:text-[#60A5FA]">
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
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#18345B] hover:underline"
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

export { ProcessoSeletivoView } from "./processo-seletivo-workspace";
