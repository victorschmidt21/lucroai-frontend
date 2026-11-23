import { describe, expect, it } from 'vitest';
import {
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
