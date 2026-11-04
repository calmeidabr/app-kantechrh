/**
 * Motor Numerológico Cabalístico e Geométrico KAN
 * Port 1:1 exato de PROG/services/numerologia.py, PROG/services/perfil.py e PROG/services/harmonia.py
 */

// Tabela Cabalística oficial de PROG/services/numerologia.py (linhas 7-12)
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2,
  L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6,
  W: 6, X: 6, Y: 1, Z: 7, Ç: 6, Ê: 3, É: 7, Í: 3, Ó: 9, Á: 3, Ú: 8,
  Ã: 4, Å: 8, Ñ: 8, Ù: 3, Û: 4, À: 2, Ö: 5, Ô: 5, È: 1, Â: 8, Ì: 2, Ï: 2,
};

export const VOWELS = new Set(
  "AEIOUYÀÁÂÃÄÅÆÉÈÊËÍÎÏÓÒÔÕÖÚÙÛÜ".split("")
);

export function sumDigits(n: number): number {
  return Math.abs(n)
    .toString()
    .split("")
    .reduce((acc, d) => acc + (parseInt(d, 10) || 0), 0);
}

export function reduceNumber(n: number): number {
  let cur = Math.abs(n);
  while (cur > 9 && cur !== 11 && cur !== 22) {
    cur = sumDigits(cur);
  }
  return cur;
}

export function reduceSingleDigit(n: number): number {
  let cur = Math.abs(n);
  while (cur > 9) {
    cur = sumDigits(cur);
  }
  return cur;
}

export function parseBirthDateTuple(rawDate: string): [number, number, number] {
  const s = String(rawDate || "")
    .trim()
    .split("T")[0]
    .split(" ")[0];
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return [d, m, y];
    }
  }
  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return [d, m, y];
      } else {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return [d, m, y];
      }
    }
  }
  return [1, 1, 1990];
}

// Port exato de calcular_numeros_nome em PROG/services/numerologia.py (linhas 24-36)
export function calcularNumerosNome(nomeCompleto: string): {
  expressao: number;
  motivacao: number;
  impressao: number;
} {
  const nome = String(nomeCompleto || "")
    .toUpperCase()
    .replace(/ /g, "");
  let expressaoTotal = 0;
  let motivacaoTotal = 0;
  let consoantesTotal = 0;

  for (const ch of nome) {
    const val = LETTER_VALUES[ch] ?? 0;
    expressaoTotal += val;
    if (VOWELS.has(ch)) {
      motivacaoTotal += val;
    } else {
      consoantesTotal += val;
    }
  }

  let impressaoReduzida = reduceNumber(consoantesTotal);
  while (impressaoReduzida > 9) {
    impressaoReduzida = sumDigits(impressaoReduzida);
  }

  return {
    expressao: reduceNumber(expressaoTotal),
    motivacao: reduceNumber(motivacaoTotal),
    impressao: impressaoReduzida,
  };
}

// Port exato de calcular_triangulo_vida em PROG/services/numerologia.py (linhas 202-215)
export function calcularTrianguloVidaBase(nomeCompleto: string): number {
  const nome = String(nomeCompleto || "")
    .toUpperCase()
    .replace(/ /g, "");
  let arr = Array.from(nome).map((ch) => LETTER_VALUES[ch] ?? 0);
  while (arr.length > 1) {
    const newArr: number[] = [];
    for (let i = 0; i < arr.length - 1; i++) {
      let s = arr[i] + arr[i + 1];
      while (s > 9) {
        s = sumDigits(s);
      }
      newArr.push(s);
    }
    arr = newArr;
  }
  return arr[0] ?? 0;
}

// Port exato de calcular_desafios em PROG/services/numerologia.py (linhas 138-145)
export function calcularDesafios(dia: number, mes: number, ano: number) {
  const d1 = reduceNumber(dia);
  const m1 = reduceNumber(mes);
  const a1 = reduceNumber(ano);
  const desafio1 = Math.abs(d1 - m1);
  const desafio2 = Math.abs(d1 - a1);
  const desafioPrincipal = Math.abs(desafio1 - desafio2);
  return { desafio1, desafio2, desafioPrincipal };
}

