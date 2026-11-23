import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple

from services.numerologia import (
    reduce_number,
    calcular_numeros_nome,
    calcular_ciclos_vida,
    calcular_momentos_decisivos,
    calcular_desafios,
    calcular_triangulo_vida,
)


def remover_acentos(s: Any) -> str:
    if s is None:
        return ""
    return "".join(
        c
        for c in unicodedata.normalize("NFD", str(s))
        if unicodedata.category(c) != "Mn"
    )


def normalizar_termo(t: Any) -> str:
    s = remover_acentos(t).lower().strip()
    s = re.sub(r"\s+", "", s)
    s = s.replace("numero", "no").replace("º", "")
    return s


def clean_str(val: Any, fallback: str = "") -> str:
    if val is None:
        return fallback
    s = str(val).strip()
    if not s or s.lower() in ("nan", "none", "null"):
        return fallback
    return s


DEFAULT_MAP_PERFIL_EIXO: Dict[str, str] = {
    "lider": "Liderança",
    "criativo": "Criação",
    "executor": "Resultado",
    "vendedor": "Relacionamento",
    "influenciador": "Empatia",
    "comunicador": "Comunicação",
    "resultado": "Resultado",
    "analitico": "Análise",
    "analytical": "Análise",
    "empatico": "Empatia",
    "empathic": "Empatia",
    "executivo": "Resultado",
    "executive": "Resultado",
    "dinamico": "Flexibilidade",
    "dynamic": "Flexibilidade",
    "colaborativo": "Liderança",
    "collaborative": "Liderança",
    "estabilizador": "Organização",
    "stabilizer": "Organização",
}

DEFAULT_MAP_CAT_EIXO: Dict[str, str] = {
    "justo": "Empatia",
    "inovador": "Criação",
    "visionario": "Criação",
    "diplomatico": "Relacionamento",
    "realizador": "Resultado",
    "expansivo": "Comunicação",
    "versatil": "Flexibilidade",
    "planejador": "Resultado",
    "magnetico": "Relacionamento",
    "pratico": "Organização",
    "analitico": "Análise",
    "organizado": "Organização",
    "financeiro": "Resultado",
    "acabativo": "Resultado",
    "comunicativo": "Comunicação",
    "intuitivo": "Criação",
    "harmonico": "Relacionamento",
    "conhecimento": "Análise",
    "execucaoefoco": "Resultado",
    "planejamentoeestrutura": "Organização",
    "organizacaoemetodo": "Organização",
    "qualidadeepadrao": "Análise",
    "precisaoecontrole": "Análise",
    "analiseediagnostico": "Análise",
    "inovacaoecriatividade": "Criação",
    "adaptacaoeflexibilidade": "Flexibilidade",
    "comunicacaoeconexao": "Comunicação",
    "relacionamentoeparceria": "Relacionamento",
    "empatiaesuporte": "Empatia",
    "colaboracaoesinergia": "Liderança",
    "liderancaeinfluencia": "Liderança",
    "desenvolvimentoementoria": "Liderança",
    "visaoefuturo": "Criação",
    "estrategiaedecisao": "Liderança",
    "iniciativaeautonomia": "Flexibilidade",
    "resilienciaeequilibrio": "Flexibilidade",
    "compromissoeentrega": "Resultado",
}

EIXOS_CONFIG = [
    {
        "nome": "Criação",
        "icon_class": "icon-lightbulb",
        "icon_color": "#38bdf8",
        "desc": "Inovação, ideação e visão de futuro",
    },
    {
        "nome": "Liderança",
        "icon_class": "icon-crown",
        "icon_color": "#fbbf24",
        "desc": "Direcionamento, autoridade e tomada de decisão",
    },
    {
        "nome": "Resultado",
        "icon_class": "icon-target",
        "icon_color": "#34d399",
        "desc": "Execução, foco em metas e tração operacional",
    },
    {
        "nome": "Relacionamento",
        "icon_class": "icon-users",
        "icon_color": "#a78bfa",
        "desc": "Conexão interpessoal, diplomacia e parceria",
    },
    {
        "nome": "Análise",
        "icon_class": "icon-search",
        "icon_color": "#60a5fa",
        "desc": "Pensamento crítico, rigor técnico e dados",
    },
    {
        "nome": "Empatia",
        "icon_class": "icon-heart",
        "icon_color": "#f472b6",
        "desc": "Escuta ativa, acolhimento e inteligência emocional",
    },
    {
        "nome": "Comunicação",
        "icon_class": "icon-message-square",
        "icon_color": "#22d3ee",
        "desc": "Expressão verbal, persuasão e engajamento",
    },
    {
        "nome": "Organização",
        "icon_class": "icon-layers",
        "icon_color": "#818cf8",
        "desc": "Processos, disciplina e governança estrutural",
    },
    {
        "nome": "Flexibilidade",
        "icon_class": "icon-refresh-cw",
        "icon_color": "#fb923c",
        "desc": "Adaptabilidade, agilidade e gestão de mudanças",
    },
]

