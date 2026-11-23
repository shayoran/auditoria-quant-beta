# -*- coding: utf-8 -*-
"""
padroes_ict.py - definicoes objetivas e detetores de conceitos ICT/SMC e padroes classicos.

Regras de desenho:
- Sem olhar para o futuro: o sinal na barra t usa so barras <= t. Pivots (swings) so contam
  depois de confirmados (k barras a seguir). Ha um teste a verificar isto (test_padroes_ict.py).
- O sinal e +1 (leitura de subida) ou -1 (leitura de descida), na barra em que fecha.
- Order Block, OCO e Bandeira/Cunha NAO estao codificados: dependem de escolhas demasiado
  subjetivas para uma definicao unica. Ficam marcados como tal em PADROES.
"""
import json
import numpy as np
import pandas as pd

PADROES = {
    "fvg": {"nome": "Fair Value Gap", "estado": "codificado", "subjetividade": "baixa",
            "definicao": "Tres velas: FVG de subida se minimo[t] > maximo[t-2]; de descida se maximo[t] < minimo[t-2]. Sinal na vela t."},
    "sweep": {"nome": "Liquidity Sweep (SSL/BSL)", "estado": "codificado", "subjetividade": "media",
              "definicao": "Ultimo swing confirmado (k barras): sweep de SSL (+1) se minimo[t] < nivel e fecho[t] > nivel; BSL (-1) se maximo[t] > nivel e fecho[t] < nivel. Nivel com idade maxima."},
    "bos": {"nome": "Break of Structure", "estado": "codificado", "subjetividade": "media",
            "definicao": "Fecho acima do ultimo swing high confirmado (+1) ou abaixo do ultimo swing low (-1), uma vez por swing."},
    "choch": {"nome": "Change of Character", "estado": "codificado", "subjetividade": "alta",
              "definicao": "BOS contrario ao sentido do BOS anterior."},
    "double": {"nome": "Topo/Fundo Duplo", "estado": "codificado", "subjetividade": "media",
               "definicao": "Dois swings a menos de tol*ATR um do outro, separados por min_sep..max_sep barras; sinal no fecho para la da neckline (minimo/maximo entre eles). Topo duplo = -1, fundo duplo = +1."},
    "ob": {"nome": "Order Block", "estado": "nao codificado", "subjetividade": "muito alta",
           "definicao": "Ultima vela contraria antes de um deslocamento. Varias definicoes incompativeis (corpo vs pavio, 50%, mitigacao)."},
    "oco": {"nome": "Ombro-Cabeca-Ombro", "estado": "nao codificado", "subjetividade": "muito alta",
            "definicao": "Exige tres pivots com regras de simetria arbitrarias; fica para depois do topo duplo ser avaliado."},
    "bandeira": {"nome": "Bandeira & Cunha", "estado": "nao codificado", "subjetividade": "muito alta",
                 "definicao": "Mastro + consolidacao: limiares de inclinacao e duracao sao escolhas livres."},
}


def exportar_json(caminho="padroes.json"):
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(PADROES, f, ensure_ascii=False, indent=2)


def _prep(df):
    d = df.copy()
    d.columns = [str(c).strip().lower() for c in d.columns]
    for c in ("open", "high", "low", "close"):
        if c not in d.columns:
            raise ValueError("falta a coluna %s" % c)
    return d.reset_index(drop=True)


def swings(df, k=3):
    """Devolve (highs, lows): listas de (idx_pivot, idx_confirmacao, preco)."""
    d = _prep(df)
    h, l, n = d["high"].values, d["low"].values, len(d)
    sh, sl = [], []
    for i in range(k, n - k):
        if h[i] > h[i - k:i].max() and h[i] >= h[i + 1:i + k + 1].max():
            sh.append((i, i + k, h[i]))
        if l[i] < l[i - k:i].min() and l[i] <= l[i + 1:i + k + 1].min():
            sl.append((i, i + k, l[i]))
    return sh, sl


def _confirmados(lista, t, ptr):
    """Avanca ptr ate ao ultimo swing com confirmacao < t."""
    while ptr < len(lista) and lista[ptr][1] < t:
        ptr += 1
    return ptr


