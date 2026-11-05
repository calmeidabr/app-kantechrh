"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Search,
  RefreshCw,
  Download,
  Edit2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Layers,
  Sliders,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface TabelaOption {
  key: string;
  nome: string;
  grupo: "Diagnóstico Ampliado" | "Pesos & Regras de Cálculo" | "Tabelas Complementares" | "Cadastros Principais (CRUD Admin)";
  primaryKey: string;
  descricao: string;
}

const TABELAS_LISTA: TabelaOption[] = [
  // 1. Diagnóstico Ampliado
  {
    key: "atributos_ampliado",
    nome: "Atributos Ampliados",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "Competências corporativas de RH, classes, dimensões, eixos, soft skills, antídotos e riscos prioritários.",
  },
  {
    key: "perfil_categoria_ampliado",
    nome: "Perfis & Categorias",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "98 perfis predominantes, descrição completa, resumo executivo, forças centrais e contexto de maior aderência.",
  },
  {
    key: "categoria_ampliado",
    nome: "Categorias & Eixos",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "19 categorias corporativas, descrições detalhadas e mapeamento para os 9 Eixos comportamentais.",
  },
  {
    key: "perfil_foco_ampliado",
    nome: "Perfis & Novos Focos",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "7 perfis estratégicos e novos focos metodológicos de atuação corporativa.",
  },
  {
    key: "riscos_ampliado",
    nome: "Riscos Comportamentais",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "149 riscos prioritários, gatilhos de ativação, comportamentos observáveis e competências de desenvolvimento (PDI).",
  },
  {
    key: "forcas_centrais",
    nome: "Forças Centrais",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "48 competências essenciais, manifestação comportamental, valor para o negócio e riscos de excesso.",
  },
  {
    key: "soft_skills_ampliado",
    nome: "Soft Skills Expandidas",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "474 soft skills corporativas novas cruzadas com as habilidades base e descrições práticas.",
  },
  {
    key: "matriz_ampliado",
    nome: "Matriz Ampliada (1 a 31)",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "resultado",
    descricao: "Arquétipos completos dos 31 resultados: motivação, impressão, expressão, destino, missão e desafios.",
  },
  {
    key: "atributos_comparacao",
    nome: "De-Para Comparativo",
    grupo: "Diagnóstico Ampliado",
    primaryKey: "id",
    descricao: "Matriz comparativa de correspondência entre Atributos Ampliados e a base legada.",
  },

  // 2. Pesos & Regras de Cálculo
  {
    key: "peso",
    nome: "Pesos por Campo / Indicador",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "campo",
    descricao: "Pesos de cálculo metodológico aplicados a cada campo (Motivação, Impressão, Expressão, Destino, Missão, etc.).",
  },
  {
    key: "peso_categoria",
    nome: "Pesos por Categoria",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "id",
    descricao: "Pesos numéricos por categoria para balanceamento das pontuações dos eixos.",
  },
  {
    key: "repeticao",
    nome: "Regras de Repetição KAN",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "repeticao",
    descricao: "Bônus de repetição e perfis dominantes derivados de números repetidos no mapa.",
  },
  {
    key: "kans",
    nome: "Definições dos 3 KANs",
    grupo: "Pesos & Regras de Cálculo",
    primaryKey: "numero",
    descricao: "Definições oficiais das forças KAN: Criação (3), Movimento (5) e Finalidade (8).",
  },

  // 3. Tabelas Complementares
  {
    key: "atributos",
    nome: "Atributos Base (Originais)",
    grupo: "Tabelas Complementares",
    primaryKey: "atributo",
    descricao: "Tabela original de atributos, perfis, categorias e qualidades do motor legado.",
  },
  {
    key: "matriz",
    nome: "Matriz Base (Original)",
    grupo: "Tabelas Complementares",
    primaryKey: "resultado",
    descricao: "Matriz cabalística original dos 31 resultados.",
  },
  {
    key: "qualidades",
    nome: "Qualidades Comportamentais",
    grupo: "Tabelas Complementares",
    primaryKey: "id",
    descricao: "Catálogo de qualidades e forças de atuação em equipe.",
  },
  {
    key: "desafios",
    nome: "Desafios de Aniversário",
    grupo: "Tabelas Complementares",
    primaryKey: "dia_nascimento",
    descricao: "Desafios comportamentais por dia de nascimento (1 a 31).",
  },

  // 4. Cadastros Principais (CRUD Completo com Exclusão Admin)
  {
    key: "mapas_salvos",
    nome: "Talentos (Mapas Salvos)",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Cadastro de talentos corporativos, cargos, empresas e perfis KAN gravados no Supabase.",
  },
  {
    key: "processos_seletivos",
    nome: "Processos Seletivos",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Processos seletivos, pipeline de candidatos e compatibilidade com vagas.",
  },
  {
    key: "vagas",
    nome: "Vagas Corporativas",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Vagas abertas com requisitos KAN, senioridade e departamentos.",
  },
  {
    key: "hierarquia_departamentos",
    nome: "Departamentos (Hierarquia)",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Árvore de governança, departamentos e organograma corporativo.",
  },
  {
    key: "equipes",
    nome: "Equipes Cadastradas",
    grupo: "Cadastros Principais (CRUD Admin)",
    primaryKey: "id",
    descricao: "Equipes, departamentos associados, líderes e integrantes.",
  },
];

