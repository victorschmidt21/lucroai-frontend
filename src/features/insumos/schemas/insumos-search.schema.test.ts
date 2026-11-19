import { expect, it } from 'vitest';
import { insumosSearchSchema } from './insumos-search.schema';

it('lê a busca e o novo=1', () => {
  expect(insumosSearchSchema.parse({ q: ' acucar ', novo: '1' })).toEqual({
    q: 'acucar',
    novo: '1',
  });
});

it('aceita a URL sem parâmetros', () => {
  expect(insumosSearchSchema.parse({})).toEqual({});
});

it('ignora valores inválidos sem derrubar a tela', () => {
  expect(insumosSearchSchema.parse({ q: ['a', 'b'], novo: 'sim' })).toEqual({
    q: undefined,
    novo: undefined,
  });
  expect(insumosSearchSchema.parse({ q: '   ' }).q).toBeUndefined();
});
