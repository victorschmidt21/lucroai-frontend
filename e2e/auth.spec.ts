import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  definirCookie,
  entrar,
  excessoHorizontal,
  preencherLogin,
  SESSION_COOKIE,
  tokenFalso,
} from './support/sessao';

const BASE_URL = 'http://localhost:3000';

test('leva ao login sem sessão e, ao entrar, volta à página de destino', async ({
  page,
  context,
}) => {
  await page.goto('/?origem=teste');
  await expect(page).toHaveURL('/login?redirect=%2F%3Forigem%3Dteste');

  await preencherLogin(page);

  await expect(page).toHaveURL('/?origem=teste');
  await expect(page.getByText('João da Silva')).toBeVisible();
  await expect(page.getByText('Padaria Pão Feliz Ltda')).toBeVisible();

  // Nenhum token fica ao alcance do JavaScript da página.
  const visivel = await page.evaluate(() => ({
    cookie: document.cookie,
    local: localStorage.length,
    sessao: sessionStorage.length,
  }));
  expect(visivel).toEqual({ cookie: '', local: 0, sessao: 0 });
  const cookie = (await context.cookies()).find(
    (item) => item.name === SESSION_COOKIE,
  );
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
  // O cookie vence com o JWT: 4 h, com folga para a duração do teste.
  const restante = (cookie?.expires ?? 0) - Date.now() / 1000;
  expect(restante).toBeGreaterThan(4 * 60 * 60 - 120);
  expect(restante).toBeLessThanOrEqual(4 * 60 * 60);
});

test('mostra "E-mail ou senha inválidos" com a senha errada', async ({
  page,
  context,
}) => {
  await page.goto('/login');

  await preencherLogin(page, 'senha-errada');

  // Só no formulário: o Next mantém o próprio `role="alert"` para anunciar rotas.
  await expect(page.locator('form').getByRole('alert')).toHaveText(
    'E-mail ou senha inválidos',
  );
  await expect(page).toHaveURL('/login');
  expect(await context.cookies()).toEqual([]);
});

test('valida os campos antes de chamar a API', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Informe seu e-mail')).toBeVisible();
  await expect(page.getByText('Informe sua senha')).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeFocused();
});

test('sai da conta, apaga o cookie e tira quem tem sessão do login', async ({
  page,
  context,
}) => {
  await entrar(page);

  await page.goto('/login?redirect=%2F%3Fvoltou%3D1');
  await expect(page).toHaveURL('/?voltou=1');

  await page.getByRole('button', { name: 'Sair' }).click();

  await expect(page).toHaveURL('/login');
  const nomes = (await context.cookies()).map((cookie) => cookie.name);
  expect(nomes).not.toContain(SESSION_COOKIE);

  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

test('com o token vencido, leva ao login com o aviso e preserva o destino', async ({
  page,
  context,
}) => {
  await definirCookie(context, BASE_URL, tokenFalso(-60));

  await page.goto('/?pagina=2');

  await expect(page).toHaveURL('/login?redirect=%2F%3Fpagina%3D2&expirada=1');
  await expect(page.getByRole('status')).toHaveText(
    'Sessão expirada. Faça login novamente.',
  );

  await preencherLogin(page);
  await expect(page).toHaveURL('/?pagina=2');
});

test('o proxy injeta o token, recusa serviço desconhecido e rotas internal', async ({
  page,
}) => {
  await entrar(page);

  const pedidos: [string, RequestInit?][] = [
    ['/api/backend/catalog/insumos'],
    ['/api/backend/pagamentos/x'],
    ['/api/backend/catalog/insumos/internal/1'],
    [
      '/api/backend/auth/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      },
    ],
  ];
  const [insumos, desconhecido, internal, loginPeloProxy] = await page.evaluate(
    (lista) =>
      Promise.all(
        lista.map(([url, init]) =>
          fetch(url, init).then((response) => response.status),
        ),
      ),
    pedidos,
  );
  const status = { insumos, desconhecido, internal, loginPeloProxy };

  expect(status).toEqual({
    insumos: 200,
    desconhecido: 404,
    internal: 403,
    loginPeloProxy: 404,
  });
});

test('o 401 de um serviço apaga o cookie', async ({ page, context }) => {
  await entrar(page);
  // Um token que o front lê como válido, mas que o backend recusa.
  await definirCookie(context, BASE_URL, tokenFalso(60 * 60));

  const status = await page.evaluate(() =>
    fetch('/api/backend/catalog/insumos').then((response) => response.status),
  );

  expect(status).toBe(401);
  const nomes = (await context.cookies()).map((cookie) => cookie.name);
  expect(nomes).not.toContain(SESSION_COOKIE);
});

test.describe('tela de login', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('não tem violações de acessibilidade, inclusive com erros', async ({
    page,
  }) => {
    await page.goto('/login?expirada=1');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Informe seu e-mail')).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test('cabe em 360px sem rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/login');

    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    expect(await excessoHorizontal(page)).toBeLessThanOrEqual(0);
  });

  test('mostra e oculta a senha', async ({ page }) => {
    await page.goto('/login');
    const senha = page.getByLabel('Senha', { exact: true });

    await page.getByRole('button', { name: 'Mostrar senha' }).click();
    await expect(senha).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar senha' }).click();
    await expect(senha).toHaveAttribute('type', 'password');
  });
});
