import { expect, test } from '@playwright/test';
import { entrar } from './support/sessao';

test('abre a página inicial com sessão e recebe 200', async ({ page }) => {
  await entrar(page);

  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Doce Fatia');
  await expect(page.getByRole('heading', { name: 'Oi, João!' })).toBeVisible();
});

test('alcança a API em /api/health', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.status()).toBe(200);
  // A API falsa (ou o monolito local, com E2E_API_REAL) responde o /health.
  expect(await response.json()).toEqual({
    status: 'ok',
    api: { reachable: true },
  });
});
