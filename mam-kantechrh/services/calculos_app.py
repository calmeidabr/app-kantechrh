"""
Motor isolado de cálculos comportamentais, aderência, harmonia de grupo,
sinergia de departamento e Soft Skills no container `mam-kantechrh`.
Mantém todas as regras proprietárias e pesos fora do código-fonte do navegador (F12).
"""

import unicodedata
from typing import Any, Dict, List, Optional

EIXOS_COMPORTAMENTAIS = [
    "Liderança",
    "Relacionamento",
    "Criação",
    "Organização",
    "Flexibilidade",
    "Comunicação",
    "Análise",
    "Resultado",
    "Empatia",
]

SOFT_SKILLS_CATALOGO: List[Dict[str, Any]] = [
    {
        "id": 11,
        "nome": "Adaptabilidade / flexibilidade",
        "kan_relacionado": ["Movimento"],
        "perfis_relacionados": ["Criativo", "Vendedor"],
        "categorias_relacionadas": ["Versátil", "Inovador"],
        "qualidades_relacionadas": ["Versatilidade", "Intuição"],
        "eixo_principal": "Flexibilidade",
    },
    {
        "id": 26,
        "nome": "Aprendizado contínuo",
        "kan_relacionado": ["Criação"],
        "perfis_relacionados": ["Criativo", "Resultado"],
        "categorias_relacionadas": ["Conhecimento", "Inovador"],
        "qualidades_relacionadas": ["Versatilidade", "Análise"],
        "eixo_principal": "Análise",
    },
    {
        "id": 17,
        "nome": "Atenção / foco",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Resultado", "Executor"],
        "categorias_relacionadas": ["Analítico", "Organizado"],
        "qualidades_relacionadas": ["Análise", "Organização"],
        "eixo_principal": "Organização",
    },
    {
        "id": 7,
        "nome": "Colaboração",
        "kan_relacionado": ["Movimento"],
        "perfis_relacionados": ["Executor", "Resultado"],
        "categorias_relacionadas": ["Harmônico", "Realizador"],
        "qualidades_relacionadas": ["Coletividade", "Serviço"],
        "eixo_principal": "Relacionamento",
    },
    {
        "id": 2,
        "nome": "Comunicação assertiva",
        "kan_relacionado": ["Movimento"],
        "perfis_relacionados": ["Lider", "Comunicador"],
        "categorias_relacionadas": ["Justo", "Comunicativo"],
        "qualidades_relacionadas": ["Comunicação", "Justiça"],
        "eixo_principal": "Comunicação",
    },
    {
        "id": 1,
        "nome": "Comunicação eficaz",
        "kan_relacionado": ["Movimento"],
        "perfis_relacionados": ["Comunicador", "Lider"],
        "categorias_relacionadas": ["Comunicativo", "Diplomático"],
        "qualidades_relacionadas": ["Comunicação", "Relacionamento"],
        "eixo_principal": "Comunicação",
    },
    {
        "id": 21,
        "nome": "Criatividade",
        "kan_relacionado": ["Criação"],
        "perfis_relacionados": ["Criativo", "Vendedor"],
        "categorias_relacionadas": ["Inovador", "Visionário"],
        "qualidades_relacionadas": ["Intuição", "Versatilidade"],
        "eixo_principal": "Criação",
    },
    {
        "id": 15,
        "nome": "Disciplina",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Executor", "Resultado"],
        "categorias_relacionadas": ["Organizado", "Realizador"],
        "qualidades_relacionadas": ["Praticidade e disciplina", "Execução"],
        "eixo_principal": "Resultado",
    },
    {
        "id": 6,
        "nome": "Empatia",
        "kan_relacionado": ["Criação"],
        "perfis_relacionados": ["Influenciador", "Lider"],
        "categorias_relacionadas": ["Intuitivo", "Harmônico"],
        "qualidades_relacionadas": ["Intuição", "Relacionamento"],
        "eixo_principal": "Empatia",
    },
    {
        "id": 3,
        "nome": "Escuta ativa",
        "kan_relacionado": ["Criação"],
        "perfis_relacionados": ["Comunicador", "Influenciador"],
        "categorias_relacionadas": ["Diplomático", "Harmônico"],
        "qualidades_relacionadas": ["Comunicação", "Relacionamento"],
        "eixo_principal": "Relacionamento",
    },
    {
        "id": 24,
        "nome": "Ética / responsabilidade",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Lider", "Executor"],
        "categorias_relacionadas": ["Justo", "Harmônico"],
        "qualidades_relacionadas": ["Justiça", "Coletividade"],
        "eixo_principal": "Liderança",
    },
    {
        "id": 14,
        "nome": "Gestão do tempo",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Resultado", "Executor"],
        "categorias_relacionadas": ["Organizado", "Realizador"],
        "qualidades_relacionadas": ["Organização", "Praticidade e disciplina"],
        "eixo_principal": "Organização",
    },
    {
        "id": 22,
        "nome": "Inovação / melhoria contínua",
        "kan_relacionado": ["Criação", "Movimento"],
        "perfis_relacionados": ["Criativo", "Lider"],
        "categorias_relacionadas": ["Inovador", "Visionário"],
        "qualidades_relacionadas": ["Execução", "Intuição"],
        "eixo_principal": "Criação",
    },
    {
        "id": 9,
        "nome": "Inteligência emocional",
        "kan_relacionado": ["Criação", "Finalidade"],
        "perfis_relacionados": ["Lider", "Influenciador"],
        "categorias_relacionadas": ["Intuitivo", "Diplomático"],
        "qualidades_relacionadas": ["Intuição", "Relacionamento"],
        "eixo_principal": "Empatia",
    },
    {
        "id": 8,
        "nome": "Liderança",
        "kan_relacionado": ["Movimento", "Finalidade"],
        "perfis_relacionados": ["Lider", "Resultado"],
        "categorias_relacionadas": ["Visionário", "Realizador"],
        "qualidades_relacionadas": ["Execução", "Coletividade"],
        "eixo_principal": "Liderança",
    },
    {
        "id": 13,
        "nome": "Organização",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Executor"],
        "categorias_relacionadas": ["Organizado", "Analítico"],
        "qualidades_relacionadas": ["Organização", "Praticidade e disciplina"],
        "eixo_principal": "Organização",
    },
    {
        "id": 18,
        "nome": "Pensamento crítico",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Criativo", "Lider"],
        "categorias_relacionadas": ["Analítico", "Visionário"],
        "qualidades_relacionadas": ["Análise", "Intuição"],
        "eixo_principal": "Análise",
    },
    {
        "id": 16,
        "nome": "Pontualidade",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Executor"],
        "categorias_relacionadas": ["Organizado", "Justo"],
        "qualidades_relacionadas": ["Praticidade e disciplina", "Organização"],
        "eixo_principal": "Organização",
    },
    {
        "id": 12,
        "nome": "Proatividade",
        "kan_relacionado": ["Movimento"],
        "perfis_relacionados": ["Executor", "Resultado"],
        "categorias_relacionadas": ["Realizador", "Visionário"],
        "qualidades_relacionadas": ["Execução", "Praticidade e disciplina"],
        "eixo_principal": "Resultado",
    },
    {
        "id": 25,
        "nome": "Produtividade",
        "kan_relacionado": ["Movimento", "Finalidade"],
        "perfis_relacionados": ["Resultado", "Executor"],
        "categorias_relacionadas": ["Realizador", "Organizado"],
        "qualidades_relacionadas": ["Execução", "Praticidade e disciplina"],
        "eixo_principal": "Resultado",
    },
    {
        "id": 5,
        "nome": "Relacionamento interpessoal",
        "kan_relacionado": ["Movimento"],
        "perfis_relacionados": ["Influenciador", "Comunicador"],
        "categorias_relacionadas": ["Diplomático", "Harmônico"],
        "qualidades_relacionadas": ["Relacionamento", "Coletividade"],
        "eixo_principal": "Relacionamento",
    },
    {
        "id": 10,
        "nome": "Resiliência",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Executor", "Resultado"],
        "categorias_relacionadas": ["Realizador", "Versátil"],
        "qualidades_relacionadas": ["Execução", "Praticidade e disciplina"],
        "eixo_principal": "Resultado",
    },
    {
        "id": 19,
        "nome": "Resolução de problemas",
        "kan_relacionado": ["Finalidade", "Movimento"],
        "perfis_relacionados": ["Criativo", "Resultado"],
        "categorias_relacionadas": ["Analítico", "Realizador"],
        "qualidades_relacionadas": ["Execução", "Análise"],
        "eixo_principal": "Análise",
    },
    {
        "id": 20,
        "nome": "Tomada de decisão",
        "kan_relacionado": ["Finalidade"],
        "perfis_relacionados": ["Lider", "Resultado"],
        "categorias_relacionadas": ["Justo", "Visionário"],
        "qualidades_relacionadas": ["Execução", "Análise"],
        "eixo_principal": "Liderança",
    },
    {
        "id": 4,
        "nome": "Trabalho em equipe",
        "kan_relacionado": ["Movimento"],
        "perfis_relacionados": ["Influenciador", "Executor"],
        "categorias_relacionadas": ["Harmônico", "Versátil"],
        "qualidades_relacionadas": ["Coletividade", "Relacionamento"],
        "eixo_principal": "Relacionamento",
    },
    {
        "id": 23,
        "nome": "Visão sistêmica",
        "kan_relacionado": ["Finalidade", "Criação"],
        "perfis_relacionados": ["Lider", "Resultado"],
        "categorias_relacionadas": ["Visionário", "Analítico"],
        "qualidades_relacionadas": ["Análise", "Coletividade"],
        "eixo_principal": "Liderança",
    },
]


