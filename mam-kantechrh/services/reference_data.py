import os
import json
import unicodedata
import pandas as pd
from functools import lru_cache

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def remover_acentos(texto):
    if texto is None:
        return ""
    texto_str = str(texto).replace("º", "o").replace("ª", "a")
    texto_str = (
        texto_str.replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'")
        .replace("–", "-")
        .replace("—", "-")
    )
    norm = "".join(
        c
        for c in unicodedata.normalize("NFD", texto_str)
        if unicodedata.category(c) != "Mn"
    )
    return norm.encode("latin-1", "ignore").decode("latin-1")


def normalize_key(k):
    if k is None:
        return ""
    n = remover_acentos(k).lower()
    for char in [" ", "_", "-", "(", ")", ".", "º", "ª"]:
        n = n.replace(char, "")
    return n


def get_from_row(row, key):
    if not row or not isinstance(row, dict):
        return None
    search_key = normalize_key(key)
    for k in row.keys():
        if normalize_key(k) == search_key:
            return row[k]
    return None


def _read_csv_safe(filename: str) -> pd.DataFrame:
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return pd.DataFrame()
    try:
        df = pd.read_csv(filepath, sep=";")
        if df.shape[1] <= 1:
            df = pd.read_csv(filepath, sep=",")
        return df
    except Exception:
        return pd.DataFrame()


@lru_cache(maxsize=1)
def get_arcanos_db():
    filepath = os.path.join(DATA_DIR, "arcanos.json")
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass
    return {}


@lru_cache(maxsize=1)
def get_matriz_db():
    df = _read_csv_safe("Tabela Matriz.csv")
    resultado = {}
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        num_val = row_dict.get("Resultado", row_dict.get("numero", ""))
        if pd.notna(num_val):
            try:
                num_val_str = str(int(float(num_val)))
            except Exception:
                num_val_str = str(num_val).strip()
            if num_val_str:
                cleaned_row = {remover_acentos(k): v for k, v in row_dict.items()}
                resultado[num_val_str] = cleaned_row
    return resultado


@lru_cache(maxsize=1)
def get_atributos_db():
    df = _read_csv_safe("Atributos.csv")
    resultado = {}
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        attr_val = str(
            get_from_row(row_dict, "atributo")
            or get_from_row(row_dict, "ATRIBUTOS")
            or ""
        ).upper()
        if attr_val:
            resultado[attr_val] = row_dict
    return resultado


@lru_cache(maxsize=1)
def get_repeticao_db():
    df = _read_csv_safe("Repeticao.csv")
    resultado = {}
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        raw = get_from_row(row_dict, "repeticao")
        if raw is not None and pd.notna(raw):
            try:
                rep_val = str(int(float(raw)))
                resultado[rep_val] = row_dict
            except Exception:
                pass
    return resultado


@lru_cache(maxsize=1)
def get_peso_db():
    df = _read_csv_safe("peso.csv")
    res_dict = {}
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        c = get_from_row(row_dict, "campo")
        p = get_from_row(row_dict, "peso")
        if c is not None and p is not None and pd.notna(p):
            try:
                res_dict[str(c)] = int(float(p))
            except Exception:
                res_dict[str(c)] = 1
    return res_dict


@lru_cache(maxsize=1)
def get_peso_categoria_db():
    df = _read_csv_safe("peso_categoria.csv")
    res_dict = {}
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        c = get_from_row(row_dict, "campo")
        p = get_from_row(row_dict, "peso") or get_from_row(row_dict, "peso_categoria")
        if c is not None and p is not None and pd.notna(p):
            try:
                res_dict[str(c)] = int(float(p))
            except Exception:
                res_dict[str(c)] = 1
    return res_dict


@lru_cache(maxsize=1)
def get_perfis_db():
    df = _read_csv_safe("perfil.csv")
    if not df.empty and "perfil" in df.columns:
        return [str(r["perfil"]).strip() for _, r in df.iterrows() if pd.notna(r["perfil"])]
    return [
        "Lider",
        "Criativo",
        "Executor",
        "Resultado",
        "Vendedor",
        "Influenciador",
        "Comunicador",
    ]


@lru_cache(maxsize=1)
def get_perfil_descricao_db():
    df = _read_csv_safe("perfil_descricao.csv")
    res = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        p = get_from_row(rd, "perfil")
        d = get_from_row(rd, "descricao")
        if p:
            res[str(p).strip().capitalize()] = str(d or "")
    return res


