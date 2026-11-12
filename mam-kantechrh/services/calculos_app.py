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


def calcular_harmonia_grupo(
    membros_atuais: List[Dict[str, Any]], candidato: Dict[str, Any]
) -> Dict[str, Any]:
    """Calcula os 5 critérios e o score percentual de harmonia do candidato com o grupo."""
    todos_sim = list(membros_atuais) + [candidato]
    kans_presentes = {str(t.get("kan_nome") or "") for t in todos_sim if t.get("kan_nome")}
    qtd_kans = len(kans_presentes)

    # 1. Complementaridade
    nota_comp = 4.8 if qtd_kans >= 3 else (4.5 if qtd_kans == 2 else 4.1)

    # 2. Integração Geométrica
    vertices_grupo = set()
    for m in membros_atuais:
        for v in (m.get("vertices_triangulo") or []):
            vertices_grupo.add(v)
    cand_verts = candidato.get("vertices_triangulo") or []
    vertices_compartilhados = sum(1 for v in cand_verts if v in vertices_grupo)

    if len(membros_atuais) == 0:
        nota_geom = 4.6
    elif vertices_compartilhados >= 2:
        nota_geom = 4.7
    elif vertices_compartilhados == 1:
        nota_geom = 4.6
    else:
        nota_geom = 4.4

    # 3. Balanceamento (cobertura dos 9 eixos comportamentais)
    eixos_list = [t.get("scores_eixos") or calcular_scores_eixos(t) for t in todos_sim]
    medias_eixos = []
    for eixo in EIXOS_COMPORTAMENTAIS:
        soma = sum(e.get(eixo, 300) for e in eixos_list)
        medias_eixos.append(soma / max(1, len(todos_sim)))
    eixos_fortes = sum(1 for m in medias_eixos if m >= 400)
    nota_bal = min(4.9, max(4.2, round(4.0 + (eixos_fortes / 9.0) * 0.9, 1)))

    # 4. Potencial de Entrega
    scores_cand = candidato.get("scores_eixos") or calcular_scores_eixos(candidato)
    media_entrega = (
        scores_cand.get("Resultado", 450)
        + scores_cand.get("Organização", 450)
        + scores_cand.get("Análise", 450)
    ) / 3.0
    nota_entrega = 4.9 if media_entrega >= 550 else (4.7 if media_entrega >= 420 else 4.4)

    # 5. Segurança Relacional
    media_rel = (
        scores_cand.get("Relacionamento", 450)
        + scores_cand.get("Empatia", 450)
        + scores_cand.get("Comunicação", 450)
    ) / 3.0
    nota_rel = 4.8 if media_rel >= 550 else (4.6 if media_rel >= 420 else 4.4)

    media_final_5 = (nota_comp + nota_geom + nota_bal + nota_entrega + nota_rel) / 5.0
    score_pct = round((media_final_5 / 5.0) * 100.0, 1)
    classificacao = (
        "Encaixe Muito Alto"
        if score_pct >= 90
        else ("Encaixe Alto" if score_pct >= 82 else "Encaixe Adequado")
    )

    return {
        "scorePct": score_pct,
        "classificacao": classificacao,
        "criterios": [
            {
                "titulo": "Complementaridade",
                "nota": f"{nota_comp:.1f}/5.0",
                "sub": "Equilíbrio de KANs",
            },
            {
                "titulo": "Integração Geométrica",
                "nota": f"{nota_geom:.1f}/5.0",
                "sub": "Conexões de Triângulos",
            },
            {
                "titulo": "Balanceamento",
                "nota": f"{nota_bal:.1f}/5.0",
                "sub": "Cobertura de Planos",
            },
            {
                "titulo": "Potencial de Entrega",
                "nota": f"{nota_entrega:.1f}/5.0",
                "sub": "Materialidade/Praticidade",
            },
            {
                "titulo": "Segurança Relacional",
                "nota": f"{nota_rel:.1f}/5.0",
                "sub": "Mitigação de Conflitos",
            },
        ],
    }


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