def _norm_text(s: str) -> str:
    if not s:
        return ""
    nfkd = unicodedata.normalize("NFKD", str(s))
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


def calcular_scores_eixos(t: Dict[str, Any]) -> Dict[str, int]:
    """Calcula a pontuação dos 9 eixos comportamentais para um talento."""
    tid = str(t.get("id") or "0")
    nome = str(t.get("nome") or "")
    kan_nome = str(t.get("kan_nome") or "")
    perfis_lista = [str(p) for p in (t.get("perfis_lista") or [])]
    categorias_lista = [str(c) for c in (t.get("categorias_lista") or [])]
    qualidades_lista = [str(q) for q in (t.get("qualidades_lista") or [])]

    last_char = ord(tid[-1]) if tid else 48
    seed = last_char * 11 + len(nome) * 17
    is_criacao = kan_nome == "Criação"
    is_movimento = kan_nome == "Movimento"
    is_finalidade = kan_nome == "Finalidade"

    return {
        "Liderança": 680 if "Lider" in perfis_lista else (490 if is_movimento else 140 + ((seed * 13) % 380)),
        "Relacionamento": 640 if any("relacionamento" in q.lower() for q in qualidades_lista) else 110 + ((seed * 17) % 410),
        "Criação": 710 if (is_criacao or "Criativo" in perfis_lista) else 90 + ((seed * 19) % 360),
        "Organização": 660 if "Organizado" in categorias_lista else 120 + ((seed * 23) % 390),
        "Flexibilidade": 620 if "Versátil" in categorias_lista else 80 + ((seed * 29) % 350),
        "Comunicação": 690 if ("Comunicador" in perfis_lista or "Influenciador" in perfis_lista) else 130 + ((seed * 31) % 390),
        "Análise": 720 if "Analítico" in categorias_lista else (510 if is_finalidade else 95 + ((seed * 37) % 340)),
        "Resultado": 740 if ("Resultado" in perfis_lista or "Executor" in perfis_lista) else 220 + ((seed * 41) % 420),
        "Empatia": 630 if "Diplomático" in categorias_lista else 85 + ((seed * 43) % 330),
    }


