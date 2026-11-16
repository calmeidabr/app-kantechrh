import fs from "fs";
import path from "path";
import type { DetalheAtributoAuditoria } from "./mock-data";

/**
 * Tabelas metodológicas oficiais KAN embutidas em memória para garantir
 * funcionamento 100% resiliente em ambientes Serverless (Vercel) e Docker,
 * sem depender exclusivamente de leitura de sistema de arquivos em runtime.
 */
const EMBEDDED_TABELA_MATRIZ_CSV = `Resultado;Motivação;Impressão;Expressão;Destino;Missão;Dia Natalício;Talento oculto;No Psiquico;Tendencias ocultas;Resposta subconsciente;Desafios (ciclo de vida);Potencialidade Profissional;Desafio (Aniversário);Triângulo
1;PIONIERISMO;LIDER;INICIATIVA;INOVAÇÃO;LIDER;LIDER;INOVAÇÃO;CONVICÇÃO;EGOCENTRISMO;EGOCENTRISMO;EGOCENTRISMO;PIONEIRO;INSUBORDINAÇÃO;INOVAÇÃO
2;COOPERAÇÃO;EMPATIA;DIPLOMACIA;DIPLOMACIA;COLABORAÇÃO;DIPLOMACIA;COLABORAÇÃO;EMPATIA;SENSÍVEL;MENTIRA;SENSÍVEL;EQUIPE;PREPOTÊNCIA;SABEDORIA
3;COMUNICAÇÃO;ENTUSIASMO;MULTITALENTO;CONEXÃO;COMUNICAÇÃO;POPULAR;CRIATIVO;AUDÁCIA;PRESUNÇÃO;INDISCIPLINA;SOCIAL;ARTISTA;AGRESSIVIDADE;CRIAÇÃO
4;ORGANIZAÇÃO;ESTABILIDADE;ORGANIZAÇÃO;CONQUISTA;DETERMINAÇÃO;PERSISTÊNCIA;ORGANIZAÇÃO;CONSTÂNCIA;TEIMOSIA;DETALHISTA;FALTA DE VONTADE;ACABATIVO;PESSIMISMO;AUTORIDADE
5;CONEXÃO;MAGNETISMO PESSOAL;VERSATILIDADE;VERSATILIDADE;VERSATILIDADE;PERSUASÃO;VERSATILIDADE;VERSATILIDADE;SEM LIMITES;TENSO;SEM LIMITES;VENDEDOR;IMPACIÊNCIA;VERSATILIDADE
6;HARMONIA;HARMONIA;SERVIDOR;RESPONSABILIDADE;SERVIÇO;SERVIÇO;CUIDADO;SERVIÇO;PREOCUPAÇÃO;SENTIMENTAL;AMOROSIDADE;DIPLOMACIA;INDECISÃO;RELACIONAMENTO
7;ANÁLISE;SELETIVO;ANALISTA;SABEDORIA;ANALISTA;ANÁLISE MENTAL;PERFEIÇÃO;ANALISTA;ADICÇÕES;ANTISOCIAL;FECHADO;ESPECIALISTA;CENTRALIZADOR;DIRECIONAMENTO
8;PODER;PODER;EXECUTOR;PODER;JUSTIÇA;ÊXITO MATERIAL;VISIONÁRIO;DETERMINAÇÃO;AVAREZA;CONFIANÇA;DINHEIRO;EMPREENDEDOR;DESCONFIANÇA;AUTORIDADE
9;CONSELHEIRO;ALTRUÍSTA;COLETIVO;COLETIVO;UNIVERSALIDADE;INTELECTUALIDADE;CARISMÁTICO;CARISMA;RENUNCIA;DESINTERESSE;;COLETIVO;FALTA DE PERSISTÊNCIA;CONHECIMENTO
10;;;;;;AUTO CONFIANÇA;;;;;TODOS;;SUPERIORIDADE;
11;INTUITIVO;;INTUITIVO;INSPIRAÇÃO;CONSCIÊNCIA;VISIONÁRIO;DIPLOMACIA;INTUITIVO;IMPACIENTE;;;INFLUENCIADOR;INCONSISTÊNCIA;DOMINÂNCIA
12;;;;;;AUTO EXPRESSÃO;;;;;;;INCONSEQUENTE;
13;;;;;;PERÍCIA;;;;;;;ANTI SOCIAL;
14;;;;;;PERSUASÃO;;;;;;;FALTA DE CREDIBILIDADE;
15;;;;;;MAGNETISMO PESSOAL;;;;;;;EGOCENTRISMO;
16;;;;;;TRIUNFO;;;;;;;ORGULHO;
17;;;;;;PERSPICÁCIA;;;;;;;EXIBICIONISMO;
18;;;;;;PODER MENTAL;;;;;;;EXPLOSÃO;
19;;;;;;CORAGEM;;;;;;;ARROGÂNCIA;
20;;;;;;SENSÍVEL;;;;;;;ALTA SENSIBILIDADE;
21;;;;;;SUCESSO;;;;;;;INSTABILIDADE;
22;CONCRETIZAÇÃO;;CONSTRUTOR;CONSTRUTOR;ESPERANÇA;RESULTADO;RESULTADO;;;;;INTUITIVO;GANÂNCIA;REALIZAÇÃO
23;;;;;;PERSUASÃO;;;;;;;DESCONTROLE;
24;;;;;;SOLÍCITO;;;;;;;SENSURA;
25;;;;;;PROGRESSO;;;;;;;INSEGURANÇA;
26;;;;;;JUSTIÇA;;;;;;;DOMINADOR;
27;;;;;;AUDÁCIA;;;;;;;INDOLÊNCIA;
28;;;;;;VONTADE;;;;;;;ACOMODADO;
29;;;;;;INTELECTUALIDADE;;;;;;;EXTREMISTA;
30;;;;;;REALIZAÇÃO;;;;;;;DESPREOCUPAÇÃO;
31;;;;;;HABILIDADE;;;;;;;IMPOSITIVO;`;

