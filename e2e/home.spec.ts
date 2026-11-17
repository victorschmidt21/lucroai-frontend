import { expect, test } from '@playwright/test';

test('abre a página inicial e recebe 200', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('LucroAI');
  await expect(page.getByRole('heading', { name: 'LucroAI' })).toBeVisible();
});

test('informa o estado dos cinco serviços em /api/health', async ({
  request,
}) => {
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
});
