import os
import json
import datetime
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.requests import Request
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware

from services.perfil import realizar_calculos_completos
from services.harmonia import obter_vertices_triangulo, calcular_harmonia_trio
from services.reference_data import normalize_key

INTERNAL_SECRET = os.getenv(
    "MAM_INTERNAL_SECRET", "kantech-mam-secret-key-2026-isolated"
)


class InternalSecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        secret = request.headers.get("X-Internal-Secret")
        if request.url.path != "/health" and secret != INTERNAL_SECRET:
            return JSONResponse(
                {
                    "error": "Acesso negado: Container mam-kantechrh aceita apenas chamadas autenticadas da rede interna BFF (X-Internal-Secret)."
                },
                status_code=403,
            )
        return await call_next(request)


def _parse_birth_date(date_str: str):
    s = str(date_str).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            dt = datetime.datetime.strptime(s, fmt)
            return (dt.day, dt.month, dt.year)
        except ValueError:
            continue
    return (1, 1, 1990)


def _build_full_calculation(
    nome: str, data_nascimento: str, cargo: str = "", empresa: str = ""
):
    nascimento_tuple = _parse_birth_date(data_nascimento)
    hoje = datetime.date.today()
    data_atual_tuple = (hoje.day, hoje.month, hoje.year)

    (
        dados,
        dados_perfil,
        kan,
        estrutural,
        direcionamento,
        rep1,
        repeticao_mapa,
        repeticao_2_mapa,
        repeticao_3_mapa,
        score_df_dict,
        score_cat_dict,
        score_qual_dict,
        auditoria_qual,
    ) = realizar_calculos_completos(
        nome, nascimento_tuple, data_atual_tuple, cargo, empresa
    )

    verts, kan_str = obter_vertices_triangulo(nome, data_nascimento)

    # Monta perfil_json compatível com public.mapas_salvos
    dados_para_salvar = list(dados_perfil)
    campos_extra = [
        ("Estrutural", estrutural),
        ("Direcionamento", direcionamento),
        ("REPETIÇÃO 1", rep1),
        ("REPETIÇÃO 2", repeticao_mapa),
    ]
    for label, val in campos_extra:
        if not any(item.get("Campo") == label for item in dados_para_salvar):
            dados_para_salvar.append(
                {
                    "Campo": label,
                    "Valor": str(val or ""),
                    "Descricao": "",
                    "Resultado": str(val or ""),
                }
            )

    for item in dados:
        campo_full = item.get("Campo", "")
        if " - " in campo_full:
            partes = campo_full.split(" - ")
            campo_simples = partes[0]
            valor_simples = partes[1]
        else:
            campo_simples = campo_full
            valor_simples = item.get("Resultado", "")
        if len(str(valor_simples)) > 50:
            valor_simples = "Ver Mapa"
        dados_para_salvar.append(
            {
                "Campo": f"Mapa: {campo_simples}",
                "Valor": str(valor_simples),
                "Descricao": "",
                "Resultado": str(valor_simples),
            }
        )

    # Monta valores_resumo compatível com public.mapas_salvos_valores
    mapa_lookup = {}
    for item in dados:
        c_title = str(item.get("Campo", "")).split(" - ")[0]
        mapa_lookup[normalize_key(c_title)] = str(
            item.get("Valor") or item.get("Resultado") or ""
        )

    perfil_lookup = {}
    for item in dados_perfil:
        c_title = str(item.get("Campo", ""))
        perfil_lookup[normalize_key(c_title)] = str(item.get("Valor") or "")

    valores_resumo = {
        "kan": str(kan),
        "perfil": perfil_lookup.get("perfil", ""),
        "categoria": perfil_lookup.get("categoria", ""),
        "qualidades": perfil_lookup.get("qualidades", ""),
        "diferenciais": perfil_lookup.get("diferenciais", ""),
        "motivacao": mapa_lookup.get("motivacao", ""),
        "impressao": mapa_lookup.get("impressao", ""),
        "expressao": mapa_lookup.get("expressao", ""),
        "dia_natalicio": str(nascimento_tuple[0]),
        "numero_psiquico": mapa_lookup.get("numeropsiquico", ""),
        "destino": mapa_lookup.get("destino", ""),
        "missao": mapa_lookup.get("missao", ""),
        "direcionamento": str(direcionamento),
        "estrutural": str(estrutural),
        "repeticao_1": str(rep1),
        "repeticao_2": str(repeticao_mapa),
        "repeticao_mapa": str(repeticao_mapa),
        "repeticao_mapa_2": str(repeticao_2_mapa),
        "vertice_triangulo_1": str(verts[0]) if len(verts) > 0 else "1",
        "vertice_triangulo_2": str(verts[1]) if len(verts) > 1 else "2",
        "vertice_triangulo_3": str(verts[2]) if len(verts) > 2 else "3",
        "dividas_carmicas": mapa_lookup.get("dividascarmicas", ""),
        "licoes_carmicas": mapa_lookup.get("licoescarmicas", ""),
        "tendencias_ocultas": mapa_lookup.get("tendenciasocultas", ""),
        "resposta_subconsciente": mapa_lookup.get("respostasubconsciente", ""),
    }

    return {
        "nome": nome,
        "data_nascimento": data_nascimento,
        "kan_numero": kan,
        "kan_nome": perfil_lookup.get("kan", kan_str),
        "estrutural": estrutural,
        "direcionamento": direcionamento,
        "vertices_triangulo": verts,
        "dados_mapa_cabalistico": dados,
        "dados_perfil": dados_perfil,
        "perfil_json": json.dumps(dados_para_salvar, ensure_ascii=False),
        "valores_resumo": valores_resumo,
        "score_df_calc": score_df_dict,
        "score_cat_df": score_cat_dict,
        "score_qual_df": score_qual_dict,
        "auditoria_qualidades": auditoria_qual,
    }