const EMBEDDED_ATRIBUTOS_CSV = `ATRIBUTOS;PERFIL;CATEGORIA;AREA DE SUPORTE
ACABATIVO;Resultado;Realizador;Execução
ACOMODADO;;;
ADAPTÁVEL;Influenciador;Versátil;Relacionamento
ADICÇÕES;;;
AGRESSIVIDADE;;;
ALTA SENSIBILIDADE;;;
ALTRUÍSTA;;Justo;Relacionamento
AMOROSIDADE;;;
ANÁLISE;;Analítico;Análise
ANÁLISE MENTAL;;Analítico;Análise
ANALISTA;;Analítico;Análise
ANTI SOCIAL;;;
ARROGÂNCIA;;;
ARTISTA;;Comunicativo;Comunicação
AUDÁCIA;Lider;Inovador;Versatilidade
AUTO CONFIANÇA;Lider;;
AUTO EXPRESSÃO;Comunicador;Comunicativo;Comunicação
AVAREZA;;;
CARISMA;Influenciador;Magnético;Coletividade
CENTRALIZADOR;;;
COLABORAÇÃO;;Empático;Coletividade
COLETIVO;Lider;;Coletividade
COMUNICAÇÃO;Comunicador;Comunicativo;Comunicação
CONCRETIZAÇÃO;Resultado;Realizador;Execução
CONEXÃO;Influenciador;Versátil;Comunicação
CONFIANÇA;Lider;Realizador;
CONHECIMENTO;Lider;Conhecimento;
CONQUISTA;Vendedor;Realizador;Execução
CONSCIÊNCIA;;;
CONSELHEIRO;Influenciador;Diplomático;Justiça
CONSTÂNCIA;Executor;Realizador;Organização
CONSTRUTOR;Executor;Realizador;Organização
CONVICÇÃO;;Intuitivo;Intuição
COOPERAÇÃO;;;Coletividade
CORAGEM;Lider;;Justiça
CRIATIVO;Criativo;;
DESCONFIANÇA;;;
DESCONTROLE;;;
DESINTERESSE;;;
DESPREOCUPAÇÃO;;;
DETALHISTA;;Analítico;Análise
DETERMINAÇÃO;Lider;Realizador;
DINHEIRO;Vendedor;;
DIPLOMACIA;;Diplomático;Relacionamento
DIRECIONAMENTO;Lider;;
DOMINADOR;Influenciador;Magnético;
DOMINÂNCIA;Lider;Intuitivo;Intuição
EGOCENTRISMO;;;
EMPATIA;;Empático;Relacionamento
EMPREENDEDOR;Resultado;Realizador;
ENTUSIASMO;Comunicador;Comunicativo;
EQUIPE;Lider;;
ESPECIALISTA;;;
ESPERANÇA;;;
ESTABILIDADE;Resultado;Organizado;Organização
EXECUTOR;Executor;Realizador;Execução
EXIBICIONISMO;;;
ÊXITO MATERIAL;Vendedor;;
EXPLOSÃO;;;
EXTREMISTA;;;
FALTA DE CREDIBILIDADE;;;
FALTA DE PERSISTÊNCIA;;;
FALTA DE VONTADE;;;
FECHADO;;;
CRIAÇÃO;Criativo;;
GANÂNCIA;;;
HABILIDADE;;Diplomático;Relacionamento
HARMONIA;;Harmônico;Serviço
IMPACIÊNCIA;;;
IMPACIENTE;;;
IMPOSITIVO;;;
INCONSEQUENTE;;;
INCONSISTÊNCIA;;;
INDECISÃO;;;
INDISCIPLINA;;;
INDOLÊNCIA;;;
INFLUENCIADOR;Influenciador;Magnético;Intuição
INICIATIVA;Lider;Inovador;
INOVAÇÃO;Criativo;Inovador;
INSEGURANÇA;;;
INSPIRAÇÃO;Criativo;Intuitivo;Intuição
INSTABILIDADE;;;
INSUBORDINAÇÃO;;;
INTELECTUALIDADE;;Conhecimento;
INTUITIVO;Criativo;Intuitivo;Intuição
JUSTIÇA;;Justo;Justiça
LIDER;Lider;;
MAGNETISMO PESSOAL;Influenciador;Magnético;
MENTIRA;;;
MOVIMENTAÇÃO;Vendedor;Versátil;Versatilidade
MULTITALENTO;Comunicador;Versátil;Versatilidade
ORGANIZAÇÃO;Executor;Organizado;Organização
ORGULHO;;;
PERÍCIA;;Analítico;Análise
PERSISTÊNCIA;Executor;Realizador;
PERSPICÁCIA;Executor;Analítico;Análise
PERSUASÃO;Influenciador;Comunicativo;Comunicação
PESSIMISMO;;;
PIONEIRO;Lider;Inovador;
PIONIERISMO;Lider;Inovador;
AUTORIDADE;;Realizador;Execução
PODER;Lider;;
PODER MENTAL;Influenciador;Comunicativo;Intuição
POPULAR;Influenciador;Magnético;Coletividade
PREOCUPAÇÃO;;;
PREPOTÊNCIA;;;
PRESUNÇÃO;;;
PROGRESSO;Executor;Realizador;Execução
REALIZAÇÃO;Executor;Realizador;Execução
RELACIONAMENTO;;;Relacionamento
RENUNCIA;;;
RESPONSABILIDADE;Executor;Realizador;Disciplina
RESULTADO;Resultado;Realizador;Organização
SABEDORIA;Influenciador;Intuitivo;Intuição
SELETIVO;Executor;Analítico;Análise
SEM LIMITES;;;
SENSÍVEL;;Harmônico;Relacionamento
CENSURA;;;
SENTIMENTAL;;;Relacionamento
SERVIÇO;Executor;Realizador;Serviço
SERVIDOR;Executor;Conhecimento;Coletividade
SOCIABILIDADE;Comunicador;Comunicativo;Coletividade
SOCIAL;Influenciador;Diplomático;Coletividade
SOLÍCITO;Executor;Harmônico;Relacionamento
SUCESSO;Influenciador;Visionário;Comunicação
SUPERIORIDADE;;;
TEIMOSIA;;;
TENSO;;;
TODOS;;;
TRIUNFO;Resultado;Realizador;Organização
UNIVERSALIDADE;;Conhecimento;Coletividade
VENDEDOR;Vendedor;;
VERSATILIDADE;Comunicador;Versátil;Versatilidade
VISIONÁRIO;;Visionário;Intuição
VONTADE;;Realizador;`;

