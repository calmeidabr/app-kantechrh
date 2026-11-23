"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Briefcase, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VagaData } from "@/lib/mock-data";

function normName(s?: string | null): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface TalentProcessosButtonProps {
  talentoNome: string;
  vagas?: VagaData[];
  onSelectProcesso?: (vagaId: number) => void;
  compact?: boolean;
  showZeroCount?: boolean;
  directIfSingle?: boolean;
  className?: string;
}

export function TalentProcessosButton({
  talentoNome,
  vagas = [],
  onSelectProcesso,
  compact = false,
  showZeroCount = false,
  directIfSingle = false,
  className = "",
}: TalentProcessosButtonProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const processosDoTalento = useMemo(() => {
    const target = normName(talentoNome);
    if (!target) return [];
    return vagas.filter((v) =>
      (v.candidatos_associados || []).some((c) => normName(c) === target)
    );
  }, [talentoNome, vagas]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === "undefined") return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 12;
    const popoverWidth = Math.min(300, window.innerWidth - margin * 2);
    const estimatedHeight = Math.min(280, 90 + processosDoTalento.length * 56);

    // Horizontal: centraliza em relação ao botão e limita às bordas da tela
    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < margin) left = margin;
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin;
    }

    // Vertical: abre abaixo se houver espaço, senão abre acima do botão
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    let top = rect.bottom + 6;
    if (spaceBelow < estimatedHeight && rect.top - margin > spaceBelow) {
      top = Math.max(margin, rect.top - estimatedHeight - 6);
    }

    setCoords({ top, left, width: popoverWidth });
  }, [processosDoTalento.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  const count = processosDoTalento.length;

  const handleTriggerClick = () => {
    if (directIfSingle && count === 1 && onSelectProcesso) {
      onSelectProcesso(processosDoTalento[0].id);
      return;
    }
    setOpen((prev) => !prev);
  };

  const popoverContent =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-100"
            role="dialog"
            aria-label={`Processos seletivos de ${talentoNome}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Briefcase className="h-3.5 w-3.5 text-[#ea580c] shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Processos Seletivos ({count})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
                aria-label="Fechar lista de processos seletivos"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {count === 0 ? (
              <p className="py-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>{talentoNome}</strong> não está participando de nenhum
                processo seletivo no momento.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {processosDoTalento.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onSelectProcesso?.(v.id);
                      }}
                      className="w-full rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2 text-left hover:border-[#ea580c]/50 hover:bg-[#ea580c]/5 transition-colors flex items-start justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#ea580c] truncate">
                          {v.nome_vaga}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {v.empresa} • {v.departamento} • {v.senioridade}
                        </div>
                      </div>
                      {onSelectProcesso && (
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#ea580c] shrink-0 mt-0.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          title={
            count > 0
              ? `Participando de ${count} processo(s) seletivo(s)`
              : "Ver processos seletivos vinculados"
          }
          className="inline-flex items-center gap-1 rounded-md border border-[#ea580c]/35 bg-[#ea580c]/5 px-2 py-1 text-[10px] font-semibold text-[#ea580c] hover:bg-[#ea580c]/15 transition-colors"
        >
          <Briefcase className="h-3 w-3 shrink-0" />
          <span>Processos Seletivos</span>
          {count > 0 && (
            <span className="rounded-full bg-[#ea580c] text-white px-1.5 py-0 text-[9px] font-bold leading-tight">
              {count}
            </span>
          )}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTriggerClick}
          className={`gap-1.5 text-xs font-semibold border-[#ea580c]/40 text-[#ea580c] hover:bg-[#ea580c]/10 dark:text-orange-300 ${
            className.includes("w-full") ? "w-full justify-center" : ""
          }`}
          title={
            directIfSingle && count === 1
              ? `Ir para o processo seletivo "${processosDoTalento[0].nome_vaga}"`
              : count > 0
              ? `Participando de ${count} processo(s) seletivo(s)`
              : "Ver processos seletivos deste talento"
          }
        >
          <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#ea580c]" />
          <span className="truncate">Processos Seletivos</span>
          {(count > 0 || showZeroCount) && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold shrink-0 ${
                count > 0
                  ? "bg-[#ea580c]/15 dark:bg-orange-900/60 text-[#ea580c] dark:text-orange-200"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {count}
            </span>
          )}
        </Button>
      )}

      {popoverContent}
    </div>
  );
}