@lru_cache(maxsize=1)
def get_qualidades_db():
    df = _read_csv_safe("Qualidades.csv")
    res = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        q = get_from_row(rd, "qualidade")
        d = get_from_row(rd, "descricao") or get_from_row(
            rd, "descricao_no_ambiente_de_trabalho"
        )
        if q:
            res[str(q).strip().capitalize()] = str(d or "")
    return res


@lru_cache(maxsize=1)
def get_lista_categoria_db():
    df = _read_csv_safe("lista_categoria.csv")
    res = []
    for _, row in df.iterrows():
        c = get_from_row(row.to_dict(), "categoria")
        if c and pd.notna(c):
            res.append(str(c).strip())
    return res if res else ["Justo", "Realizador", "Visionário", "Inovador", "Diplomático"]


@lru_cache(maxsize=1)
def get_categoria_descricao_db():
    df = _read_csv_safe("categoria_descricao.csv")
    res = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        c = get_from_row(rd, "categoria")
        d = get_from_row(rd, "descricao")
        if c:
            res[str(c).strip().capitalize()] = str(d or "")
    return res


@lru_cache(maxsize=1)
def get_kan_db():
    df = _read_csv_safe("KAN.csv")
    res_dict = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        num_val = get_from_row(rd, "numero")
        if num_val is not None and pd.notna(num_val):
            try:
                key_str = str(int(float(num_val)))
            except Exception:
                key_str = str(num_val).strip()
            res_dict[key_str] = {
                "kan": str(get_from_row(rd, "kan") or ""),
                "descricao": str(get_from_row(rd, "descricao") or ""),
            }
    return res_dict


@lru_cache(maxsize=1)
def get_fortalezas_db():
    df = _read_csv_safe("Fortaleza.csv")
    res_dict = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        num_val = get_from_row(rd, "triangulo")
        if num_val is not None and pd.notna(num_val):
            try:
                key_str = str(int(float(num_val)))
            except Exception:
                key_str = str(num_val).strip()
            res_dict[key_str] = {
                "fortaleza": str(get_from_row(rd, "fortaleza") or ""),
                "descricao": str(get_from_row(rd, "descricao") or ""),
            }
    return res_dict


@lru_cache(maxsize=1)
def get_desafios_db():
    df = _read_csv_safe("Desafio.csv")
    res_dict = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        num_val = get_from_row(rd, "dia do nascimento") or get_from_row(
            rd, "dia_nascimento"
        )
        if num_val is not None and pd.notna(num_val):
            try:
                key_str = str(int(float(num_val)))
            except Exception:
                key_str = str(num_val).strip()
            res_dict[key_str] = {
                "desafio": str(get_from_row(rd, "desafio") or ""),
                "descricao": str(get_from_row(rd, "descricao") or ""),
            }
    return res_dict


@lru_cache(maxsize=1)
def get_campo_definicao_db():
    df = _read_csv_safe("campo_definicao.csv")
    res = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        c = get_from_row(rd, "campo")
        e = get_from_row(rd, "explicacao")
        if c:
            res[str(c)] = str(e or "")
    return res


@lru_cache(maxsize=1)
def get_diferenciais_desc_db():
    df = _read_csv_safe("diferenciais_descricao.csv")
    res = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        no = get_from_row(rd, "no")
        if no is not None and pd.notna(no):
            try:
                key_str = str(int(float(no)))
            except Exception:
                key_str = str(no).strip()
            res[key_str] = {
                "diferencial": str(get_from_row(rd, "diferencial") or ""),
                "descricao": str(get_from_row(rd, "descricao") or ""),
            }
    return res


@lru_cache(maxsize=1)
def get_descricoes_mapa_db():
    df = _read_csv_safe("descricoes_mapa.csv")
    res = {}
    for _, row in df.iterrows():
        rd = row.to_dict()
        cat = str(get_from_row(rd, "categoria") or "").strip()
        val = get_from_row(rd, "valor")
        if cat and val is not None and pd.notna(val):
            try:
                val_str = str(int(float(val)))
            except Exception:
                val_str = str(val).strip()
            if cat not in res:
                res[cat] = {}
            res[cat][val_str] = {
                "descricao": str(get_from_row(rd, "descricao") or ""),
                "resumo": str(get_from_row(rd, "resumo") or ""),
            }
    return res


def get_desc_mapa(categoria: str, valor: str) -> str:
    db = get_descricoes_mapa_db()
    cat_data = db.get(categoria, {})
    entry = cat_data.get(str(valor), "")
    if isinstance(entry, dict):
        resumo = entry.get("resumo", "")
        if resumo and str(resumo).strip() and str(resumo).lower() != "nan":
            return str(resumo)
        return str(entry.get("descricao", ""))
    return str(entry or "")