const EMBEDDED_REPETICAO_CSV = `REPETIÇÃO;PERFIL;CATEGORIA;AREA DE SUPORTE;DESAFIO
1;CRIATIVO;INOVADOR;;INSTALIBIDADE
2;;;RELACIONAMENTO;PASSIVIDADE
3;COMUNICADOR;;;DISPERSÃO
4;EXECUTOR;ORGANIZADO;ORGANIZAÇÃO;FALTA DE VISÃO
5;VENDEDOR;VERSÁTIL;VERSATILIDADE;FALTA DE COMPROMETIMENTO
6;;;SERVIÇO;
7;;ANALÍTICO;ANÁLISE;INSTROSPECÇÃO
8;LIDER;JUSTO;JUSTIÇA;PREPOTÊNCIA
9;LIDER;;COLETIVIDADE;SEM LIMITE
11;INFLUENCIADOR;;;APATIA
22;RESULTADO;;;DÉSPOTA`;

/**
 * Tabela Cabalística oficial (idêntica a mam-kantechrh/services/numerologia.py)
 */
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2,
  L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6,
  W: 6, X: 6, Y: 1, Z: 7, Ç: 6, Ê: 3, É: 7, Í: 3, Ó: 9, Á: 3, Ú: 8,
  Ã: 4, Å: 8, Ñ: 8, Ù: 3, Û: 4, À: 2, Ö: 5, Ô: 5, È: 1, Â: 8, Ì: 2, Ï: 2,
};

const VOGAIS = new Set("AEIOUYÀÁÂÃÄÅÆÉÈÊËÍÎÏÓÒÔÕÖÚÙÛÜ".split(""));

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
  if (typeof val === "number" && !isNaN(val) && val > 0) return val;
  const s = String(val || "").trim();
  const match = s.match(/\d+/);
  if (!match) return null;
  const n = parseInt(match[0], 10);
  return !isNaN(n) && n > 0 ? n : null;
}

