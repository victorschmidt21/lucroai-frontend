import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfiguracaoCustos } from '@/shared/api/contracts/pricing';
import { ToastProvider } from '@/shared/ui/toast';
import { mockApi, mockApiErro } from '@/test/api';
import { makeInsumosDoSeed } from '@/test/factories/insumo.factory';
import { makeConfiguracaoCustos } from '@/test/factories/pricing.factory';
import { makeReceita } from '@/test/factories/receita.factory';
import { setTestUrl } from '@/test/next-navigation';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { ReceitaFormPagina } from './receita-form';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

// Os testes digitam e abrem diálogos: com a suíte inteira, passam dos 5 s padrão.
const OPCOES = { timeout: 20_000 };

// Farinha de Trigo (3/kg), Açúcar Cristal (4,4/kg) e Manteiga sem Sal (0,024/g).
const INSUMOS = makeInsumosDoSeed().slice(0, 3);

function renderPagina({
  receitaId,
  configuracao = makeConfiguracaoCustos(),
}: { receitaId?: number; configuracao?: ConfiguracaoCustos } = {}) {
  server.use(
    mockApi('GET /insumos', INSUMOS),
    mockApi('GET /configuracao-custos', configuracao),
  );
  return renderWithQuery(
    <ToastProvider>
      <ReceitaFormPagina receitaId={receitaId} />
    </ToastProvider>,
  );
}

async function adicionarInsumo(nome: string, quantidade: string) {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Adicionar insumo' }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: 'Adicionar insumo',
  });
  const combobox = within(dialog).getByRole('combobox', { name: 'Insumo' });
  await userEvent.click(combobox);
  await userEvent.click(within(dialog).getByRole('option', { name: nome }));
  await userEvent.type(
    within(dialog).getByRole('textbox', { name: 'Quantidade' }),
    quantidade,
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Adicionar' }),
  );
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
}

beforeEach(() => {
  setTestUrl('/receitas/nova');
});

describe('nova receita', OPCOES, () => {
  it('adiciona, edita e remove insumos, com o custo na unidade do insumo', async () => {
    renderPagina();

    expect(
      await screen.findByText('Nenhum insumo adicionado.'),
    ).toBeInTheDocument();

    await adicionarInsumo('Farinha de Trigo', '0,5');
    const quantidade = screen.getByRole('textbox', {
      name: 'Quantidade de Farinha de Trigo',
    });
    expect(quantidade).toHaveValue('0,5');
    expect(screen.getByText('Custo: R$ 1,50')).toBeInTheDocument();

    await userEvent.clear(quantidade);
    await userEvent.type(quantidade, '2');
    expect(screen.getByText('Custo: R$ 6,00')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Remover Farinha de Trigo' }),
    );
    expect(screen.getByText('Nenhum insumo adicionado.')).toBeInTheDocument();
  });

  it('não oferece de novo um insumo já adicionado', async () => {
    renderPagina();

    await adicionarInsumo('Farinha de Trigo', '1');
    await adicionarInsumo('Açúcar Cristal', '1');

    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar insumo' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Adicionar insumo',
    });
    await userEvent.click(
      within(dialog).getByRole('combobox', { name: 'Insumo' }),
    );
    expect(
      within(dialog)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Manteiga sem Sal']);
    // A quantidade aparece na unidade do insumo.
    expect(within(dialog).getByText('g')).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Adicionar' }),
    );
    expect(await within(dialog).findByText('Obrigatório')).toBeVisible();
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Quantidade' }),
      '100',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Adicionar' }),
    );

    const botao = await screen.findByRole('button', {
      name: 'Todos os insumos adicionados',
    });
    expect(botao).toBeDisabled();
  });

  it('salva a ficha técnica com o corpo do contrato e abre o detalhe', async () => {
    const corpos: unknown[] = [];
    server.use(
      mockApi('POST /receitas', async ({ request }) => {
        corpos.push(await request.json());
        return makeReceita({ id: 9, nome: 'Bolo' });
      }),
    );
    renderPagina();

    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Nome' }),
      'Bolo',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Rende quantas unidades boas?' }),
      '12',
    );
    const fornadas = screen.getByRole('textbox', {
      name: 'Quantas fornadas um lote ocupa?',
    });
    expect(fornadas).toHaveValue('1');
    await userEvent.clear(fornadas);
    await userEvent.type(fornadas, '0,5');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Embalagem por unidade' }),
      '0,15',
    );
    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Quanto costuma sobrar ou estragar?',
      }),
      '5',
    );
    // O lucro vazio usa o padrão da empresa, que aparece no texto de apoio.
    expect(
      screen.getByText('De cada R$ 1,00 vendido. Vazio usa o padrão (15,0%).'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Margem de lucro/)).not.toBeInTheDocument();
    await adicionarInsumo('Manteiga sem Sal', '100');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Receita criada com sucesso.'),
    ).toBeInTheDocument();
    expect(corpos).toEqual([
      {
        nome: 'Bolo',
        rendimento: 12,
        unidadeRendimento: 'UN',
        uso_por_lote: 0.5,
        embalagem_por_unidade: 0.15,
        perda_percentual: 0.05,
        lucro_percentual: null,
        insumos: [{ insumo_id: 3, quantidade: 100 }],
      },
    ]);
    expect(window.location.pathname).toBe('/receitas/9');
  });

  it('mostra as mensagens de validação e o erro do backend', async () => {
    server.use(mockApiErro('POST /receitas', 404, 'Insumo não encontrado'));
    renderPagina();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Salvar' }),
    );
    expect(await screen.findByText('Informe o nome')).toBeVisible();
    expect(screen.getByText('Obrigatório')).toBeVisible();

    await userEvent.type(screen.getByRole('textbox', { name: 'Nome' }), 'Bolo');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Rende quantas unidades boas?' }),
      '1',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Insumo não encontrado')).toBeVisible();
    expect(window.location.pathname).toBe('/receitas/nova');
  });

  it('pede confirmação para sair com alterações não salvas', async () => {
    renderPagina();

    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Nome' }),
      'Bolo',
    );
    await userEvent.click(screen.getByRole('link', { name: 'Cancelar' }));

    const confirmacao = await screen.findByRole('dialog', {
      name: 'Descartar alterações?',
    });
    expect(
      within(confirmacao).getByText('As alterações não salvas serão perdidas.'),
    ).toBeInTheDocument();
    await userEvent.click(
      within(confirmacao).getByRole('button', { name: 'Descartar' }),
    );
    await waitFor(() => expect(window.location.pathname).toBe('/receitas'));
  });
});

