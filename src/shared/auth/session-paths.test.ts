import { describe, expect, it } from 'vitest';
import { getLoginPath, getSafeRedirect } from './session-paths';

describe('getSafeRedirect', () => {
  it.each([
    ['/insumos', '/insumos'],
    ['/insumos?q=acucar#topo', '/insumos?q=acucar#topo'],
    ['/receitas/1/editar', '/receitas/1/editar'],
  ])('aceita o caminho interno %s', (valor, esperado) => {
    expect(getSafeRedirect(valor)).toBe(esperado);
  });

  it.each([
    ['ausente', undefined],
    ['que não é texto', ['/insumos']],
    ['vazio', ''],
    ['relativo', 'insumos'],
    ['absoluto', 'https://exemplo.com/insumos'],
    ['de protocolo relativo', '//exemplo.com'],
    ['com barra invertida', '/\\exemplo.com'],
    ['com tabulação', '/\t/exemplo.com'],
    ['do próprio login', '/login?redirect=/insumos'],
  ])('troca o destino %s pela página inicial', (_caso, valor) => {
    expect(getSafeRedirect(valor)).toBe('/');
  });
});

describe('getLoginPath', () => {
  it('leva o destino em redirect', () => {
    expect(getLoginPath('/vendas?aba=historico')).toBe(
      '/login?redirect=%2Fvendas%3Faba%3Dhistorico',
    );
  });

  it('omite o redirect da página inicial e de destinos externos', () => {
    expect(getLoginPath('/')).toBe('/login');
    expect(getLoginPath('//exemplo.com')).toBe('/login');
  });

  it('acrescenta o aviso de sessão expirada', () => {
    expect(getLoginPath('/insumos', { expirada: true })).toBe(
      '/login?redirect=%2Finsumos&expirada=1',
    );
    expect(getLoginPath('/', { expirada: true })).toBe('/login?expirada=1');
  });
});