def fvg(df):
    d = _prep(df)
    h, l = d["high"].values, d["low"].values
    s = np.zeros(len(d), dtype=int)
    for t in range(2, len(d)):
        if l[t] > h[t - 2]:
            s[t] = 1
        elif h[t] < l[t - 2]:
            s[t] = -1
    return pd.Series(s)


def sweep(df, k=3, max_age=50):
    d = _prep(df)
    h, l, c = d["high"].values, d["low"].values, d["close"].values
    sh, sl = swings(d, k)
    s = np.zeros(len(d), dtype=int)
    ph = pl = 0
    for t in range(len(d)):
        ph = _confirmados(sh, t, ph)
        pl = _confirmados(sl, t, pl)
        if pl > 0:
            i, _, p = sl[pl - 1]
            if t - i <= max_age and l[t] < p and c[t] > p:
                s[t] = 1
        if ph > 0 and s[t] == 0:
            i, _, p = sh[ph - 1]
            if t - i <= max_age and h[t] > p and c[t] < p:
                s[t] = -1
    return pd.Series(s)


def bos_choch(df, k=3):
    d = _prep(df)
    c = d["close"].values
    sh, sl = swings(d, k)
    bos = np.zeros(len(d), dtype=int)
    choch = np.zeros(len(d), dtype=int)
    ph = pl = 0
    tendencia = 0
    quebrado_h = quebrado_l = -1
    for t in range(len(d)):
        ph = _confirmados(sh, t, ph)
        pl = _confirmados(sl, t, pl)
        if ph > 0:
            i, _, p = sh[ph - 1]
            if c[t] > p and i != quebrado_h:
                quebrado_h = i
                bos[t] = 1
                if tendencia == -1:
                    choch[t] = 1
                tendencia = 1
        if pl > 0 and bos[t] == 0:
            i, _, p = sl[pl - 1]
            if c[t] < p and i != quebrado_l:
                quebrado_l = i
                bos[t] = -1
                if tendencia == 1:
                    choch[t] = -1
                tendencia = -1
    return pd.Series(bos), pd.Series(choch)


def _atr(d, n=14):
    pc = d["close"].shift(1)
    tr = pd.concat([d["high"] - d["low"], (d["high"] - pc).abs(), (d["low"] - pc).abs()], axis=1).max(axis=1)
    return tr.rolling(n, min_periods=n).mean().values


def double_top_bottom(df, k=3, tol_atr=0.5, min_sep=5, max_sep=60, janela=30):
    d = _prep(df)
    c, h, l = d["close"].values, d["high"].values, d["low"].values
    atr = _atr(d)
    sh, sl = swings(d, k)
    s = np.zeros(len(d), dtype=int)
    feitos = set()
    ph = pl = 0
    for t in range(len(d)):
        if np.isnan(atr[t]):
            continue
        ph = _confirmados(sh, t, ph)
        pl = _confirmados(sl, t, pl)
        if ph >= 2:
            (ia, _, pa), (ib, cb, pb) = sh[ph - 2], sh[ph - 1]
            if ("T", ib) not in feitos and min_sep <= ib - ia <= max_sep \
                    and abs(pa - pb) <= tol_atr * atr[t] and t - cb <= janela:
                neck = l[ia:ib + 1].min()
                if c[t] < neck:
                    s[t] = -1
                    feitos.add(("T", ib))
        if pl >= 2 and s[t] == 0:
            (ia, _, pa), (ib, cb, pb) = sl[pl - 2], sl[pl - 1]
            if ("B", ib) not in feitos and min_sep <= ib - ia <= max_sep \
                    and abs(pa - pb) <= tol_atr * atr[t] and t - cb <= janela:
                neck = h[ia:ib + 1].max()
                if c[t] > neck:
                    s[t] = 1
                    feitos.add(("B", ib))
    return pd.Series(s)


def detetar_todos(df, k=3):
    d = _prep(df)
    bos, choch = bos_choch(d, k)
    return pd.DataFrame({"fvg": fvg(d), "sweep": sweep(d, k), "bos": bos,
                         "choch": choch, "double": double_top_bottom(d, k)})
