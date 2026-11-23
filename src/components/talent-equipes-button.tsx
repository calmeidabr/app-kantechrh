"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { UsersRound, ExternalLink, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EquipeData } from "@/lib/mock-data";

function normName(s?: string | null): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface TalentEquipesButtonProps {
  talentoNome: string;
  equipes?: EquipeData[];
  onSelectEquipe?: (equipeNome: string) => void;
  showZeroCount?: boolean;
  className?: string;
}

export function TalentEquipesButton({
  talentoNome,
  equipes = [],
  onSelectEquipe,
  showZeroCount = false,
  className = "",
}: TalentEquipesButtonProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const equipesDoTalento = useMemo(() => {
    const target = normName(talentoNome);
    if (!target) return [];
    return equipes.filter((eq) =>
      (eq.membros || []).some((m) => normName(m.nome) === target)
    );
  }, [talentoNome, equipes]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === "undefined") return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 12;
    const popoverWidth = Math.min(300, window.innerWidth - margin * 2);
    const estimatedHeight = Math.min(280, 90 + equipesDoTalento.length * 56);

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < margin) left = margin;
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin;
    }

    const spaceBelow = window.innerHeight - rect.bottom - margin;
    let top = rect.bottom + 6;
    if (spaceBelow < estimatedHeight && rect.top - margin > spaceBelow) {
      top = Math.max(margin, rect.top - estimatedHeight - 6);
    }

    setCoords({ top, left, width: popoverWidth });
  }, [equipesDoTalento.length]);

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

  const count = equipesDoTalento.length;

  const handleTriggerClick = () => {
    if (count === 1 && onSelectEquipe) {
      onSelectEquipe(equipesDoTalento[0].nome);
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
            aria-label={`Equipes de ${talentoNome}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <UsersRound className="h-3.5 w-3.5 text-[#510851] dark:text-[#a78bfa] shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Equipes ({count})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
                aria-label="Fechar lista de equipes"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {count === 0 ? (
              <p className="py-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>{talentoNome}</strong> não participa de nenhuma equipe
                cadastrada no momento.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {equipesDoTalento.map((eq) => {
                  const isLider = (eq.membros || []).some(
                    (m) => normName(m.nome) === normName(talentoNome) && m.lider
                  );
                  return (
                    <li key={eq.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onSelectEquipe?.(eq.nome);
                        }}
                        className="w-full rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2 text-left hover:border-[#510851]/50 hover:bg-[#510851]/5 transition-colors flex items-start justify-between gap-2 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#510851] dark:group-hover:text-[#a78bfa] truncate">
                              {eq.nome}
                            </span>
                            {isLider && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                                <Crown className="h-2.5 w-2.5" />
                                Líder
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {eq.empresa} • {eq.departamento} •{" "}
                            {eq.membros.length} integrante(s)
                          </div>
                        </div>
                        {onSelectEquipe && (
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#510851] dark:group-hover:text-[#a78bfa] shrink-0 mt-0.5" />
                        )}
                      </button>
                    </li>
                  );
                })}
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTriggerClick}
        className={`gap-1.5 text-xs font-bold border-[#510851]/40 text-[#510851] hover:bg-[#510851]/10 dark:text-purple-300 h-9 shadow-xs ${
          className.includes("w-full") ? "w-full justify-center" : ""
        }`}
        title={
          count === 1
            ? `Ir para a equipe "${equipesDoTalento[0].nome}"`
            : count > 1
            ? `Participa de ${count} equipes — clique para escolher`
            : "Nenhuma equipe vinculada"
        }
      >
        <UsersRound className="h-3.5 w-3.5 shrink-0 text-[#510851] dark:text-[#a78bfa]" />
        <span className="truncate">Equipes</span>
        {(count > 0 || showZeroCount) && (
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold shrink-0 ${
              count > 0
                ? "bg-[#510851]/15 dark:bg-purple-900/60 text-[#510851] dark:text-purple-200"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {count}
          </span>
        )}
      </Button>

      {popoverContent}
    </div>
  );
}
