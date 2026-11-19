import { expect, test } from '@playwright/test';
import { entrar } from './support/sessao';

// Fumaça do caminho principal (FE-23), só no desktop: login → insumo → receita
// → produção → venda concluída → Home. Contra a API falsa, que guarda o estado
// em memória (e2e/support/fake-api.mjs); o sufixo deixa os nomes únicos se o
// servidor for reaproveitado entre execuções.
test.use({ viewport: { width: 1280, height: 800 } });

test('cadastra, produz, vende e vê o resultado no painel', async ({ page }) => {
  const sufixo = Date.now().toString(36);
  const insumo = `Farinha ${sufixo}`;
  const receita = `Pão ${sufixo}`;

  await entrar(page);

  // Insumo: 1.000 g por R$ 5,00, com 5.000 g em estoque.
  await page.goto('/insumos');
  await page.getByRole('button', { name: 'Novo insumo' }).first().click();
  const dialogInsumo = page.getByRole('dialog', { name: 'Novo insumo' });
  await dialogInsumo.getByRole('textbox', { name: 'Nome' }).fill(insumo);
  await dialogInsumo
    .getByRole('textbox', { name: 'Quantidade', exact: true })
    .fill('1000');
  await dialogInsumo.getByRole('textbox', { name: 'Valor pago' }).fill('5,00');
  await dialogInsumo
    .getByRole('textbox', { name: 'Quantidade disponível inicial' })
    .fill('5000');
  await dialogInsumo.getByRole('button', { name: 'Salvar' }).click();
  await expect(
    page.getByText('Insumo criado com sucesso.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: new RegExp(insumo) }),
  ).toBeVisible();

  // Receita: 2.000 g do insumo (R$ 10,00), rendimento 10, margem 50%.
  await page.goto('/receitas');
  await page.getByRole('link', { name: 'Nova receita' }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Nova receita' }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'Nome' }).fill(receita);
  await page.getByRole('textbox', { name: 'Rendimento' }).fill('10');
  await page.getByRole('textbox', { name: 'Margem de lucro (%)' }).fill('50');
  await page.getByRole('button', { name: 'Adicionar insumo' }).click();
  const dialogItem = page.getByRole('dialog', { name: 'Adicionar insumo' });
  await dialogItem.getByRole('combobox', { name: 'Insumo' }).click();
  await page.getByRole('option', { name: insumo }).click();
  await dialogItem.getByRole('textbox', { name: 'Quantidade' }).fill('2000');
  await dialogItem.getByRole('button', { name: 'Adicionar' }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(
    page.getByText('Receita criada com sucesso.', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/receitas$/);

  // Produção: 1 lote = 10 unidades.
  await page.goto('/producoes');
  await page.getByRole('button', { name: 'Nova Produção' }).first().click();
  const dialogProducao = page.getByRole('dialog', {
    name: 'Registrar Produção',
  });
  await dialogProducao
    .getByRole('combobox', { name: 'Receita' })
    .selectOption({ label: receita });
  await dialogProducao
    .getByRole('textbox', { name: 'Quantidade de lotes' })
    .fill('1');
  await dialogProducao
    .getByRole('button', { name: 'Registrar Produção' })
    .click();
  await expect(
    page.getByText('Produção registrada com sucesso.', { exact: true }),
  ).toBeVisible();

  // Venda: 4 unidades pelo preço sugerido (R$ 1,50), concluída.
  await page.goto('/vendas');
  await page
    .getByRole('combobox', { name: 'Produto/Receita' })
    .selectOption({ label: receita });
  await expect(
    page.getByRole('textbox', { name: 'Preço unitário real' }),
  ).toHaveValue('1,50');
  await page.getByRole('textbox', { name: 'Quantidade' }).fill('4');
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
  await page.getByRole('button', { name: 'Registrar Venda' }).click();
  const confirmacao = page.getByRole('dialog', { name: 'Confirmar venda' });
  await expect(confirmacao.getByText('R$ 6,00').first()).toBeVisible();
  await confirmacao.getByRole('button', { name: 'Concluir venda' }).click();
  await expect(
    page.getByText('Venda concluída com sucesso.', { exact: true }),
  ).toBeVisible();
  await expect(confirmacao.getByText('Concluída')).toBeVisible();

  // Home: a receita vendida aparece entre os produtos mais rentáveis, com o
  // lucro de 4 × (R$ 1,50 − R$ 1,00).
  await page.goto('/');
  await expect(page.getByText('Faturamento')).toBeVisible();
  const produto = page.getByRole('listitem').filter({ hasText: receita });
  await expect(produto).toContainText('4 un - margem 33,3%');
  await expect(produto).toContainText('R$ 2,00');
});