def talento_possui_soft_skill(
    t: Dict[str, Any],
    soft_skill_nome: str,
    scores_eixos: Optional[Dict[str, int]] = None,
) -> bool:
    """Verifica se o talento atende aos critérios de uma Soft Skill do catálogo."""
    target = soft_skill_nome.lower().strip()
    def_item = next(
        (s for s in SOFT_SKILLS_CATALOGO if s["nome"].lower() == target),
        None,
    )
    if not def_item:
        return False

    eixos = scores_eixos or calcular_scores_eixos(t)
    eixo_principal = def_item["eixo_principal"]

    if eixos.get(eixo_principal, 0) >= 580:
        return True

    kan_nome = str(t.get("kan_nome") or "").lower()
    perfis_lista = [str(p).lower() for p in (t.get("perfis_lista") or [])]
    categorias_lista = [str(c).lower() for c in (t.get("categorias_lista") or [])]
    qualidades_lista = [str(q).lower() for q in (t.get("qualidades_lista") or [])]

    kan_match = any(k.lower() == kan_nome for k in def_item["kan_relacionado"])
    perfil_match = any(p.lower() in perfis_lista for p in def_item["perfis_relacionados"])
    cat_match = any(c.lower() in categorias_lista for c in def_item["categorias_relacionadas"])
    qual_match = any(q.lower() in qualidades_lista for q in def_item["qualidades_relacionadas"])

    return (
        (kan_match and perfil_match)
        or (perfil_match and (cat_match or qual_match))
        or (eixos.get(eixo_principal, 0) >= 480 and (kan_match or perfil_match or cat_match))
    )


def listar_soft_skills_compativeis(
    t: Dict[str, Any], scores_eixos: Optional[Dict[str, int]] = None
) -> List[str]:
    """Retorna todas as Soft Skills do catálogo compatíveis com o talento."""
    eixos = scores_eixos or calcular_scores_eixos(t)
    return [
        sk["nome"]
        for sk in SOFT_SKILLS_CATALOGO
        if talento_possui_soft_skill(t, sk["nome"], eixos)
    ]


