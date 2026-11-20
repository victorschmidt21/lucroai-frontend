import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { ToastProvider } from '@/shared/ui/toast';
import { mockApi, mockApiErro } from '@/test/api';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { InsumoFormDialog } from './insumo-form-dialog';

// Os testes digitam e abrem diálogos: sob a carga da
// cobertura com a suíte inteira, passam dos 5 s padrão.
const OPCOES = { timeout: 20_000 };

function renderForm(insumo?: Insumo) {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  renderWithQuery(
    <ToastProvider>
      <InsumoFormDialog open onOpenChange={onOpenChange} insumo={insumo} />
    </ToastProvider>,
  );
  const dialog = screen.getByRole('dialog', {
    name: insumo ? 'Editar insumo' : 'Novo insumo',
  });

  return { dialog, onOpenChange };
}

function campo(dialog: HTMLElement, nome: string) {
  return within(dialog).getByRole('textbox', { name: nome });
}

describe('criação', OPCOES, () => {
  it('mostra a prévia do custo unitário enquanto digita, com a unidade', async () => {
    const { dialog } = renderForm();

    expect(
      within(dialog).getByText('Custo unitário: R$ 0,0000/g'),
    ).toBeInTheDocument();
    await userEvent.type(campo(dialog, 'Quantidade'), '500');
    await userEvent.type(campo(dialog, 'Valor pago'), '12');
    expect(
      within(dialog).getByText('Custo unitário: R$ 0,0240/g'),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Unidade' }),
      'KG',
    );
    await userEvent.clear(campo(dialog, 'Quantidade'));
    await userEvent.type(campo(dialog, 'Quantidade'), '0,5');
    expect(
      within(dialog).getByText('Custo unitário: R$ 24,0000/kg'),
    ).toBeInTheDocument();
  });

  it('valida os campos com as mensagens em português', async () => {
    const { dialog } = renderForm();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Salvar' }),
    );

    expect(await within(dialog).findByText('Informe o nome')).toBeVisible();
    expect(
      within(dialog).getByText('Informe uma quantidade maior que zero'),
    ).toBeVisible();
    expect(
      within(dialog).getByText('Informe um valor maior que zero'),
    ).toBeVisible();
    expect(campo(dialog, 'Nome')).toHaveFocus();
  });

  it('envia o corpo com os nomes do contrato e a quantidade inicial', async () => {
    const corpos: unknown[] = [];
    server.use(
      mockApi('POST /insumos', async ({ request }) => {
        corpos.push(await request.json());
        return makeInsumo({ id: 40, nome: 'Polvilho Doce' });
      }),
    );
    const { dialog, onOpenChange } = renderForm();

    await userEvent.type(campo(dialog, 'Nome'), 'Polvilho Doce');
    await userEvent.type(campo(dialog, 'Quantidade'), '1');
    await userEvent.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Unidade' }),
      'KG',
    );
    await userEvent.type(campo(dialog, 'Valor pago'), '7,90');
    await userEvent.type(campo(dialog, 'Quantidade disponível inicial'), '2,5');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Salvar' }),
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(corpos).toEqual([
      {
        nome: 'Polvilho Doce',
        quantidadeBaseCusto: 1,
        unidade: 'KG',
        valorPago: 7.9,
        quantidadeDisponivelInicial: 2.5,
      },
    ]);
    expect(
      await screen.findByText('Insumo criado com sucesso.'),
    ).toBeInTheDocument();
  });

  it('mantém o diálogo aberto com a mensagem do backend', async () => {
    server.use(
      mockApiErro(
        'POST /insumos',
        400,
        ['nome must be a string'],
        'Bad Request',
      ),
    );
    const { dialog, onOpenChange } = renderForm();

    await userEvent.type(campo(dialog, 'Nome'), 'Sal');
    await userEvent.type(campo(dialog, 'Quantidade'), '1');
    await userEvent.type(campo(dialog, 'Valor pago'), '2,50');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Salvar' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'nome must be a string',
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(campo(dialog, 'Nome')).toHaveValue('Sal');
  });
});

describe('edição', OPCOES, () => {
  it('abre com os valores do insumo, sem a quantidade inicial', () => {
    const { dialog } = renderForm(
      makeInsumo({
        nome: 'Manteiga sem Sal',
        quantidadeBaseCusto: 500,
        unidade: 'G',
        valorPago: 12,
        custoUnitario: 0.024,
      }),
    );

    expect(campo(dialog, 'Nome')).toHaveValue('Manteiga sem Sal');
    expect(campo(dialog, 'Quantidade')).toHaveValue('500');
    expect(campo(dialog, 'Valor pago')).toHaveValue('12,00');
    expect(
      within(dialog).getByRole('combobox', { name: 'Unidade' }),
    ).toHaveValue('G');
    expect(
      within(dialog).queryByRole('textbox', {
        name: 'Quantidade disponível inicial',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText('Custo unitário: R$ 0,0240/g'),
    ).toBeInTheDocument();
  });

  it('envia o PATCH sem a quantidade inicial e avisa', async () => {
    const chamadas: unknown[] = [];
    server.use(
      mockApi('PATCH /insumos/:id', async ({ request, params }) => {
        chamadas.push([params.id, await request.json()]);
        return makeInsumo({ valorPago: 18, custoUnitario: 3.6 });
      }),
    );
    const { dialog, onOpenChange } = renderForm(makeInsumo({ id: 19 }));

    await userEvent.clear(campo(dialog, 'Valor pago'));
    await userEvent.type(campo(dialog, 'Valor pago'), '18');
    expect(
      within(dialog).getByText('Custo unitário: R$ 3,6000/kg'),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Atualizar' }),
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(chamadas).toEqual([
      [
        '19',
        {
          nome: 'Farinha de Trigo',
          quantidadeBaseCusto: 5,
          unidade: 'KG',
          valorPago: 18,
        },
      ],
    ]);
    expect(
      await screen.findByText('Insumo atualizado com sucesso.'),
    ).toBeInTheDocument();
  });
});
