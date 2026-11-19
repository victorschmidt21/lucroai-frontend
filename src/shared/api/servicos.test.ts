import { expect, it } from 'vitest';
import { isServico, SERVICOS } from './servicos';

it('conhece os cinco serviços do backend', () => {
  expect(SERVICOS).toEqual([
    'auth',
    'catalog',
    'recipe',
    'operations',
    'sales',
  ]);
  expect(isServico('catalog')).toBe(true);
  expect(isServico('internal')).toBe(false);
});