def calcular_match_vaga(
    vaga: Dict[str, Any], talentos: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Calcula a aderência e pontuação MundoKAN de cada talento para uma vaga."""
    kan_ideal = [str(k) for k in (vaga.get("kan_ideal") or [])]
    perfis_ideais = [str(p) for p in (vaga.get("perfis_ideais") or [])]
    soft_skills_desejadas = [str(s) for s in (vaga.get("soft_skills_ideais") or [])]
    qualidades_ideais = [str(q) for q in (vaga.get("qualidades_ideais") or [])]
    categorias_ideais = [str(c) for c in (vaga.get("categorias_ideais") or [])]

    resultados: List[Dict[str, Any]] = []

    for t in talentos:
        scores_eixos = t.get("scores_eixos") or calcular_scores_eixos(t)
        kan_nome = str(t.get("kan_nome") or "")
        perfis_lista = [str(p) for p in (t.get("perfis_lista") or [])]
        qualidades_lista = [str(q) for q in (t.get("qualidades_lista") or [])]
        categorias_lista = [str(c) for c in (t.get("categorias_lista") or [])]

        # 1. KAN Match (até 190 pts)
        kan_compativel = len(kan_ideal) == 0 or any(
            k.lower() == kan_nome.lower() for k in kan_ideal
        )
        pts_kan = 190 if kan_compativel else 50

        # 2. Perfis Ideais Match (até 230 pts)
        total_perfis = len(perfis_ideais)
        perfis_hits = [
            p
            for p in perfis_ideais
            if any(tp.lower() == p.lower() for tp in perfis_lista)
        ]
        taxa_perfil = len(perfis_hits) / total_perfis if total_perfis > 0 else 1.0
        pts_perfil = round(taxa_perfil * 230)

        # 3. Soft Skills Match (até 230 pts)
        total_soft = len(soft_skills_desejadas)
        soft_skills_hits = [
            sk
            for sk in soft_skills_desejadas
            if talento_possui_soft_skill(t, sk, scores_eixos)
        ]
        taxa_soft = (
            len(soft_skills_hits) / total_soft if total_soft > 0 else taxa_perfil
        )
        pts_soft = round(taxa_soft * 230)

        # 4. Qualidades & Categorias Match (até 150 pts)
        total_quals = len(qualidades_ideais)
        quals_hits = [
            q
            for q in qualidades_ideais
            if any(tq.lower() == q.lower() for tq in qualidades_lista)
        ]
        taxa_qual = len(quals_hits) / total_quals if total_quals > 0 else 1.0

        total_cats = len(categorias_ideais)
        cats_hits = [
            c
            for c in categorias_ideais
            if any(tc.lower() == c.lower() for tc in categorias_lista)
        ]
        taxa_cat = len(cats_hits) / total_cats if total_cats > 0 else 1.0
        pts_qual = round((taxa_qual * 0.6 + taxa_cat * 0.4) * 150)

        # Pontuação Global no padrão Mapa de Calor (120 a 840)
        total_pts = min(840, max(120, pts_kan + pts_perfil + pts_soft + pts_qual))

        # Aderência Percentual (15 a 99%)
        aderencia_pct = min(
            99,
            max(
                15,
                round(
                    (25 if kan_compativel else 0)
                    + taxa_perfil * 30
                    + taxa_soft * 30
                    + (taxa_qual * 0.6 + taxa_cat * 0.4) * 15
                ),
            ),
        )

        tier_label = "Inicial"
        tier_badge_variant = "secondary"
        if total_pts >= 600:
            tier_label = "Muito Alto"
            tier_badge_variant = "success"
        elif total_pts >= 450:
            tier_label = "Alto"
            tier_badge_variant = "orange"
        elif total_pts >= 300:
            tier_label = "Médio"
            tier_badge_variant = "secondary"
        elif total_pts >= 150:
            tier_label = "Discreto"
            tier_badge_variant = "secondary"

        resultados.append(
            {
                "talento_id": str(t.get("id") or ""),
                "talento_nome": str(t.get("nome") or ""),
                "aderenciaPct": aderencia_pct,
                "totalPts": total_pts,
                "tierLabel": tier_label,
                "tierBadgeVariant": tier_badge_variant,
                "ptsKan": pts_kan,
                "ptsPerfil": pts_perfil,
                "ptsSoft": pts_soft,
                "ptsQual": pts_qual,
                "kanStatus": "✓ Compatível" if kan_compativel else "✗ Incompatível",
                "perfilStatus": f"{len(perfis_hits)}/{total_perfis} compatíveis",
                "softStatus": (
                    f"{len(soft_skills_hits)}/{total_soft} compatíveis"
                    if total_soft > 0
                    else "Padrão"
                ),
                "catStatus": f"{len(cats_hits)}/{total_cats} compatíveis",
                "qualStatus": f"{len(quals_hits)}/{total_quals} compatíveis",
                "scoresEixos": scores_eixos,
            }
        )

    resultados.sort(key=lambda r: r["totalPts"], reverse=True)
    return resultados


COORDS_PLANO_TESLA: Dict[int, tuple] = {
    1: (794.0, 176.0),
    2: (1037.0, 243.0),
    3: (960.0, 380.0),
    4: (794.0, 585.0),
    5: (486.0, 585.0),
    6: (320.0, 380.0),
    7: (243.0, 243.0),
    8: (486.0, 176.0),
    9: (640.0, 120.0),
    11: (1037.0, 243.0),
    22: (794.0, 585.0),
}


def _norm_vert(v: Any) -> int:
    try:
        n = int(v)
    except (TypeError, ValueError):
        return 9
    if n == 11:
        return 2
    if n == 22:
        return 4
    return n if n in COORDS_PLANO_TESLA else 9


def _get_vertices(t: Dict[str, Any]) -> List[int]:
    raw = t.get("vertices_triangulo") or t.get("vertices") or []
    return [_norm_vert(v) for v in raw]


def _get_vert_set(t: Dict[str, Any]) -> set:
    return set(_get_vertices(t))


def _get_kan_nome(t: Dict[str, Any]) -> str:
    return str(t.get("kan_nome") or t.get("kan") or "").strip()


def _shared_vertices_count(a: Dict[str, Any], b: Dict[str, Any]) -> int:
    return len(_get_vert_set(a).intersection(_get_vert_set(b)))


def _is_full_overlap(a: Dict[str, Any], b: Dict[str, Any]) -> bool:
    sa = _get_vert_set(a)
    sb = _get_vert_set(b)
    return len(sa) > 0 and sa == sb


def _polygon_area(poly: List[tuple]) -> float:
    if len(poly) < 3:
        return 0.0
    area = 0.0
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2.0


def _ensure_ccw(poly: List[tuple]) -> List[tuple]:
    signed = 0.0
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        signed += (x2 - x1) * (y2 + y1)
    return list(reversed(poly)) if signed > 0 else list(poly)


def _clip_polygon(subject: List[tuple], clip: List[tuple]) -> List[tuple]:
    output = list(subject)
    clip_ccw = _ensure_ccw(clip)
    n_clip = len(clip_ccw)
    for i in range(n_clip):
        cp1 = clip_ccw[i]
        cp2 = clip_ccw[(i + 1) % n_clip]
        inp = output
        output = []
        if not inp:
            break

        def inside(p: tuple) -> bool:
            return (cp2[0] - cp1[0]) * (p[1] - cp1[1]) - (cp2[1] - cp1[1]) * (
                p[0] - cp1[0]
            ) >= -1e-6

        def intersect(s: tuple, e: tuple) -> tuple:
            dc = (cp1[0] - cp2[0], cp1[1] - cp2[1])
            dp = (s[0] - e[0], s[1] - e[1])
            n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0]
            n2 = s[0] * e[1] - s[1] * e[0]
            denom = dc[0] * dp[1] - dc[1] * dp[0]
            if abs(denom) < 1e-9:
                return e
            return (
                (n1 * dp[0] - n2 * dc[0]) / denom,
                (n1 * dp[1] - n2 * dc[1]) / denom,
            )

        s = inp[-1]
        for e in inp:
            if inside(e):
                if not inside(s):
                    output.append(intersect(s, e))
                output.append(e)
            elif inside(s):
                output.append(intersect(s, e))
            s = e
    return output


def _triangles_cross_or_overlap(a: Dict[str, Any], b: Dict[str, Any]) -> bool:
    """Retorna True se os triângulos passam um pelo outro no Plano de Tesla (excluindo sobreposição total)."""
    if _is_full_overlap(a, b):
        return False
    verts_a = _get_vertices(a)
    verts_b = _get_vertices(b)
    if len(verts_a) < 3 or len(verts_b) < 3:
        return False
    poly_a = [COORDS_PLANO_TESLA.get(v, COORDS_PLANO_TESLA[9]) for v in verts_a[:3]]
    poly_b = [COORDS_PLANO_TESLA.get(v, COORDS_PLANO_TESLA[9]) for v in verts_b[:3]]
    clipped = _clip_polygon(_ensure_ccw(poly_a), _ensure_ccw(poly_b))
    return _polygon_area(clipped) > 1.0


def calcular_harmonia_grupo(
    membros_atuais: List[Dict[str, Any]], candidato: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calcula os 5 critérios oficiais da Análise de Harmonia de Equipes sobre o Plano de Tesla:
      1. Complementariedade (0 / 50 / 100 pts + regra da ponte 3+ talentos + Alerta de Repulsão)
      2. Integração Geométrica (0 / 100 pts via interseção real de triângulos 2D)
      3. Balanceamento (0 / 100 / 150 pts — exceção 150 pts para 3 KANs diferentes)
      4. Tração Operacional (0 / 100 / 150 pts — 150 pts se todos com o mesmo KAN)
      5. Segurança Relacional (0 / 50 / 100 pts)
    """
    todos_sim = list(membros_atuais) + ([candidato] if candidato else [])
    alertas: List[Dict[str, str]] = []
    tem_sobreposicao_total = False
    tem_sobreposicao_mesmo_kan = False

    # Verificar sobreposição total (todos os vértices coincidentes) entre todos os pares do grupo
    for i in range(len(todos_sim)):
        for j in range(i + 1, len(todos_sim)):
            a = todos_sim[i]
            b = todos_sim[j]
            if _is_full_overlap(a, b):
                tem_sobreposicao_total = True
                kan_a = _get_kan_nome(a)
                kan_b = _get_kan_nome(b)
                mesmo_kan = bool(kan_a and kan_a == kan_b)
                if mesmo_kan:
                    tem_sobreposicao_mesmo_kan = True
                nome_a = str(a.get("nome") or "Talento 1")
                nome_b = str(b.get("nome") or "Talento 2")
                alertas.append(
                    {
                        "severidade": "critico" if mesmo_kan else "atencao",
                        "talentoA": nome_a,
                        "talentoB": nome_b,
                        "mesmoKan": mesmo_kan,
                        "texto": (
                            f"{nome_a} e {nome_b} com possibilidade de produtividade muito alta ou repulsão"
                            + (f" — Alerta Maior (mesmo KAN: {kan_a})." if mesmo_kan else ".")
                        ),
                    }
                )

    # 1. COMPLEMENTARIEDADE (0 / 50 / 100)
    pts_comp = 0
    sub_comp = "Sem complementariedade"
    cand_sobrepoe_alguem = any(
        _is_full_overlap(candidato, m) for m in membros_atuais
    )

    # Regra da Ponte (3+ talentos): 2 talentos da equipe sem vértices coincidentes entre si,
    # e o candidato toca ao menos 1 vértice de cada um (sem sobreposição total)
    faz_ponte = False
    if len(membros_atuais) >= 2 and candidato:
        for i in range(len(membros_atuais)):
            if faz_ponte:
                break
            for j in range(i + 1, len(membros_atuais)):
                m1 = membros_atuais[i]
                m2 = membros_atuais[j]
                if (
                    _shared_vertices_count(m1, m2) == 0
                    and not _is_full_overlap(candidato, m1)
                    and not _is_full_overlap(candidato, m2)
                    and _shared_vertices_count(candidato, m1) >= 1
                    and _shared_vertices_count(candidato, m2) >= 1
                ):
                    faz_ponte = True
                    break

    max_shared_cand = 0
    for m in membros_atuais:
        if not _is_full_overlap(candidato, m):
            max_shared_cand = max(max_shared_cand, _shared_vertices_count(candidato, m))

    if len(membros_atuais) == 0:
        pts_comp = 0
        sub_comp = "Selecione equipe ou departamento"
    elif cand_sobrepoe_alguem and max_shared_cand == 0 and not faz_ponte:
        pts_comp = 0
        sub_comp = "Não pontuado (alerta de repulsão)"
    elif faz_ponte:
        pts_comp = 100
        sub_comp = "Ótima (elo entre talentos desconexos)"
    elif max_shared_cand >= 2:
        pts_comp = 100
        sub_comp = "Ótima (2 vértices coincidentes)"
    elif max_shared_cand == 1:
        pts_comp = 50
        sub_comp = "Média (1 vértice coincidente)"
    else:
        pts_comp = 0
        sub_comp = "Sem complementariedade"

    # 2. INTEGRAÇÃO GEOMÉTRICA (0 / 100)
    tem_integracao = any(
        _triangles_cross_or_overlap(candidato, m) for m in membros_atuais
    )
    pts_geom = 100 if tem_integracao else 0
    if tem_integracao:
        sub_geom = "Integração ótima (triângulos se cruzam)"
    elif cand_sobrepoe_alguem:
        sub_geom = "Sobreposição total (alerta)"
    else:
        sub_geom = "Sem integração geométrica"

    # 3. BALANCEAMENTO (0 / 100 / 150)
    kans_unicos = {_get_kan_nome(t) for t in todos_sim if _get_kan_nome(t)}
    tri_sigs = {tuple(sorted(_get_vert_set(t))) for t in todos_sim}
    tem_vertices_diferentes = len(tri_sigs) > 1
    tem_kans_diferentes = len(kans_unicos) >= 2

    if len(kans_unicos) >= 3:
        pts_bal = 150
        sub_bal = "Balanceamento total (3 KANs diferentes)"
    elif tem_vertices_diferentes or tem_kans_diferentes:
        pts_bal = 100
        sub_bal = (
            f"Alto ({len(kans_unicos)} KANs + vértices distintos)"
            if tem_kans_diferentes
            else "Alto (vértices distintos)"
        )
    else:
        pts_bal = 0
        sub_bal = "Sem balanceamento"

    # 4. TRAÇÃO OPERACIONAL (0 / 100 / 150)
    algum_vertice_coincidente_grupo = False
    for i in range(len(todos_sim)):
        if algum_vertice_coincidente_grupo:
            break
        for j in range(i + 1, len(todos_sim)):
            if _shared_vertices_count(todos_sim[i], todos_sim[j]) >= 1:
                algum_vertice_coincidente_grupo = True
                break

    if len(kans_unicos) == 1 and len(todos_sim) > 0:
        kan_unico = next(iter(kans_unicos))
        pts_tracao = 150
        sub_tracao = f"Potencializada para {kan_unico}"
    elif algum_vertice_coincidente_grupo:
        pts_tracao = 100
        sub_tracao = "Tração operacional ótima"
    else:
        pts_tracao = 0
        sub_tracao = "Sem tração operacional"

    # 5. SEGURANÇA RELACIONAL (0 / 50 / 100)
    if tem_sobreposicao_mesmo_kan:
        pts_seg = 0
        sub_seg = "Baixa (sobreposição total + mesmo KAN)"
    elif not tem_integracao:
        pts_seg = 50
        sub_seg = "Média (sem integração geométrica)"
    elif tem_integracao and algum_vertice_coincidente_grupo and len(kans_unicos) >= 2:
        pts_seg = 100
        sub_seg = "Alta (integração + vértices + KANs)"
    else:
        pts_seg = 50
        sub_seg = "Segurança relacional média"

    total_pts = pts_comp + pts_geom + pts_bal + pts_tracao + pts_seg
    max_pts = 550
    score_pct = round(min(100.0, (total_pts / float(max_pts)) * 100.0), 1)

    if tem_sobreposicao_mesmo_kan:
        classificacao = "Alerta de Repulsão"
    elif total_pts >= 450:
        classificacao = "Harmonia Excelente"
    elif total_pts >= 350:
        classificacao = "Harmonia Alta"
    elif total_pts >= 250:
        classificacao = "Harmonia Média"
    else:
        classificacao = "Harmonia Baixa"

    return {
        "totalPts": total_pts,
        "maxPts": max_pts,
        "scorePct": score_pct,
        "classificacao": classificacao,
        "alertas": alertas,
        "temSobreposicaoTotal": tem_sobreposicao_total,
        "temSobreposicaoMesmoKan": tem_sobreposicao_mesmo_kan,
        "criterios": [
            {
                "titulo": "Complementariedade",
                "nota": f"{pts_comp} pts",
                "pts": pts_comp,
                "sub": sub_comp,
            },
            {
                "titulo": "Integração Geométrica",
                "nota": f"{pts_geom} pts",
                "pts": pts_geom,
                "sub": sub_geom,
            },
            {
                "titulo": "Balanceamento",
                "nota": f"{pts_bal} pts",
                "pts": pts_bal,
                "sub": sub_bal,
            },
            {
                "titulo": "Tração Operacional",
                "nota": f"{pts_tracao} pts",
                "pts": pts_tracao,
                "sub": sub_tracao,
            },
            {
                "titulo": "Segurança Relacional",
                "nota": f"{pts_seg} pts",
                "pts": pts_seg,
                "sub": sub_seg,
            },
        ],
    }


def calcular_harmonia_shortlist(
    membros_atuais: List[Dict[str, Any]], candidatos: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Calcula e ranqueia a harmonia de toda a Short List contra a equipe ou departamento escolhido."""
    resultados = []
    for cand in candidatos:
        harm = calcular_harmonia_grupo(membros_atuais, cand)
        resultados.append(
            {
                "id": cand.get("id"),
                "nome": cand.get("nome"),
                "harmonia": harm,
            }
        )
    resultados.sort(
        key=lambda r: (
            0 if r["harmonia"].get("temSobreposicaoMesmoKan") else 1,
            r["harmonia"].get("totalPts", 0),
        ),
        reverse=True,
    )
    return resultados


def calcular_sinergia_departamento(membros: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calcula a métrica de sinergia KAN de um departamento/grupo."""
    total = len(membros)
    if total == 0:
        return {
            "score": 0,
            "status": "Sem integrantes alocados",
            "criacao": 0,
            "movimento": 0,
            "finalidade": 0,
        }

    criacao = sum(1 for t in membros if t.get("kan_nome") == "Criação")
    movimento = sum(1 for t in membros if t.get("kan_nome") == "Movimento")
    finalidade = sum(1 for t in membros if t.get("kan_nome") == "Finalidade")

    active_forces = sum(1 for cnt in (criacao, movimento, finalidade) if cnt > 0)
    max_force = max(criacao, movimento, finalidade)
    balance_ratio = 1.0 - (max_force - total / 3.0) / max(1, total)

    if active_forces == 3:
        base_score = min(98, round(78 + balance_ratio * 20))
    elif active_forces == 2:
        base_score = round(68 + balance_ratio * 14)
    else:
        base_score = 58

    status = "Equilíbrio entre Criativos, Movimentadores e Finalizadores"
    if active_forces == 1:
        if criacao > 0:
            status = "Concentração em Criação (Falta Movimento e Finalidade)"
        elif movimento > 0:
            status = "Concentração em Movimento (Falta Criação e Finalidade)"
        else:
            status = "Concentração em Finalidade (Falta Criação e Movimento)"
    elif active_forces == 2:
        if criacao == 0:
            status = "Forte em Movimento e Finalidade (Oportunidade em Criação)"
        elif movimento == 0:
            status = "Equilíbrio entre Criativos e Finalizadores"
        else:
            status = "Forte em Criação e Movimento (Oportunidade em Finalidade)"

    return {
        "score": base_score,
        "status": status,
        "criacao": criacao,
        "movimento": movimento,
        "finalidade": finalidade,
    }


def sugerir_requisitos_vaga(
    nome_vaga: str,
    departamento: str = "",
    descricao_vaga: str = "",
    senioridade: str = "",
) -> Dict[str, List[str]]:
    """Sugere KANs, Perfis, Categorias, Qualidades e Soft Skills ideais para uma vaga."""
    combined = f"{_norm_text(nome_vaga)} {_norm_text(departamento)} {_norm_text(descricao_vaga)}"

    kan_sugerido = ["Finalidade", "Movimento"]
    perfis_sugeridos = ["Lider", "Resultado", "Comunicador"]
    categorias_sugeridas = ["Realizador", "Visionário"]
    qualidades_sugeridas = ["Execução", "Comunicação", "Organização", "Análise"]
    soft_sugeridas = [
        "Liderança",
        "Comunicação assertiva",
        "Resolução de problemas",
        "Proatividade",
        "Trabalho em equipe",
    ]

    if any(k in combined for k in ("comercial", "venda", "account", "growth", "hunter")):
        kan_sugerido = ["Movimento", "Finalidade"]
        perfis_sugeridos = ["Vendedor", "Resultado", "Influenciador"]
        categorias_sugeridas = ["Comunicativo", "Realizador", "Diplomático"]
        qualidades_sugeridas = ["Comunicação", "Execução", "Relacionamento", "Praticidade e disciplina"]
        soft_sugeridas = [
            "Comunicação assertiva",
            "Comunicação eficaz",
            "Relacionamento interpessoal",
            "Proatividade",
            "Resiliência",
            "Adaptabilidade / flexibilidade",
        ]
    elif any(k in combined for k in ("tech", "eng", "dev", "software", "dados", "sistema")):
        kan_sugerido = ["Criação", "Finalidade"]
        perfis_sugeridos = ["Criativo", "Executor", "Lider"]
        categorias_sugeridas = ["Analítico", "Inovador", "Realizador"]
        qualidades_sugeridas = ["Análise", "Execução", "Intuição", "Praticidade e disciplina"]
        soft_sugeridas = [
            "Resolução de problemas",
            "Pensamento crítico",
            "Visão sistêmica",
            "Aprendizado contínuo",
            "Atenção / foco",
            "Inovação / melhoria contínua",
        ]
    elif any(k in combined for k in ("rh", "gente", "cultura", "people", "recrut")):
        kan_sugerido = ["Criação", "Movimento"]
        perfis_sugeridos = ["Comunicador", "Influenciador", "Lider"]
        categorias_sugeridas = ["Harmônico", "Comunicativo", "Diplomático"]
        qualidades_sugeridas = ["Relacionamento", "Comunicação", "Coletividade", "Serviço"]
        soft_sugeridas = [
            "Empatia",
            "Escuta ativa",
            "Inteligência emocional",
            "Comunicação eficaz",
            "Relacionamento interpessoal",
            "Trabalho em equipe",
        ]
    elif any(k in combined for k in ("financ", "contab", "auditor", "control")):
        kan_sugerido = ["Finalidade"]
        perfis_sugeridos = ["Executor", "Resultado"]
        categorias_sugeridas = ["Analítico", "Organizado", "Justo"]
        qualidades_sugeridas = ["Análise", "Organização", "Praticidade e disciplina", "Justiça"]
        soft_sugeridas = [
            "Atenção / foco",
            "Organização",
            "Gestão do tempo",
            "Tomada de decisão",
            "Ética / responsabilidade",
            "Disciplina",
        ]
    elif senioridade == "Executivo" or any(k in combined for k in ("diretor", "head", "gerente", "ceo")):
        kan_sugerido = ["Finalidade", "Movimento"]
        perfis_sugeridos = ["Lider", "Resultado", "Influenciador"]
        categorias_sugeridas = ["Visionário", "Realizador", "Justo"]
        qualidades_sugeridas = ["Execução", "Comunicação", "Análise", "Coletividade"]
        soft_sugeridas = [
            "Liderança",
            "Visão sistêmica",
            "Tomada de decisão",
            "Comunicação assertiva",
            "Inteligência emocional",
            "Ética / responsabilidade",
        ]

    return {
        "kan_ideal": kan_sugerido,
        "perfis_ideais": perfis_sugeridos,
        "categorias_ideais": categorias_sugeridas,
        "qualidades_ideais": qualidades_sugeridas,
        "soft_skills_ideais": soft_sugeridas,
    }
