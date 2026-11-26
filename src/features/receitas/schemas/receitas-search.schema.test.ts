import { expect, it } from 'vitest';
import { receitasSearchSchema } from './receitas-search.schema';

it('lê os filtros "vendo" e "dentro"', () => {
  expect(receitasSearchSchema.parse({ tipo: 'vendo' }).tipo).toBe('vendo');
  expect(receitasSearchSchema.parse({ tipo: 'dentro' }).tipo).toBe('dentro');
});

it('sem filtro mostra todas', () => {
  expect(receitasSearchSchema.parse({}).tipo).toBeUndefined();
});

it('ignora valores inválidos sem derrubar a tela', () => {
  expect(receitasSearchSchema.parse({ tipo: 'todas' }).tipo).toBeUndefined();
  expect(receitasSearchSchema.parse({ tipo: ['vendo'] }).tipo).toBeUndefined();
});
