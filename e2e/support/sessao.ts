import { expect, type BrowserContext, type Page } from '@playwright/test';

// Usuário do seed, aceito pela API falsa (e2e/support/fake-api.mjs) e pelo
// backend real (E2E_API_REAL=true).
export const EMAIL = 'joao@padariapaofeliz.com.br';
export const SENHA = '123456';
export const SESSION_COOKIE = 'lucroai_sessao';

export async function preencherLogin(page: Page, senha = SENHA) {
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

/** Entra pela tela de login e espera o menu do usuário, como uma pessoa faria. */
export async function entrar(page: Page) {
  await page.goto('/login');
  await preencherLogin(page);
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
}

function base64Url(valor: unknown) {
  return Buffer.from(JSON.stringify(valor)).toString('base64url');
}

/**
 * JWT com o payload do seed e a assinatura errada: o front o lê, mas o
 * backend (falso ou real) o recusa com 401. `expSegundos` é relativo a agora.
 */
export function tokenFalso(expSegundos: number) {
  const iat = Math.floor(Date.now() / 1000);

  return [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({
      sub: 3,
      email: EMAIL,
      nome: 'João da Silva',
      empresa: {
        id: 3,
        nome: 'Padaria Pão Feliz Ltda',
        cnpj: null,
        segmento: null,
      },
      iat,
      exp: iat + expSegundos,
    }),
    'assinatura-invalida',
  ].join('.');
}

/** Grava o cookie de sessão direto no navegador, como se tivesse sobrado de antes. */
export async function definirCookie(
  context: BrowserContext,
  baseURL: string,
  valor: string,
) {
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: valor,
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/** Quantos pixels o documento passa da largura visível; zero ou menos está ok. */
export function excessoHorizontal(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}
