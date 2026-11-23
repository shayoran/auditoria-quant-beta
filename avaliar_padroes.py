# -*- coding: utf-8 -*-
"""
avaliar_padroes.py - estudo de eventos dos padroes de padroes_ict.py num CSV OHLC.

Uso:
  python avaliar_padroes.py dados_BTC_H4.csv --custo-bps 10 --horizontes 6 12
  python avaliar_padroes.py dados_BTC_H4.csv --usar-holdout      # SO UMA VEZ, no fim

Metodo:
- Entrada na abertura da barra seguinte ao sinal, saida no fecho h barras depois, custo de ida e volta (bps).
- Eventos sobrepostos descartados (um evento so conta se passaram h barras desde o anterior aceite).
- net    = media(direcao*retorno) - custo
- excess = media(direcao*retorno) - media incondicional da mesma direcao em todas as barras
- IC por bootstrap com correcao de Bonferroni para TODOS os testes (padrao x direcao x horizonte).
- Por defeito so usa os primeiros (1-holdout) dos dados; o holdout fica intocado.
Veredito: "candidato" so se os limites inferiores de net E excess forem > 0; "negativo" se o limite
superior de net for < 0; caso contrario "sem vantagem detetada". Candidato NAO e prova: vai ao holdout.
"""
import argparse
import numpy as np
import pandas as pd
from padroes_ict import detetar_todos

PADROES_AVALIADOS = ["fvg", "sweep", "bos", "choch", "double"]


def carregar(caminho):
    d = pd.read_csv(caminho, sep=None, engine="python")
    d.columns = [str(c).strip().lower() for c in d.columns]
    for c in ("time", "date", "datetime", "timestamp"):
        if c in d.columns:
            d = d.sort_values(c)
            break
    return d.reset_index(drop=True)


def retornos(d, h):
    o, c = d["open"].values, d["close"].values
    r = np.full(len(d), np.nan)
    for t in range(len(d) - h - 1):
        r[t] = c[t + h] / o[t + 1] - 1
    return r


def sem_sobreposicao(idx, h):
    ok, ultimo = [], -10**9
    for t in idx:
        if t - ultimo >= h:
            ok.append(t)
            ultimo = t
    return np.array(ok, dtype=int)


def ic_boot(x, alfa, n=5000, seed=1):
    r = np.random.default_rng(seed)
    m = r.choice(x, size=(n, len(x)), replace=True).mean(axis=1)
    return np.quantile(m, alfa / 2), np.quantile(m, 1 - alfa / 2)


def avaliar(d, horizontes, custo_bps, k):
    sinais = detetar_todos(d, k)
    combos = len(PADROES_AVALIADOS) * 2 * len(horizontes)
    alfa = 0.05 / combos
    custo = custo_bps / 1e4
    linhas = []
    for h in horizontes:
        r = retornos(d, h)
        valido = ~np.isnan(r)
        base = {1: r[valido].mean(), -1: -r[valido].mean()}
        for p in PADROES_AVALIADOS:
            for dirc in (1, -1):
                idx = np.where((sinais[p].values == dirc) & valido)[0]
                idx = sem_sobreposicao(idx, h)
                n = len(idx)
                if n < 20:
                    linhas.append(dict(padrao=p, direcao=dirc, horizonte=h, n=n,
                                       net_medio=np.nan, net_lo=np.nan, net_hi=np.nan,
                                       exc_lo=np.nan, exc_hi=np.nan,
                                       veredito="amostra insuficiente (n<20)"))
                    continue
                g = dirc * r[idx]
                net = g - custo
                exc = g - base[dirc]
                nlo, nhi = ic_boot(net, alfa)
                elo, ehi = ic_boot(exc, alfa)
                if nlo > 0 and elo > 0:
                    v = "candidato (precisa de holdout)"
                elif nhi < 0:
                    v = "negativo"
                else:
                    v = "sem vantagem detetada"
                linhas.append(dict(padrao=p, direcao=dirc, horizonte=h, n=n,
                                   net_medio=net.mean(), net_lo=nlo, net_hi=nhi,
                                   exc_lo=elo, exc_hi=ehi, veredito=v))
    return pd.DataFrame(linhas), combos, alfa


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--horizontes", type=int, nargs="+", default=[6, 12])
    ap.add_argument("--custo-bps", type=float, default=10.0)
    ap.add_argument("--k", type=int, default=3)
    ap.add_argument("--holdout", type=float, default=0.3)
    ap.add_argument("--usar-holdout", action="store_true")
    ap.add_argument("--saida", default="resultados_padroes.csv")
    a = ap.parse_args()

    d = carregar(a.csv)
    corte = int(len(d) * (1 - a.holdout))
    d = d.iloc[corte:] if a.usar_holdout else d.iloc[:corte]
    d = d.reset_index(drop=True)
    print("Barras usadas: %d (%s)" % (len(d), "HOLDOUT" if a.usar_holdout else "exploracao"))
    res, combos, alfa = avaliar(d, a.horizontes, a.custo_bps, a.k)
    res.to_csv(a.saida, index=False, encoding="utf-8")
    pd.set_option("display.width", 200)
    print(res.round(5).to_string(index=False))
    print("\nTestes: %d | alfa por teste (Bonferroni): %.5f" % (combos, alfa))
    print("Candidatos:", int((res["veredito"].str.startswith("candidato")).sum()))
    print("Escolhe os parametros ANTES de ver os resultados; mexer neles e repetir invalida o holdout.")


if __name__ == "__main__":
    main()
