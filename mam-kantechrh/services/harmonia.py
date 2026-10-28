import datetime
from collections import Counter
from services.numerologia import calcular_numerologia, reduce_number
from services.perfil import calcular_perfil_comportamental

# Coordenadas oficiais dos planos no Plano de Tesla
COORDS_MAP = {
    1: (794, 176),
    2: (1037, 243),
    3: (960, 380),
    4: (794, 585),
    5: (486, 585),
    6: (320, 380),
    7: (243, 243),
    8: (486, 176),
    9: (640, 120),
    11: (1037, 243),
    22: (794, 585),
}


def clean_value(v):
    if v is None:
        return None
    s = str(v).split(" - ")[0]
    return int(s) if s.isdigit() and int(s) > 0 else None


def obter_vertices_triangulo(nome_comp: str, data_nasc_str: str):
    """
    Calcula e retorna os 3 vértices do triângulo harmônico (números de 1 a 9)
    e o KAN principal correspondente a um talento com base em numerologia.
    """
    try:
        if isinstance(data_nasc_str, (datetime.datetime, datetime.date)):
            nasc_dt = data_nasc_str
        else:
            try:
                nasc_dt = datetime.datetime.strptime(data_nasc_str, "%d/%m/%Y")
            except ValueError:
                nasc_dt = datetime.datetime.strptime(data_nasc_str, "%Y-%m-%d")

        nasc_tuple = (nasc_dt.day, nasc_dt.month, nasc_dt.year)
        now_dt = datetime.datetime.now()
        data_at = (now_dt.day, now_dt.month, now_dt.year)

        res = calcular_numerologia(nome_comp, nasc_tuple, data_at)
        (
            expressao,
            motivacao,
            impressao,
            destino,
            _,
            _,
            _,
            missao,
            _,
            _,
            _,
            _,
            _,
            _,
            _,
            _,
            ciclos_vida,
            momentos_decisivos,
            triangulo_base,
            _,
            _,
            _,
        ) = res

        estrutural, direcionamento, kan, rep1, _ = calcular_perfil_comportamental(
            expressao,
            motivacao,
            impressao,
            nasc_tuple[0],
            destino,
            missao,
            ciclos_vida["ciclo2"]["numero"],
            momentos_decisivos["momento3"]["numero"],
            triangulo_base,
        )

        todos_num = []
        for v_it in [expressao, motivacao, impressao, destino, missao, nasc_tuple[0]]:
            if isinstance(v_it, int):
                todos_num.append(v_it)
            elif isinstance(v_it, str) and str(v_it).isdigit():
                todos_num.append(int(v_it))

        for c_key in ciclos_vida:
            num_c = ciclos_vida[c_key].get("numero")
            if isinstance(num_c, int):
                todos_num.append(num_c)
        for m_key in momentos_decisivos:
            num_m = momentos_decisivos[m_key].get("numero")
            if isinstance(num_m, int):
                todos_num.append(num_m)

        num_ps = reduce_number(nasc_tuple[0])
        todos_num.append(num_ps)
        if isinstance(triangulo_base, int):
            todos_num.append(triangulo_base)

        c_tot = Counter(todos_num)
        r_tot = sorted([(n, c) for n, c in c_tot.items()], key=lambda x: (-x[1], x[0]))
        r2_v = r_tot[0][0] if r_tot else 0
        r3_v = r_tot[1][0] if len(r_tot) > 1 else 0
        r4_v = r_tot[2][0] if len(r_tot) > 2 else 0

        todos_comp = [
            {"campo": "KAN", "valor": clean_value(kan)},
            {"campo": "ESTRUTURAL", "valor": clean_value(estrutural)},
            {"campo": "DIRECIONAMENTO", "valor": clean_value(direcionamento)},
            {"campo": "REPETIÇÃO 1", "valor": clean_value(rep1)},
            {"campo": "REP. MAPA", "valor": r2_v if r2_v else None},
            {"campo": "REP. MAPA 2", "valor": r3_v if r3_v else None},
            {"campo": "REP. MAPA 3", "valor": r4_v if r4_v else None},
        ]

        verts = []
        vals_seen = set()
        for it in todos_comp:
            v_it = it["valor"]
            if v_it is not None and v_it not in [11, 22] and v_it not in vals_seen:
                verts.append(v_it)
                vals_seen.add(v_it)
            if len(verts) == 3:
                break

        if len(verts) < 3:
            for fallback_val in [1, 2, 3, 4, 5, 6, 7, 8, 9]:
                if fallback_val not in vals_seen:
                    verts.append(fallback_val)
                    vals_seen.add(fallback_val)
                if len(verts) == 3:
                    break

        kan_str = str(kan) if kan else "Nenhum"
        return verts, kan_str
    except Exception:
        return [1, 2, 3], "Nenhum"