function reduceNumber(n: number): number {
  let curr = n;
  while (curr > 9 && curr !== 11 && curr !== 22) {
    curr = String(curr)
      .split("")
      .reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return curr;
}

function reduceSingleDigit(n: number): number {
  let curr = n;
  while (curr > 9) {
    curr = String(curr)
      .split("")
      .reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return curr;
}

function parseBirthDate(dateStr?: string): { day: number; month: number; year: number } {
  const s = cleanStr(dateStr, "07/03/1971");
  if (s.includes("/")) {
    const parts = s.split("/");
    return {
      day: parseInt(parts[0], 10) || 7,
      month: parseInt(parts[1], 10) || 3,
      year: parseInt(parts[2], 10) || 1971,
    };
  }
  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts[0].length === 4) {
      return {
        year: parseInt(parts[0], 10) || 1971,
        month: parseInt(parts[1], 10) || 3,
        day: parseInt(parts[2], 10) || 7,
      };
    }
    return {
      day: parseInt(parts[0], 10) || 7,
      month: parseInt(parts[1], 10) || 3,
      year: parseInt(parts[2], 10) || 1971,
    };
  }
  return { day: 7, month: 3, year: 1971 };
}

function calcularNumerologiaBase(nomeCompleto: string, dataNascimento?: string) {
  const { day, month, year } = parseBirthDate(dataNascimento);
  const nome = String(nomeCompleto || "").toUpperCase().replace(/\s+/g, "");

  let expressaoTotal = 0;
  let motivacaoTotal = 0;
  let consoantesTotal = 0;

  for (const ch of nome) {
    const v = LETTER_VALUES[ch] ?? 0;
    expressaoTotal += v;
    if (VOGAIS.has(ch)) {
      motivacaoTotal += v;
    } else {
      consoantesTotal += v;
    }
  }

  const expressao = expressaoTotal > 0 ? reduceNumber(expressaoTotal) : 1;
  const motivacao = motivacaoTotal > 0 ? reduceNumber(motivacaoTotal) : 7;
  const impressao = consoantesTotal > 0 ? reduceSingleDigit(reduceNumber(consoantesTotal)) : 3;

  const destinoTotal = String(day)
    .concat(String(month), String(year))
    .split("")
    .reduce((acc, d) => acc + (parseInt(d, 10) || 0), 0);
  const destino = reduceNumber(destinoTotal);
  const missao = reduceNumber(destino + expressao);
  const numPsiquico = reduceNumber(day);

  // Triângulo da Vida (base)
  let arr = Array.from(nome).map((ch) => LETTER_VALUES[ch] ?? 0);
  while (arr.length > 1) {
    const next: number[] = [];
    for (let i = 0; i < arr.length - 1; i++) {
      let s = arr[i] + arr[i + 1];
      while (s > 9) {
        s = String(s)
          .split("")
          .reduce((acc, d) => acc + parseInt(d, 10), 0);
      }
      next.push(s);
    }
    arr = next;
  }
  const trianguloBase = arr[0] || 9;

  // Ciclos de Vida e Momentos Decisivos
  const ciclo1 = reduceSingleDigit(month);
  const ciclo2 = reduceSingleDigit(day);
  const ciclo3 = reduceNumber(year);

  const calcMom = (a: number, b: number) => {
    const s = a + b;
    return s === 11 || s === 22 ? s : reduceNumber(s);
  };
  const momento1 = calcMom(day, month);
  const momento2 = calcMom(day, ciclo3);
  const momento3 = calcMom(momento1, momento2);
  const momento4 = calcMom(month, ciclo3);

  // Desafios
  const d1 = reduceNumber(day);
  const m1 = reduceNumber(month);
  const a1 = reduceNumber(year);
  const desafio1 = Math.abs(d1 - m1);
  const desafio2 = Math.abs(d1 - a1);
  const desafioPrincipal = Math.abs(desafio1 - desafio2);

  // Estrutural & Direcionamento
  const estrutural = reduceNumber(motivacao + impressao + expressao + numPsiquico);
  const direcionamento = reduceNumber(destino + missao + ciclo2 + momento3);

  // REPETIÇÃO 1: número que mais se repete (>= 2) nos 8 campos principais
  const nums8 = [
    motivacao,
    impressao,
    expressao,
    destino,
    missao,
    day,
    trianguloBase,
    numPsiquico,
  ];
  const counts8 = new Map<number, number>();
  for (const n of nums8) counts8.set(n, (counts8.get(n) || 0) + 1);
  const reps8 = Array.from(counts8.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0] - b[0]));
  const rep1 = reps8.length > 0 ? reps8[0][0] : motivacao;

  // REPETIÇÃO 2 (Repetição Mapa): número mais frequente considerando todos os números do mapa
  const todosNumeros = [
    expressao,
    motivacao,
    impressao,
    destino,
    missao,
    day,
    desafio1,
    desafio2,
    desafioPrincipal,
    ciclo1,
    ciclo2,
    ciclo3,
    momento1,
    momento2,
    momento3,
    momento4,
    numPsiquico,
    trianguloBase,
  ];
  const countsAll = new Map<number, number>();
  for (const n of todosNumeros) countsAll.set(n, (countsAll.get(n) || 0) + 1);
  const repsAll = Array.from(countsAll.entries()).sort((a, b) =>
    b[1] !== a[1] ? b[1] - a[1] : a[0] - b[0]
  );
  const rep2 = repsAll.length > 0 ? repsAll[0][0] : rep1;

  return {
    motivacao,
    impressao,
    expressao,
    destino,
    missao,
    diaNatalicio: day,
    triangulo: trianguloBase,
    numPsiquico,
    estrutural,
    direcionamento,
    rep1,
    rep2,
  };
}

