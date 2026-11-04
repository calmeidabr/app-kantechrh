/**
 * Motor Numerológico e Geométrico KAN (Port 1:1 de PROG/services/numerologia.py, perfil.py e harmonia.py)
 */

export const LETTER_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1, I: 1, Q: 1, Y: 1,
  B: 2, K: 2, T: 2, R: 2,
  C: 3, G: 3, L: 3,
  D: 4, M: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
  // Vogais Acentuadas
  Ê: 3, É: 7, Í: 3, Ó: 9, Á: 3, Ú: 8, Â: 8, Õ: 1, Ô: 5, À: 2, Ä: 2, Ë: 7, Ï: 3, Ö: 5, Ü: 4,
  // Consoantes/Outros Acentuados
  Ã: 4, Ç: 6, Ñ: 8,
};

export const VOWELS = new Set([
  "A", "E", "I", "O", "U", "Y",
  "Á", "É", "Í", "Ó", "Ú",
  "Â", "Ê", "Ô", "Ã", "Õ",
  "À", "Ä", "Ë", "Ï", "Ö", "Ü",
]);

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
  const s = String(rawDate || "").trim();
  const slashParts = s.split("/");
  if (slashParts.length === 3) {
    const d = parseInt(slashParts[0], 10);
    const m = parseInt(slashParts[1], 10);
    const y = parseInt(slashParts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return [d, m, y];
  }
  const dashParts = s.split("-");
  if (dashParts.length === 3) {
    const y = parseInt(dashParts[0], 10);
    const m = parseInt(dashParts[1], 10);
    const d = parseInt(dashParts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return [d, m, y];
  }
  return [1, 1, 1990];
}

export function calcularNumerosNome(nomeCompleto: string): {
  expressao: number;
  motivacao: number;
  impressao: number;
} {
  const nome = String(nomeCompleto || "").toUpperCase();
  let somaVogais = 0;
  let somaConsoantes = 0;
  for (const letra of nome) {
    if (letra in LETTER_VALUES) {
      const val = LETTER_VALUES[letra];
      if (VOWELS.has(letra)) {
        somaVogais += val;
      } else {
        somaConsoantes += val;
      }
    }
  }
  const motivacao = reduceNumber(somaVogais);
  const impressao = reduceNumber(somaConsoantes);
  const expressao = reduceNumber(somaVogais + somaConsoantes);
  return { expressao, motivacao, impressao };
}

export function calcularTrianguloVidaBase(nomeCompleto: string): number {
  const letras = String(nomeCompleto || "")
    .toUpperCase()
    .split("")
    .filter((ch) => ch in LETTER_VALUES);
  if (letras.length === 0) return 0;
  let linha = letras.map((ch) => LETTER_VALUES[ch]);
  while (linha.length > 1) {
    const novaLinha: number[] = [];
    for (let i = 0; i < linha.length - 1; i++) {
      let s = linha[i] + linha[i + 1];
      while (s > 9) {
        s = sumDigits(s);
      }
      novaLinha.push(s);
    }
    linha = novaLinha;
  }
  return linha[0] || 0;
}

export function calcularDesafios(dia: number, mes: number, ano: number) {
  const dRed = reduceSingleDigit(dia);
  const mRed = reduceSingleDigit(mes);
  const aRed = reduceSingleDigit(ano);
  const desafio1 = Math.abs(dRed - mRed);
  const desafio2 = Math.abs(dRed - aRed);
  const desafioPrincipal = Math.abs(desafio1 - desafio2);
  return { desafio1, desafio2, desafioPrincipal };
}

export function calcularCiclosVida(
  dia: number,
  mes: number,
  ano: number,
  destino: number
) {
  const duracaoCiclo1 = 37 - destino;
  const fimCiclo1 = ano + duracaoCiclo1;
  const ciclo1Num = mes !== 11 ? sumDigits(mes) : 11;

  const inicioCiclo2 = fimCiclo1;
  const fimCiclo2 = inicioCiclo2 + 27;
  const ciclo2Num =
    dia !== 11 && dia !== 22 ? reduceSingleDigit(dia) : dia;

  const inicioCiclo3 = fimCiclo2;
  const ciclo3Num = reduceNumber(ano);

  return {
    ciclo1: { numero: reduceNumber(ciclo1Num), inicio: ano, fim: fimCiclo1 },
    ciclo2: {
      numero: reduceNumber(ciclo2Num),
      inicio: inicioCiclo2,
      fim: fimCiclo2,
    },
    ciclo3: {
      numero: reduceNumber(ciclo3Num),
      inicio: inicioCiclo3,
      fim: "Resto da vida",
    },
  };
}

export function calcularMomentosDecisivos(
  dia: number,
  mes: number,
  ano: number,
  ciclos: ReturnType<typeof calcularCiclosVida>
) {
  const dRed = reduceNumber(dia);
  const mRed = reduceNumber(mes);
  const aRed = reduceNumber(ano);

  const m1 = reduceNumber(dRed + mRed);
  const m2 = reduceNumber(dRed + aRed);
  const m3 = reduceNumber(m1 + m2);
  const m4 = reduceNumber(mRed + aRed);

  const fimM1 = ciclos.ciclo1.fim;
  const fimM2 = fimM1 + 9;
  const fimM3 = fimM2 + 9;

  return {
    momento1: { numero: m1, inicio: ano, fim: fimM1 },
    momento2: { numero: m2, inicio: fimM1, fim: fimM2 },
    momento3: { numero: m3, inicio: fimM2, fim: fimM3 },
    momento4: { numero: m4, inicio: fimM3, fim: "Resto da vida" },
  };
}

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
 * Port 1:1 de `obter_vertices_triangulo(nome_comp, data_nasc_str)` em `PROG/services/harmonia.py`
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
    const missao = reduceNumber(expressao + destino);
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

    const r2V = rTot.length > 0 ? rTot[0][0] : null;
    const r3V = rTot.length > 1 ? rTot[1][0] : null;
    const r4V = rTot.length > 2 ? rTot[2][0] : null;

    const todosComp: Array<number | null> = [
      kan > 0 ? kan : null,
      estrutural > 0 ? estrutural : null,
      direcionamento > 0 ? direcionamento : null,
      rep1Num && rep1Num > 0 ? rep1Num : null,
      r2V && r2V > 0 ? r2V : null,
      r3V && r3V > 0 ? r3V : null,
      r4V && r4V > 0 ? r4V : null,
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
