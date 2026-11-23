import { describe, expect, it } from 'vitest';
import {
  getItemAtivo,
  ITENS_BARRA_INFERIOR,
  ITENS_MAIS,
  ITENS_MENU,
} from './menu';

describe('ITENS_MENU', () => {
  it('tem os oito destinos na ordem do mobile, com os nomes de cozinha', () => {
    expect(ITENS_MENU.map(({ label, href }) => [label, href])).toEqual([
      ['Início', '/'],
      ['Ingredientes', '/insumos'],
      ['Receitas', '/receitas'],
      ['Custos', '/custos'],
      ['Vendas', '/vendas'],
      ['Estoque', '/estoque'],
      ['Fornadas', '/producoes'],
      ['Contas do mês', '/gastos-indiretos'],
    ]);
  });
});

describe('barra inferior', () => {
  it('mostra Início, Receitas, Vendas e Estoque, e o resto vai para "Mais"', () => {
    expect(ITENS_BARRA_INFERIOR.map(({ label }) => label)).toEqual([
      'Início',
      'Receitas',
      'Vendas',
      'Estoque',
    ]);
    expect(ITENS_MAIS.map(({ label, href }) => [label, href])).toEqual([
      ['Ingredientes', '/insumos'],
      ['Custos', '/custos'],
      ['Fornadas', '/producoes'],
      ['Contas do mês', '/gastos-indiretos'],
      ['Ajustes de preço', '/configuracoes'],
    ]);
  });
});

describe('getItemAtivo', () => {
  it.each([
    ['/', 'Início'],
    ['/insumos', 'Ingredientes'],
    ['/receitas/nova', 'Receitas'],
    ['/receitas/3/editar', 'Receitas'],
    ['/custos', 'Custos'],
    ['/vendas', 'Vendas'],
    ['/estoque', 'Estoque'],
    ['/producoes', 'Fornadas'],
    ['/gastos-indiretos', 'Contas do mês'],
    ['/configuracoes', 'Ajustes de preço'],
  ])('em %s, é %s', (pathname, label) => {
    expect(getItemAtivo(pathname)?.label).toBe(label);
  });

  it('não marca nada fora do menu nem em rota de mesmo começo', () => {
    expect(getItemAtivo('/simulacao')).toBeUndefined();
    expect(getItemAtivo('/insumos-antigos')).toBeUndefined();
  });
});
