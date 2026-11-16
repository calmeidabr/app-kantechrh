import pandas as pd
from collections import Counter
from services.reference_data import (
    remover_acentos,
    normalize_key,
    get_from_row,
    get_matriz_db,
    get_atributos_db,
    get_repeticao_db,
    get_peso_db,
    get_peso_categoria_db,
    get_perfis_db,
    get_perfil_descricao_db,
    get_qualidades_db,
    get_lista_categoria_db,
    get_categoria_descricao_db,
    get_kan_db,
    get_fortalezas_db,
    get_desafios_db,
    get_campo_definicao_db,
    get_diferenciais_desc_db,
    get_desc_mapa,
)
from services.numerologia import reduce_number, calcular_numerologia


def calcular_perfil_comportamental(
    expressao,
    motivacao,
    impressao,
    dia,
    destino,
    missao,
    ciclo2_num,
    momento3_num,
    triangulo_base,
):
    repeticao_db = get_repeticao_db()

    def reduce_kan(n):
        while n > 9 and n not in [11, 22]:
            n = sum(int(d) for d in str(n))
        return n

    estrutural = reduce_kan(motivacao + impressao + expressao + reduce_number(dia))
    direcionamento = reduce_kan(destino + missao + ciclo2_num + momento3_num)
    kan = reduce_kan(estrutural + direcionamento)

    num_dia_puro = dia
    num_dia_reduzido = reduce_number(dia)
    nums = [
        motivacao,
        impressao,
        expressao,
        destino,
        missao,
        num_dia_puro,
        triangulo_base,
        num_dia_reduzido,
    ]
    counts = Counter(nums)
    reps = sorted(
        [(num, count) for num, count in counts.items() if count >= 2],
        key=lambda x: (-x[1], x[0]),
    )

    def get_rep_info(idx):
        if idx < len(reps):
            n = reps[idx][0]
            r_data = repeticao_db.get(str(n), {"perfil": ""})
            perfil = get_from_row(r_data, "perfil") or ""
            return f"{n} - {perfil}" if perfil else str(n)
        return ""

    rep1 = get_rep_info(0)
    rep2 = get_rep_info(1)
    return estrutural, direcionamento, kan, rep1, rep2


