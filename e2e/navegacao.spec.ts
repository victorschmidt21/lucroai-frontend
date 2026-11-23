import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { entrar, excessoHorizontal } from './support/sessao';

// Os oito destinos de src/features/navegacao/menu.ts, com o título de cada tela.
// `barra`: fica na barra inferior do celular; os outros abrem pela gaveta "Mais" (FE-57).
const DESTINOS = [
  {
    rotulo: 'Início',
    rota: '/',
    titulo: 'Oi, João!',
    aba: 'Doce Fatia',
    barra: true,
  },
  {
    rotulo: 'Ingredientes',
    rota: '/insumos',
    titulo: 'Ingredientes e embalagens',
    aba: 'Ingredientes e embalagens | Doce Fatia',
    barra: false,
  },
  {
    rotulo: 'Receitas',
    rota: '/receitas',
    titulo: 'Receitas',
    aba: 'Receitas | Doce Fatia',
    barra: true,
  },
  {
    rotulo: 'Custos',
    rota: '/custos',
    titulo: 'Quanto custa de verdade',
    aba: 'Quanto custa de verdade | Doce Fatia',
    barra: false,
  },
  {
    rotulo: 'Vendas',
    rota: '/vendas',
    titulo: 'Vendas',
    aba: 'Vendas | Doce Fatia',
    barra: true,
  },
  {
    rotulo: 'Estoque',
    rota: '/estoque',
    titulo: 'Estoque',
    aba: 'Estoque | Doce Fatia',
    barra: true,
  },
  {
    rotulo: 'Fornadas',
    rota: '/producoes',
    titulo: 'Fornadas',
    aba: 'Fornadas | Doce Fatia',
    barra: false,
  },
  {
    rotulo: 'Contas do mês',
    rota: '/gastos-indiretos',
    titulo: 'Contas do mês',
    aba: 'Contas do mês | Doce Fatia',
    barra: false,
  },
];

// Cada teste visita várias rotas; no `next dev`, cada uma compila na primeira vez.
test.slow();

const CELULAR = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
];
const DESKTOP = { width: 1280, height: 800 };

/**
 * Os dois menus ficam no DOM, e só um aparece por vez. `includeHidden` mantém a
 * ordem fixa: o menu lateral vem antes da barra inferior.
 */
function menus(page: Page) {
  return page.getByRole('navigation', {
    name: 'Menu principal',
    includeHidden: true,
  });
}

function menuLateral(page: Page) {
  return menus(page).first();
}

function barraInferior(page: Page) {
  return menus(page).last();
}

type Destino = (typeof DESTINOS)[number];

/** Confere URL, título, aba e a ausência de rolagem horizontal. */
async function conferirDestino(page: Page, destino: Destino) {
  // No `next dev`, a primeira visita a cada rota compila a página.
  await expect(page).toHaveURL(destino.rota, { timeout: 20_000 });
  await expect(
    page.getByRole('heading', { level: 1, name: destino.titulo }),
  ).toBeVisible();
  await expect(page).toHaveTitle(destino.aba);
  expect(await excessoHorizontal(page)).toBeLessThanOrEqual(0);
}

