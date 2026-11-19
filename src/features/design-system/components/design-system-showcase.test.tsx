import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { DesignSystemShowcase } from './design-system-showcase';

// O axe percorre o catálogo inteiro, o que passa dos 5 s padrão com a suíte em paralelo.
it('não tem violações de acessibilidade', { timeout: 30_000 }, async () => {
  render(<DesignSystemShowcase />);

  await expectNoA11yViolations();
});

it('tem um só h1 e uma seção para cada grupo', () => {
  render(<DesignSystemShowcase />);

  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(
    screen
      .getAllByRole('heading', { level: 2 })
      .map((titulo) => titulo.textContent),
  ).toEqual([
    'Cores',
    'Tipografia',
    'Raios',
    'Ícones',
    'Botões',
    'Campos',
    'Seleção',
    'Cartões',
    'Rendimento',
    'Status',
    'Sobreposições',
    'Abas',
    'Estados',
    'Listagem e formulário',
  ]);
});

it('dispara os três tipos de notificação', async () => {
  render(<DesignSystemShowcase />);

  await userEvent.click(
    screen.getByRole('button', { name: 'Toast de sucesso' }),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Toast de erro' }));
  await userEvent.click(
    screen.getByRole('button', { name: 'Toast informativo' }),
  );

  expect(
    screen.getAllByRole('button', { name: 'Fechar notificação' }),
  ).toHaveLength(3);
});

it('os exemplos de seleção respondem ao usuário', async () => {
  render(<DesignSystemShowcase />);

  await userEvent.click(screen.getByRole('radio', { name: 'Baixo' }));
  expect(screen.getByRole('radio', { name: 'Baixo' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  const aluguel = screen.getByRole('button', { name: 'Aluguel do Espaço' });
  await userEvent.click(aluguel);
  expect(aluguel).toHaveAttribute('aria-pressed', 'true');
  const energia = screen.getByRole('button', { name: 'Energia Elétrica' });
  await userEvent.click(energia);
  expect(energia).toHaveAttribute('aria-pressed', 'false');

  const slider = screen.getByRole('slider', { name: 'Preço de venda' });
  slider.focus();
  await userEvent.keyboard('{ArrowRight}');
  // O Intl separa o símbolo com espaço sem quebra.
  expect(slider).toHaveAttribute(
    'aria-valuetext',
    expect.stringMatching(/^R\$\s1,55$/),
  );

  await userEvent.type(
    screen.getByRole('combobox', { name: 'Receita' }),
    '{Control>}a{/Control}quin{Enter}',
  );
  expect(screen.getByRole('combobox', { name: 'Receita' })).toHaveValue(
    'Quindim',
  );

  const inicio = screen.getByLabelText('Data inicial');
  await userEvent.clear(inicio);
  await userEvent.type(inicio, '2026-12-15');
  expect(screen.getAllByRole('alert').map((a) => a.textContent)).toContain(
    'A data inicial não pode ser depois da data final.',
  );
});

it('abre a confirmação de exclusão', async () => {
  render(<DesignSystemShowcase />);

  await userEvent.click(
    screen.getByRole('button', { name: 'Abrir ConfirmDialog' }),
  );
  const dialog = screen.getByRole('dialog', { name: 'Excluir gasto' });
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Excluir' }),
  );

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
