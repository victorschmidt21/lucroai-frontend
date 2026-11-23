import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// `/design-system` só existe em desenvolvimento, como na Urbizzi. Com `E2E_USAR_BUILD`
// (o CI usa), o build devolve 404 e só esse comportamento é conferido.
const usarBuild = process.env.E2E_USAR_BUILD === 'true';

test.describe('no build de produção', () => {
  test.skip(!usarBuild, 'roda só contra o build (E2E_USAR_BUILD=true)');

  test('a página não existe', async ({ page }) => {
    const response = await page.goto('/design-system');

    expect(response?.status()).toBe(404);
  });
});

test.describe('em desenvolvimento', () => {
  test.skip(usarBuild, 'a página não existe no build de produção');

  // Sem transições: as cores não podem ser medidas no meio de uma animação.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('sem violações de acessibilidade, inclusive contraste', async ({
    page,
  }) => {
    await page.goto('/design-system');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Design system' }),
    ).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();

    expect(
      violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.html}`),
    ).toEqual([]);
  });

  test('Dialog e Drawer abertos sem violações', async ({ page }) => {
    await page.goto('/design-system');

    for (const nome of ['Abrir Dialog', 'Abrir Drawer']) {
      await page.getByRole('button', { name: nome }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const { violations } = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .analyze();

      expect(
        violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.html}`),
      ).toEqual([]);
      await page.keyboard.press('Escape');
    }
  });

  test('Dialog funciona só com o teclado e devolve o foco', async ({
    page,
  }) => {
    await page.goto('/design-system');
    const abrir = page.getByRole('button', { name: 'Abrir Dialog' });

    await abrir.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('dialog', { name: 'Novo insumo' }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(abrir).toBeFocused();
  });

  test('foco visível em laranja nos controles', async ({ page }) => {
    await page.goto('/design-system');
    const primario = page.getByRole('button', { name: 'Primário' });

    await primario.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');

    await expect(primario).toHaveCSS('outline-style', 'solid');
    await expect(primario).toHaveCSS('outline-color', 'rgb(255, 107, 61)');
  });

  test('tema claro, botões em pílula e Fredoka e Nunito servidas pelo próprio app', async ({
    page,
  }) => {
    const externas: string[] = [];
    page.on('request', (request) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) {
        externas.push(request.url());
      }
    });

    await page.goto('/design-system');
    await page.evaluate(() => document.fonts.ready);

    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(255, 248, 243)',
    );
    await expect(page.getByRole('button', { name: 'Primário' })).toHaveCSS(
      'min-height',
      '48px',
    );
    expect(externas).toEqual([]);

    // `document.fonts.check` devolve true para fonte inexistente, então a lista é conferida.
    const carregadas = await page.evaluate(() =>
      [...document.fonts]
        .filter((fonte) => fonte.status === 'loaded')
        .map((fonte) => fonte.family)
        .join(),
    );

    expect(carregadas).toMatch(/Fredoka/);
    expect(carregadas).toMatch(/Nunito/);
    expect(carregadas).not.toMatch(/Roboto/);
  });

  for (const [nome, largura] of [
    ['celular pequeno', 360],
    ['celular', 390],
    ['desktop', 1280],
  ] as const) {
    test(`sem rolagem horizontal no ${nome} (${largura}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto('/design-system');

      const excesso = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );

      expect(excesso).toBe(0);
    });
  }

  test('no celular, o Drawer sobe de baixo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/design-system');

    await page.getByRole('button', { name: 'Abrir Drawer' }).click();
    const drawer = page.getByRole('dialog', { name: 'Filtros' });
    await expect(drawer).toBeVisible();

    const caixa = await drawer.boundingBox();

    expect(Math.round((caixa?.y ?? 0) + (caixa?.height ?? 0))).toBe(800);
    expect(caixa?.width).toBe(390);
  });
});
