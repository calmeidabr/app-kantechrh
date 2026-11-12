import fs from "fs";
import path from "path";
import { DetalheAtributoAuditoria } from "./mock-data";

/**
 * Remove acentos e normaliza para caixa alta sem caracteres especiais.
 */
function removerAcentos(str: string): string {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function cleanStr(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  if (
    !s ||
    s.toLowerCase() === "nan" ||
    s.toLowerCase() === "none" ||
    s.toLowerCase() === "null" ||
    s === "undefined"
  ) {
    return fallback;
  }
  return s;
}

function extractNum(val: unknown): number | null {
  if (typeof val === "number" && !isNaN(val)) return val;
  const s = String(val || "").trim();
  const match = s.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Caches em memória
let matrizDbCache: Map<string, Record<string, string>> | null = null;
let atributosDbCache: Map<string, { perfil: string; categoria: string; qualidade: string }> | null = null;
let repeticaoDbCache: Map<string, { perfil: string; categoria: string; qualidade: string; desafio: string }> | null = null;

function loadDatabases() {
  if (matrizDbCache && atributosDbCache && repeticaoDbCache) {
    return {
      matrizDb: matrizDbCache,
      atributosDb: atributosDbCache,
      repeticaoDb: repeticaoDbCache,
    };
  }

  const baseDir = path.join(process.cwd(), "mam-kantechrh", "data");

  // 1. Tabela Matriz.csv
  const matrizDb = new Map<string, Record<string, string>>();
  try {
    const matrizPath = path.join(baseDir, "Tabela Matriz.csv");
    if (fs.existsSync(matrizPath)) {
      const lines = fs.readFileSync(matrizPath, "utf8").split(/\r?\n/).filter(Boolean);
      const headers = lines[0].split(";").map((h) => removerAcentos(h));
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(";");
        const resultado = cleanStr(parts[0]);
        if (!resultado) continue;
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cleanStr(parts[idx]);
        });
        matrizDb.set(resultado, rowObj);
      }
    }
  } catch (err) {
    console.warn("Aviso ao ler Tabela Matriz.csv:", err);
  }

  // 2. Atributos.csv
  const atributosDb = new Map<string, { perfil: string; categoria: string; qualidade: string }>();
  try {
    const attrPath = path.join(baseDir, "Atributos.csv");
    if (fs.existsSync(attrPath)) {
      const lines = fs.readFileSync(attrPath, "utf8").split(/\r?\n/).filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(";");
        const attrKey = removerAcentos(parts[0]);
        if (!attrKey) continue;
        atributosDb.set(attrKey, {
          perfil: cleanStr(parts[1], "N/A"),
          categoria: cleanStr(parts[2], "N/A"),
          qualidade: cleanStr(parts[3], "N/A"),
        });
      }
    }
  } catch (err) {
    console.warn("Aviso ao ler Atributos.csv:", err);
  }

  // 3. Repeticao.csv
  const repeticaoDb = new Map<string, { perfil: string; categoria: string; qualidade: string; desafio: string }>();
  try {
    const repPath = path.join(baseDir, "Repeticao.csv");
    if (fs.existsSync(repPath)) {
      const lines = fs.readFileSync(repPath, "utf8").split(/\r?\n/).filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(";");
        const repKey = cleanStr(parts[0]);
        if (!repKey) continue;
        repeticaoDb.set(repKey, {
          perfil: cleanStr(parts[1], "N/A"),
          categoria: cleanStr(parts[2], "N/A"),
          qualidade: cleanStr(parts[3], "N/A"),
          desafio: cleanStr(parts[4], ""),
        });
      }
    }
  } catch (err) {
    console.warn("Aviso ao ler Repeticao.csv:", err);
  }

  matrizDbCache = matrizDb;
  atributosDbCache = atributosDb;
  repeticaoDbCache = repeticaoDb;

  return { matrizDb, atributosDb, repeticaoDb };
}

