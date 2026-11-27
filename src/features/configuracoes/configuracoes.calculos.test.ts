import { describe, expect, it } from 'vitest';
import {
  calcularValorHora,
  formatComissao,
  percentualDaApi,
  percentualDaTela,
} from './configuracoes.calculos';

describe('percentualDaApi (fração da API → texto do campo)', () => {
  it.each([
    [0.15, '15'],
    [0.0136, '1,36'],
    [0.152, '15,2'],
    [0.07, '7'],
    [0, '0'],
    [1, '100'],
  ])('%s vira "%s"', (fracao, texto) => {
    expect(percentualDaApi(fracao)).toBe(texto);
  });
});

describe('percentualDaTela (percentual digitado → fração da API)', () => {
  it.each([
    [15, 0.15],
    [1.36, 0.0136],
    [7, 0.07],
    [26.2, 0.262],
    [0, 0],
    [100, 1],
  ])('%s vira %s, sem ruído de ponto flutuante', (pontos, fracao) => {
    expect(percentualDaTela(pontos)).toBe(fracao);
  });

  it('a ida e a volta devolvem o mesmo valor', () => {
    for (const fracao of [0.0136, 0.152, 0.262, 0.333]) {
      const texto = percentualDaApi(fracao);
      expect(percentualDaTela(Number(texto.replace(',', '.')))).toBe(fracao);
    }
  });
});

describe('formatComissao', () => {
  it.each([
    [0.152, '15,2%'],
    [0.0136, '1,36%'],
    [0, '0%'],
  ])('%s vira "%s"', (fracao, texto) => {
    expect(formatComissao(fracao)).toBe(texto);
  });
});

describe('calcularValorHora (ganho do mês ÷ horas de produção)', () => {
  it('R$ 1.500 em 80 h dá R$ 18,75', () => {
    expect(calcularValorHora(1500, 80)).toEqual({ valor: 18.75 });
  });

  it('arredonda para 2 casas', () => {
    expect(calcularValorHora(1000, 3)).toEqual({ valor: 333.33 });
    expect(calcularValorHora(100, 6)).toEqual({ valor: 16.67 });
  });

  it('ganho 0 dá hora 0', () => {
    expect(calcularValorHora(0, 80)).toEqual({ valor: 0 });
  });

  it('não calcula sem o ganho', () => {
    expect(calcularValorHora(null, 80)).toEqual({
      motivo: 'Diga quanto você quer ganhar por mês para fazer a conta.',
    });
  });

  it('não calcula com as horas vazias', () => {
    expect(calcularValorHora(1500, null)).toEqual({
      motivo: 'Diga quantas horas por mês você passa produzindo.',
    });
  });

  it.each([0, -5])('não calcula com %s horas', (horas) => {
    expect(calcularValorHora(1500, horas)).toEqual({
      motivo:
        'Com 0 horas não dá para fazer a conta. Conte as horas em que você está produzindo.',
    });
  });
});
