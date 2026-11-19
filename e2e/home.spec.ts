import { expect, test } from '@playwright/test';
import { entrar } from './support/sessao';

test('abre a página inicial com sessão e recebe 200', async ({ page }) => {
  await entrar(page);

  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('LucroAI');
  await expect(page.getByRole('heading', { name: 'LucroAI' })).toBeVisible();
});

test('alcança os cinco serviços em /api/health', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    status: string;
    services: Record<string, { reachable: boolean }>;
  };
  expect(body.status).toBe('ok');
  expect(Object.keys(body.services).toSorted()).toEqual([
    'auth',
    'catalog',
    'operations',
    'recipe',
    'sales',
  ]);
  // A API falsa (ou o backend local, com E2E_API_REAL) atende os cinco.
  expect(
    Object.values(body.services).every((service) => service.reachable),
  ).toBe(true);
});