/**
 * Mapeia soft skills metodológicas para uma linha de atributo.
 */
export function determinarSoftSkillsLinha(
  perfil: string,
  categoria: string,
  qualidade: string,
  atributo = "",
  campo = ""
): string {
  const p = removerAcentos(perfil);
  const c = removerAcentos(categoria);
  const q = removerAcentos(qualidade);
  const a = removerAcentos(atributo);

  const skills: string[] = [];
  if (q.includes("COMUNIC") || p.includes("COMUNIC")) {
    skills.push("Comunicação eficaz", "Comunicação assertiva", "Escuta ativa");
  }
  if (q.includes("RELACIONAM") || p.includes("RELACIONAM")) {
    skills.push("Relacionamento interpessoal", "Empatia", "Trabalho em equipe");
  }
  if (q.includes("EXECU") || p.includes("EXECU") || p.includes("RESULT")) {
    skills.push("Produtividade", "Disciplina", "Gestão do tempo");
  }
  if (q.includes("ORGANIZ") || c.includes("ORGANIZ")) {
    skills.push("Organização", "Gestão do tempo", "Atenção / foco");
  }
  if (q.includes("ANALIS") || c.includes("ANALIT")) {
    skills.push("Pensamento crítico", "Resolução de problemas", "Atenção / foco");
  }
  if (p.includes("LIDER") || q.includes("JUSTI")) {
    skills.push("Liderança", "Tomada de decisão", "Ética / responsabilidade");
  }
  if (q.includes("COLETIV") || a.includes("COOPER")) {
    skills.push("Colaboração", "Trabalho em equipe", "Inteligência emocional");
  }
  if (q.includes("VERSATIL") || c.includes("VERSATIL")) {
    skills.push("Adaptabilidade / flexibilidade", "Proatividade", "Resiliência");
  }
  if (p.includes("CRIATIV") || c.includes("INOV") || a.includes("INOV")) {
    skills.push("Criatividade", "Inovação / melhoria contínua", "Visão sistêmica");
  }
  if (p.includes("VENDED") || a.includes("PERSUAS")) {
    skills.push("Comunicação assertiva", "Proatividade", "Resiliência");
  }
  if (p.includes("INFLUEN") || c.includes("MAGNET")) {
    skills.push("Comunicação eficaz", "Relacionamento interpessoal", "Liderança");
  }

  const dedup: string[] = [];
  for (const s of skills) {
    if (!dedup.includes(s)) dedup.push(s);
  }

  if (dedup.length === 0) {
    dedup.push("Adaptabilidade / flexibilidade", "Trabalho em equipe", "Proatividade");
  }

  return dedup.slice(0, 3).join(", ");
}

/**
 * Executa o cálculo da decomposição de atributos no servidor (BFF) com base
 * nos dados do mapa e das tabelas metodológicas KAN.
 */