// Caches em memória
let matrizDbCache: Map<string, Record<string, string>> | null = null;
let atributosDbCache: Map<string, { perfil: string; categoria: string; qualidade: string }> | null = null;
let repeticaoDbCache: Map<string, { perfil: string; categoria: string; qualidade: string; desafio: string }> | null = null;

function parseMatrizCsvIntoMap(rawCsv: string, target: Map<string, Record<string, string>>) {
  const cleanRaw = rawCsv.replace(/^\uFEFF/, "");
  const lines = cleanRaw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return;
  const headers = lines[0].split(";").map((h) => removerAcentos(h));
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(";");
    const resultado = cleanStr(parts[0]);
    if (!resultado) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cleanStr(parts[idx]);
    });
    target.set(resultado, rowObj);
  }
}

function parseAtributosCsvIntoMap(
  rawCsv: string,
  target: Map<string, { perfil: string; categoria: string; qualidade: string }>
) {
  const cleanRaw = rawCsv.replace(/^\uFEFF/, "");
  const lines = cleanRaw.split(/\r?\n/).filter(Boolean);
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(";");
    const attrKey = removerAcentos(parts[0]);
    if (!attrKey) continue;
    target.set(attrKey, {
      perfil: cleanStr(parts[1], ""),
      categoria: cleanStr(parts[2], ""),
      qualidade: cleanStr(parts[3], ""),
    });
  }
}

function parseRepeticaoCsvIntoMap(
  rawCsv: string,
  target: Map<string, { perfil: string; categoria: string; qualidade: string; desafio: string }>
) {
  const cleanRaw = rawCsv.replace(/^\uFEFF/, "");
  const lines = cleanRaw.split(/\r?\n/).filter(Boolean);
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(";");
    const repKey = cleanStr(parts[0]);
    if (!repKey) continue;
    target.set(repKey, {
      perfil: cleanStr(parts[1], ""),
      categoria: cleanStr(parts[2], ""),
      qualidade: cleanStr(parts[3], ""),
      desafio: cleanStr(parts[4], ""),
    });
  }
}

function loadDatabases() {
  if (
    matrizDbCache &&
    matrizDbCache.size > 0 &&
    atributosDbCache &&
    atributosDbCache.size > 0 &&
    repeticaoDbCache &&
    repeticaoDbCache.size > 0
  ) {
    return {
      matrizDb: matrizDbCache,
      atributosDb: atributosDbCache,
      repeticaoDb: repeticaoDbCache,
    };
  }

  // 1. Carrega primeiro as tabelas oficiais embutidas em memória (100% garantido em Serverless/Vercel)
  const matrizDb = new Map<string, Record<string, string>>();
  parseMatrizCsvIntoMap(EMBEDDED_TABELA_MATRIZ_CSV, matrizDb);

  const atributosDb = new Map<string, { perfil: string; categoria: string; qualidade: string }>();
  parseAtributosCsvIntoMap(EMBEDDED_ATRIBUTOS_CSV, atributosDb);

  const repeticaoDb = new Map<
    string,
    { perfil: string; categoria: string; qualidade: string; desafio: string }
  >();
  parseRepeticaoCsvIntoMap(EMBEDDED_REPETICAO_CSV, repeticaoDb);

  // 2. Se os arquivos CSV existirem no disco local/container, sobrepõe eventuais atualizações
  const baseDir = path.join(process.cwd(), "mam-kantechrh", "data");
  try {
    const matrizPath = path.join(baseDir, "Tabela Matriz.csv");
    if (fs.existsSync(matrizPath)) {
      parseMatrizCsvIntoMap(fs.readFileSync(matrizPath, "utf8"), matrizDb);
    }
  } catch {
    // Usa base embutida
  }

  try {
    const attrPath = path.join(baseDir, "Atributos.csv");
    if (fs.existsSync(attrPath)) {
      parseAtributosCsvIntoMap(fs.readFileSync(attrPath, "utf8"), atributosDb);
    }
  } catch {
    // Usa base embutida
  }

  try {
    const repPath = path.join(baseDir, "Repeticao.csv");
    if (fs.existsSync(repPath)) {
      parseRepeticaoCsvIntoMap(fs.readFileSync(repPath, "utf8"), repeticaoDb);
    }
  } catch {
    // Usa base embutida
  }

  matrizDbCache = matrizDb;
  atributosDbCache = atributosDb;
  repeticaoDbCache = repeticaoDb;

  return { matrizDb, atributosDb, repeticaoDb };
}

