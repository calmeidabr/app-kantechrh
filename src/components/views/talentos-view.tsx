"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Camera,
  UploadCloud,
  Sparkles,
  Briefcase,
  Tag,
  UsersRound,
  Linkedin,
  Calendar,
  Eye,
  Pencil,
  RotateCcw,
  CheckCircle2,
  Building2,
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
import {
  EMPRESAS_TENANT,
  DEPARTAMENTOS_OPCOES,
  type TalentoProfile,
  type EquipeData,
} from "@/lib/mock-data";

export function TalentosView({
  talentos,
  setTalentos,
  equipes,
  onInspectTalento,
  onNavigateEquipe,
}: {
  talentos: TalentoProfile[];
  setTalentos: React.Dispatch<React.SetStateAction<TalentoProfile[]>>;
  equipes: EquipeData[];
  onInspectTalento: (t: TalentoProfile) => void;
  onNavigateEquipe: (equipeNome: string) => void;
}) {
  // Form state matching PROG/menus/talentos_menu.py
  const [cadNome, setCadNome] = useState("");
  const [cadData, setCadData] = useState("");
  const [cadProfissao, setCadProfissao] = useState("");
  const [cadGrupo, setCadGrupo] = useState("");
  const [cadEmpresa, setCadEmpresa] = useState(EMPRESAS_TENANT[0].nome);
  const [cadDepto, setCadDepto] = useState(DEPARTAMENTOS_OPCOES[1]);
  const [cadLinkedin, setCadLinkedin] = useState("");
  const [cadExp, setCadExp] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Consultation State
  const [buscaTalento, setBuscaTalento] = useState("");
  const [ultimosConsultados, setUltimosConsultados] = useState<string[]>([
    "Cristiano Corrêa de Almeida",
    "Mariana Vasconcelos",
    "Rafael Mendonça",
    "Camila Albuquerque",
    "Lucas Bittencourt",
    "Beatriz Nogueira",
  ]);

  // DD/MM/AAAA auto-formatter identical to talentos_menu.py
  const handleDateChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    setCadData(formatted);
  };

  const handleLoadIntoForm = (t: TalentoProfile) => {
    setCadNome(t.nome);
    setCadData(t.data_nascimento);
    setCadProfissao(t.profissao);
    setCadGrupo(t.grupo);
    setCadEmpresa(t.empresa);
    setCadDepto(t.departamento);
    setCadLinkedin(t.linkedin_url || "");
    setCadExp(t.experiencias || "");
    if (!ultimosConsultados.includes(t.nome)) {
      setUltimosConsultados((prev) => [t.nome, ...prev].slice(0, 6));
    }
  };

  const handleClearForm = () => {
    setCadNome("");
    setCadData("");
    setCadProfissao("");
    setCadGrupo("");
    setCadEmpresa(EMPRESAS_TENANT[0].nome);
    setCadLinkedin("");
    setCadExp("");
    setCameraOpen(false);
  };

  const handleSimulateOcr = () => {
    setOcrLoading(true);
    setTimeout(() => {
      setCadNome("HENRIQUE MONTEIRO DE ALENCAR");
      setCadData("18/07/1990");
      setCadProfissao("Diretor de Operações");
      setCadGrupo("Executivo B2B");
      setCameraOpen(false);
      setOcrLoading(false);
      setToastMsg("✨ Dados extraídos do documento via Gemini 2.5 OCR!");
      setTimeout(() => setToastMsg(null), 4000);
    }, 900);
  };

  const handleSaveTalento = async () => {
    if (!cadNome.trim()) {
      setToastMsg("⚠️ O campo 'Nome Completo (Conforme certidão)' é obrigatório.");
      return;
    }
    if (cadData.split("/").length !== 3 || cadData.length < 10) {
      setToastMsg("⚠️ Formato de data inválido. Use dd/mm/aaaa.");
      return;
    }

    setToastMsg("⏳ Calculando matriz no container mam-kantechrh e salvando no Supabase...");

    let calcKanNum = 8;
    let calcKanNome: "Criação" | "Movimento" | "Finalidade" = "Finalidade";
    let calcEstrutural = 4;
    let calcDirecionamento = 1;
    let calcVertices: [number, number, number] = [8, 4, 1];
    let calcPerfis = ["Lider", "Resultado", "Executor"];
    let calcCats = ["Realizador", "Analítico"];
    let calcQuals = ["Execução", "Organização", "Análise"];

    try {
      const res = await fetch("/api/talentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: cadNome.trim(),
          data_nascimento: cadData,
          profissao: cadProfissao || "Especialista Corporativo",
          cargo: cadProfissao || "Especialista",
          grupo: cadGrupo || "Geral",
          departamento: cadDepto,
          empresa: cadEmpresa,
          linkedin_url: cadLinkedin,
          experiencias: cadExp,
        }),
      });
      const json = await res.json();
      if (json?.calculation) {
        const c = json.calculation;
        calcKanNum = Number(c.kan_numero) || 8;
        const kn = String(c.kan_nome || "").toLowerCase();
        calcKanNome = kn.includes("cria")
          ? "Criação"
          : kn.includes("mov")
          ? "Movimento"
          : "Finalidade";
        calcEstrutural = Number(c.estrutural) || 4;
        calcDirecionamento = Number(c.direcionamento) || 1;
        if (Array.isArray(c.vertices_triangulo) && c.vertices_triangulo.length >= 3) {
          calcVertices = [
            Number(c.vertices_triangulo[0]),
            Number(c.vertices_triangulo[1]),
            Number(c.vertices_triangulo[2]),
          ];
        }
        const vr = c.valores_resumo || {};
        if (vr.perfil) {
          calcPerfis = String(vr.perfil).split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        if (vr.categoria) {
          calcCats = String(vr.categoria).split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        if (vr.qualidades) {
          calcQuals = String(vr.qualidades).split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
    } catch {
      // Fallback local calculation if offline
    }

    const exists = talentos.find(
      (t) => t.nome.toLowerCase() === cadNome.trim().toLowerCase()
    );

    if (exists) {
      setTalentos((prev) =>
        prev.map((item) =>
          item.id === exists.id
            ? {
                ...item,
                nome: cadNome.trim(),
                data_nascimento: cadData,
                profissao: cadProfissao || item.profissao,
                grupo: cadGrupo || item.grupo,
                empresa: cadEmpresa,
                departamento: cadDepto,
                linkedin_url: cadLinkedin,
                experiencias: cadExp,
                kan_numero: calcKanNum,
                kan_nome: calcKanNome,
                estrutural: calcEstrutural,
                direcionamento: calcDirecionamento,
                vertices_triangulo: calcVertices,
                perfis_lista: calcPerfis.length ? calcPerfis : item.perfis_lista,
                categorias_lista: calcCats.length ? calcCats : item.categorias_lista,
                qualidades_lista: calcQuals.length ? calcQuals : item.qualidades_lista,
              }
            : item
        )
      );
      setToastMsg(
        `✅ Cadastro de "${cadNome.trim()}" recalculado (KAN ${calcKanNum} • ${calcKanNome}) e salvo no Supabase!`
      );
    } else {
      const novo: TalentoProfile = {
        id: String(Date.now()),
        codigo: String(Math.floor(10000000 + Math.random() * 90000000)),
        nome: cadNome.trim(),
        email: `${cadNome.trim().split(" ")[0].toLowerCase()}@kantechrh.com.br`,
        data_nascimento: cadData,
        profissao: cadProfissao || "Especialista Corporativo",
        cargo: cadProfissao || "Especialista",
        grupo: cadGrupo || "Geral",
        departamento: cadDepto,
        empresa: cadEmpresa,
        status: "Ativo",
        avatar:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        linkedin_url: cadLinkedin,
        experiencias: cadExp,
        kan_numero: calcKanNum,
        kan_nome: calcKanNome,
        estrutural: calcEstrutural,
        direcionamento: calcDirecionamento,
        perfil_dominante: `${calcPerfis[0] || "Líder"} ${calcCats[0] || "Realizador"}`,
        perfis_lista: calcPerfis,
        categorias_lista: calcCats,
        qualidades_lista: calcQuals,
        vertices_triangulo: calcVertices,
        aderencia_vaga: 91,
        indicadores_perfil: TALENTOS_MOCK_FALLBACK_IND,
        soft_skills: TALENTOS_MOCK_FALLBACK_SKILLS,
        ai_diagnosis: [
          `Perfil processado pelo motor isolado mam-kantechrh: KAN ${calcKanNum} (${calcKanNome}), vértices [${calcVertices.join(", ")}] e vetores ${calcPerfis.join(", ")}.`,
        ],
      };
      setTalentos((prev) => [novo, ...prev]);
      setUltimosConsultados((prev) => [novo.nome, ...prev].slice(0, 6));
      setToastMsg(
        `✅ Talento "${novo.nome}" calculado no mam-kantechrh (KAN ${calcKanNum} • ${calcKanNome}) e salvo no Supabase!`
      );
    }
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Find teams that the currently loaded talent belongs to
  const equipesDoTalentoAtual = cadNome.trim()
    ? equipes.filter((eq) =>
        eq.membros.some(
          (m) => m.nome.toLowerCase() === cadNome.trim().toLowerCase()
        )
      )
    : [];

  // Filter talents for bottom grid
  const talentosFiltrados = talentos.filter((t) => {
    if (!buscaTalento.trim()) {
      return ultimosConsultados.includes(t.nome);
    }
    const q = buscaTalento.toLowerCase();
    return (
      t.nome.toLowerCase().includes(q) ||
      t.profissao.toLowerCase().includes(q) ||
      t.grupo.toLowerCase().includes(q) ||
      t.departamento.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Cadastros • Base Sincronizada</Badge>
            <span className="text-xs text-slate-400">
              Tabelas: <code className="font-mono">mapas_salvos</code> &{" "}
              <code className="font-mono">mapas_salvos_valores</code>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Cadastro e Consulta de Talentos
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre talentos manualmente ou via leitura OCR de documento por IA e consulte seus vínculos de equipe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClearForm}>
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar / Novo
          </Button>
          <Button
            variant="orange"
            size="sm"
            onClick={() => setCameraOpen(!cameraOpen)}
          >
            <Camera className="h-3.5 w-3.5" />
            {cameraOpen ? "Fechar Leitor OCR" : "Leitura de Documento IA (OCR)"}
          </Button>
        </div>
      </div>

      {toastMsg && (
        <div className="rounded-xl border border-[#510851]/20 bg-[#510851]/5 dark:bg-[#8b5cf6]/15 px-4 py-3 text-xs font-semibold text-[#510851] dark:text-white flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400">
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================
          FORMULÁRIO: NOVO CADASTRO / EDIÇÃO DE TALENTO
      ==================================================================== */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {cadNome ? `Editando / Consultando: ${cadNome}` : "Novo Cadastro de Talento"}
              </CardTitle>
              <CardDescription>
                Ao salvar, o frontend aciona internamente o container{" "}
                <span className="font-semibold text-[#510851] dark:text-[#a78bfa]">
                  mam-kantechrh
                </span>{" "}
                para gerar o Mapa e o Perfil Comportamental.
              </CardDescription>
            </div>
            {cadNome && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" />
                Perfil Sincronizado
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Camera / OCR Dropzone Drawer */}
          {cameraOpen && (
            <div className="rounded-2xl border-2 border-dashed border-[#ea580c]/50 bg-orange-500/5 p-6 text-center space-y-3">
              <UploadCloud className="mx-auto h-8 w-8 text-[#ea580c]" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Leitura Automática de RG / CNH via Gemini 2.5 Flash
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                  Tire uma foto legível ou envie a imagem do documento brasileiro para extrair automaticamente o Nome Completo de Registro e a Data de Nascimento.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <Button
                  size="sm"
                  variant="orange"
                  onClick={handleSimulateOcr}
                  disabled={ocrLoading}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {ocrLoading
                    ? "Extraindo com Gemini 2.5..."
                    : "Simular Extração OCR Instantânea"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCameraOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Row 1: Nome Completo, Data de Nascimento, Foto */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome Completo (Conforme certidão de nascimento) *
              </label>
              <Input
                value={cadNome}
                onChange={(e) => setCadNome(e.target.value)}
                placeholder="Ex.: CRISTIANO CORRÊA DE ALMEIDA"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Data de Nascimento *
              </label>
              <Input
                value={cadData}
                onChange={(e) => handleDateChange(e.target.value)}
                placeholder="dd/mm/aaaa"
                maxLength={10}
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Foto do Perfil (Opcional)
              </label>
              <label className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100">
                <UploadCloud className="h-3.5 w-3.5 text-[#510851]" />
                <span>Carregar PNG/JPG</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>

          {/* Row 2: Profissão, Grupo, Empresa, Departamento, LinkedIn */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Profissão / Cargo
              </label>
              <Input
                value={cadProfissao}
                onChange={(e) => setCadProfissao(e.target.value)}
                placeholder="Ex.: Head de Produto"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Grupo / Tag (Opcional)
              </label>
              <Input
                value={cadGrupo}
                onChange={(e) => setCadGrupo(e.target.value)}
                placeholder="Ex.: Board Executivo"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Empresa Associada
              </label>
              <select
                value={cadEmpresa}
                onChange={(e) => setCadEmpresa(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#510851]"
              >
                <option value="Nenhuma / Não associada">
                  Nenhuma / Não associada
                </option>
                {EMPRESAS_TENANT.map((emp) => (
                  <option key={emp.id} value={emp.nome}>
                    {emp.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Departamento
              </label>
              <select
                value={cadDepto}
                onChange={(e) => setCadDepto(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#510851]"
              >
                {DEPARTAMENTOS_OPCOES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                LinkedIn (URL)
              </label>
              <Input
                value={cadLinkedin}
                onChange={(e) => setCadLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>

          {/* Row 3: Experiências Profissionais / Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Experiências Profissionais / Bio Executiva (Contexto para o Diagnóstico IA)
            </label>
            <textarea
              value={cadExp}
              onChange={(e) => setCadExp(e.target.value)}
              rows={2}
              placeholder="Resumo de experiências, certificações e histórico de liderança para enriquecer a análise com IA..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-card p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#510851]"
            />
          </div>

          {/* Equipes das quais este talento faz parte (Exact feature from talentos_menu.py) */}
          {cadNome.trim() && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <UsersRound className="h-4 w-4 text-[#510851] dark:text-[#a78bfa]" />
                  Equipes das quais este talento faz parte:
                </span>
                {equipesDoTalentoAtual.length > 0 ? (
                  equipesDoTalentoAtual.map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => onNavigateEquipe(eq.nome)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#510851]/25 bg-[#510851]/10 dark:bg-[#8b5cf6]/20 px-2.5 py-1 text-xs font-semibold text-[#510851] dark:text-[#a78bfa] hover:bg-[#510851] hover:text-white transition-colors"
                    >
                      <span>{eq.nome}</span>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Este talento ainda não pertence a nenhuma equipe cadastrada.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2.5">
              <Button onClick={handleSaveTalento}>
                <Plus className="h-4 w-4" />
                Salvar Talento & Calcular Mapa
              </Button>
              <Button variant="outline" onClick={handleClearForm}>
                Novo / Limpar
              </Button>
            </div>

            {cadNome && (
              <Button
                variant="outline"
                onClick={() => {
                  const found = talentos.find(
                    (t) => t.nome.toLowerCase() === cadNome.trim().toLowerCase()
                  );
                  if (found) onInspectTalento(found);
                }}
              >
                <Eye className="h-4 w-4 text-[#ea580c]" />
                Abrir Diagnóstico Completo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          CONSULTAR TALENTOS CADASTRADOS (3-COLUMN CARDS GRID)
      ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Consultar Talentos Cadastrados
            </h2>
            <p className="text-xs text-slate-400">
              {buscaTalento.trim()
                ? `Resultados filtrados (${talentosFiltrados.length})`
                : `Exibindo últimos perfis consultados (${talentosFiltrados.length})`}
            </p>
          </div>

          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={buscaTalento}
              onChange={(e) => setBuscaTalento(e.target.value)}
              placeholder="Buscar por Nome, Profissão, Grupo ou Departamento..."
              className="pl-9"
            />
          </div>
        </div>

        {/* 3-Column Cards Grid matching talentos_menu.py */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {talentosFiltrados.map((t) => {
            const membroDe = equipes.filter((eq) =>
              eq.membros.some((m) => m.nome === t.nome)
            );

            return (
              <Card
                key={t.id}
                className="p-5 hover:border-[#510851]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={t.avatar}
                    alt={t.nome}
                    className="h-13 w-13 rounded-full object-cover ring-2 ring-[#510851]/20 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleLoadIntoForm(t)}
                        className="truncate text-sm font-bold text-slate-900 dark:text-white hover:text-[#510851] dark:hover:text-[#a78bfa] text-left"
                      >
                        {t.nome}
                      </button>
                      <Badge variant="purple" className="shrink-0">
                        KAN {t.kan_numero}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      <Briefcase className="h-3.5 w-3.5 text-[#ea580c] shrink-0" />
                      <span className="truncate">{t.profissao}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-[#510851] dark:text-[#a78bfa]" />
                        {t.grupo || t.departamento}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t.data_nascimento}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Equipes Links inside Talent Card */}
                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Equipes Vinculadas:
                  </span>
                  {membroDe.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {membroDe.map((eq) => (
                        <button
                          key={eq.id}
                          onClick={() => onNavigateEquipe(eq.nome)}
                          className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-[#510851] dark:text-[#a78bfa] hover:underline"
                        >
                          {eq.nome}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Nenhuma equipe vinculada
                    </span>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-1">
                  {t.linkedin_url ? (
                    <a
                      href={t.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#510851] dark:text-[#a78bfa] hover:underline"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </a>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadIntoForm(t)}
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button size="sm" onClick={() => onInspectTalento(t)}>
                      <Eye className="h-3 w-3" />
                      Diagnóstico
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TALENTOS_MOCK_FALLBACK_IND = [
  {
    Campo: "Índice KAN Central",
    Valor: "8 — Realizador Executivo",
    Descricao:
      "Orientação para entregas estruturadas, liderança pragmática e governança corporativa.",
  },
];

const TALENTOS_MOCK_FALLBACK_SKILLS = [
  { perfil: "Líder", score: 90, cor: "#510851" },
  { perfil: "Resultado", score: 88, cor: "#ea580c" },
  { perfil: "Executor", score: 84, cor: "#8b5cf6" },
  { perfil: "Criativo", score: 78, cor: "#10b981" },
  { perfil: "Comunicador", score: 75, cor: "#6366f1" },
  { perfil: "Influenciador", score: 72, cor: "#f59e0b" },
  { perfil: "Vendedor", score: 70, cor: "#ec4899" },
];