export function AdminTabelasEditor() {
  const [selectedGrupo, setSelectedGrupo] = useState<string>("Diagnóstico Ampliado");
  const [selectedTableKey, setSelectedTableKey] = useState<string>("atributos_ampliado");
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [primaryKey, setPrimaryKey] = useState<string>("id");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modal Editing State
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modal New Record State
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newFormData, setNewFormData] = useState<Record<string, unknown>>({});
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Current Table Metadata
  const currentTableMeta = useMemo(() => {
    return TABELAS_LISTA.find((t) => t.key === selectedTableKey) || TABELAS_LISTA[0];
  }, [selectedTableKey]);

  // Fetch Table Data from Supabase via API
  const fetchTableData = async (tabela: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/tabelas?tabela=${tabela}&limit=1000`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao consultar tabela no Supabase.");
      }
      setRecords(data.records || []);
      setColumns(data.columns || []);
      setPrimaryKey(data.metadata?.primaryKey || "id");
      setCurrentPage(1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido ao carregar tabela.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(selectedTableKey);
  }, [selectedTableKey]);

  // Tables for selected group
  const tabelasDoGrupo = useMemo(() => {
    return TABELAS_LISTA.filter((t) => t.grupo === selectedGrupo);
  }, [selectedGrupo]);

  // Filtered Records based on search
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase().trim();
    return records.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [records, searchTerm]);

  // Paginated Records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Open Edit Modal
  const handleOpenEdit = (record: Record<string, unknown>) => {
    setEditingRecord(record);
    setEditFormData({ ...record });
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingRecord(null);
    setEditFormData({});
  };

  // Save Edit to Supabase
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setIsSaving(true);
    setFeedback(null);
    const pkVal = editingRecord[primaryKey];

    try {
      const res = await fetch("/api/admin/tabelas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabela: selectedTableKey,
          pkValue: pkVal,
          updates: editFormData,
          usuario: "adminkan",
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Falha ao salvar alterações no Supabase.");
      }

      // Update local state immediately
      setRecords((prev) =>
        prev.map((r) => (r[primaryKey] === pkVal ? { ...r, ...editFormData } : r))
      );

      setFeedback({
        type: "success",
        message: `Registro na tabela '${currentTableMeta.nome}' atualizado com sucesso no Supabase! As alterações já estão ativas no Diagnóstico Ampliado.`,
      });
      handleCloseEdit();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao atualizar registro no Supabase.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const initialData: Record<string, unknown> = {};
    columns.forEach((col) => {
      if (col !== primaryKey && col !== "created_at") {
        initialData[col] = "";
      }
    });
    setNewFormData(initialData);
    setIsCreatingNew(true);
  };

  // Save New Record to Supabase
  const handleSaveNew = async () => {
    setIsCreating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/tabelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabela: selectedTableKey,
          record: newFormData,
          usuario: "adminkan",
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Falha ao inserir novo registro no Supabase.");
      }

      // Refresh table
      await fetchTableData(selectedTableKey);
      setFeedback({
        type: "success",
        message: `Novo registro inserido com sucesso na tabela '${currentTableMeta.nome}' do Supabase!`,
      });
      setIsCreatingNew(false);
      setNewFormData({});
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao inserir registro.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Delete Record from Supabase
  const handleDelete = async (record: Record<string, unknown>) => {
    const pkVal = record[primaryKey];
    if (
      !confirm(
        `Tem certeza que deseja excluir o registro com ${primaryKey} = "${pkVal}" da tabela '${currentTableMeta.nome}' no Supabase?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/tabelas?tabela=${selectedTableKey}&pkValue=${encodeURIComponent(String(pkVal))}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Falha ao excluir registro.");
      }

      setRecords((prev) => prev.filter((r) => r[primaryKey] !== pkVal));
      setFeedback({
        type: "success",
        message: `Registro removido com sucesso da tabela '${currentTableMeta.nome}'.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao excluir registro.",
      });
    }
  };

  // Export filtered rows to CSV
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const header = columns.join(";");
    const rows = filteredRecords.map((r) =>
      columns
        .map((col) => {
          const val = r[col];
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(";")
    );
    const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedTableKey}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLongTextField = (fieldName: string) => {
    const fn = fieldName.toLowerCase();
    return (
      fn.includes("definicao") ||
      fn.includes("descricao") ||
      fn.includes("resumo") ||
      fn.includes("forcas") ||
      fn.includes("contexto") ||
      fn.includes("soft_skills") ||
      fn.includes("gatilhos") ||
      fn.includes("comportamentos") ||
      fn.includes("impacto") ||
      fn.includes("competencias") ||
      fn.includes("como_aparece") ||
      fn.includes("valor_para_o_negocio") ||
      fn.includes("possivel_excesso")
    );
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-xs font-medium shadow-sm transition-all ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <p className="leading-relaxed">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="rounded p-1 text-slate-500 hover:bg-black/5 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Card: Editor de Tabelas do Supabase */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-[#ea580c]" />
                <CardTitle className="text-base font-bold">
                  Editor de Tabelas Metodológicas & Diagnóstico Ampliado
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <ShieldCheck className="mr-1 h-3 w-3" /> Supabase Live
                </Badge>
              </div>
              <CardDescription className="mt-1 text-xs text-muted-foreground">
                Consulte e edite diretamente atributos, pesos, riscos e parâmetros no banco de dados
                Supabase para calibrar ou corrigir dados do Diagnóstico Ampliado.
              </CardDescription>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTableData(selectedTableKey)}
                disabled={loading}
                className="h-8 text-xs font-semibold"
                title="Recarregar dados do Supabase"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={filteredRecords.length === 0}
                className="h-8 text-xs font-semibold"
                title="Exportar registros filtrados para CSV"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Exportar CSV
              </Button>
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 bg-[#ea580c] text-xs font-semibold text-white hover:bg-[#d9460f]"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Novo Registro
              </Button>
            </div>
          </div>

          {/* Group Tabs */}
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
            {(
              [
                "Diagnóstico Ampliado",
                "Pesos & Regras de Cálculo",
                "Tabelas Complementares",
                "Cadastros Principais (CRUD Admin)",
              ] as const
            ).map((grp) => (
              <button
                key={grp}
                onClick={() => {
                  setSelectedGrupo(grp);
                  const firstTabOfGroup = TABELAS_LISTA.find((t) => t.grupo === grp);
                  if (firstTabOfGroup) setSelectedTableKey(firstTabOfGroup.key);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedGrupo === grp
                    ? "bg-[#510851] text-white shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {grp === "Diagnóstico Ampliado" && <Sparkles className="h-3.5 w-3.5" />}
                {grp === "Pesos & Regras de Cálculo" && <Sliders className="h-3.5 w-3.5" />}
                {grp === "Tabelas Complementares" && <Layers className="h-3.5 w-3.5" />}
                {grp === "Cadastros Principais (CRUD Admin)" && <ShieldCheck className="h-3.5 w-3.5" />}
                {grp}
              </button>
            ))}
          </div>

          {/* Table Pills inside Selected Group */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tabelasDoGrupo.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setSelectedTableKey(tb.key)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  selectedTableKey === tb.key
                    ? "border-[#ea580c] bg-[#ea580c] text-white shadow-sm"
                    : "border-border/60 bg-background text-muted-foreground hover:border-slate-400 hover:text-foreground"
                }`}
              >
                {tb.nome}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Active Table Details & Search Bar */}
          <div className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#ea580c]">
                  public.{currentTableMeta.key}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {currentTableMeta.nome}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  PK: {primaryKey}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {currentTableMeta.descricao}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por qualquer campo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                Total: <strong>{filteredRecords.length}</strong>
              </span>
            </div>
          </div>

          {/* Loading / Error States */}
          {loading && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin text-[#ea580c]" />
              <span className="text-xs">Consultando dados no Supabase...</span>
            </div>
          )}

          {errorMsg && !loading && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300">
              <p className="font-bold">Erro ao carregar tabela:</p>
              <p className="mt-1 font-mono">{errorMsg}</p>
            </div>
          )}

          {/* Data Table */}
          {!loading && !errorMsg && (
            <>
              {filteredRecords.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                  <Database className="h-5 w-5 text-muted-foreground/60" />
                  <span>Nenhum registro encontrado para os filtros aplicados.</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/70 text-[11px] uppercase text-muted-foreground">
                      <tr>
                        <th className="w-24 px-3 py-2.5 text-center font-bold">Ações</th>
                        {columns.map((col) => (
                          <th key={col} className="px-3 py-2.5 font-bold whitespace-nowrap">
                            {col === primaryKey ? (
                              <span className="text-[#ea580c] font-bold underline decoration-dotted">
                                {col} (PK)
                              </span>
                            ) : (
                              col
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedRecords.map((row, idx) => {
                        const pkVal = row[primaryKey];
                        return (
                          <tr
                            key={String(pkVal ?? idx)}
                            className="transition-colors hover:bg-muted/30"
                          >
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(row)}
                                  className="h-7 w-7 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
                                  title="Editar este registro no Supabase"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(row)}
                                  className="h-7 w-7 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                                  title="Excluir este registro"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                            {columns.map((col) => {
                              const val = row[col];
                              const isPk = col === primaryKey;
                              let displayVal = "";
                              if (val === null || val === undefined) {
                                displayVal = "-";
                              } else if (typeof val === "object") {
                                displayVal = JSON.stringify(val);
                              } else {
                                displayVal = String(val);
                              }

                              const isLong = displayVal.length > 60;

                              return (
                                <td
                                  key={col}
                                  className={`px-3 py-2 text-slate-700 dark:text-slate-300 ${
                                    isPk ? "font-mono font-bold text-[#ea580c]" : ""
                                  }`}
                                >
                                  {isLong ? (
                                    <span
                                      className="line-clamp-2 cursor-pointer hover:underline"
                                      title={displayVal}
                                      onClick={() => handleOpenEdit(row)}
                                    >
                                      {displayVal}
                                    </span>
                                  ) : (
                                    displayVal
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredRecords.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 pt-2 text-xs sm:flex-row">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Linhas por página:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded border bg-background px-2 py-1 text-xs"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                      {Math.min(currentPage * itemsPerPage, filteredRecords.length)} de{" "}
                      {filteredRecords.length} registros
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 font-medium">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* =====================================================================
          MODAL: EDITAR REGISTRO EXISTENTE
         ===================================================================== */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Editar Registro em <span className="text-[#ea580c]">{currentTableMeta.nome}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tabela: <span className="font-mono">public.{currentTableMeta.key}</span> • Chave
                  Primária ({primaryKey}):{" "}
                  <strong className="font-mono text-[#ea580c]">
                    {String(editingRecord[primaryKey])}
                  </strong>
                </p>
              </div>
              <button
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {columns.map((col) => {
                  const isPk = col === primaryKey;
                  const isLong = isLongTextField(col);
                  const val = editFormData[col];
                  const stringVal = val === null || val === undefined ? "" : String(val);

                  if (col === "created_at" || col === "updated_at") {
                    return null;
                  }

                  return (
                    <div
                      key={col}
                      className={isLong ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}
                    >
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{col}</span>
                        {isPk && (
                          <span className="rounded bg-orange-500/10 px-1.5 py-0.2 text-[10px] font-bold text-[#ea580c]">
                            Chave Primária (Fixa)
                          </span>
                        )}
                      </label>
                      {isLong ? (
                        <textarea
                          rows={3}
                          value={stringVal}
                          onChange={(e) =>
                            setEditFormData((prev) => ({ ...prev, [col]: e.target.value }))
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder={`Digite ${col}...`}
                        />
                      ) : (
                        <Input
                          type={typeof editingRecord[col] === "number" ? "number" : "text"}
                          disabled={isPk}
                          value={stringVal}
                          onChange={(e) => {
                            const v =
                              typeof editingRecord[col] === "number"
                                ? Number(e.target.value)
                                : e.target.value;
                            setEditFormData((prev) => ({ ...prev, [col]: v }));
                          }}
                          className={`h-9 text-xs ${isPk ? "bg-muted font-mono" : ""}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="bg-[#510851] text-xs font-semibold text-white hover:bg-[#510851]/90"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Salvando no Supabase...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Salvar Alterações no Supabase
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NOVO REGISTRO
         ===================================================================== */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Adicionar Novo Registro em{" "}
                  <span className="text-[#ea580c]">{currentTableMeta.nome}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Insira os valores correspondentes para registrar na tabela{" "}
                  <span className="font-mono">public.{currentTableMeta.key}</span> do Supabase.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                disabled={isCreating}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {columns.map((col) => {
                  if (col === "created_at" || col === "updated_at") return null;
                  const isLong = isLongTextField(col);
                  const isPk = col === primaryKey;
                  const val = newFormData[col] ?? "";

                  return (
                    <div
                      key={col}
                      className={isLong ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}
                    >
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{col}</span>
                        {isPk && (
                          <span className="rounded bg-orange-500/10 px-1.5 py-0.2 text-[10px] font-bold text-[#ea580c]">
                            Obrigatório (PK)
                          </span>
                        )}
                      </label>
                      {isLong ? (
                        <textarea
                          rows={3}
                          value={String(val)}
                          onChange={(e) =>
                            setNewFormData((prev) => ({ ...prev, [col]: e.target.value }))
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder={`Digite ${col}...`}
                        />
                      ) : (
                        <Input
                          type="text"
                          value={String(val)}
                          onChange={(e) =>
                            setNewFormData((prev) => ({ ...prev, [col]: e.target.value }))
                          }
                          className="h-9 text-xs"
                          placeholder={`Digite ${col}...`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingNew(false)}
                disabled={isCreating}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNew}
                disabled={isCreating}
                className="bg-[#ea580c] text-xs font-semibold text-white hover:bg-[#d9460f]"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Inserindo no Supabase...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Criar Registro no Supabase
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