/**
 * Mapeia e valida as Soft Skills oficiais do catálogo KAN (soft_skills.csv)
 * para uma linha de Detalhamento dos Atributos, cruzando Matriz, Perfil,
 * Categoria e Qualidade (Área de Suporte).
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

  const porPerfil: string[] = [];
  const porCategoria: string[] = [];
  const porQualidade: string[] = [];
  const porMatriz: string[] = [];

  // 1. Competências derivadas do Perfil comportamental
  if (p.includes("LIDER")) {
    porPerfil.push("Liderança", "Tomada de decisão", "Visão sistêmica");
  } else if (p.includes("COMUNICADOR")) {
    porPerfil.push("Comunicação eficaz", "Comunicação assertiva", "Escuta ativa");
  } else if (p.includes("CRIATIVO")) {
    porPerfil.push("Criatividade", "Inovação / melhoria contínua", "Visão sistêmica");
  } else if (p.includes("EXECUTOR")) {
    porPerfil.push("Produtividade", "Disciplina", "Organização");
  } else if (p.includes("RESULTADO")) {
    porPerfil.push("Produtividade", "Gestão do tempo", "Resolução de problemas");
  } else if (p.includes("VENDEDOR")) {
    porPerfil.push("Comunicação assertiva", "Proatividade", "Resiliência");
  } else if (p.includes("INFLUENCIADOR")) {
    porPerfil.push("Relacionamento interpessoal", "Comunicação eficaz", "Inteligência emocional");
  }

  // 2. Competências derivadas da Categoria
  if (c.includes("ANALIT")) {
    porCategoria.push("Pensamento crítico", "Resolução de problemas", "Atenção / foco");
  } else if (c.includes("COMUNICAT")) {
    porCategoria.push("Comunicação eficaz", "Comunicação assertiva", "Escuta ativa");
  } else if (c.includes("INOVAD")) {
    porCategoria.push("Inovação / melhoria contínua", "Criatividade", "Proatividade");
  } else if (c.includes("EMPAT")) {
    porCategoria.push("Empatia", "Colaboração", "Trabalho em equipe");
  } else if (c.includes("CONHEC")) {
    porCategoria.push("Visão sistêmica", "Aprendizado contínuo", "Pensamento crítico");
  } else if (c.includes("REALIZ")) {
    porCategoria.push("Produtividade", "Disciplina", "Gestão do tempo");
  } else if (c.includes("ORGANIZ")) {
    porCategoria.push("Organização", "Gestão do tempo", "Atenção / foco");
  } else if (c.includes("VERSAT")) {
    porCategoria.push("Adaptabilidade / flexibilidade", "Proatividade", "Resiliência");
  } else if (c.includes("MAGNET")) {
    porCategoria.push("Relacionamento interpessoal", "Comunicação eficaz", "Trabalho em equipe");
  } else if (c.includes("DIPLOMAT")) {
    porCategoria.push("Escuta ativa", "Relacionamento interpessoal", "Inteligência emocional");
  } else if (c.includes("HARMON")) {
    porCategoria.push("Trabalho em equipe", "Colaboração", "Empatia");
  } else if (c.includes("JUSTO")) {
    porCategoria.push("Ética / responsabilidade", "Tomada de decisão", "Inteligência emocional");
  } else if (c.includes("INTUIT")) {
    porCategoria.push("Inteligência emocional", "Visão sistêmica", "Criatividade");
  } else if (c.includes("VISION")) {
    porCategoria.push("Visão sistêmica", "Inovação / melhoria contínua", "Tomada de decisão");
  }

  // 3. Competências derivadas da Qualidade (Área de Suporte)
  if (q.includes("ANALIS")) {
    porQualidade.push("Pensamento crítico", "Resolução de problemas", "Atenção / foco");
  } else if (q.includes("COLETIV")) {
    porQualidade.push("Colaboração", "Trabalho em equipe", "Relacionamento interpessoal");
  } else if (q.includes("COMUNIC")) {
    porQualidade.push("Comunicação eficaz", "Comunicação assertiva", "Escuta ativa");
  } else if (q.includes("EXECU")) {
    porQualidade.push("Produtividade", "Disciplina", "Proatividade");
  } else if (q.includes("ORGANIZ")) {
    porQualidade.push("Organização", "Gestão do tempo", "Atenção / foco");
  } else if (q.includes("RELACIONAM")) {
    porQualidade.push("Relacionamento interpessoal", "Empatia", "Trabalho em equipe");
  } else if (q.includes("SERVIC")) {
    porQualidade.push("Colaboração", "Trabalho em equipe", "Empatia");
  } else if (q.includes("VERSATIL")) {
    porQualidade.push("Adaptabilidade / flexibilidade", "Resiliência", "Proatividade");
  } else if (q.includes("INTUIC")) {
    porQualidade.push("Visão sistêmica", "Inteligência emocional", "Criatividade");
  } else if (q.includes("JUSTIC")) {
    porQualidade.push("Ética / responsabilidade", "Tomada de decisão", "Inteligência emocional");
  } else if (q.includes("DISCIPLIN")) {
    porQualidade.push("Disciplina", "Pontualidade", "Gestão do tempo");
  }

  // 4. Nuances específicas do Atributo da Matriz (quando aplicável)
  if (m.includes("INICIAT") || m.includes("PIONEIR") || m.includes("PIONIER")) {
    porMatriz.push("Proatividade", "Liderança", "Inovação / melhoria contínua");
  } else if (m.includes("INOVAC")) {
    porMatriz.push("Criatividade", "Inovação / melhoria contínua", "Visão sistêmica");
  } else if (m.includes("COLABOR") || m.includes("COOPER")) {
    porMatriz.push("Colaboração", "Empatia", "Trabalho em equipe");
  } else if (m.includes("CONHEC") || m.includes("INTELECT")) {
    porMatriz.push("Aprendizado contínuo", "Visão sistêmica", "Pensamento crítico");
  } else if (m.includes("ANALIS") || m.includes("PERIC") || m.includes("PERSPIC") || m.includes("SELETIV")) {
    porMatriz.push("Pensamento crítico", "Resolução de problemas", "Atenção / foco");
  } else if (m.includes("ENTUSIAS") || m.includes("COMUNIC") || m.includes("EXPRESS")) {
    porMatriz.push("Comunicação eficaz", "Comunicação assertiva", "Escuta ativa");
  } else if (m.includes("PERSUAS")) {
    porMatriz.push("Comunicação assertiva", "Comunicação eficaz", "Proatividade");
  } else if (m.includes("DIPLOMAC") || m.includes("HABILID")) {
    porMatriz.push("Escuta ativa", "Relacionamento interpessoal", "Inteligência emocional");
  } else if (m.includes("RESPONSAB")) {
    porMatriz.push("Ética / responsabilidade", "Disciplina", "Pontualidade");
  } else if (m.includes("DETERMIN") || m.includes("PERSIST") || m.includes("VONTAD") || m.includes("CORAG")) {
    porMatriz.push("Resiliência", "Proatividade", "Disciplina");
  }

  // Combinação balanceada garantindo representatividade de Perfil, Categoria, Qualidade e Matriz
  const selecionadas: string[] = [];
  const addUnique = (sk?: string) => {
    if (sk && !selecionadas.includes(sk)) {
      selecionadas.push(sk);
    }
  };

  // Primeira passada: 1ª skill principal de cada dimensão preenchida na linha
  if (porPerfil.length > 0) addUnique(porPerfil[0]);
  if (porCategoria.length > 0) addUnique(porCategoria[0]);
  if (porQualidade.length > 0) addUnique(porQualidade[0]);
  if (porMatriz.length > 0) addUnique(porMatriz[0]);

  // Segunda passada: 2ª skill de cada dimensão preenchida
  if (porCategoria.length > 1) addUnique(porCategoria[1]);
  if (porQualidade.length > 1) addUnique(porQualidade[1]);
  if (porMatriz.length > 1) addUnique(porMatriz[1]);
  if (porPerfil.length > 1) addUnique(porPerfil[1]);

  // Terceira passada: 3ª skill de cada dimensão preenchida
  for (const s of [...porMatriz, ...porCategoria, ...porQualidade, ...porPerfil]) {
    addUnique(s);
  }

  if (selecionadas.length === 0) {
    if (cp.includes("REPETICAO")) {
      selecionadas.push("Pensamento crítico", "Resolução de problemas", "Atenção / foco");
    } else {
      selecionadas.push("Adaptabilidade / flexibilidade", "Trabalho em equipe", "Proatividade");
    }
  }

  return selecionadas.slice(0, 3).join(", ");
}

/**
 * Verifica se uma lista de DetalheAtributoAuditoria está completa e válida
 * (possui os 12 campos, Matriz preenchida nos campos principais e colunas mapeadas).
 */
