import { expect, it } from 'vitest';
import { estoqueSearchSchema } from './estoque-search.schema';

it('lê o filtro baixo=1', () => {
  expect(estoqueSearchSchema.parse({ baixo: '1' })).toEqual({ baixo: '1' });
});

it('aceita a URL sem parâmetros', () => {
  expect(estoqueSearchSchema.parse({})).toEqual({});
});

it('ignora valores inválidos sem derrubar a tela', () => {
  expect(estoqueSearchSchema.parse({ baixo: 'sim' })).toEqual({
    baixo: undefined,
  });
  expect(
    estoqueSearchSchema.parse({ baixo: ['1', '1'] }).baixo,
  ).toBeUndefined();
});

it('lê a busca e ignora a busca vazia', () => {
  expect(estoqueSearchSchema.parse({ q: ' farinha ' }).q).toBe('farinha');
  expect(estoqueSearchSchema.parse({ q: '  ' }).q).toBeUndefined();
});
