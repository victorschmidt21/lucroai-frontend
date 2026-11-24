import { describe, expect, it } from 'vitest';
import {
  CAPACIDADE_MENSAL_PADRAO,
  passosIniciais,
  type DadosDosPassos,
} from './primeiros-passos';

const VAZIA: DadosDosPassos = {
  insumos: [],
  gastos: [],
  configuracao: { capacidadeMensal: CAPACIDADE_MENSAL_PADRAO },
  receitas: [],
  vendas: [],
};

const COMPLETA: DadosDosPassos = {
  insumos: [{}, {}, {}],
  gastos: [{ tipo: 'MENSAL' }],
  configuracao: { capacidadeMensal: 100 },
  receitas: [{}],
  vendas: [{ status: 'CONCLUIDA' }],
};

function feitos(dados: DadosDosPassos) {
  return passosIniciais(dados).map((p) => p.feito);
}

describe('passosIniciais', () => {
  it('conta vazia: nenhum passo feito, na ordem da tabela', () => {
    const passos = passosIniciais(VAZIA);
    expect(passos.map((p) => p.id)).toEqual([
      'ingredientes',
      'contas',
      'fornadas',
      'receita',
      'venda',
    ]);
    expect(passos.map((p) => p.href)).toEqual([
      '/insumos',
      '/gastos-indiretos',
      '/configuracoes',
      '/receitas/nova',
      '/vendas',
    ]);
    expect(feitos(VAZIA)).toEqual([false, false, false, false, false]);
  });

  it('conta completa: os 5 passos feitos', () => {
    expect(feitos(COMPLETA)).toEqual([true, true, true, true, true]);
  });

  it('parcial: 2 ingredientes, só contas por unidade e venda pendente não contam', () => {
    expect(
      feitos({
        ...COMPLETA,
        insumos: [{}, {}],
        gastos: [{ tipo: 'POR_UNIDADE' }, { tipo: 'PERCENTUAL_VENDA' }],
        vendas: [{ status: 'PENDENTE' }, { status: 'CANCELADA' }],
      }),
    ).toEqual([false, false, true, true, false]);
  });

  it('parcial: o terceiro ingrediente marca o passo 1', () => {
    expect(feitos({ ...VAZIA, insumos: [{}, {}, {}] })).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('configuração padrão (40 fornadas) não conta; qualquer outro valor conta', () => {
    expect(feitos(COMPLETA)[2]).toBe(true);
    expect(
      feitos({ ...COMPLETA, configuracao: { capacidadeMensal: 40 } })[2],
    ).toBe(false);
    expect(
      feitos({ ...COMPLETA, configuracao: { capacidadeMensal: 39.5 } })[2],
    ).toBe(true);
  });
});