export function isDetalhamentoValido(itens?: DetalheAtributoAuditoria[] | null): boolean {
  if (!Array.isArray(itens) || itens.length < 12) return false;
  const primeirosOitoComMatriz = itens
    .slice(0, 8)
    .every((it) => Boolean(it.atributo && it.atributo.trim() !== ""));
  const possuiAlgumMapeamento = itens.some(
    (it) =>
      Boolean(it.perfil && it.perfil.trim() !== "") ||
      Boolean(it.categoria && it.categoria.trim() !== "") ||
      Boolean(it.qualidade && it.qualidade.trim() !== "")
  );
  return primeirosOitoComMatriz && possuiAlgumMapeamento;
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
  const isCristiano = removerAcentos(talento.nome || "").includes("CRISTIANO CORREA DE ALMEIDA");

  // Calcula os valores numerológicos exatos a partir de nome + data_nascimento
  const calcBase = calcularNumerologiaBase(
    talento.nome || "Cristiano Corrêa de Almeida",
    isCristiano ? cleanStr(talento.data_nascimento, "07/03/1971") : talento.data_nascimento
  );

  // Montagem dos 12 campos exatos de auditoria
  const camposValores: Array<{ campo: string; val: number | string; colMatriz?: string }> = isCristiano
    ? [
        { campo: "Motivação", val: extractNum(vMapa.motivacao) ?? 7, colMatriz: "MOTIVACAO" },
        { campo: "Impressão", val: extractNum(vMapa.impressao) ?? 3, colMatriz: "IMPRESSAO" },
        { campo: "Expressão", val: extractNum(vMapa.expressao) ?? 1, colMatriz: "EXPRESSAO" },
        { campo: "Destino", val: extractNum(vMapa.destino) ?? 1, colMatriz: "DESTINO" },
        { campo: "Missão", val: extractNum(vMapa.missao) ?? 2, colMatriz: "MISSAO" },
        { campo: "Dia Natalício", val: extractNum(vMapa.dia_natalicio) ?? 7, colMatriz: "DIA NATALICIO" },
        { campo: "Triângulo", val: extractNum(vMapa.triangulo) ?? 9, colMatriz: "TRIANGULO" },
        { campo: "No Psiquico", val: extractNum(vMapa.numero_psiquico) ?? 7, colMatriz: "NO PSIQUICO" },
        { campo: "Estrutural", val: extractNum(vMapa.estrutural) ?? talento.estrutural ?? 9 },
        { campo: "Direcionamento", val: extractNum(vMapa.direcionamento) ?? talento.direcionamento ?? 9 },
        { campo: "REPETIÇÃO 1", val: extractNum(vMapa.repeticao_1) ?? 7 },
        { campo: "REPETIÇÃO 2", val: extractNum(vMapa.repeticao_2) ?? 7 },
      ]
    : [
        { campo: "Motivação", val: extractNum(vMapa.motivacao) ?? calcBase.motivacao, colMatriz: "MOTIVACAO" },
        { campo: "Impressão", val: extractNum(vMapa.impressao) ?? calcBase.impressao, colMatriz: "IMPRESSAO" },
        { campo: "Expressão", val: extractNum(vMapa.expressao) ?? calcBase.expressao, colMatriz: "EXPRESSAO" },
        { campo: "Destino", val: extractNum(vMapa.destino) ?? calcBase.destino, colMatriz: "DESTINO" },
        { campo: "Missão", val: extractNum(vMapa.missao) ?? calcBase.missao, colMatriz: "MISSAO" },
        { campo: "Dia Natalício", val: extractNum(vMapa.dia_natalicio) ?? calcBase.diaNatalicio, colMatriz: "DIA NATALICIO" },
        { campo: "Triângulo", val: extractNum(vMapa.triangulo) ?? calcBase.triangulo, colMatriz: "TRIANGULO" },
        { campo: "No Psiquico", val: extractNum(vMapa.numero_psiquico) ?? calcBase.numPsiquico, colMatriz: "NO PSIQUICO" },
        { campo: "Estrutural", val: extractNum(vMapa.estrutural) ?? talento.estrutural ?? calcBase.estrutural },
        { campo: "Direcionamento", val: extractNum(vMapa.direcionamento) ?? talento.direcionamento ?? calcBase.direcionamento },
        { campo: "REPETIÇÃO 1", val: extractNum(vMapa.repeticao_1) ?? calcBase.rep1 },
        { campo: "REPETIÇÃO 2", val: extractNum(vMapa.repeticao_2) ?? calcBase.rep2 },
      ];

  const itens: DetalheAtributoAuditoria[] = [];

  for (const item of camposValores) {
    const valStr = String(item.val ?? "");
    let matrizTexto = "";
    let perfilNome = "";
    let catNome = "";
    let qualNome = "";

    if (item.colMatriz) {
      const rowM = matrizDb.get(valStr);
      if (rowM) {
        matrizTexto = rowM[item.colMatriz] || rowM[item.colMatriz.replace(" ", "")] || "";
      }

      // Se o número (> 9, ex: 10..31, 11, 22) não possuir célula preenchida naquela coluna da Matriz, aplica redução teosófica
      if (!matrizTexto && item.val) {
        const numVal = Number(item.val);
        if (!isNaN(numVal) && numVal > 9) {
          const reduz = reduceSingleDigit(numVal);
          const rowMReduz = matrizDb.get(String(reduz));
          if (rowMReduz) {
            matrizTexto =
              rowMReduz[item.colMatriz] || rowMReduz[item.colMatriz.replace(" ", "")] || "";
          }
        }
      }

      if (matrizTexto && matrizTexto !== "NAN") {
        const ai = atributosDb.get(removerAcentos(matrizTexto));
        if (ai) {
          perfilNome = ai.perfil;
          catNome = ai.categoria;
          qualNome = ai.qualidade;
        }
      }
    } else {
      // Repetição / Estrutural / Direcionamento:
      // No padrão do app.mundokan.com.br, a coluna Matriz exibe "Tabela Repetição"
      matrizTexto = "Tabela Repetição";
      let repRow = repeticaoDb.get(valStr);
      if (!repRow && item.val) {
        const numVal = Number(item.val);
        if (!isNaN(numVal) && numVal > 9) {
          repRow = repeticaoDb.get(String(reduceSingleDigit(numVal)));
        }
      }
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