export function calcularDetalhamentoAtributosServidor(talento: {
  nome: string;
  data_nascimento?: string;
  valores_mapa?: Record<string, string>;
  vertices_triangulo?: [number, number, number] | number[];
  estrutural?: number;
  direcionamento?: number;
  kan_numero?: number;
}): DetalheAtributoAuditoria[] {
  const { matrizDb, atributosDb, repeticaoDb } = loadDatabases();

  const vMapa = talento.valores_mapa || {};
  const vVerts = talento.vertices_triangulo || [8, 1, 7];

  // Extrai dia natalício
  let diaNatalicio = extractNum(vMapa.dia_natalicio);
  if (!diaNatalicio && talento.data_nascimento) {
    const parts = talento.data_nascimento.split("/");
    if (parts.length >= 1) diaNatalicio = extractNum(parts[0]);
  }
  if (!diaNatalicio) diaNatalicio = 14;

  const camposValores: Array<{ campo: string; val: number | string; colMatriz?: string }> = [
    { campo: "Motivação", val: extractNum(vMapa.motivacao) ?? vVerts[0] ?? 3, colMatriz: "MOTIVACAO" },
    { campo: "Impressão", val: extractNum(vMapa.impressao) ?? 6, colMatriz: "IMPRESSAO" },
    { campo: "Expressão", val: extractNum(vMapa.expressao) ?? vVerts[1] ?? 9, colMatriz: "EXPRESSAO" },
    { campo: "Destino", val: extractNum(vMapa.destino) ?? vVerts[2] ?? 2, colMatriz: "DESTINO" },
    { campo: "Missão", val: extractNum(vMapa.missao) ?? 5, colMatriz: "MISSAO" },
    { campo: "Dia Natalício", val: diaNatalicio, colMatriz: "DIA NATALICIO" },
    { campo: "Triângulo", val: extractNum(vMapa.triangulo) ?? talento.kan_numero ?? vVerts[0] ?? 3, colMatriz: "TRIANGULO" },
    { campo: "No Psiquico", val: extractNum(vMapa.numero_psiquico) ?? diaNatalicio, colMatriz: "NO PSIQUICO" },
    { campo: "Estrutural", val: talento.estrutural ?? vVerts[1] ?? 1 },
    { campo: "Direcionamento", val: talento.direcionamento ?? vVerts[2] ?? 7 },
    { campo: "REPETIÇÃO 1", val: extractNum(vMapa.repeticao_1) ?? 4 },
    { campo: "REPETIÇÃO 2", val: extractNum(vMapa.repeticao_2) ?? 8 },
  ];

  const itens: DetalheAtributoAuditoria[] = [];

  for (const item of camposValores) {
    const valStr = String(item.val ?? "");
    let attrNome = "";
    let perfilNome = "N/A";
    let catNome = "N/A";
    let qualNome = "N/A";

    if (item.colMatriz) {
      let rowM = matrizDb.get(valStr);
      if (!rowM && item.val) {
        // Redução teosófica para números > 9 que não estejam diretamente na matriz
        const numVal = Number(item.val);
        if (!isNaN(numVal) && numVal > 9 && numVal !== 11 && numVal !== 22) {
          const reduz = String(numVal)
            .split("")
            .reduce((acc, d) => acc + parseInt(d, 10), 0);
          rowM = matrizDb.get(String(reduz));
        }
      }

      if (rowM) {
        attrNome = rowM[item.colMatriz] || rowM[item.colMatriz.replace(" ", "")] || "";
        if (attrNome && attrNome !== "NAN") {
          const ai = atributosDb.get(removerAcentos(attrNome));
          if (ai) {
            perfilNome = ai.perfil !== "N/A" ? ai.perfil : perfilNome;
            catNome = ai.categoria !== "N/A" ? ai.categoria : catNome;
            qualNome = ai.qualidade !== "N/A" ? ai.qualidade : qualNome;
          }
        }
      }
    } else {
      // Repetição / Estrutural / Direcionamento
      const repRow = repeticaoDb.get(valStr);
      if (repRow) {
        perfilNome = repRow.perfil !== "N/A" ? repRow.perfil : perfilNome;
        catNome = repRow.categoria !== "N/A" ? repRow.categoria : catNome;
        qualNome = repRow.qualidade !== "N/A" ? repRow.qualidade : qualNome;
        attrNome = `Repetição ${valStr}`;
      } else {
        attrNome = `Repetição ${valStr}`;
      }
    }

    const attrDisplay = attrNome || `Padrão ${valStr}`;
    const softSkillsStr = determinarSoftSkillsLinha(perfilNome, catNome, qualNome, attrDisplay, item.campo);

    itens.push({
      campo: item.campo,
      valor: valStr,
      atributo: attrDisplay,
      perfil: perfilNome,
      categoria: catNome,
      qualidade: qualNome,
      soft_skills: softSkillsStr,
    });
  }

  return itens;
}
