import { describe, expect, it } from 'vitest';
import { getItemAtivo, ITENS_MENU } from './menu';

describe('ITENS_MENU', () => {
  it('tem os oito destinos na ordem do mobile', () => {
    expect(ITENS_MENU.map(({ label, href }) => [label, href])).toEqual([
      ['Home', '/'],
      ['Insumos', '/insumos'],
      ['Receitas', '/receitas'],
      ['Custos', '/custos'],
      ['Vendas', '/vendas'],
      ['Estoque', '/estoque'],
      ['Produção', '/producoes'],
      ['Gastos', '/gastos-indiretos'],
    ]);
  });
});

describe('getItemAtivo', () => {
  it.each([
    ['/', 'Home'],
    ['/insumos', 'Insumos'],
    ['/receitas/nova', 'Receitas'],
    ['/receitas/3/editar', 'Receitas'],
    ['/custos', 'Custos'],
    ['/vendas', 'Vendas'],
    ['/estoque', 'Estoque'],
    ['/producoes', 'Produção'],
    ['/gastos-indiretos', 'Gastos'],
    ['/configuracoes', 'Configurações de custo'],
  ])('em %s, é %s', (pathname, label) => {
    expect(getItemAtivo(pathname)?.label).toBe(label);
  });

  it('não marca nada fora do menu nem em rota de mesmo começo', () => {
    expect(getItemAtivo('/simulacao')).toBeUndefined();
    expect(getItemAtivo('/insumos-antigos')).toBeUndefined();
  });
});
