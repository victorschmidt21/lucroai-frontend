import { describe, expect, it } from 'vitest';
import {
  calcularCustoReal,
  lerCamposCustoReal,
  type CamposCustoReal,
  type EntradaCustoReal,
} from './custos.calculos';

const ENTRADA: EntradaCustoReal = {
  ingredientes: 30,
  energia: 5,
  agua: 2,
  gas: 3,
  horas: 2,
  valorHora: 15,
  rendimento: 20,
};

const VAZIO: CamposCustoReal = {
  ingredientes: '',
  energia: '',
  agua: '',
  gas: '',
  horas: '',
  valorHora: '',
  rendimento: '',
};

describe('calcularCustoReal', () => {
  it('soma os custos invisíveis aos ingredientes e divide pelo rendimento', () => {
    // maoDeObra = 2 × 15 = 30; invisíveis = 5 + 2 + 3 + 30 = 40; total = 70.
    expect(calcularCustoReal(ENTRADA)).toEqual({
      maoDeObra: 30,
      custosInvisiveis: 40,
      custoTotal: 70,
      custoPorUnidade: 3.5,
      percentualInvisivel: (40 / 70) * 100,
    });
  });

  it('rendimento 0 dá custo por unidade 0, e não Infinity', () => {
    const resultado = calcularCustoReal({ ...ENTRADA, rendimento: 0 });
    expect(resultado.custoPorUnidade).toBe(0);
    expect(resultado.custoTotal).toBe(70);
  });

  it('custo total 0 dá percentual 0, e não NaN', () => {
    expect(
      calcularCustoReal({
        ingredientes: 0,
        energia: 0,
        agua: 0,
        gas: 0,
        horas: 0,
        valorHora: 0,
        rendimento: 1,
      }),
    ).toEqual({
      maoDeObra: 0,
      custosInvisiveis: 0,
      custoTotal: 0,
      custoPorUnidade: 0,
      percentualInvisivel: 0,
    });
  });

  it('só ingredientes: nenhum custo invisível', () => {
    const resultado = calcularCustoReal({
      ...ENTRADA,
      energia: 0,
      agua: 0,
      gas: 0,
      horas: 0,
    });
    expect(resultado.percentualInvisivel).toBe(0);
    expect(resultado.custoPorUnidade).toBe(1.5);
  });
});

describe('lerCamposCustoReal', () => {
  it('lê valores com vírgula e com separador de milhar', () => {
    expect(
      lerCamposCustoReal({
        ingredientes: '1.234,56',
        energia: '2,5',
        agua: '1.5',
        gas: '0,75',
        horas: '1,5',
        valorHora: '12,00',
        rendimento: '10',
      }),
    ).toEqual({
      ingredientes: 1234.56,
      energia: 2.5,
      agua: 1.5,
      gas: 0.75,
      horas: 1.5,
      valorHora: 12,
      rendimento: 10,
    });
  });

  it('campo vazio conta como 0, e o resultado não tem NaN', () => {
    const entrada = lerCamposCustoReal(VAZIO);
    expect(Object.values(entrada).every((valor) => valor === 0)).toBe(true);

    const resultado = calcularCustoReal(entrada);
    expect(Object.values(resultado).some(Number.isNaN)).toBe(false);
  });

  it('texto inválido e rendimento fracionado contam como 0', () => {
    const entrada = lerCamposCustoReal({
      ...VAZIO,
      ingredientes: 'abc',
      rendimento: '1,5',
    });
    expect(entrada.ingredientes).toBe(0);
    expect(entrada.rendimento).toBe(0);
  });

  it('com vírgula, o resultado bate com o do mobile', () => {
    // 10,50 + 1,25 + 0,75 + 0,50 + 1,5 × 20,00 = 43,00; 43 / 4 = 10,75.
    const resultado = calcularCustoReal(
      lerCamposCustoReal({
        ingredientes: '10,50',
        energia: '1,25',
        agua: '0,75',
        gas: '0,50',
        horas: '1,5',
        valorHora: '20,00',
        rendimento: '4',
      }),
    );
    expect(resultado.custoTotal).toBeCloseTo(43);
    expect(resultado.custoPorUnidade).toBeCloseTo(10.75);
  });
});