def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])


def se_cruzam(A, B, C, D):
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)


def obter_coordenada(plano):
    p = int(plano)
    if p == 11:
        p = 2
    elif p == 22:
        p = 4
    return COORDS_MAP.get(p, (640, 360))


def classificar_relacao_geometrica(T_A, T_B):
    set_A = set(T_A)
    set_B = set(T_B)

    if set_A == set_B:
        return "Sobreposição Idêntica"

    intersec = set_A.intersection(set_B)
    if len(intersec) == 2:
        return "Lateral em Comum"

    if len(intersec) == 1:
        return "Vértice em Comum"

    arestas_A = [(T_A[0], T_A[1]), (T_A[1], T_A[2]), (T_A[2], T_A[0])]
    arestas_B = [(T_B[0], T_B[1]), (T_B[1], T_B[2]), (T_B[2], T_B[0])]

    for a_A in arestas_A:
        pA1 = obter_coordenada(a_A[0])
        pA2 = obter_coordenada(a_A[1])
        for a_B in arestas_B:
            pB1 = obter_coordenada(a_B[0])
            pB2 = obter_coordenada(a_B[1])
            if se_cruzam(pA1, pA2, pB1, pB2):
                return "Atravessamento"

    return "Afastamento"


def calcular_harmonia_trio(membro1: dict, membro2: dict, candidato: dict, pesos=None):
    if pesos is None:
        pesos = {
            "complementaridade": 25,
            "integracao": 25,
            "balanceamento": 20,
            "entrega": 15,
            "conflito": 15,
        }

    n1, n2, nc = membro1["nome"], membro2["nome"], candidato["nome"]
    v1, v2, vc = membro1["vertices"], membro2["vertices"], candidato["vertices"]

    def normalizar_nome_kan(k_val):
        if k_val is None:
            return "Nenhum"
        k_str = str(k_val).strip()
        if k_str in ("3", "3.0", "1", "2"):
            return "Criação"
        if k_str in ("6", "6.0", "4", "5"):
            return "Movimento"
        if k_str in ("9", "9.0", "7", "8"):
            return "Finalidade"
        k_cap = k_str.capitalize()
        if k_cap in ("Criação", "Criacao"):
            return "Criação"
        if k_cap == "Movimento":
            return "Movimento"
        if k_cap == "Finalidade":
            return "Finalidade"
        return k_cap

    k1 = normalizar_nome_kan(membro1.get("kan"))
    k2 = normalizar_nome_kan(membro2.get("kan"))
    kc = normalizar_nome_kan(candidato.get("kan"))

    kans_ativos = {k1, k2, kc}
    kans_validos = {
        k for k in kans_ativos if k in ("Criação", "Movimento", "Finalidade")
    }

    if len(kans_validos) == 3:
        bloco_kan = 5.0
    elif len(kans_validos) == 2:
        bloco_kan = 3.5
    else:
        bloco_kan = 1.5

    r12 = classificar_relacao_geometrica(v1, v2)
    r1c = classificar_relacao_geometrica(v1, vc)
    r2c = classificar_relacao_geometrica(v2, vc)

    pontos_relacao = {
        "Lateral em Comum": 5.0,
        "Vértice em Comum": 4.0,
        "Atravessamento": 3.0,
        "Sobreposição Idêntica": 2.5,
        "Afastamento": 1.0,
    }

    bloco_geo = (
        pontos_relacao[r12] + pontos_relacao[r1c] + pontos_relacao[r2c]
    ) / 3.0

    planos_cobertos = set(v1).union(set(v2)).union(set(vc))
    num_planos = len(planos_cobertos)

    if num_planos >= 6:
        bloco_bal = 5.0
    elif num_planos == 5:
        bloco_bal = 4.0
    elif num_planos == 4:
        bloco_bal = 3.0
    elif num_planos == 3:
        bloco_bal = 2.0
    elif num_planos == 2:
        bloco_bal = 1.0
    else:
        bloco_bal = 0.5

    planos_praticos = {4, 8, 9}
    vertices_compartilhados = (
        set(v1)
        .intersection(set(vc))
        .union(set(v2).intersection(set(vc)))
        .union(set(v1).intersection(set(v2)))
    )
    conexoes_praticas_compartilhadas = vertices_compartilhados.intersection(
        planos_praticos
    )

    nota_conexoes = 0.0
    if len(conexoes_praticas_compartilhadas) >= 2:
        nota_conexoes = 4.0
    elif len(conexoes_praticas_compartilhadas) == 1:
        nota_conexoes = 2.5

    ponto_finalidade = 0.0
    if any(k == "Finalidade" for k in (k1, k2, kc)):
        ponto_finalidade += 0.5
    if kc == "Finalidade":
        ponto_finalidade += 0.5

    bloco_entrega = min(5.0, 1.0 + nota_conexoes + ponto_finalidade)

    bloco_conflito = 5.0
    if r1c == "Sobreposição Idêntica":
        bloco_conflito -= 1.8
    if r2c == "Sobreposição Idêntica":
        bloco_conflito -= 1.8
    if r12 == "Sobreposição Idêntica":
        bloco_conflito -= 1.0

    if k1 == k2 == kc and k1 != "Nenhum":
        bloco_conflito -= 1.5
    else:
        if k1 == kc and k1 != "Nenhum":
            bloco_conflito -= 0.8
        if k2 == kc and k2 != "Nenhum":
            bloco_conflito -= 0.8
        if k1 == k2 and k1 != "Nenhum":
            bloco_conflito -= 0.5

    if r1c == "Afastamento":
        bloco_conflito -= 0.6
    if r2c == "Afastamento":
        bloco_conflito -= 0.6
    if num_planos <= 3:
        bloco_conflito -= 1.0

    bloco_conflito = max(0.0, min(5.0, bloco_conflito))

    nota_final_5 = (
        bloco_kan * pesos["complementaridade"]
        + bloco_geo * pesos["integracao"]
        + bloco_bal * pesos["balanceamento"]
        + bloco_entrega * pesos["entrega"]
        + bloco_conflito * pesos["conflito"]
    ) / 100.0

    nota_final = round((nota_final_5 / 5.0) * 100.0, 1)

    if nota_final >= 85.0:
        faixa = "Encaixe Muito Alto"
    elif nota_final >= 70.0:
        faixa = "Bom Encaixe"
    elif nota_final >= 55.0:
        faixa = "Encaixe Moderado"
    elif nota_final >= 40.0:
        faixa = "Encaixe Frágil"
    else:
        faixa = "Encaixe Baixo"

    justificativa = (
        f"A integração de {nc} com a equipe formada por {n1} e {n2} apresenta "
        f"{faixa.upper()} (Nota: {nota_final}/100). "
        f"Relações geométricas no Plano de Tesla: ({n1}×{nc}: {r1c}) e ({n2}×{nc}: {r2c})."
    )

    return {
        "nota_final": nota_final,
        "faixa": faixa,
        "relacoes_geometricas": {"m1_m2": r12, "m1_cand": r1c, "m2_cand": r2c},
        "blocos": {
            "complementaridade": round(bloco_kan, 2),
            "integracao": round(bloco_geo, 2),
            "balanceamento": round(bloco_bal, 2),
            "entrega": round(bloco_entrega, 2),
            "conflito": round(bloco_conflito, 2),
        },
        "justificativa": justificativa,
    }