def realizar_calculos_completos(
    nome: str,
    nascimento: tuple,
    data_atual: tuple,
    cargo: str = "",
    empresa: str = "",
):
    MATRIZ_DB = get_matriz_db()
    ATRIBUTOS_DB = get_atributos_db()
    REPETICAO_DB = get_repeticao_db()
    PESO_DB = get_peso_db()
    PESO_CATEGORIA_DB = get_peso_categoria_db()
    PERFIS_DB = get_perfis_db()
    PERFIL_DESCRICAO_DB = get_perfil_descricao_db()
    QUALIDADES_DB = get_qualidades_db()
    LISTA_CATEGORIA_DB = get_lista_categoria_db()
    CATEGORIA_DESCRICAO_DB = get_categoria_descricao_db()
    KAN_DB = get_kan_db()
    FORTALEZAS_DB = get_fortalezas_db()
    DESAFIOS_DB = get_desafios_db()
    CAMPO_DEFINICAO_DB = get_campo_definicao_db()
    DIFERENCIAIS_DESC_DB = get_diferenciais_desc_db()

    resultados = calcular_numerologia(nome, nascimento, data_atual)
    (
        expressao,
        motivacao,
        impressao,
        destino,
        dia_pessoal,
        mes_pess,
        ano_pess,
        missao,
        dividas_carmicas,
        licoes_carmicas,
        tendencias_ocultas,
        soma_tendencias,
        resposta_subconsciente,
        desafio1,
        desafio2,
        desafio_principal,
        ciclos_vida,
        momentos_decisivos,
        triangulo_base,
        triangulo_reps,
        arcano_atual_res,
        arcano_atual_periodo,
    ) = resultados

    estrutural, direcionamento, kan, rep1, rep2 = calcular_perfil_comportamental(
        expressao,
        motivacao,
        impressao,
        nascimento[0],
        destino,
        missao,
        ciclos_vida["ciclo2"]["numero"],
        momentos_decisivos["momento3"]["numero"],
        triangulo_base,
    )

    todos_numeros_mapa = []
    for v in [expressao, motivacao, impressao, destino, missao, nascimento[0]]:
        if isinstance(v, int):
            todos_numeros_mapa.append(v)
        elif isinstance(v, str) and str(v).isdigit():
            todos_numeros_mapa.append(int(v))

    for v in [desafio1, desafio2, desafio_principal]:
        if isinstance(v, int):
            todos_numeros_mapa.append(v)
        elif isinstance(v, str) and str(v).isdigit():
            todos_numeros_mapa.append(int(v))

    for c_key in ciclos_vida:
        num_c = ciclos_vida[c_key].get("numero")
        if isinstance(num_c, int):
            todos_numeros_mapa.append(num_c)

    for m_key in momentos_decisivos:
        num_m = momentos_decisivos[m_key].get("numero")
        if isinstance(num_m, int):
            todos_numeros_mapa.append(num_m)

    num_psiquico = reduce_number(nascimento[0])
    todos_numeros_mapa.append(num_psiquico)
    if isinstance(triangulo_base, int):
        todos_numeros_mapa.append(triangulo_base)

    c_total = Counter(todos_numeros_mapa)
    r_totais = sorted([(n, c) for n, c in c_total.items()], key=lambda x: (-x[1], x[0]))

    num_repeticao_mapa = r_totais[0][0] if r_totais else 0
    perfil_rep_mapa = get_from_row(
        REPETICAO_DB.get(str(num_repeticao_mapa), {}), "perfil"
    ) or ""
    repeticao_mapa = (
        f"{num_repeticao_mapa} - {perfil_rep_mapa}"
        if perfil_rep_mapa
        else str(num_repeticao_mapa)
    )

    num_repeticao_2_mapa = r_totais[1][0] if len(r_totais) > 1 else 0
    perfil_rep_2_mapa = get_from_row(
        REPETICAO_DB.get(str(num_repeticao_2_mapa), {}), "perfil"
    ) or ""
    repeticao_2_mapa = (
        f"{num_repeticao_2_mapa} - {perfil_rep_2_mapa}"
        if perfil_rep_2_mapa
        else str(num_repeticao_2_mapa)
    )

    num_repeticao_3_mapa = r_totais[2][0] if len(r_totais) > 2 else 0
    perfil_rep_3_mapa = get_from_row(
        REPETICAO_DB.get(str(num_repeticao_3_mapa), {}), "perfil"
    ) or ""
    repeticao_3_mapa = (
        f"{num_repeticao_3_mapa} - {perfil_rep_3_mapa}"
        if perfil_rep_3_mapa
        else str(num_repeticao_3_mapa)
    )

    def extract_num(s):
        if s is None or s == "":
            return None
        try:
            return str(s).split(" - ")[0]
        except Exception:
            return str(s)

    colunas_score = [
        "Motivação",
        "Impressão",
        "Expressão",
        "Destino",
        "Missão",
        "Dia Natalício",
        "Triângulo",
        "No Psiquico",
        "Estrutural",
        "Direcionamento",
        "REPETIÇÃO 1",
        "REPETIÇÃO 2",
    ]
    mapa_col_matriz = {
        "Motivação": "motivacao",
        "Impressão": "impressao",
        "Expressão": "expressao",
        "Destino": "destino",
        "Missão": "missao",
        "Dia Natalício": "dia_natalicio",
        "Triângulo": "triangulo",
        "No Psiquico": "no_psiquico",
    }

    valores_originais_score = {
        "Motivação": extract_num(motivacao),
        "Impressão": extract_num(impressao),
        "Expressão": extract_num(expressao),
        "Destino": extract_num(destino),
        "Missão": extract_num(missao),
        "Dia Natalício": nascimento[0],
        "Triângulo": triangulo_base,
        "No Psiquico": num_psiquico,
        "Estrutural": estrutural,
        "Direcionamento": direcionamento,
        "REPETIÇÃO 1": extract_num(rep1),
        "REPETIÇÃO 2": num_repeticao_mapa,
    }

    perfis_list = (
        PERFIS_DB
        if PERFIS_DB
        else [
            "Lider",
            "Criativo",
            "Executor",
            "Resultado",
            "Vendedor",
            "Influenciador",
            "Comunicador",
        ]
    )
    score_df_calc = pd.DataFrame(0, index=perfis_list, columns=colunas_score)

    def get_expl(campo_nome):
        base_name = str(campo_nome).split(" - ")[0]
        search = normalize_key(base_name)
        if "psiquico" in search:
            search = "nopsiquico"
        if "triangulodavida" in search and "repeticao" not in search:
            search = "triangulodavida"
        if "repeticao" in search:
            search = "triangulodavidarepeticoes"
        for k, v in CAMPO_DEFINICAO_DB.items():
            if normalize_key(k) == search:
                return v
        return ""

    dados = []

    def add_row(campo_titulo, valor_badge, resultado_texto, explicacao=""):
        if not explicacao or str(explicacao).strip() == "":
            explicacao = get_expl(campo_titulo)
        campo_full = (
            f"{campo_titulo} - {valor_badge}"
            if (valor_badge is not None and str(valor_badge).strip() != "")
            else campo_titulo
        )
        dados.append(
            {
                "Campo": campo_full,
                "Valor": str(valor_badge) if valor_badge is not None else "",
                "Resultado": str(resultado_texto) if resultado_texto is not None else "",
                "Explicacao": explicacao,
            }
        )

    def add_row_mapa(campo_titulo, valor_num, cat_mapa):
        num_clean = extract_num(valor_num)
        desc = get_desc_mapa(cat_mapa, str(num_clean)) if num_clean is not None else ""
        add_row(campo_titulo, valor_num, desc if desc else valor_num)

    add_row_mapa("Motivação", motivacao, "Motivacao")
    add_row_mapa("Impressão", impressao, "Impressao")
    add_row_mapa("Expressão", expressao, "Expressao")
    add_row_mapa("Dia Natalício", str(nascimento[0]), "Dia Natalicio")
    add_row_mapa("Número Psíquico", str(num_psiquico), "Numero Psiquico")
    add_row_mapa("Destino", destino, "Destino")
    add_row_mapa("Missão", missao, "Missao")

    if dividas_carmicas:
        dividas_str = ", ".join(str(d) for d in dividas_carmicas if d is not None)
        add_row("Dívidas Cármicas", dividas_str, dividas_str)
    else:
        add_row("Dívidas Cármicas", None, "Não há")

    if licoes_carmicas:
        licoes_str = ", ".join(str(l) for l in licoes_carmicas if l is not None)
        add_row("Lições Cármicas", licoes_str, licoes_str)
    else:
        add_row("Lições Cármicas", None, "Não há")

    if tendencias_ocultas:
        tend_str = ", ".join(str(t) for t in tendencias_ocultas if t is not None)
        add_row("Tendências Ocultas", tend_str, tend_str)
    else:
        add_row("Tendências Ocultas", None, "Não há")

    add_row("Resposta Subconsciente", str(resposta_subconsciente), str(resposta_subconsciente))
    add_row("1º Desafio", str(desafio1), get_desc_mapa("Desafio", str(desafio1)) or str(desafio1))
    add_row("2º Desafio", str(desafio2), get_desc_mapa("Desafio", str(desafio2)) or str(desafio2))
    add_row(
        "Desafio Principal",
        str(desafio_principal),
        get_desc_mapa("Desafio", str(desafio_principal)) or str(desafio_principal),
    )

    add_row("Ano Pessoal", str(ano_pess), str(ano_pess))
    add_row("Mês Pessoal", str(mes_pess), str(mes_pess))
    add_row("Dia Pessoal", str(dia_pessoal), str(dia_pessoal))
    add_row("Triângulo Harmônico", str(triangulo_base), str(triangulo_base))
    add_row("Arcano Atual", None, arcano_atual_res)
    add_row("Arcano Atual (Período)", None, arcano_atual_periodo)
    add_row("Repetição Mapa", None, repeticao_mapa)
    add_row("Repetição 2 Mapa", None, repeticao_2_mapa)
    add_row("Repetição 3 Mapa", None, repeticao_3_mapa)

    for campo_s in colunas_score:
        val_s = valores_originais_score.get(campo_s)
        if val_s is None:
            continue
        perfil_enc = None
        if campo_s in mapa_col_matriz:
            row_m = MATRIZ_DB.get(str(val_s))
            if row_m:
                attr_t = str(get_from_row(row_m, campo_s) or "").upper()
                if (
                    (not attr_t or attr_t == "NAN")
                    and str(val_s).isdigit()
                    and int(val_s) in (11, 22, 33)
                ):
                    num_reduz = sum(int(d) for d in str(val_s))
                    row_m_reduz = MATRIZ_DB.get(str(num_reduz))
                    if row_m_reduz:
                        attr_t = str(get_from_row(row_m_reduz, campo_s) or "").upper()
                if attr_t and attr_t != "NAN":
                    ai = ATRIBUTOS_DB.get(attr_t)
                    if ai:
                        perfil_enc = get_from_row(ai, "perfil")
        else:
            ri = REPETICAO_DB.get(str(val_s))
            if ri:
                perfil_enc = get_from_row(ri, "perfil")

        if perfil_enc:
            pn = str(perfil_enc).strip().capitalize()
            if pn in score_df_calc.index:
                pv = PESO_DB.get(campo_s, 1)
                score_df_calc.at[pn, campo_s] = int(pv)

    score_df_calc["TOTAL"] = score_df_calc.sum(axis=1)

    lista_cat = LISTA_CATEGORIA_DB if LISTA_CATEGORIA_DB else ["Justo"]
    score_cat_df = pd.DataFrame(0, index=lista_cat, columns=colunas_score)

    for campo_c in colunas_score:
        val_c = valores_originais_score.get(campo_c)
        if val_c is None:
            continue
        cat_encontrada = None
        if campo_c in mapa_col_matriz:
            row_m_cat = MATRIZ_DB.get(str(val_c))
            if row_m_cat:
                attr_t_cat = str(get_from_row(row_m_cat, campo_c) or "").upper()
                if attr_t_cat and attr_t_cat != "NAN":
                    ai_cat = ATRIBUTOS_DB.get(attr_t_cat)
                    if ai_cat:
                        cat_encontrada = get_from_row(ai_cat, "categoria")
        else:
            ri_cat = REPETICAO_DB.get(str(val_c))
            if ri_cat:
                cat_encontrada = get_from_row(ri_cat, "categoria")

        if cat_encontrada:
            cn = str(cat_encontrada).strip().capitalize()
            if cn in score_cat_df.index:
                pv_cat = PESO_CATEGORIA_DB.get(campo_c, PESO_DB.get(campo_c, 1))
                score_cat_df.at[cn, campo_c] = int(pv_cat)

    score_cat_df["TOTAL"] = score_cat_df.sum(axis=1)

    lista_quals = list(QUALIDADES_DB.keys()) if QUALIDADES_DB else ["Relacionamento"]
    score_qual_df = pd.DataFrame(0, index=lista_quals, columns=colunas_score)
    dados_auditoria_qual = []

    def determinar_soft_skills_linha(
        perfil: str,
        categoria: str,
        qualidade: str,
        atributo: str = "",
        campo: str = "",
    ) -> str:
        """Mapeia e valida as Soft Skills oficiais do catálogo KAN para a linha de detalhamento."""
        p = remover_acentos(str(perfil or "")).upper()
        c = remover_acentos(str(categoria or "")).upper()
        q = remover_acentos(str(qualidade or "")).upper()
        m = remover_acentos(str(atributo or "")).upper()
        cp = remover_acentos(str(campo or "")).upper()

        por_perfil = []
        por_categoria = []
        por_qualidade = []
        por_matriz = []

        if "LIDER" in p:
            por_perfil.extend(["Liderança", "Tomada de decisão", "Visão sistêmica"])
        elif "COMUNICADOR" in p:
            por_perfil.extend(["Comunicação eficaz", "Comunicação assertiva", "Escuta ativa"])
        elif "CRIATIVO" in p:
            por_perfil.extend(["Criatividade", "Inovação / melhoria contínua", "Visão sistêmica"])
        elif "EXECUTOR" in p:
            por_perfil.extend(["Produtividade", "Disciplina", "Organização"])
        elif "RESULTADO" in p:
            por_perfil.extend(["Produtividade", "Gestão do tempo", "Resolução de problemas"])
        elif "VENDEDOR" in p:
            por_perfil.extend(["Comunicação assertiva", "Proatividade", "Resiliência"])
        elif "INFLUENCIADOR" in p:
            por_perfil.extend(["Relacionamento interpessoal", "Comunicação eficaz", "Inteligência emocional"])

        if "ANALIT" in c:
            por_categoria.extend(["Pensamento crítico", "Resolução de problemas", "Atenção / foco"])
        elif "COMUNICAT" in c:
            por_categoria.extend(["Comunicação eficaz", "Comunicação assertiva", "Escuta ativa"])
        elif "INOVAD" in c:
            por_categoria.extend(["Inovação / melhoria contínua", "Criatividade", "Proatividade"])
        elif "EMPAT" in c:
            por_categoria.extend(["Empatia", "Colaboração", "Trabalho em equipe"])
        elif "CONHEC" in c:
            por_categoria.extend(["Visão sistêmica", "Aprendizado contínuo", "Pensamento crítico"])
        elif "REALIZ" in c:
            por_categoria.extend(["Produtividade", "Disciplina", "Gestão do tempo"])
        elif "ORGANIZ" in c:
            por_categoria.extend(["Organização", "Gestão do tempo", "Atenção / foco"])
        elif "VERSAT" in c:
            por_categoria.extend(["Adaptabilidade / flexibilidade", "Proatividade", "Resiliência"])
        elif "MAGNET" in c:
            por_categoria.extend(["Relacionamento interpessoal", "Comunicação eficaz", "Trabalho em equipe"])
        elif "DIPLOMAT" in c:
            por_categoria.extend(["Escuta ativa", "Relacionamento interpessoal", "Inteligência emocional"])
        elif "HARMON" in c:
            por_categoria.extend(["Trabalho em equipe", "Colaboração", "Empatia"])
        elif "JUSTO" in c:
            por_categoria.extend(["Ética / responsabilidade", "Tomada de decisão", "Inteligência emocional"])
        elif "INTUIT" in c:
            por_categoria.extend(["Inteligência emocional", "Visão sistêmica", "Criatividade"])
        elif "VISION" in c:
            por_categoria.extend(["Visão sistêmica", "Inovação / melhoria contínua", "Tomada de decisão"])

        if "ANALIS" in q:
            por_qualidade.extend(["Pensamento crítico", "Resolução de problemas", "Atenção / foco"])
        elif "COLETIV" in q:
            por_qualidade.extend(["Colaboração", "Trabalho em equipe", "Relacionamento interpessoal"])
        elif "COMUNIC" in q:
            por_qualidade.extend(["Comunicação eficaz", "Comunicação assertiva", "Escuta ativa"])
        elif "EXECU" in q:
            por_qualidade.extend(["Produtividade", "Disciplina", "Proatividade"])
        elif "ORGANIZ" in q:
            por_qualidade.extend(["Organização", "Gestão do tempo", "Atenção / foco"])
        elif "RELACIONAM" in q:
            por_qualidade.extend(["Relacionamento interpessoal", "Empatia", "Trabalho em equipe"])
        elif "SERVIC" in q:
            por_qualidade.extend(["Colaboração", "Trabalho em equipe", "Empatia"])
        elif "VERSATIL" in q:
            por_qualidade.extend(["Adaptabilidade / flexibilidade", "Resiliência", "Proatividade"])
        elif "INTUIC" in q:
            por_qualidade.extend(["Visão sistêmica", "Inteligência emocional", "Criatividade"])
        elif "JUSTIC" in q:
            por_qualidade.extend(["Ética / responsabilidade", "Tomada de decisão", "Inteligência emocional"])
        elif "DISCIPLIN" in q:
            por_qualidade.extend(["Disciplina", "Pontualidade", "Gestão do tempo"])

        if "INICIAT" in m or "PIONEIR" in m or "PIONIER" in m:
            por_matriz.extend(["Proatividade", "Liderança", "Inovação / melhoria contínua"])
        elif "INOVAC" in m:
            por_matriz.extend(["Criatividade", "Inovação / melhoria contínua", "Visão sistêmica"])
        elif "COLABOR" in m or "COOPER" in m:
            por_matriz.extend(["Colaboração", "Empatia", "Trabalho em equipe"])
        elif "CONHEC" in m or "INTELECT" in m:
            por_matriz.extend(["Aprendizado contínuo", "Visão sistêmica", "Pensamento crítico"])
        elif "ANALIS" in m or "PERIC" in m or "PERSPIC" in m or "SELETIV" in m:
            por_matriz.extend(["Pensamento crítico", "Resolução de problemas", "Atenção / foco"])
        elif "ENTUSIAS" in m or "COMUNIC" in m or "EXPRESS" in m:
            por_matriz.extend(["Comunicação eficaz", "Comunicação assertiva", "Escuta ativa"])
        elif "PERSUAS" in m:
            por_matriz.extend(["Comunicação assertiva", "Comunicação eficaz", "Proatividade"])
        elif "DIPLOMAC" in m or "HABILID" in m:
            por_matriz.extend(["Escuta ativa", "Relacionamento interpessoal", "Inteligência emocional"])
        elif "RESPONSAB" in m:
            por_matriz.extend(["Ética / responsabilidade", "Disciplina", "Pontualidade"])
        elif "DETERMIN" in m or "PERSIST" in m or "VONTAD" in m or "CORAG" in m:
            por_matriz.extend(["Resiliência", "Proatividade", "Disciplina"])

        selecionadas = []

        def add_unique(sk):
            if sk and sk not in selecionadas:
                selecionadas.append(sk)

        if por_perfil:
            add_unique(por_perfil[0])
        if por_categoria:
            add_unique(por_categoria[0])
        if por_qualidade:
            add_unique(por_qualidade[0])
        if por_matriz:
            add_unique(por_matriz[0])

        if len(por_categoria) > 1:
            add_unique(por_categoria[1])
        if len(por_qualidade) > 1:
            add_unique(por_qualidade[1])
        if len(por_matriz) > 1:
            add_unique(por_matriz[1])
        if len(por_perfil) > 1:
            add_unique(por_perfil[1])

        for s in por_matriz + por_categoria + por_qualidade + por_perfil:
            add_unique(s)

        if not selecionadas:
            if "REPETICAO" in cp:
                selecionadas = ["Pensamento crítico", "Resolução de problemas", "Atenção / foco"]
            else:
                selecionadas = ["Adaptabilidade / flexibilidade", "Trabalho em equipe", "Proatividade"]

        return ", ".join(selecionadas[:3])

    for campo_q in colunas_score:
        val_q = valores_originais_score.get(campo_q)
        if val_q is None:
            continue
        qual_en = ""
        p_v = ""
        c_v = ""
        attr_t_q = ""
        if campo_q in mapa_col_matriz:
            row_m_q = MATRIZ_DB.get(str(val_q))
            if row_m_q:
                attr_t_q = str(get_from_row(row_m_q, campo_q) or "").strip().upper()
            if (not attr_t_q or attr_t_q == "NAN") and str(val_q).isdigit() and int(val_q) > 9:
                num_reduz = sum(int(d) for d in str(val_q))
                while num_reduz > 9:
                    num_reduz = sum(int(d) for d in str(num_reduz))
                row_m_reduz = MATRIZ_DB.get(str(num_reduz))
                if row_m_reduz:
                    attr_t_q = str(get_from_row(row_m_reduz, campo_q) or "").strip().upper()
            if attr_t_q and attr_t_q != "NAN":
                ai_q = ATRIBUTOS_DB.get(attr_t_q) or ATRIBUTOS_DB.get(remover_acentos(attr_t_q).upper().strip())
                if ai_q:
                    p_v = str(get_from_row(ai_q, "perfil") or "").strip()
                    c_v = str(get_from_row(ai_q, "categoria") or "").strip()
                    qual_en = str(
                        get_from_row(ai_q, "area de suporte")
                        or get_from_row(ai_q, "qualidade")
                        or get_from_row(ai_q, "qualidades")
                        or ""
                    ).strip()
        else:
            ri_q = REPETICAO_DB.get(str(val_q))
            if ri_q:
                p_v = str(get_from_row(ri_q, "perfil") or "").strip()
                c_v = str(get_from_row(ri_q, "categoria") or "").strip()
                qual_en = str(
                    get_from_row(ri_q, "area de suporte")
                    or get_from_row(ri_q, "qualidade")
                    or ""
                ).strip()
            attr_t_q = "Tabela Repetição"

        if qual_en and qual_en.upper() != "NAN":
            qn = remover_acentos(str(qual_en).strip()).upper()
            for idx_name in score_qual_df.index:
                if remover_acentos(idx_name).upper() == qn:
                    score_qual_df.at[idx_name, campo_q] += int(PESO_DB.get(campo_q, 1))
                    break

        attr_display = attr_t_q if (attr_t_q and attr_t_q != "NAN") else ""
        p_clean = "" if (p_v.upper() in ("N/A", "NAN") or not p_v) else str(p_v)
        c_clean = "" if (c_v.upper() in ("N/A", "NAN") or not c_v) else str(c_v)
        q_clean = "" if (qual_en.upper() in ("N/A", "NAN") or not qual_en) else str(qual_en)
        soft_skills_str = determinar_soft_skills_linha(p_clean, c_clean, q_clean, attr_display, campo_q)

        dados_auditoria_qual.append(
            {
                "Campo": campo_q,
                "campo": campo_q,
                "Valor": str(val_q),
                "valor": str(val_q),
                "Matriz": attr_display,
                "Atributo": attr_display,
                "atributo": attr_display,
                "Perfil": p_clean,
                "perfil": p_clean,
                "Categoria": c_clean,
                "categoria": c_clean,
                "Qualidade": q_clean,
                "qualidade": q_clean,
                "Soft Skills": soft_skills_str,
                "soft_skills": soft_skills_str,
            }
        )

    score_qual_df["TOTAL"] = score_qual_df.sum(axis=1)

    dados_perfil = []

    def add_row_perfil_split(campo, valor, descricao):
        desc_limpa = (
            str(descricao or "")
            .replace("<b>", "")
            .replace("</b>", "")
            .replace("<br>", " | ")
        )
        dados_perfil.append(
            {
                "Campo": campo,
                "Valor": str(valor or ""),
                "Descricao": str(descricao or ""),
                "Resultado": f"{valor} - {desc_limpa}" if desc_limpa else str(valor or ""),
            }
        )

    k_data = KAN_DB.get(str(kan), {"kan": str(kan), "descricao": ""})
    add_row_perfil_split("KAN", k_data["kan"], k_data["descricao"])

    totais_s = score_df_calc["TOTAL"].sort_values(ascending=False)
    perfis_escolhidos = []
    if not totais_s[totais_s > 0].empty:
        max_s = totais_s.iloc[0]
        for p, s in totais_s[totais_s > 0].items():
            if max_s / s <= 1.8:
                perfis_escolhidos.append(p)
            else:
                break

    perfil_val = ", ".join(str(x) for x in perfis_escolhidos if x is not None)
    p_desc_list = []
    for p in perfis_escolhidos:
        d = ""
        pn = remover_acentos(p).upper()
        for k_desc, v_desc in PERFIL_DESCRICAO_DB.items():
            if k_desc and remover_acentos(k_desc).upper() == pn:
                d = v_desc
                break
        if d:
            p_desc_list.append(d)
    add_row_perfil_split("Perfil", perfil_val, " | ".join(p_desc_list))

    totais_cat = score_cat_df["TOTAL"].sort_values(ascending=False)
    cat_sel = totais_cat.index[0] if not totais_cat.empty else "Realizador"
    cat_d = ""
    cn = remover_acentos(cat_sel).upper() if cat_sel else ""
    if cn:
        for k_desc, v_desc in CATEGORIA_DESCRICAO_DB.items():
            if k_desc and remover_acentos(k_desc).upper() == cn:
                cat_d = v_desc
                break
    add_row_perfil_split("Categoria", cat_sel, cat_d)

    campos_para_dif = [
        extract_num(motivacao),
        extract_num(impressao),
        extract_num(expressao),
        extract_num(destino),
        extract_num(missao),
        str(nascimento[0]),
        str(triangulo_base),
        str(num_psiquico),
    ]
    dif_ativos = []
    dif_d_list = []
    for v_dif in ["11", "22"]:
        if v_dif in campos_para_dif:
            d_dif = DIFERENCIAIS_DESC_DB.get(v_dif)
            if d_dif:
                dif_val = d_dif.get("diferencial")
                if dif_val:
                    dif_ativos.append(dif_val)
                    dif_d_list.append(f"{dif_val}: {d_dif.get('descricao') or ''}")
    if dif_ativos:
        add_row_perfil_split(
            "Diferenciais", ", ".join(dif_ativos), " | ".join(dif_d_list)
        )

    totais_q = score_qual_df["TOTAL"].sort_values(ascending=False)
    q_escolhidas = list(totais_q[totais_q > 0].index)[:2]
    q_d_list = []
    for q in q_escolhidas:
        d = ""
        qn = remover_acentos(q).upper()
        for k_desc, v_desc in QUALIDADES_DB.items():
            if k_desc and remover_acentos(k_desc).upper() == qn:
                d = v_desc
                break
        if d:
            q_d_list.append(f"{q}: {d}")
    add_row_perfil_split("Qualidades", ", ".join(q_escolhidas), " | ".join(q_d_list))

    f_data = FORTALEZAS_DB.get(
        str(triangulo_base), {"fortaleza": "N/E", "descricao": ""}
    )
    add_row_perfil_split(
        "Fortaleza", f_data.get("fortaleza", "N/E"), f_data.get("descricao", "")
    )

    d_data = DESAFIOS_DB.get(str(nascimento[0]), {"desafio": "N/E", "descricao": ""})
    add_row_perfil_split(
        "Risco Comportamental",
        d_data.get("desafio", "N/E"),
        d_data.get("descricao", ""),
    )

    return (
        dados,
        dados_perfil,
        kan,
        estrutural,
        direcionamento,
        rep1,
        repeticao_mapa,
        repeticao_2_mapa,
        repeticao_3_mapa,
        score_df_calc.to_dict(orient="index"),
        score_cat_df.to_dict(orient="index"),
        score_qual_df.to_dict(orient="index"),
        dados_auditoria_qual,
    )


def obter_detalhamento_atributos_talento(nome: str, data_nascimento: str) -> list:
    """Executa o processamento do perfil e retorna a tabela Detalhamento dos Atributos."""
    try:
        import datetime

        s = str(data_nascimento or "").strip()
        nasc_tuple = (7, 3, 1971)
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                dt = datetime.datetime.strptime(s, fmt)
                nasc_tuple = (dt.day, dt.month, dt.year)
                break
            except ValueError:
                continue
        hoje = datetime.date.today()
        data_atual_tuple = (hoje.day, hoje.month, hoje.year)
        res = realizar_calculos_completos(nome, nasc_tuple, data_atual_tuple, "", "")
        return res[12] if res and len(res) > 12 else []
    except Exception:
        return []
