"use client";

import React, { useState } from "react";

const COORDS_MAP: Record<number, [number, number]> = {
  1: [794, 176],
  2: [1037, 243],
  3: [960, 380],
  4: [794, 585],
  5: [486, 585],
  6: [320, 380],
  7: [243, 243],
  8: [486, 176],
  9: [640, 120],
  11: [1037, 243],
  22: [794, 585],
};

// Cores oficiais de PROG/utils/graphics.py (gerar_svg_triangulos_harmonicos)
const FILL_COLORS = [
  "rgba(255, 200, 100, 0.5)",
  "rgba(100, 200, 255, 0.5)",
  "rgba(200, 255, 100, 0.5)",
  "rgba(255, 100, 200, 0.5)",
  "rgba(100, 255, 200, 0.5)",
  "rgba(255, 160, 100, 0.5)",
  "rgba(160, 100, 255, 0.5)",
  "rgba(100, 160, 255, 0.5)",
];

const BORDER_COLORS = [
  "rgba(255, 200, 100, 0.95)",
  "rgba(100, 200, 255, 0.95)",
  "rgba(200, 255, 100, 0.95)",
  "rgba(255, 100, 200, 0.95)",
  "rgba(100, 255, 200, 0.95)",
  "rgba(255, 160, 100, 0.95)",
  "rgba(160, 100, 255, 0.95)",
  "rgba(100, 160, 255, 0.95)",
];

function resolveCoord(valNum: number): [number, number] | null {
  if (valNum in COORDS_MAP) {
    return COORDS_MAP[valNum];
  }
  const valReduz = String(Math.abs(valNum))
    .split("")
    .reduce((acc, d) => acc + (parseInt(d, 10) || 0), 0);
  if (valReduz in COORDS_MAP) {
    return COORDS_MAP[valReduz];
  }
  return null;
}

export interface TriangleMemberInput {
  nome: string;
  vertices: [number, number, number];
  isLider?: boolean;
  isCandidatoDestaque?: boolean;
}

export function KanTrianglesSvg({
  membros,
}: {
  membros: TriangleMemberInput[];
}) {
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  // Ordenar alfabeticamente primeiro (como sorted(lista_membros) em equipes_menu.py)
  // e colocar líder/candidato por último (por cima), igual a gerar_svg_triangulos_harmonicos em graphics.py
  const sortedMembros = [...membros]
    .sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0))
    .sort((a, b) => {
      const scoreA = a.isCandidatoDestaque ? 2 : a.isLider ? 1 : 0;
      const scoreB = b.isCandidatoDestaque ? 2 : b.isLider ? 1 : 0;
      return scoreA - scoreB;
    });

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-[#1e1d24]"
      >
        <svg
          viewBox="0 0 1280 720"
          className="w-full h-auto block select-none"
        >
          <defs>
            <filter id="kanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Official KAN Plane Background Image */}
          <image
            href="/images/plano_kan_fundo.jpg"
            x="0"
            y="0"
            width="1280"
            height="720"
          />

          {sortedMembros.map((m, idx) => {
            const pts = m.vertices
              .map((v) => resolveCoord(Number(v)))
              .filter(Boolean) as [number, number][];

            if (pts.length !== 3) return null;

            const ptsStr = pts.map((p) => `${p[0]},${p[1]}`).join(" ");
            const cx = Math.floor((pts[0][0] + pts[1][0] + pts[2][0]) / 3);
            const cy = Math.floor((pts[0][1] + pts[1][1] + pts[2][1]) / 3);

            const isHovered = hoveredMember === m.nome;
            const colorIdx = idx % FILL_COLORS.length;
            const fillColor = m.isCandidatoDestaque
              ? "rgba(234, 88, 12, 0.62)"
              : FILL_COLORS[colorIdx];
            const strokeColor = isHovered
              ? "#FFFFFF"
              : m.isLider || m.isCandidatoDestaque
              ? "#FFFFFF"
              : BORDER_COLORS[colorIdx];
            const strokeWidth = isHovered
              ? 4
              : m.isLider || m.isCandidatoDestaque
              ? 4.5
              : 2;

            const primeiroNome = String(m.nome).trim().split(/\s+/)[0] || m.nome;
            const displayLabel = m.isLider
              ? `👑 ${primeiroNome}`
              : m.isCandidatoDestaque
              ? `★ ${primeiroNome}`
              : primeiroNome;

            return (
              <g
                key={m.nome}
                onMouseEnter={() => setHoveredMember(m.nome)}
                onMouseLeave={() => setHoveredMember(null)}
                className="cursor-pointer transition-all duration-200"
                style={{
                  filter: isHovered
                    ? "url(#kanGlow) brightness(1.25)"
                    : undefined,
                }}
              >
                <polygon
                  points={ptsStr}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fillOpacity={isHovered ? 0.75 : 1}
                />

                {/* Esfera preta no vértice do KAN (pts[0]) igual a PROG/utils/graphics.py */}
                <circle
                  cx={pts[0][0]}
                  cy={pts[0][1]}
                  r={6}
                  fill="#000000"
                />

                <text
                  x={cx}
                  y={cy}
                  fontFamily="Arial, sans-serif"
                  fontSize={isHovered ? 42 : 34}
                  fontWeight="bold"
                  fill={isHovered ? "#FFFFFF" : "#EFEFEF"}
                  textAnchor="middle"
                  dominantBaseline="central"
                  stroke="#101010"
                  strokeWidth="2"
                  paintOrder="stroke fill"
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Legend Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-400 mr-1">
          Passe o mouse para destacar o triângulo:
        </span>
        {sortedMembros.map((m, idx) => (
          <button
            key={m.nome}
            onMouseEnter={() => setHoveredMember(m.nome)}
            onMouseLeave={() => setHoveredMember(null)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              hoveredMember === m.nome
                ? "border-[#510851] bg-[#510851] text-white shadow-xs"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: m.isCandidatoDestaque
                  ? "#ea580c"
                  : BORDER_COLORS[idx % BORDER_COLORS.length],
              }}
            />
            <span>
              {m.isLider ? "👑 " : m.isCandidatoDestaque ? "★ " : ""}
              {m.nome}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