COLUNAS_SCORE = [
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

PERFIS_PADRAO = [
    "Líder",
    "Criativo",
    "Executor",
    "Resultado",
    "Vendedor",
    "Influenciador",
    "Comunicador",
]

CATEGORIAS_PADRAO = [
    "Visionário",
    "Realizador",
    "Inovador",
    "Conhecimento",
    "Harmônico",
    "Analítico",
    "Diplomático",
    "Empático",
    "Comunicativo",
    "Magnético",
    "Organizado",
    "Justo",
    "Versátil",
    "Intuitivo",
]

DEFAULT_PESOS_PERFIL: Dict[str, int] = {
    "Motivação": 150,
    "Impressão": 150,
    "Expressão": 300,
    "Destino": 150,
    "Missão": 300,
    "Dia Natalício": 150,
    "Triângulo": 150,
    "No Psiquico": 100,
    "Estrutural": 0,
    "Direcionamento": 0,
    "REPETIÇÃO 1": 100,
    "REPETIÇÃO 2": 100,
}

DEFAULT_PESOS_CATEGORIA: Dict[str, int] = {
    "Motivação": 150,
    "Impressão": 150,
    "Expressão": 300,
    "Destino": 150,
    "Missão": 300,
    "Dia Natalício": 150,
    "Triângulo": 150,
    "No Psiquico": 100,
    "Estrutural": 0,
    "Direcionamento": 0,
    "REPETIÇÃO 1": 100,
    "REPETIÇÃO 2": 100,
}


def parse_birth_date_parts(dt_str: Any) -> Tuple[int, int, int]:
    clean = clean_str(dt_str, "01/01/1990")
    if "/" in clean:
        parts = clean.split("/")
        d = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1
        m = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
        y = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 1990
        return d, m, y
    if "-" in clean:
        parts = clean.split("-")
        y = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1990
        m = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
        d = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 1
        return d, m, y
    return 1, 1, 1990


def _calcular_triangulo_base_int(nome: str) -> int:
    try:
        linhas = calcular_triangulo_vida(nome)
        if linhas and len(linhas[-1]) > 0:
            return int(linhas[-1][0])
    except Exception:
        pass
    return 1


def _resolve_peso(pesos_map: Dict[str, Any], campo: str, default_val: int) -> int:
    if campo in pesos_map:
        try:
            return int(float(pesos_map[campo]))
        except Exception:
            pass
    c_norm = normalizar_termo(campo)
    for k, v in pesos_map.items():
        if normalizar_termo(k) == c_norm:
            try:
                return int(float(v))
            except Exception:
                pass
    return default_val


def _map_campo_to_key(campo: str) -> Optional[str]:
    c_norm = normalizar_termo(campo)
    mapping = {
        "motivacao": "motivacao",
        "impressao": "impressao",
        "expressao": "expressao",
        "destino": "destino",
        "missao": "missao",
        "dianatalicio": "dia_natalicio",
        "triangulo": "triangulo",
        "nopsiquico": "psiquico",
        "psiquico": "psiquico",
        "estrutural": "estrutural",
        "direcionamento": "direcionamento",
        "repeticao1": "repeticao_1",
        "repeticao2": "repeticao_2",
        "repeticaomapa": "repeticao_2",
    }
    return mapping.get(c_norm)


def calcular_score_perfis_e_categorias(
    detalhes: List[Dict[str, Any]],
    pesos_perfil_custom: Optional[Dict[str, Any]] = None,
    pesos_cat_custom: Optional[Dict[str, Any]] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    pesos_p = dict(DEFAULT_PESOS_PERFIL)
    if pesos_perfil_custom:
        for k, v in pesos_perfil_custom.items():
            try:
                pesos_p[str(k).strip()] = int(float(v))
            except Exception:
                pass

    pesos_c = dict(DEFAULT_PESOS_CATEGORIA)
    if pesos_cat_custom:
        for k, v in pesos_cat_custom.items():
            try:
                pesos_c[str(k).strip()] = int(float(v))
            except Exception:
                pass

    perfis_ordem = [
        "Lider",
        "Resultado",
        "Executor",
        "Criativo",
        "Comunicador",
        "Influenciador",
        "Vendedor",
    ]
    perf_rows: Dict[str, Dict[str, Any]] = {}
    for p in perfis_ordem:
        perf_rows[p] = {
            "perfil": p,
            "motivacao": 0,
            "impressao": 0,
            "expressao": 0,
            "destino": 0,
            "missao": 0,
            "dia_natalicio": 0,
            "triangulo": 0,
            "psiquico": 0,
            "estrutural": 0,
            "direcionamento": 0,
            "repeticao_1": 0,
            "repeticao_2": 0,
            "repeticao": 0,
            "total": 0,
        }

    cat_rows: Dict[str, Dict[str, Any]] = {}
    for c in CATEGORIAS_PADRAO:
        cat_rows[c] = {
            "categoria": c,
            "motivacao": 0,
            "impressao": 0,
            "expressao": 0,
            "destino": 0,
            "missao": 0,
            "dia_natalicio": 0,
            "triangulo": 0,
            "psiquico": 0,
            "estrutural": 0,
            "direcionamento": 0,
            "repeticao_1": 0,
            "repeticao_2": 0,
            "repeticao": 0,
            "total": 0,
        }

    for item in detalhes or []:
        campo = clean_str(item.get("campo") or item.get("Campo"))
        col_key = _map_campo_to_key(campo)
        if not col_key:
            continue

        peso_p = _resolve_peso(pesos_p, campo, DEFAULT_PESOS_PERFIL.get(campo, 0))
        peso_c = _resolve_peso(pesos_c, campo, DEFAULT_PESOS_CATEGORIA.get(campo, peso_p))

        perf_raw = clean_str(item.get("perfil") or item.get("Perfil"))
        if perf_raw and perf_raw != "N/D":
            p_norm = normalizar_termo(perf_raw)
            for p_name in perfis_ordem:
                if normalizar_termo(p_name) == p_norm:
                    perf_rows[p_name][col_key] += peso_p
                    if col_key in ("repeticao_1", "repeticao_2"):
                        perf_rows[p_name]["repeticao"] += peso_p
                    perf_rows[p_name]["total"] += peso_p
                    break

        cat_raw = clean_str(item.get("categoria") or item.get("Categoria"))
        if cat_raw and cat_raw != "N/D":
            c_norm = normalizar_termo(cat_raw)
            for c_name in CATEGORIAS_PADRAO:
                if normalizar_termo(c_name) == c_norm:
                    cat_rows[c_name][col_key] += peso_c
                    if col_key in ("repeticao_1", "repeticao_2"):
                        cat_rows[c_name]["repeticao"] += peso_c
                    cat_rows[c_name]["total"] += peso_c
                    break

    perf_list = sorted(perf_rows.values(), key=lambda x: x["total"], reverse=True)
    cat_list = sorted(cat_rows.values(), key=lambda x: x["total"], reverse=True)
    return perf_list, cat_list


def calcular_diagnostico_ampliado_membro(
    nome_membro: str,
    data_nascimento: str,
    tables: Dict[str, Any],
    val_row: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    val_row = val_row or {}
    day, month, year = parse_birth_date_parts(data_nascimento)

    res_nome = calcular_numeros_nome(nome_membro)
    if isinstance(res_nome, dict):
        expressao = int(res_nome.get("expressao") or 1)
        motivacao = int(res_nome.get("motivacao") or 1)
        impressao = int(res_nome.get("impressao") or 1)
    else:
        expressao, motivacao, impressao = int(res_nome[0]), int(res_nome[1]), int(res_nome[2])

    destino_total = sum(int(ch) for ch in f"{day}{month}{year}" if ch.isdigit())
    destino = reduce_number(destino_total)
    missao = reduce_number(destino + expressao)
    num_psiquico = reduce_number(day)
    triangulo_base = _calcular_triangulo_base_int(nome_membro)

    ciclos_vida = calcular_ciclos_vida(day, month, year, destino)
    momentos_decisivos = calcular_momentos_decisivos(day, month, year, ciclos_vida)
    desafios = calcular_desafios(day, month, year)
    if isinstance(desafios, dict):
        desafio1 = int(desafios.get("desafio1") or 0)
        desafio2 = int(desafios.get("desafio2") or 0)
        desafio_principal = int(desafios.get("desafio_principal") or 0)
    else:
        desafio1, desafio2, desafio_principal = int(desafios[0]), int(desafios[1]), int(desafios[2])

    c1_num = int((ciclos_vida.get("ciclo1") or {}).get("numero", 1))
    c2_num = int((ciclos_vida.get("ciclo2") or {}).get("numero", 1))
    c3_num = int((ciclos_vida.get("ciclo3") or {}).get("numero", 1))
    m1_num = int((momentos_decisivos.get("momento1") or {}).get("numero", 1))
    m2_num = int((momentos_decisivos.get("momento2") or {}).get("numero", 1))
    m3_num = int((momentos_decisivos.get("momento3") or {}).get("numero", 1))
    m4_num = int((momentos_decisivos.get("momento4") or {}).get("numero", 1))

    estrutural = reduce_number(motivacao + impressao + expressao + reduce_number(day))
    direcionamento = reduce_number(destino + missao + c2_num + m3_num)
    kan_num = reduce_number(estrutural + direcionamento)

    # REPETIÇÃO 1
    nums_rep1 = [
        motivacao,
        impressao,
        expressao,
        destino,
        missao,
        day,
        triangulo_base,
        num_psiquico,
    ]
    counts1: Dict[int, int] = {}
    for n in nums_rep1:
        counts1[n] = counts1.get(n, 0) + 1
    reps1 = sorted(
        [(n, c) for n, c in counts1.items() if c >= 2],
        key=lambda x: (-x[1], x[0]),
    )
    rep1_str = str(reps1[0][0]) if reps1 else ""

    # REPETIÇÃO 2
    todos_numeros_mapa = [
        expressao,
        motivacao,
        impressao,
        destino,
        missao,
        day,
        desafio1,
        desafio2,
        desafio_principal,
        c1_num,
        c2_num,
        c3_num,
        m1_num,
        m2_num,
        m3_num,
        m4_num,
        num_psiquico,
        triangulo_base,
    ]
    counts_total: Dict[int, int] = {}
    for n in todos_numeros_mapa:
        counts_total[n] = counts_total.get(n, 0) + 1
    reps_total = sorted(counts_total.items(), key=lambda x: (-x[1], x[0]))
    _rep2_str = str(reps_total[0][0]) if reps_total else ""

    valores_score_map: Dict[str, str] = {
        "Motivação": str(motivacao),
        "Impressão": str(impressao),
        "Expressão": str(expressao),
        "Destino": str(destino),
        "Missão": str(missao),
        "Dia Natalício": str(day),
        "Triângulo": str(triangulo_base),
        "No Psiquico": str(num_psiquico),
        "Estrutural": str(estrutural),
        "Direcionamento": str(direcionamento),
        "REPETIÇÃO 1": rep1_str,
        "REPETIÇÃO 2": "",
    }

    atributos_ampliado = tables.get("atributosAmpliado") or []
    perfil_categoria_ampliado = tables.get("perfilCategoriaAmpliado") or []
    forcas_centrais = tables.get("forcasCentrais") or []
    riscos_ampliado = tables.get("riscosAmpliado") or []
    qualidades_db = tables.get("qualidadesDb") or {}
    map_perfil_eixo = dict(DEFAULT_MAP_PERFIL_EIXO)
    map_perfil_eixo.update(tables.get("mapPerfilEixo") or {})
    map_cat_eixo = dict(DEFAULT_MAP_CAT_EIXO)
    map_cat_eixo.update(tables.get("mapCatEixo") or {})
    peso_db = dict(DEFAULT_PESOS_PERFIL)
    for k, v in (tables.get("pesoDb") or {}).items():
        try:
            peso_db[str(k)] = int(float(v))
        except Exception:
            pass
    peso_cat_db = dict(DEFAULT_PESOS_CATEGORIA)
    for k, v in (tables.get("pesoCategoriaDb") or {}).items():
        try:
            peso_cat_db[str(k)] = int(float(v))
        except Exception:
            pass
    kans_db = tables.get("kansDb") or {}
    repeticao_db = tables.get("repeticaoDb") or {}
    soft_skills_descricoes = tables.get("softSkillsDescricoes") or {}

    score_perf_matrix: Dict[str, Dict[str, int]] = {
        p: {**{c: 0 for c in COLUNAS_SCORE}, "TOTAL": 0} for p in PERFIS_PADRAO
    }
    score_cat_matrix: Dict[str, Dict[str, int]] = {
        cat: {**{c: 0 for c in COLUNAS_SCORE}, "TOTAL": 0} for cat in CATEGORIAS_PADRAO
    }

    detalhes_atributos_list: List[Dict[str, str]] = []
    eixo_enc = ""

    for campo_nome in COLUNAS_SCORE:
        val_num = valores_score_map.get(campo_nome, "")
        if not val_num:
            continue

        attr_encontrado = ""
        perfil_enc = ""
        cat_enc = ""
        pol_enc = "POSITIVA"
        area_sup_enc = ""
        soft_sk_enc = ""
        risco_enc = ""

        c_norm = normalizar_termo(campo_nome)
        matched_row = None
        for r in atributos_ampliado:
            if (
                normalizar_termo(r.get("campo") or r.get("Campo")) == c_norm
                and clean_str(r.get("resultado") or r.get("Resultado")) == val_num
            ):
                matched_row = r
                break

        if not matched_row and val_num in ("11", "22", "33"):
            val_red = str(sum(int(d) for d in val_num))
            for r in atributos_ampliado:
                if (
                    normalizar_termo(r.get("campo") or r.get("Campo")) == c_norm
                    and clean_str(r.get("resultado") or r.get("Resultado")) == val_red
                ):
                    matched_row = r
                    break

        if matched_row:
            attr_encontrado = clean_str(
                matched_row.get("atributos") or matched_row.get("ATRIBUTOS")
            )
            perfil_enc = clean_str(
                matched_row.get("perfil") or matched_row.get("PERFIL")
            )
            cat_enc = clean_str(
                matched_row.get("categoria") or matched_row.get("CATEGORIA")
            )
            pol_enc = clean_str(
                matched_row.get("polaridade") or matched_row.get("POLARIDADE"),
                "POSITIVA",
            )
            area_sup_enc = clean_str(
                matched_row.get("area_de_suporte") or matched_row.get("AREA DE SUPORTE")
            )
            eixo_enc = clean_str(matched_row.get("eixo") or matched_row.get("Eixo"))
            soft_sk_enc = clean_str(
                matched_row.get("soft_skills") or matched_row.get("Soft Skills")
            )
            risco_enc = clean_str(
                matched_row.get("risco_prioritario")
                or matched_row.get("Risco Prioritário")
            )

        if not perfil_enc:
            r_rep = repeticao_db.get(val_num)
            if r_rep:
                perfil_enc = ""
                cat_enc = ""
                if not attr_encontrado:
                    attr_encontrado = f"Repetição {val_num}"

        if not eixo_enc or eixo_enc == "N/D":
            if perfil_enc and normalizar_termo(perfil_enc) in map_perfil_eixo:
                eixo_enc = map_perfil_eixo[normalizar_termo(perfil_enc)]
            elif cat_enc and normalizar_termo(cat_enc) in map_cat_eixo:
                eixo_enc = map_cat_eixo[normalizar_termo(cat_enc)]

        peso_campo = int(peso_db.get(campo_nome, 0))
        peso_cat = int(peso_cat_db.get(campo_nome, peso_campo))

        if perfil_enc:
            p_clean = remover_acentos(perfil_enc).lower().strip()
            for idx_p in PERFIS_PADRAO:
                if remover_acentos(idx_p).lower().strip() == p_clean:
                    score_perf_matrix[idx_p][campo_nome] += peso_campo
                    break

        if cat_enc:
            c_clean = remover_acentos(cat_enc).lower().strip()
            for idx_c in CATEGORIAS_PADRAO:
                if remover_acentos(idx_c).lower().strip() == c_clean:
                    score_cat_matrix[idx_c][campo_nome] += peso_cat
                    break

        detalhes_atributos_list.append(
            {
                "Campo": campo_nome,
                "Valor": val_num,
                "Atributo Ampliado": attr_encontrado or "N/D",
                "Perfil": perfil_enc or "N/D",
                "Categoria": cat_enc or "N/D",
                "Eixo": eixo_enc or "N/D",
                "Polaridade": pol_enc or "POSITIVA",
                "Área de Suporte": area_sup_enc or "N/D",
                "Soft Skills": soft_sk_enc or "N/D",
                "Risco Prioritário": risco_enc or "N/D",
            }
        )

    perfil_top = "Líder"
    max_perf_score = -1
    for p in PERFIS_PADRAO:
        total_p = sum(score_perf_matrix[p][c] for c in COLUNAS_SCORE)
        score_perf_matrix[p]["TOTAL"] = total_p
        if total_p > max_perf_score:
            max_perf_score = total_p
            perfil_top = p

    cat_top = "Realizador"
    max_cat_score = -1
    for cat in CATEGORIAS_PADRAO:
        total_c = sum(score_cat_matrix[cat][c] for c in COLUNAS_SCORE)
        score_cat_matrix[cat]["TOTAL"] = total_c
        if total_c > max_cat_score:
            max_cat_score = total_c
            cat_top = cat

    perfil_predominante = f"{perfil_top} {cat_top}"

    desc_completa_txt = ""
    resumo_txt = ""
    forcas_txt = ""
    risco_prior_txt = ""
    desc_risco_txt = ""
    contexto_txt = ""

    chave_norm = normalizar_termo(perfil_predominante)
    matched_pc = None
    for r in perfil_categoria_ampliado:
        if (
            normalizar_termo(
                r.get("perfil_predominante") or r.get("PERFIL PREDOMINANTE")
            )
            == chave_norm
        ):
            matched_pc = r
            break

    if not matched_pc:
        p_w = normalizar_termo(perfil_top)
        c_w = normalizar_termo(cat_top)
        for r in perfil_categoria_ampliado:
            k = normalizar_termo(
                r.get("perfil_predominante") or r.get("PERFIL PREDOMINANTE")
            )
            if p_w in k and c_w in k:
                matched_pc = r
                break

    if matched_pc:
        desc_completa_txt = clean_str(
            matched_pc.get("descricao_completa")
            or matched_pc.get("DESCRIÇÃO COMPLETA")
        )
        resumo_txt = clean_str(matched_pc.get("resumo") or matched_pc.get("RESUMO"))
        forcas_txt = clean_str(
            matched_pc.get("forcas_centrais") or matched_pc.get("FORÇAS CENTRAIS")
        )
        risco_prior_txt = clean_str(
            matched_pc.get("risco_prioritario") or matched_pc.get("RISCO PRIORITÁRIO")
        )
        desc_risco_txt = clean_str(
            matched_pc.get("descricao_do_risco")
            or matched_pc.get("DESCRIÇÃO DO RISCO")
        )
        contexto_txt = clean_str(
            matched_pc.get("contexto_de_maior_aderencia")
            or matched_pc.get("CONTEXTO DE MAIOR ADERÊNCIA")
        )

    # KAN strictly 3 (CRIAÇÃO), 6 (MOVIMENTO), or 9 (FINALIDADE)
    kan_digit = reduce_number(kan_num)
    if kan_digit > 9:
        kan_digit = 9
    raw_kan_val = "3" if kan_digit in (1, 2, 3) else ("6" if kan_digit in (4, 5, 6) else "9")
    kan_map_titulos = {"3": "CRIAÇÃO", "6": "MOVIMENTO", "9": "FINALIDADE"}
    kan_nome = kan_map_titulos.get(raw_kan_val, "FINALIDADE")
    kan_key_num = "3" if kan_nome == "CRIAÇÃO" else ("6" if kan_nome == "MOVIMENTO" else "9")
    kan_data = kans_db.get(kan_key_num) or kans_db.get(raw_kan_val) or {}
    kan_desc = clean_str(kan_data.get("descricao"))
    if kan_desc:
        kan_desc = " ".join(
            l.strip().strip('"') for l in re.split(r"\r?\n", kan_desc) if l.strip()
        )
    else:
        if kan_nome == "CRIAÇÃO":
            kan_desc = "Estímulo para criar em qualquer área de atuação. Impulso a trazer novidades, diferenciais e evolução constante."
        elif kan_nome == "MOVIMENTO":
            kan_desc = "Trocas, interações e conexão de pontos. Propulsores de movimento e agilidade fundamentais para a eficiência da equipe."
        else:
            kan_desc = "Prazer em concluir atividades e ciclos. Foco contínuo que evita dispersão de energia e garante as entregas."

    maior_peso = max([300] + [int(v) for v in peso_db.values() if isinstance(v, (int, float))])

    eixos_lista = [e["nome"] for e in EIXOS_CONFIG]
    colunas_eixos_score = COLUNAS_SCORE + [
        "Perfil Predominante",
        "Categoria Predominante",
    ]
    score_eixos_matrix: Dict[str, Dict[str, int]] = {
        e_nome: {**{col: 0 for col in colunas_eixos_score}, "TOTAL": 0}
        for e_nome in eixos_lista
    }

    for d_item in detalhes_atributos_list:
        c_nome = d_item["Campo"]
        p_campo = int(peso_db.get(c_nome, 0))
        eixo_val = d_item["Eixo"]
        if eixo_val and eixo_val != "N/D":
            e_clean = remover_acentos(eixo_val).lower().strip()
            for e_nome in eixos_lista:
                if remover_acentos(e_nome).lower().strip() == e_clean:
                    score_eixos_matrix[e_nome][c_nome] += p_campo
                    break

    eixo_perfil_top = map_perfil_eixo.get(normalizar_termo(perfil_top), "")
    if not eixo_perfil_top:
        p_norm = normalizar_termo(perfil_top)
        for k_p, v_e in map_perfil_eixo.items():
            if k_p in p_norm or p_norm in k_p:
                eixo_perfil_top = v_e
                break

    eixo_cat_top = map_cat_eixo.get(normalizar_termo(cat_top), "")
    if not eixo_cat_top:
        c_norm = normalizar_termo(cat_top)
        for k_c, v_e in map_cat_eixo.items():
            if k_c in c_norm or c_norm in k_c:
                eixo_cat_top = v_e
                break

    if eixo_perfil_top:
        e_p_clean = remover_acentos(eixo_perfil_top).lower().strip()
        for e_nome in eixos_lista:
            if remover_acentos(e_nome).lower().strip() == e_p_clean:
                score_eixos_matrix[e_nome]["Perfil Predominante"] += maior_peso
                break

    if eixo_cat_top:
        e_c_clean = remover_acentos(eixo_cat_top).lower().strip()
        for e_nome in eixos_lista:
            if remover_acentos(e_nome).lower().strip() == e_c_clean:
                score_eixos_matrix[e_nome]["Categoria Predominante"] += maior_peso
                break

    score_eixos: Dict[str, int] = {}
    for e_nome in eixos_lista:
        total_e = sum(score_eixos_matrix[e_nome].get(col, 0) for col in colunas_eixos_score)
        score_eixos_matrix[e_nome]["TOTAL"] = total_e
        score_eixos[e_nome] = total_e

    score_soft_skills: Dict[str, int] = {}
    for d_item in detalhes_atributos_list:
        c_nome = d_item["Campo"]
        p_campo = int(peso_db.get(c_nome, 0))
        sk_val = d_item["Soft Skills"]
        if sk_val and sk_val != "N/D":
            for sk in sk_val.split(","):
                sk_clean = sk.strip()
                if sk_clean:
                    score_soft_skills[sk_clean] = (
                        score_soft_skills.get(sk_clean, 0) + p_campo
                    )

    sorted_skills = sorted(score_soft_skills.items(), key=lambda x: -x[1])
    soft_skills_detalhadas = []
    for sk_nome, sk_pts in sorted_skills:
        desc = (
            soft_skills_descricoes.get(sk_nome)
            or soft_skills_descricoes.get(normalizar_termo(sk_nome))
            or ""
        )
        if not desc:
            sk_norm = normalizar_termo(sk_nome)
            for k, v in soft_skills_descricoes.items():
                if k in sk_norm or sk_norm in k:
                    desc = v
                    break
        soft_skills_detalhadas.append(
            {
                "nome": sk_nome,
                "pontos": sk_pts,
                "descricao": desc
                or "Competência comportamental mapeada no perfil, impulsionando a eficiência operacional e a sinergia em equipe.",
            }
        )

    origens_eixos_list = []
    for d_item in detalhes_atributos_list:
        c_nome = d_item["Campo"]
        p_campo = int(peso_db.get(c_nome, 0))
        e_val = d_item["Eixo"]
        if e_val and e_val != "N/D":
            origens_eixos_list.append(
                {
                    "Eixo": e_val,
                    "Origem": f"Campo {c_nome}",
                    "Valor Mapa": d_item["Valor"],
                    "Atributo": d_item["Atributo Ampliado"],
                    "Perfil Mapeado": d_item["Perfil"],
                    "Categoria Mapeada": d_item["Categoria"],
                    "Pontos": p_campo,
                }
            )

    if eixo_perfil_top:
        origens_eixos_list.append(
            {
                "Eixo": eixo_perfil_top,
                "Origem": "Perfil Predominante",
                "Valor Mapa": "-",
                "Atributo": f"Perfil Predominante: {perfil_top}",
                "Perfil Mapeado": perfil_top,
                "Categoria Mapeada": "-",
                "Pontos": maior_peso,
            }
        )

    if eixo_cat_top:
        origens_eixos_list.append(
            {
                "Eixo": eixo_cat_top,
                "Origem": "Categoria Predominante",
                "Valor Mapa": "-",
                "Atributo": f"Categoria Predominante: {cat_top}",
                "Perfil Mapeado": "-",
                "Categoria Mapeada": cat_top,
                "Pontos": maior_peso,
            }
        )

    primeiro_nome = (nome_membro.strip().split() or [nome_membro])[0]
    kan_revisado_map = {
        "CRIAÇÃO": {
            "nomeCap": "Criação",
            "resumo": "representa a energia de geração de possibilidades, inovação aplicada, experimentação e transformação de ideias em melhorias.",
            "capacidades": "questionar padrões, conectar elementos aparentemente distantes e imaginar alternativas antes mesmo que um problema esteja completamente formulado. Essa energia favorece inovação, diferenciação, experimentação e evolução contínua de produtos, processos e formas de trabalho. Seu melhor desempenho aparece quando existe espaço para explorar, testar e aperfeiçoar ideias com critérios claros de valor.",
            "excesso": "Converter criatividade em execução priorizada, evitando dispersão, excesso de alternativas ou criações que não chegam à aplicação.",
        },
        "MOVIMENTO": {
            "nomeCap": "Movimento",
            "resumo": "representa a energia de conexão entre pessoas, informações, atividades e oportunidades, reduzindo silos e acelerando a cooperação.",
            "capacidades": "criar conexões, facilitar trocas, aproximar áreas e acelerar a comunicação entre diferentes pontos da organização. Atua como propulsor(a) de equipes, reduzindo silos, identificando dependências e transformando relações em cooperação, velocidade e eficiência. Essa energia é especialmente valiosa em ambientes dinâmicos, projetos interdisciplinares, mudanças organizacionais e situações que exigem articulação rápida.",
            "excesso": "Equilibrar movimento com foco, organização e conclusão, evitando dispersão, excesso de interação ou dificuldade de sustentar uma iniciativa até o resultado final.",
        },
        "FINALIDADE": {
            "nomeCap": "Finalidade",
            "resumo": "representa a energia de concentração de esforços, conclusão de ciclos, responsabilidade por entregas e foco em resultados.",
            "capacidades": "concluir atividades e encerrar ciclos, manter foco, evitar dispersão e concentrar energia em objetivos definidos. Essa orientação favorece persistência, responsabilidade e capacidade de conduzir entregas até o final. Seu melhor desempenho aparece quando existem metas claras, prioridades definidas, responsabilidades explícitas e critérios objetivos de conclusão.",
            "excesso": "Equilibrar persistência com flexibilidade, repriorização, delegação e capacidade de interromper ou redirecionar uma atividade quando o contexto exigir.",
        },
    }
    kan_rev = kan_revisado_map.get(kan_nome, kan_revisado_map["FINALIDADE"])
    kan_motivadores_texto = f"O KAN de {kan_rev['nomeCap']} {kan_rev['resumo']} {primeiro_nome} tende a {kan_rev['capacidades']}"

    raw_qual_str = clean_str(val_row.get("qualidades"))
    qual_terms: List[str] = []
    if raw_qual_str:
        for q in re.split(r"[,;|/]", raw_qual_str):
            qt = q.strip()
            if qt and qt not in qual_terms:
                qual_terms.append(qt)
    for d_item in detalhes_atributos_list:
        a_sup = clean_str(d_item.get("Área de Suporte"))
        if a_sup and a_sup != "N/D" and a_sup not in qual_terms:
            qual_terms.append(a_sup)

    qual_descs: List[str] = []
    for qt in qual_terms:
        desc_q = qualidades_db.get(qt) or qualidades_db.get(normalizar_termo(qt))
        if desc_q and desc_q not in qual_descs:
            qual_descs.append(desc_q)
    if not qual_descs:
        for fallback_q in ("Execução", "Análise", "Relacionamento"):
            d = qualidades_db.get(normalizar_termo(fallback_q))
            if d and d not in qual_descs:
                qual_descs.append(d)

    comportamentos_observaveis_txt = (
        " ".join(qual_descs[:4])
        or "Orientado a resultados, transforma objetivos em ações concretas com consistência, análise de contexto e colaboração com a equipe."
    )
    kan_motivadores_obj = {
        "texto": kan_motivadores_texto,
        "comportamentos_observaveis": comportamentos_observaveis_txt,
        "possivel_excesso": kan_rev["excesso"],
    }

    forcas_aplicadas_list: List[Dict[str, str]] = []
    added_forcas_norm = set()

    def try_add_forca(term: str):
        t_norm = normalizar_termo(term)
        if not t_norm or t_norm in added_forcas_norm:
            return
        found = None
        for f in forcas_centrais:
            if normalizar_termo(f.get("forca")) == t_norm:
                found = f
                break
        if not found:
            for f in forcas_centrais:
                fn = normalizar_termo(f.get("forca"))
                if fn and (fn in t_norm or t_norm in fn):
                    found = f
                    break
        if found:
            f_nome = clean_str(found.get("forca"))
            f_key = normalizar_termo(f_nome)
            if f_key not in added_forcas_norm:
                added_forcas_norm.add(f_key)
                forcas_aplicadas_list.append(
                    {
                        "forca": f_nome,
                        "como_aparece": clean_str(found.get("como_aparece")),
                        "valor_para_o_negocio": clean_str(
                            found.get("valor_para_o_negocio")
                        ),
                        "possivel_excesso": clean_str(found.get("possivel_excesso")),
                    }
                )

    raw_forcas_terms = [
        s.strip()
        for s in re.split(
            r"[,;]|\s+e\s+",
            (
                forcas_txt
                or "Liderança, resultados, execução, disciplina e persistência"
            ).replace(".", ""),
            flags=re.IGNORECASE,
        )
        if s.strip()
    ]
    for ft in raw_forcas_terms:
        try_add_forca(ft)

    sorted_eixos_entries = sorted(score_eixos.items(), key=lambda x: -x[1])
    for e_nome, _ in sorted_eixos_entries:
        if len(forcas_aplicadas_list) >= 5:
            break
        try_add_forca(e_nome)
    for sk_nome, _ in sorted_skills:
        if len(forcas_aplicadas_list) >= 5:
            break
        try_add_forca(sk_nome)

    r_prior_norm = normalizar_termo(risco_prior_txt)
    d_risco_norm = normalizar_termo(desc_risco_txt)
    matched_risco = None
    for r in riscos_ampliado:
        if (
            r_prior_norm and normalizar_termo(r.get("risco_prioritario")) == r_prior_norm
        ) or (
            d_risco_norm and normalizar_termo(r.get("descricao_do_risco")) == d_risco_norm
        ):
            matched_risco = r
            break
    if not matched_risco and r_prior_norm:
        for r in riscos_ampliado:
            rn = normalizar_termo(r.get("risco_prioritario"))
            if rn and (rn in r_prior_norm or r_prior_norm in rn):
                matched_risco = r
                break
    if not matched_risco:
        for d_item in detalhes_atributos_list:
            rp = normalizar_termo(d_item.get("Risco Prioritário"))
            if rp and rp != "n/d":
                for r in riscos_ampliado:
                    rn = normalizar_termo(r.get("risco_prioritario"))
                    if rn and (rn == rp or rp in rn):
                        matched_risco = r
                        break
                if matched_risco:
                    break

    mr = matched_risco or {}
    risco_comportamental_obj = {
        "risco": clean_str(mr.get("risco_prioritario"))
        or risco_prior_txt
        or "Centralização, sobrecarga operacional e baixa delegação.",
        "origem_provavel": clean_str(mr.get("origem_provavel"))
        or "Forte senso de responsabilidade pela entrega, padrão elevado de exigência e necessidade de controle de riscos.",
        "gatilhos": clean_str(mr.get("gatilhos"))
        or "Projetos críticos, pressão por prazos, percepção de baixa maturidade na execução alheia ou falta de alinhamento prévio.",
        "comportamentos_observaveis": clean_str(mr.get("comportamentos_observaveis"))
        or desc_risco_txt
        or "Assume tarefas operacionais diretamente, revisa excessivamente entregas e concentra decisões sob seu controle.",
        "impacto_potencial": clean_str(mr.get("impacto_potencial"))
        or "Sobrecarga da liderança, menor autonomia e escala da equipe e risco de gargalos decisórios.",
        "competencias_de_desenvolvimento": clean_str(
            mr.get("competencias_de_desenvolvimento")
        )
        or "Delegação estruturada, comunicação de expectativas, acompanhamento por checkpoints e desenvolvimento da equipe.",
    }

    return {
        "nome": nome_membro,
        "perfil_predominante": perfil_predominante,
        "resumo": resumo_txt
        or "Combina autoridade natural e foco implacável em entregas concretas.",
        "forcas": forcas_txt
        or "Liderança, resultados, execução, disciplina e persistência",
        "contexto": contexto_txt or "Projetos críticos, operações e implantação",
        "risco_prior": risco_prior_txt
        or "Pressão Excessiva por Resultados, Centralização e Microgestão",
        "desc_risco": desc_risco_txt
        or "Risco de esgotamento do time (burnout) e turnover por ritmo insustentável de cobrança, agravado por microgestão centralizadora e negligência no desenvolvimento e capacitação da equipe.",
        "kan_nome": kan_nome,
        "kan_desc": kan_desc,
        "desc_completa": desc_completa_txt,
        "score_eixos": score_eixos,
        "eixos_config": EIXOS_CONFIG,
        "sorted_skills": [[k, v] for k, v in sorted_skills],
        "soft_skills_detalhadas": soft_skills_detalhadas,
        "perfil_top": perfil_top,
        "cat_top": cat_top,
        "eixo_perfil_top": eixo_perfil_top,
        "eixo_cat_top": eixo_cat_top,
        "maior_peso": maior_peso,
        "kan_motivadores": kan_motivadores_obj,
        "forcas_aplicadas": forcas_aplicadas_list,
        "risco_comportamental": risco_comportamental_obj,
        "colunas_score": COLUNAS_SCORE,
        "colunas_eixos_score": colunas_eixos_score,
        "score_eixos_matrix": score_eixos_matrix,
        "origens_eixos_list": origens_eixos_list,
        "score_perf_matrix": score_perf_matrix,
        "score_cat_matrix": score_cat_matrix,
        "detalhes_atributos_list": detalhes_atributos_list,
    }