/** Percorre os oito itens pelo menu lateral, conferindo também o item ativo. */
async function navegarPeloMenuLateral(page: Page, menu: Locator) {
  // Sai do Início primeiro, para o clique nele também ser uma navegação.
  for (const destino of [...DESTINOS.slice(1), DESTINOS[0]]) {
    await menu.getByRole('link', { name: destino.rotulo }).click();
    await conferirDestino(page, destino);
    await expect(
      menu.getByRole('link', { name: destino.rotulo }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(menu.locator('[aria-current]')).toHaveCount(1);
  }
}

/** O clique só abre a gaveta depois da hidratação, que no `next dev` demora. */
async function abrirGaveta(page: Page, nome: string) {
  const gaveta = page.getByRole('dialog', { name: nome });
  await expect(async () => {
    await page.getByRole('button', { name: nome }).click();
    await expect(gaveta).toBeVisible({ timeout: 1000 });
  }).toPass();
  return gaveta;
}

/**
 * Percorre os oito itens pelo celular: os da barra direto e os outros pela
 * gaveta "Mais", que marca o item atual.
 */
async function navegarPelaBarra(page: Page, barra: Locator) {
  for (const destino of [...DESTINOS.slice(1), DESTINOS[0]]) {
    if (destino.barra) {
      await barra.getByRole('link', { name: destino.rotulo }).click();
      await conferirDestino(page, destino);
      await expect(
        barra.getByRole('link', { name: destino.rotulo }),
      ).toHaveAttribute('aria-current', 'page');
      await expect(barra.locator('[aria-current]')).toHaveCount(1);
    } else {
      const mais = await abrirGaveta(page, 'Mais');
      await mais.getByRole('link', { name: destino.rotulo }).click();
      await expect(mais).toBeHidden();
      await conferirDestino(page, destino);
      await expect(barra.locator('[aria-current]')).toHaveCount(0);
      const aberta = await abrirGaveta(page, 'Mais');
      await expect(
        aberta.getByRole('link', { name: destino.rotulo }),
      ).toHaveAttribute('aria-current', 'page');
      await page.keyboard.press('Escape');
      await expect(aberta).toBeHidden();
    }
  }
}

test.describe('desktop', () => {
  test.use({ viewport: DESKTOP });

  test('navega pelos oito itens do menu lateral, com o menu do usuário', async ({
    page,
  }) => {
    await entrar(page);

    const lateral = page.getByRole('complementary');
    await expect(lateral.getByText('João da Silva')).toBeVisible();
    await expect(lateral.getByRole('button', { name: 'Sair' })).toBeVisible();
    await expect(menuLateral(page)).toBeVisible();
    await expect(barraInferior(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Conta' })).toBeHidden();

    await navegarPeloMenuLateral(page, menuLateral(page));
  });

  test('o menu é percorrido pelo teclado, com foco visível', async ({
    page,
  }) => {
    await entrar(page);
    await page.goto('/vendas');

    await page.keyboard.press('Tab');
    const pular = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(pular).toBeFocused();
    await expect(pular).toBeVisible();

    // Logo e depois os itens, na ordem do menu.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const home = menuLateral(page).getByRole('link', { name: 'Início' });
    await expect(home).toBeFocused();
    const contorno = await home.evaluate(
      (link) => getComputedStyle(link).outlineStyle,
    );
    expect(contorno).toBe('solid');

    for (let i = 0; i < 3; i += 1) await page.keyboard.press('Tab');
    await expect(
      menuLateral(page).getByRole('link', { name: 'Custos' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/custos', { timeout: 20_000 });
  });
});

for (const viewport of CELULAR) {
  test.describe(`celular ${viewport.width}px`, () => {
    test.use({ viewport });

    test('navega pelos oito itens pela barra inferior e pela gaveta "Mais", sem rolagem horizontal', async ({
      page,
    }) => {
      await page.setViewportSize(DESKTOP);
      await entrar(page);
      await page.setViewportSize(viewport);

      await expect(menuLateral(page)).toBeHidden();
      const barra = barraInferior(page);
      await expect(barra).toBeVisible();
      // A barra fica presa embaixo, com os cinco rótulos inteiros (sem cortar nem quebrar).
      const caixa = await barra.boundingBox();
      expect((caixa?.y ?? 0) + (caixa?.height ?? 0)).toBeCloseTo(
        viewport.height,
        0,
      );
      const links = barra.getByRole('link');
      await expect(links).toHaveCount(4);
      for (const link of [
        ...(await links.all()),
        barra.getByRole('button', { name: 'Mais' }),
      ]) {
        const medidas = await link.evaluate((elemento) => ({
          cabe: elemento.scrollWidth <= elemento.clientWidth,
          altura: elemento.getBoundingClientRect().height,
        }));
        expect(medidas.cabe).toBe(true);
        expect(medidas.altura).toBeGreaterThanOrEqual(44);
      }

      await navegarPelaBarra(page, barra);
    });

    test('abre o menu do usuário pelo botão "Conta" e sai', async ({
      page,
    }) => {
      await page.setViewportSize(DESKTOP);
      await entrar(page);
      await page.setViewportSize(viewport);

      const gaveta = await abrirGaveta(page, 'Conta');
      await expect(gaveta.getByText('Padaria Pão Feliz Ltda')).toBeVisible();
      await gaveta.getByRole('button', { name: 'Sair' }).click();

      await expect(page).toHaveURL('/login', { timeout: 20_000 });
    });
  });
}

test('mostra o 404 dentro do layout, com o menu', async ({ page }) => {
  await entrar(page);

  // Abaixo de um item do menu, ele continua marcado: a pessoa sabe em que seção está.
  for (const [rota, marcados] of [
    ['/rota-que-nao-existe', 0],
    ['/insumos/nao/existe', 1],
  ] as const) {
    const response = await page.goto(rota);

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeVisible();
    await expect(page).toHaveTitle('Página não encontrada | Doce Fatia');
    await expect(menuLateral(page)).toBeVisible();
    await expect(menuLateral(page).locator('[aria-current]')).toHaveCount(
      marcados,
    );
  }

  await page.getByRole('link', { name: 'Voltar ao início' }).click();
  await expect(page).toHaveURL('/');
});

test('sem sessão, toda rota de (app) leva ao login', async ({ page }) => {
  for (const rota of [
    ...DESTINOS.map((destino) => destino.rota),
    '/rota-que-nao-existe',
  ]) {
    await page.goto(rota);

    // A Home é o destino padrão depois do login: não vai no `redirect`.
    await expect(page).toHaveURL(
      rota === '/' ? '/login' : `/login?redirect=${encodeURIComponent(rota)}`,
    );
  }
});

test.describe('acessibilidade do layout', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('não tem violações no desktop, no celular e no 404', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page);
    await page.goto('/insumos');
    await expect(
      page.getByRole('heading', { name: 'Ingredientes e embalagens' }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.setViewportSize(CELULAR[0]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await abrirGaveta(page, 'Conta');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');

    await abrirGaveta(page, 'Mais');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');

    await page.goto('/rota-que-nao-existe');
    await expect(
      page.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
