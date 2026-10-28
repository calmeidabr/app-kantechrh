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

const FILL_COLORS = [
  "rgba(249, 115, 22, 0.45)", // Laranja Kantech
  "rgba(139, 92, 246, 0.45)", // Violeta KAN
  "rgba(16, 185, 129, 0.45)", // Esmeralda
  "rgba(59, 130, 246, 0.45)", // Azul
  "rgba(236, 72, 153, 0.45)", // Rosa
  "rgba(234, 179, 8, 0.45)",  // Âmbar
];

const BORDER_COLORS = [
  "rgba(249, 115, 22, 0.95)",
  "rgba(167, 139, 250, 0.95)",
  "rgba(52, 211, 153, 0.95)",
  "rgba(96, 165, 250, 0.95)",
  "rgba(244, 114, 182, 0.95)",
  "rgba(250, 204, 21, 0.95)",
];

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

  // Draw regular members first, leader and highlighted candidate on top
  const sortedMembros = [...membros].sort((a, b) => {
    const scoreA = a.isCandidatoDestaque ? 2 : a.isLider ? 1 : 0;
    const scoreB = b.isCandidatoDestaque ? 2 : b.isLider ? 1 : 0;
    return scoreA - scoreB;
  });

  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg bg-[#16151d]">
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
            preserveAspectRatio="xMidYMid slice"
          />

          {sortedMembros.map((m, idx) => {
            const pts = m.vertices
              .map((v) => COORDS_MAP[v] || COORDS_MAP[(v % 9) || 9])
              .filter(Boolean);

            if (pts.length !== 3) return null;

            const ptsStr = pts.map((p) => `${p[0]},${p[1]}`).join(" ");
            const cx = Math.round((pts[0][0] + pts[1][0] + pts[2][0]) / 3);
            const cy = Math.round((pts[0][1] + pts[1][1] + pts[2][1]) / 3);

            const isHovered = hoveredMember === m.nome;
            const fillColor = m.isCandidatoDestaque
              ? "rgba(234, 88, 12, 0.62)"
              : FILL_COLORS[idx % FILL_COLORS.length];
            const strokeColor = isHovered
              ? "#FFFFFF"
              : m.isLider || m.isCandidatoDestaque
              ? "#FFFFFF"
              : BORDER_COLORS[idx % BORDER_COLORS.length];
            const strokeWidth = isHovered
              ? 4.5
              : m.isLider || m.isCandidatoDestaque
              ? 4
              : 2.2;

            const primeiroNome = m.nome.split(" ")[0];
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
                  filter: isHovered ? "url(#kanGlow) brightness(1.2)" : undefined,
                  opacity:
                    hoveredMember && hoveredMember !== m.nome ? 0.35 : 1,
                }}
              >
                <polygon
                  points={ptsStr}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />

                {/* Black sphere at primary KAN vertex (pts[0]) */}
                <circle
                  cx={pts[0][0]}
                  cy={pts[0][1]}
                  r={7}
                  fill="#000000"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />

                <text
                  x={cx}
                  y={cy}
                  fontSize={isHovered ? 38 : 31}
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                  dominantBaseline="central"
                  stroke="#0f172a"
                  strokeWidth="3"
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
          Passe o mouse para isolar o triângulo:
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
            <span className="text-[10px] opacity-65">
              [{m.vertices.join(" • ")}]
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
