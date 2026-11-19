import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Exemplo de /design-system/listagem (FE-06): só existe em desenvolvimento, como
// /design-system. Com `E2E_USAR_BUILD` (o CI), só se confere o 404.
const usarBuild = process.env.E2E_USAR_BUILD === 'true';
const URL_EXEMPLO = '/design-system/listagem';

async function violacoes(page: Page, seletor?: string) {
  const builder = new AxeBuilder({ page });
  const { violations } = await (
    seletor ? builder.include(seletor) : builder
  ).analyze();

  return violations.map(({ id, nodes }) => `${id}: ${nodes[0]?.html}`);
}

async function abrirExemplo(page: Page, url = URL_EXEMPLO) {
  await page.goto(url);
  await expect(page.getByText(/^\d+ insumos?$/)).toBeVisible();
}

test.describe('no build de produção', () => {
  test.skip(!usarBuild, 'roda só contra o build (E2E_USAR_BUILD=true)');

  test('o exemplo não existe', async ({ page }) => {
    const response = await page.goto(URL_EXEMPLO);

    expect(response?.status()).toBe(404);
  });
});

test.describe('em desenvolvimento', () => {
  test.skip(usarBuild, 'a página não existe no build de produção');

  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('listagem e formulário sem violações, inclusive contraste', async ({
    page,
  }) => {
    await abrirExemplo(page);

    expect(await violacoes(page)).toEqual([]);

    await page.getByRole('button', { name: 'Novo insumo' }).first().click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(
      page.getByRole('dialog').getByRole('alert').first(),
    ).toBeVisible();

    expect(await violacoes(page, '[role="dialog"]')).toEqual([]);
  });

  test('a busca fica na URL e sobrevive a recarregar a página', async ({
    page,
  }) => {
    await abrirExemplo(page);

    await page.getByRole('searchbox', { name: 'Buscar insumo' }).fill('acucar');
    await expect(page).toHaveURL(/\?q=acucar$/);
    await expect(page.getByText('1 insumo', { exact: true })).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole('searchbox', { name: 'Buscar insumo' }),
    ).toHaveValue('acucar');
    await expect(page.getByText('1 insumo', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('cell', { name: 'Açúcar Cristal', exact: true }),
    ).toBeVisible();
  });

  test('vazio por busca com "Limpar busca"', async ({ page }) => {
    await abrirExemplo(page, `${URL_EXEMPLO}?q=chocolate`);

    await expect(
      page.getByText('Nenhum resultado para "chocolate"'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Limpar busca' }).click();

    await expect(page).toHaveURL(new RegExp(`${URL_EXEMPLO}$`));
    await expect(page.getByText('8 insumos')).toBeVisible();
  });

  for (const digitado of ['1.234,56', '1234,56', '1234.56']) {
    test(`"${digitado}" vira 1234.56 e o campo mostra 1.234,56`, async ({
      page,
    }) => {
      await abrirExemplo(page);

      await page.getByRole('button', { name: 'Novo insumo' }).first().click();
      const dialog = page.getByRole('dialog', { name: 'Novo insumo' });
      await dialog.getByRole('textbox', { name: 'Nome' }).fill('Polvilho Doce');
      await dialog
        .getByRole('textbox', { name: 'Quantidade', exact: true })
        .fill('1');
      await dialog.getByRole('textbox', { name: 'Valor pago' }).fill(digitado);
      await dialog.getByRole('textbox', { name: 'Valor pago' }).blur();

      await expect(
        dialog.getByRole('textbox', { name: 'Valor pago' }),
      ).toHaveValue('1.234,56');
      await dialog.getByRole('button', { name: 'Salvar' }).click();

      await expect(
        page.getByText('Insumo criado com sucesso.', { exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByRole('row', { name: /Polvilho Doce/ })
          .getByText('R$ 1.234,56', { exact: true }),
      ).toBeVisible();
    });
  }

  test('margem digitada como 30 é enviada como 0.3', async ({ page }) => {
    await page.goto(URL_EXEMPLO);

    await page
      .getByRole('textbox', { name: 'Nome da receita' })
      .fill('Pão Francês');
    await page.getByRole('textbox', { name: 'Rendimento' }).fill('50');
    await page.getByRole('textbox', { name: 'Margem de lucro' }).fill('30');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(
      page.getByRole('status', { name: 'Corpo enviado' }),
    ).toContainText('"margem_lucro": 0.3');
  });

  test('formulário só com o teclado, com o erro anunciado no campo', async ({
    page,
  }) => {
    await abrirExemplo(page);
    const novo = page.getByRole('button', { name: 'Novo insumo' }).first();

    await novo.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Novo insumo' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('textbox', { name: 'Nome' })).toBeFocused();
    await page.keyboard.type('Polvilho');
    await page.keyboard.press('Enter');

    const quantidade = dialog.getByRole('textbox', {
      name: 'Quantidade',
      exact: true,
    });
    await expect(quantidade).toBeFocused();
    await expect(quantidade).toHaveAttribute('aria-invalid', 'true');
    await expect(quantidade).toHaveAccessibleDescription(
      'Informe uma quantidade maior que zero',
    );

    await page.keyboard.type('2');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.type('10,00');
    await page.keyboard.press('Enter');

    await expect(
      page.getByText('Insumo criado com sucesso.', { exact: true }),
    ).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('no celular, o formulário abre de baixo e sem rolagem horizontal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await abrirExemplo(page);

    await page.getByRole('button', { name: 'Novo insumo' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Novo insumo' });
    await expect(dialog).toBeVisible();

    const caixa = await dialog.boundingBox();
    expect(Math.round((caixa?.y ?? 0) + (caixa?.height ?? 0))).toBe(800);
    expect(caixa?.width).toBe(390);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
    expect(await dialog.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(
      0,
    );
  });

  test('no desktop, o formulário abre centralizado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await abrirExemplo(page);

    await page.getByRole('button', { name: 'Novo insumo' }).first().click();
    const caixa = await page
      .getByRole('dialog', { name: 'Novo insumo' })
      .boundingBox();

    expect(Math.round((caixa?.x ?? 0) + (caixa?.width ?? 0) / 2)).toBe(640);
    expect(Math.round((caixa?.y ?? 0) + (caixa?.height ?? 0))).toBeLessThan(
      800,
    );
  });

  for (const [nome, largura] of [
    ['celular pequeno', 360],
    ['celular', 390],
    ['desktop', 1280],
  ] as const) {
    test(`listagem sem rolagem horizontal no ${nome} (${largura}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await abrirExemplo(page);

      const excesso = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );

      expect(excesso).toBe(0);
      // Tabela a partir de `md`; cartões abaixo.
      await expect(
        page.getByRole('columnheader', { name: 'Valor pago' }),
      ).toBeVisible({ visible: largura >= 768 });
    });
  }
});