// Port exato de calcular_ciclos_vida em PROG/services/numerologia.py (linhas 70-94)
export function calcularCiclosVida(
  dia: number,
  mes: number,
  ano: number,
  destino: number
) {
  let ciclo1Num = mes;
  while (ciclo1Num > 9) {
    ciclo1Num = sumDigits(ciclo1Num);
  }
  const ciclo1AnoInicio = ano;
  const ciclo1AnoFim = ciclo1AnoInicio + (37 - destino);

  let ciclo2Num = dia;
  while (ciclo2Num > 9) {
    ciclo2Num = sumDigits(ciclo2Num);
  }
  const ciclo2AnoInicio = ciclo1AnoFim;
  const ciclo2AnoFim = ciclo2AnoInicio + 27;

  const ciclo3Num = reduceNumber(ano);
  const ciclo3AnoInicio = ciclo2AnoFim;

  return {
    ciclo1: { numero: ciclo1Num, inicio: ciclo1AnoInicio, fim: ciclo1AnoFim },
    ciclo2: { numero: ciclo2Num, inicio: ciclo2AnoInicio, fim: ciclo2AnoFim },
    ciclo3: { numero: ciclo3Num, inicio: ciclo3AnoInicio, fim: null },
  };
}

function calcularMomentoDecisivo(a: number, b: number): number {
  const soma = a + b;
  if (soma === 11 || soma === 22) return soma;
  return reduceNumber(soma);
}

// Port exato de calcular_momentos_decisivos em PROG/services/numerologia.py (linhas 43-68)
export function calcularMomentosDecisivos(
  dia: number,
  mes: number,
  ano: number,
  ciclosVida: ReturnType<typeof calcularCiclosVida>
) {
  const momento1 = calcularMomentoDecisivo(dia, mes);
  const inicio1 = ciclosVida.ciclo1.inicio;
  const fim1 = ciclosVida.ciclo1.fim;

  const anoReduzido = reduceNumber(ano);
  const momento2 = calcularMomentoDecisivo(dia, anoReduzido);
  const inicio2 = fim1;
  const fim2 = inicio2 + 9;

  const soma12 = momento1 + momento2;
  const momento3 =
    soma12 === 11 || soma12 === 22 ? soma12 : reduceNumber(soma12);
  const inicio3 = fim2;
  const fim3 = inicio3 + 9;

  const momento4 = calcularMomentoDecisivo(mes, anoReduzido);
  const inicio4 = fim3;

  return {
    momento1: { numero: momento1, inicio: inicio1, fim: fim1 },
    momento2: { numero: momento2, inicio: inicio2, fim: fim2 },
    momento3: { numero: momento3, inicio: inicio3, fim: fim3 },
    momento4: { numero: momento4, inicio: inicio4, fim: null },
  };
}

// Port exato de calcular_perfil_comportamental em PROG/services/perfil.py (linhas 16-42)
export function calcularPerfilComportamentalNumeros(
  expressao: number,
  motivacao: number,
  impressao: number,
  dia: number,
  destino: number,
  missao: number,
  ciclo2Num: number,
  momento3Num: number,
  trianguloBase: number
) {
  const estrutural = reduceNumber(
    motivacao + impressao + expressao + reduceNumber(dia)
  );
  const direcionamento = reduceNumber(
    destino + missao + ciclo2Num + momento3Num
  );
  const kan = reduceNumber(estrutural + direcionamento);

  const numDiaPuro = dia;
  const numDiaReduzido = reduceNumber(dia);
  const nums = [
    motivacao,
    impressao,
    expressao,
    destino,
    missao,
    numDiaPuro,
    trianguloBase,
    numDiaReduzido,
  ];
  const counts = new Map<number, number>();
  for (const n of nums) {
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  const reps = Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0] - b[0]));

  const rep1Num = reps.length > 0 ? reps[0][0] : null;
  const rep2Num = reps.length > 1 ? reps[1][0] : null;

  return { estrutural, direcionamento, kan, rep1Num, rep2Num };
}

