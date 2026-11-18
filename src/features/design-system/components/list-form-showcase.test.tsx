import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/ui/toast';
import { expectNoA11yViolations } from '@/test/a11y';
import { setTestUrl } from '@/test/next-navigation';
import { renderWithQuery } from '@/test/render';
import { criarApiDeExemplo } from '../exemplo-api';
import { ListFormShowcase } from './list-form-showcase';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

function renderExemplo() {
  const api = criarApiDeExemplo({ atrasoMs: 0 });
  renderWithQuery(
    <ToastProvider>
      <ListFormShowcase api={api} />
    </ToastProvider>,
  );

  return api;
}

function nomes() {
  return within(screen.getByRole('table', { name: 'Insumos' }))
    .getAllByRole('row')
    .slice(1)
    .map((linha) => within(linha).getAllByRole('cell')[0]?.textContent);
}

beforeEach(() => {
  setTestUrl('/design-system/listagem');
});

describe('exemplo de listagem', () => {
  it('lista os insumos do seed por nome, com os formatadores', async () => {
    renderExemplo();

    expect(await screen.findByText('8 insumos')).toBeInTheDocument();
    expect(nomes()[0]).toBe('Açúcar Cristal');
    expect(screen.getByText('R$ 0,0240/g')).toBeInTheDocument();
    expect(screen.getAllByText('500 g')).toHaveLength(2);
  });

  // O axe na página inteira também passa dos 5 s sob a carga da cobertura.
  it(
    'não tem violações de acessibilidade na listagem',
    { timeout: 20_000 },
    async () => {
      renderExemplo();
      await screen.findByText('8 insumos');

      await expectNoA11yViolations();
    },
  );

  // Digita em três campos e roda o axe com o diálogo aberto: sob a carga da
  // cobertura com a suíte inteira, passa dos 5 s padrão.
  it(
    'cadastra um insumo com o valor no padrão brasileiro',
    { timeout: 20_000 },
    async () => {
      renderExemplo();
      await screen.findByText('8 insumos');

      await userEvent.click(
        screen.getAllByRole('button', { name: 'Novo insumo' })[0]!,
      );
      const dialog = screen.getByRole('dialog', { name: 'Novo insumo' });
      await userEvent.type(
        within(dialog).getByRole('textbox', { name: 'Nome' }),
        'Polvilho Doce',
      );
      await userEvent.type(
        within(dialog).getByRole('textbox', { name: 'Quantidade' }),
        '1',
      );
      await userEvent.type(
        within(dialog).getByRole('textbox', { name: 'Valor pago' }),
        '1234.5',
      );
      await userEvent.tab();

      expect(
        within(dialog).getByRole('textbox', { name: 'Valor pago' }),
      ).toHaveValue('1.234,50');
      expect(
        within(dialog).getByText('Custo unitário: R$ 1.234,5000/kg'),
      ).toBeInTheDocument();
      await expectNoA11yViolations();

      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Salvar' }),
      );

      expect(
        await screen.findByText('Insumo criado com sucesso.'),
      ).toBeInTheDocument();
      expect(await screen.findByText('9 insumos')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.234,50')).toBeInTheDocument();
    },
  );

  it('edita com os valores do insumo e "Atualizar"', async () => {
    renderExemplo();
    await screen.findByText('8 insumos');

    await userEvent.click(screen.getByRole('button', { name: 'Editar Sal' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar insumo' });

    expect(
      within(dialog).getByRole('textbox', { name: 'Valor pago' }),
    ).toHaveValue('2,50');
    expect(
      within(dialog).queryByLabelText('Quantidade disponível inicial'),
    ).not.toBeInTheDocument();
    await userEvent.clear(
      within(dialog).getByRole('textbox', { name: 'Valor pago' }),
    );
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Valor pago' }),
      '3',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Atualizar' }),
    );

    expect(
      await screen.findByText('Insumo atualizado com sucesso.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('R$ 3,00')).toBeInTheDocument();
  });

  it('exclui depois de confirmar, com a consequência', async () => {
    renderExemplo();
    await screen.findByText('8 insumos');

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Ovos' }));
    const dialog = screen.getByRole('dialog', { name: 'Excluir insumo' });
    expect(dialog).toHaveAccessibleDescription(
      'Deseja excluir "Ovos"? Isso afetará o custo das receitas que usam este insumo.',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Excluir' }),
    );

    expect(
      await screen.findByText('Insumo excluído com sucesso.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('7 insumos')).toBeInTheDocument();
  });

  it('com falha ao salvar, o diálogo fica aberto com a mensagem', async () => {
    renderExemplo();
    await screen.findByText('8 insumos');
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Falhar ao salvar e excluir' }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Editar Sal' }));
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    const dialog = screen.getByRole('dialog', { name: 'Editar insumo' });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente.',
    );
  });

  it('mostra o erro ao carregar e o vazio', async () => {
    renderExemplo();
    await screen.findByText('8 insumos');

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Falhar ao carregar' }),
    );
    expect(
      await screen.findByText('Não foi possível carregar os insumos.'),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Falhar ao carregar' }),
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Lista vazia' }),
    );
    expect(
      await screen.findByText('Nenhum insumo encontrado.'),
    ).toBeInTheDocument();
  });

  it('busca e grava q na URL', async () => {
    renderExemplo();
    await screen.findByText('8 insumos');

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
      'acucar',
    );

    await waitFor(() => expect(window.location.search).toBe('?q=acucar'));
    expect(nomes()).toEqual(['Açúcar Cristal']);
  });
});

describe('exemplo de formulário em página', () => {
  it('envia a margem digitada como 30 em fração (0.3)', async () => {
    renderExemplo();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Nome da receita' }),
      'Pão Francês',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Rendimento' }),
      '50',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Margem de lucro' }),
      '30',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const corpo = await screen.findByText(/"margem_lucro": 0.3/);
    expect(JSON.parse(corpo.textContent ?? '')).toEqual({
      nome: 'Pão Francês',
      rendimento: 50,
      unidadeRendimento: 'UN',
      margem_lucro: 0.3,
    });
    expect(
      await screen.findByText('Receita criada com sucesso.'),
    ).toBeInTheDocument();
  });
});