async def health_check(request: Request):
    return JSONResponse(
        {
            "status": "healthy",
            "service": "mam-kantechrh",
            "engine": "Starlette/FastAPI ASGI Python — KAN Proprietary Calculation Container",
            "isolated": True,
        }
    )


async def api_calcular_completo(request: Request):
    try:
        body = await request.json()
        nome = str(body.get("nome") or "").strip()
        data_nascimento = str(body.get("data_nascimento") or "").strip()
        cargo = str(body.get("cargo") or "")
        empresa = str(body.get("empresa") or "KantechRH Enterprise")

        if not nome or not data_nascimento:
            return JSONResponse(
                {"error": "Campos nome e data_nascimento são obrigatórios."},
                status_code=400,
            )

        result = _build_full_calculation(nome, data_nascimento, cargo, empresa)
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse(
            {"error": f"Erro no motor de cálculo KAN: {str(e)}"}, status_code=500
        )


async def api_calcular_harmonia_trio(request: Request):
    try:
        body = await request.json()
        res = calcular_harmonia_trio(
            body["membro1"],
            body["membro2"],
            body["candidato"],
            body.get("pesos"),
        )
        return JSONResponse(res)
    except Exception as e:
        return JSONResponse(
            {"error": f"Erro no cálculo de harmonia: {str(e)}"}, status_code=500
        )


async def api_calcular_lote(request: Request):
    try:
        body = await request.json()
        talentos = body.get("talentos", [])
        items = []
        for t in talentos:
            nome = str(t.get("nome") or "").strip()
            nasc = str(t.get("data_nascimento") or "01/01/1990").strip()
            if not nome:
                continue
            try:
                calc = _build_full_calculation(
                    nome,
                    nasc,
                    str(t.get("cargo") or ""),
                    str(t.get("empresa") or "KantechRH Enterprise"),
                )
                resumo = calc["valores_resumo"]
                resumo["nome"] = nome
                resumo["data_nascimento"] = nasc
                items.append(resumo)
            except Exception:
                continue
        return JSONResponse({"processed": len(items), "items": items})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


app = Starlette(
    debug=False,
    routes=[
        Route("/health", health_check, methods=["GET"]),
        Route("/api/v1/calcular-completo", api_calcular_completo, methods=["POST"]),
        Route(
            "/api/v1/calcular-harmonia-trio",
            api_calcular_harmonia_trio,
            methods=["POST"],
        ),
        Route("/api/v1/calcular-lote", api_calcular_lote, methods=["POST"]),
    ],
    middleware=[Middleware(InternalSecretMiddleware)],
)