/**
 * Port 1:1 exato de `obter_vertices_triangulo(nome_comp, data_nasc_str)` em `PROG/services/harmonia.py` (linhas 20-108)
 */
export function obterVerticesTriangulo(
  nomeComp: string,
  dataNascStr: string
): {
  vertices: [number, number, number];
  kanNumero: number;
  estrutural: number;
  direcionamento: number;
  trianguloBase: number;
} {
  try {
    const [day, month, year] = parseBirthDateTuple(dataNascStr);
    const { expressao, motivacao, impressao } = calcularNumerosNome(nomeComp);
    const destinoTotal = String(day)
      .concat(String(month), String(year))
      .split("")
      .reduce((acc, d) => acc + (parseInt(d, 10) || 0), 0);
    const destino = reduceNumber(destinoTotal);
    const missao = reduceNumber(destino + expressao);
    const trianguloBase = calcularTrianguloVidaBase(nomeComp);

    const ciclosVida = calcularCiclosVida(day, month, year, destino);
    const momentosDecisivos = calcularMomentosDecisivos(
      day,
      month,
      year,
      ciclosVida
    );

    const { estrutural, direcionamento, kan, rep1Num } =
      calcularPerfilComportamentalNumeros(
        expressao,
        motivacao,
        impressao,
        day,
        destino,
        missao,
        ciclosVida.ciclo2.numero,
        momentosDecisivos.momento3.numero,
        trianguloBase
      );

    // Exatamente como em PROG/services/harmonia.py linhas 50-75:
    const todosNum: number[] = [
      expressao,
      motivacao,
      impressao,
      destino,
      missao,
      day,
      ciclosVida.ciclo1.numero,
      ciclosVida.ciclo2.numero,
      ciclosVida.ciclo3.numero,
      momentosDecisivos.momento1.numero,
      momentosDecisivos.momento2.numero,
      momentosDecisivos.momento3.numero,
      momentosDecisivos.momento4.numero,
      reduceNumber(day),
      trianguloBase,
    ];

    const cTot = new Map<number, number>();
    for (const n of todosNum) {
      if (typeof n === "number" && !isNaN(n)) {
        cTot.set(n, (cTot.get(n) || 0) + 1);
      }
    }
    const rTot = Array.from(cTot.entries()).sort((a, b) =>
      b[1] !== a[1] ? b[1] - a[1] : a[0] - b[0]
    );

    const r2V = rTot.length > 0 ? rTot[0][0] : 0;
    const r3V = rTot.length > 1 ? rTot[1][0] : 0;
    const r4V = rTot.length > 2 ? rTot[2][0] : 0;

    const todosComp: Array<number | null> = [
      kan > 0 ? kan : null,
      estrutural > 0 ? estrutural : null,
      direcionamento > 0 ? direcionamento : null,
      rep1Num && rep1Num > 0 ? rep1Num : null,
      r2V > 0 ? r2V : null,
      r3V > 0 ? r3V : null,
      r4V > 0 ? r4V : null,
    ];

    const verts: number[] = [];
    const valsSeen = new Set<number>();
    for (const vIt of todosComp) {
      if (
        vIt !== null &&
        vIt !== 11 &&
        vIt !== 22 &&
        !valsSeen.has(vIt)
      ) {
        verts.push(vIt);
        valsSeen.add(vIt);
      }
      if (verts.length === 3) break;
    }

    if (verts.length < 3) {
      for (const fb of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        if (!valsSeen.has(fb)) {
          verts.push(fb);
          valsSeen.add(fb);
        }
        if (verts.length === 3) break;
      }
    }

    return {
      vertices: [verts[0], verts[1], verts[2]],
      kanNumero: kan,
      estrutural,
      direcionamento,
      trianguloBase,
    };
  } catch {
    return {
      vertices: [1, 2, 3],
      kanNumero: 9,
      estrutural: 1,
      direcionamento: 2,
      trianguloBase: 3,
    };
  }
}
