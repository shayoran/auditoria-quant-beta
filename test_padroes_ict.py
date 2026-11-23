# -*- coding: utf-8 -*-
import unittest
import numpy as np
import pandas as pd
import padroes_ict as P


def df_de(ohlc):
    return pd.DataFrame(ohlc, columns=["open", "high", "low", "close"])


def passeio(n=600, seed=7):
    r = np.random.default_rng(seed)
    c = 100 * np.exp(np.cumsum(r.normal(0, 0.01, n)))
    o = np.r_[c[0], c[:-1]]
    h = np.maximum(o, c) * (1 + np.abs(r.normal(0, 0.004, n)))
    l = np.minimum(o, c) * (1 - np.abs(r.normal(0, 0.004, n)))
    return pd.DataFrame({"open": o, "high": h, "low": l, "close": c})


class TestFVG(unittest.TestCase):
    def test_fvg_subida(self):
        d = df_de([[10, 11, 9, 10], [10, 14, 10, 13], [13, 15, 12, 14]])
        self.assertEqual(P.fvg(d).tolist(), [0, 0, 1])   # minimo[2]=12 > maximo[0]=11

    def test_fvg_descida(self):
        d = df_de([[20, 21, 19, 20], [20, 20, 16, 17], [17, 18, 15, 16]])
        self.assertEqual(P.fvg(d).tolist(), [0, 0, -1])  # maximo[2]=18 < minimo[0]=19

    def test_sem_fvg_quando_sobrepoe(self):
        d = df_de([[10, 11, 9, 10], [10, 12, 10, 11], [11, 12, 10, 11]])
        self.assertEqual(P.fvg(d).tolist(), [0, 0, 0])


class TestSweep(unittest.TestCase):
    def test_ssl_sweep(self):
        # fundo a 90 (i=3), recupera; depois mergulha abaixo de 90 e fecha acima
        base = [[100, 101, 99, 100]] * 3
        v = base + [[96, 97, 90, 92]] + [[92, 99, 91, 98]] * 4 + [[98, 100, 97, 99]] * 2 \
            + [[99, 100, 88, 95]]
        s = P.sweep(df_de(v), k=2)
        self.assertEqual(s.iloc[-1], 1)

    def test_bsl_sweep(self):
        base = [[100, 101, 99, 100]] * 3
        v = base + [[104, 110, 103, 108]] + [[108, 109, 101, 102]] * 4 + [[102, 103, 100, 101]] * 2 \
            + [[102, 113, 101, 105]]
        s = P.sweep(df_de(v), k=2)
        self.assertEqual(s.iloc[-1], -1)


class TestBOS(unittest.TestCase):
    def test_bos_de_subida(self):
        v = [[100, 101, 99, 100]] * 3 + [[104, 110, 103, 108]] + [[108, 109, 101, 102]] * 4 \
            + [[102, 103, 100, 101]] * 2 + [[102, 113, 101, 112]]
        bos, _ = P.bos_choch(df_de(v), k=2)
        self.assertEqual(bos.iloc[-1], 1)


class TestSemOlharParaOFuturo(unittest.TestCase):
    """O sinal em t nao pode mudar se cortarmos os dados depois de t."""

    def test_prefixos(self):
        d = passeio()
        completo = P.detetar_todos(d)
        for corte in (150, 300, 450):
            parcial = P.detetar_todos(d.iloc[:corte + 1])
            for col in completo.columns:
                self.assertTrue((completo[col].iloc[:corte + 1].values == parcial[col].values).all(),
                                "olha para o futuro: %s corte=%d" % (col, corte))


class TestRobustez(unittest.TestCase):
    def test_colunas_em_maiusculas(self):
        d = passeio(200).rename(columns=str.upper)
        self.assertEqual(len(P.detetar_todos(d)), 200)

    def test_falta_coluna(self):
        with self.assertRaises(ValueError):
            P.fvg(pd.DataFrame({"open": [1], "high": [1]}))


if __name__ == "__main__":
    unittest.main(verbosity=2)