describe('editar receita', OPCOES, () => {
  beforeEach(() => {
    setTestUrl('/receitas/1/editar');
  });

  it('preenche o formulário e atualiza, com minutos de forno', async () => {
    const receita = makeReceita({
      usoPorLote: 30,
      lucroPercentual: 0.2,
      itens: [
        { insumoId: 1, quantidade: 1, custoCalculado: 3 },
        { insumoId: 99, quantidade: 2, custoCalculado: 1 },
      ],
    });
    const corpos: unknown[] = [];
    server.use(
      mockApi('GET /receitas/:id', receita),
      mockApi('PUT /receitas/:id', async ({ request }) => {
        corpos.push(await request.json());
        return receita;
      }),
    );
    renderPagina({
      receitaId: 1,
      configuracao: makeConfiguracaoCustos({ baseRateio: 'MINUTOS' }),
    });

    expect(await screen.findByRole('textbox', { name: 'Nome' })).toHaveValue(
      'Pão Francês',
    );
    expect(
      screen.getByRole('textbox', {
        name: 'Quantos minutos de forno um lote ocupa?',
      }),
    ).toHaveValue('30');
    expect(
      screen.getByRole('textbox', { name: 'Lucro desta receita' }),
    ).toHaveValue('20');
    // Insumo que saiu do catálogo.
    expect(screen.getByText('Insumo #99')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Remover Insumo #99' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    expect(
      await screen.findByText('Receita atualizada com sucesso.'),
    ).toBeInTheDocument();
    expect(corpos).toEqual([
      {
        nome: 'Pão Francês',
        rendimento: 50,
        unidadeRendimento: 'UN',
        uso_por_lote: 30,
        embalagem_por_unidade: 0,
        perda_percentual: 0,
        lucro_percentual: 0.2,
        insumos: [{ insumo_id: 1, quantidade: 1 }],
      },
    ]);
    expect(window.location.pathname).toBe('/receitas/1');
  });
});
