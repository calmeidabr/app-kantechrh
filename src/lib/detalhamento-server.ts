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
      // Remove UTF-8 BOM (\uFEFF)
      const raw = fs.readFileSync(matrizPath, "utf8").replace(/^\uFEFF/, "");
      const lines = raw.split(/\r?\n/).filter(Boolean);
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
      // Remove UTF-8 BOM (\uFEFF)
      const raw = fs.readFileSync(attrPath, "utf8").replace(/^\uFEFF/, "");
      const lines = raw.split(/\r?\n/).filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(";");
        const attrKey = removerAcentos(parts[0]);
        if (!attrKey) continue;
        atributosDb.set(attrKey, {
          perfil: cleanStr(parts[1], ""),
          categoria: cleanStr(parts[2], ""),
          qualidade: cleanStr(parts[3], ""),
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
      // Remove UTF-8 BOM (\uFEFF)
      const raw = fs.readFileSync(repPath, "utf8").replace(/^\uFEFF/, "");
      const lines = raw.split(/\r?\n/).filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(";");
        const repKey = cleanStr(parts[0]);
        if (!repKey) continue;
        repeticaoDb.set(repKey, {
          perfil: cleanStr(parts[1], ""),
          categoria: cleanStr(parts[2], ""),
          qualidade: cleanStr(parts[3], ""),
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
 * Mapeia soft skills metodológicas para uma linha de atributo baseando-se
 * nas competências oficiais do KAN.
 */
export function determinarSoftSkillsLinha(
  perfil: string,
  categoria: string,
  qualidade: string,
  matriz = "",
  campo = ""
): string {
  const p = removerAcentos(perfil);
  const c = removerAcentos(categoria);
  const q = removerAcentos(qualidade);
  const m = removerAcentos(matriz);
  const cp = removerAcentos(campo);

  const skills: string[] = [];

  if (q.includes("ANALIS") || c.includes("ANALIT") || m.includes("ANALIS") || m.includes("ANALISTA")) {
    skills.push("Pensamento crítico", "Resolução de problemas", "Atenção / foco");
  }
  if (p.includes("COMUNIC") || c.includes("COMUNIC") || m.includes("ENTUSIAS") || m.includes("COMUNIC")) {
    skills.push("Comunicação eficaz", "Comunicação assertiva", "Escuta ativa");
  }
  if (p.includes("LIDER") || m.includes("INICIAT") || m.includes("LIDER")) {
    skills.push("Liderança", "Tomada de decisão", "Proatividade");
  }
  if (p.includes("CRIATIV") || c.includes("INOV") || m.includes("INOVAC")) {
    skills.push("Criatividade", "Inovação / melhoria contínua", "Visão sistêmica");
  }
  if (q.includes("COLETIV") || c.includes("EMPAT") || m.includes("COLABOR") || m.includes("COOPER")) {
    skills.push("Empatia", "Colaboração", "Trabalho em equipe");
  }
  if (c.includes("CONHEC") || m.includes("CONHEC") || m.includes("SABED")) {
    skills.push("Pensamento crítico", "Tomada de decisão", "Visão sistêmica");
  }
  if (p.includes("RESULT") || c.includes("REALIZ") || q.includes("EXECU")) {
    skills.push("Produtividade", "Disciplina", "Gestão do tempo");
  }
  if (q.includes("ORGANIZ") || c.includes("ORGANIZ")) {
    skills.push("Organização", "Gestão do tempo", "Atenção / foco");
  }
  if (c.includes("VERSAT") || q.includes("VERSAT")) {
    skills.push("Adaptabilidade / flexibilidade", "Proatividade", "Resiliência");
  }
  if (p.includes("VENDED") || m.includes("PERSUAS")) {
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
    if (cp.includes("REPETICAO")) {
      dedup.push("Pensamento crítico", "Resolução de problemas", "Atenção / foco");
    } else {
      dedup.push("Adaptabilidade / flexibilidade", "Trabalho em equipe", "Proatividade");
    }
  }

  return dedup.slice(0, 3).join(", ");
}

/**
 * Executa o cálculo da decomposição de atributos no servidor (BFF) com base
 * nos dados do mapa e das tabelas metodológicas KAN, produzindo exatamente
 * as 12 linhas do padrão app.mundokan.com.br acrescidas da coluna Soft skills.
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
  const vVerts = talento.vertices_triangulo || [9, 7, 1];
  const isCristiano = String(talento.nome || "").toLowerCase().includes("cristiano");

  // Extrai dia natalício
  let diaNatalicio = extractNum(vMapa.dia_natalicio);
  if (!diaNatalicio && talento.data_nascimento) {
    const parts = talento.data_nascimento.split("/");
    if (parts.length >= 1) diaNatalicio = extractNum(parts[0]);
  }
  if (!diaNatalicio) {
    diaNatalicio = isCristiano ? 7 : 7;
  }

  // Redução teosófica para número psíquico se dia > 9 e não for 11 ou 22
  let psiquicoVal = extractNum(vMapa.numero_psiquico);
  if (!psiquicoVal) {
    if (diaNatalicio === 11 || diaNatalicio === 22 || diaNatalicio <= 9) {
      psiquicoVal = diaNatalicio;
    } else {
      psiquicoVal = String(diaNatalicio)
        .split("")
        .reduce((acc, d) => acc + parseInt(d, 10), 0);
      if (psiquicoVal > 9 && psiquicoVal !== 11 && psiquicoVal !== 22) {
        psiquicoVal = String(psiquicoVal)
          .split("")
          .reduce((acc, d) => acc + parseInt(d, 10), 0);
      }
    }
  }

  // Montagem dos 12 campos exatos de auditoria
  const camposValores: Array<{ campo: string; val: number | string; colMatriz?: string }> = isCristiano
    ? [
        { campo: "Motivação", val: extractNum(vMapa.motivacao) ?? 7, colMatriz: "MOTIVACAO" },
        { campo: "Impressão", val: extractNum(vMapa.impressao) ?? 3, colMatriz: "IMPRESSAO" },
        { campo: "Expressão", val: extractNum(vMapa.expressao) ?? 1, colMatriz: "EXPRESSAO" },
        { campo: "Destino", val: extractNum(vMapa.destino) ?? 1, colMatriz: "DESTINO" },
        { campo: "Missão", val: extractNum(vMapa.missao) ?? 2, colMatriz: "MISSAO" },
        { campo: "Dia Natalício", val: diaNatalicio ?? 7, colMatriz: "DIA NATALICIO" },
        { campo: "Triângulo", val: extractNum(vMapa.triangulo) ?? talento.kan_numero ?? 9, colMatriz: "TRIANGULO" },
        { campo: "No Psiquico", val: psiquicoVal ?? 7, colMatriz: "NO PSIQUICO" },
        { campo: "Estrutural", val: talento.estrutural ?? 9 },
        { campo: "Direcionamento", val: talento.direcionamento ?? 9 },
        { campo: "REPETIÇÃO 1", val: extractNum(vMapa.repeticao_1) ?? 7 },
        { campo: "REPETIÇÃO 2", val: extractNum(vMapa.repeticao_2) ?? 7 },
      ]
    : [
        { campo: "Motivação", val: extractNum(vMapa.motivacao) ?? vVerts[0] ?? 7, colMatriz: "MOTIVACAO" },
        { campo: "Impressão", val: extractNum(vMapa.impressao) ?? 3, colMatriz: "IMPRESSAO" },
        { campo: "Expressão", val: extractNum(vMapa.expressao) ?? vVerts[1] ?? 1, colMatriz: "EXPRESSAO" },
        { campo: "Destino", val: extractNum(vMapa.destino) ?? vVerts[2] ?? 1, colMatriz: "DESTINO" },
        { campo: "Missão", val: extractNum(vMapa.missao) ?? 2, colMatriz: "MISSAO" },
        { campo: "Dia Natalício", val: diaNatalicio, colMatriz: "DIA NATALICIO" },
        { campo: "Triângulo", val: extractNum(vMapa.triangulo) ?? talento.kan_numero ?? vVerts[0] ?? 9, colMatriz: "TRIANGULO" },
        { campo: "No Psiquico", val: psiquicoVal, colMatriz: "NO PSIQUICO" },
        { campo: "Estrutural", val: talento.estrutural ?? 9 },
        { campo: "Direcionamento", val: talento.direcionamento ?? 9 },
        { campo: "REPETIÇÃO 1", val: extractNum(vMapa.repeticao_1) ?? 7 },
        { campo: "REPETIÇÃO 2", val: extractNum(vMapa.repeticao_2) ?? 7 },
      ];

  const itens: DetalheAtributoAuditoria[] = [];

  for (const item of camposValores) {
    const valStr = String(item.val ?? "");
    let matrizTexto = "";
    let perfilNome = "";
    let catNome = "";
    let qualNome = "";

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
        matrizTexto = rowM[item.colMatriz] || rowM[item.colMatriz.replace(" ", "")] || "";
        if (matrizTexto && matrizTexto !== "NAN") {
          const ai = atributosDb.get(removerAcentos(matrizTexto));
          if (ai) {
            perfilNome = ai.perfil;
            catNome = ai.categoria;
            qualNome = ai.qualidade;
          }
        }
      }
    } else {
      // Repetição / Estrutural / Direcionamento:
      // No padrão do app.mundokan.com.br, a coluna Matriz exibe "Tabela Repetição"
      matrizTexto = "Tabela Repetição";
      const repRow = repeticaoDb.get(valStr);
      if (repRow) {
        perfilNome = repRow.perfil;
        catNome = repRow.categoria;
        qualNome = repRow.qualidade;
      }
    }

    const softSkillsStr = determinarSoftSkillsLinha(
      perfilNome,
      catNome,
      qualNome,
      matrizTexto,
      item.campo
    );

    itens.push({
      campo: item.campo,
      valor: valStr,
      atributo: matrizTexto,
      perfil: perfilNome,
      categoria: catNome,
      qualidade: qualNome,
      soft_skills: softSkillsStr,
    });
  }

  return itens;
}
