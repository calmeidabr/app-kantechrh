import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Server-side in-memory cache for talent photos to avoid repeated DB queries
const fotoCache = new Map<string, string | null>();
let batchPreloadPromise: Promise<void> | null = null;

async function ensurePhotosPreloaded() {
  if (fotoCache.size > 0) return;
  if (batchPreloadPromise) {
    await batchPreloadPromise;
    return;
  }

  batchPreloadPromise = (async () => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin
        .from("mapas_salvos")
        .select("id, nome, foto_base64")
        .not("foto_base64", "is", null)
        .limit(1000);

      if (data) {
        for (const row of data) {
          const b64 = String(row.foto_base64 || "").trim();
          if (b64.length > 20) {
            fotoCache.set(String(row.id), b64);
            if (row.nome) {
              fotoCache.set(`nome:${String(row.nome).toLowerCase()}`, b64);
            }
          }
        }
      }
    } catch {
      // Ignore preload errors
    } finally {
      batchPreloadPromise = null;
    }
  })();

  await batchPreloadPromise;
}

function buildInitialsSvg(nome: string): string {
  const parts = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) || "KR").toUpperCase();

  const colors = [
    ["#510851", "#8b5cf6"],
    ["#ea580c", "#f97316"],
    ["#0f766e", "#10b981"],
    ["#1d4ed8", "#6366f1"],
    ["#9d174d", "#ec4899"],
  ];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash * 31 + nome.charCodeAt(i)) % colors.length;
  }
  const [c1, c2] = colors[Math.abs(hash) % colors.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="80" fill="url(#g)" />
    <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700">${initials}</text>
  </svg>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const nome = searchParams.get("nome") || "Talento KAN";

  await ensurePhotosPreloaded();

  let b64 = fotoCache.get(id) ?? fotoCache.get(`nome:${nome.toLowerCase()}`);

  if (b64 === undefined && id) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin
        .from("mapas_salvos")
        .select("foto_base64")
        .eq("id", id)
        .single();
      const raw = String(data?.foto_base64 || "").trim();
      b64 = raw.length > 20 ? raw : null;
      fotoCache.set(id, b64);
    } catch {
      b64 = null;
      fotoCache.set(id, null);
    }
  }

  if (b64 && b64.length > 20) {
    const cleanB64 = b64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    const buffer = Buffer.from(cleanB64, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const svg = buildInitialsSvg(nome);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
