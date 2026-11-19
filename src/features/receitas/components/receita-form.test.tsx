import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GastoIndireto } from '@/shared/api/contracts/catalog';
import { ToastProvider } from '@/shared/ui/toast';
import { mockApi, mockApiErro } from '@/test/api';
import { makeGastoIndireto } from '@/test/factories/gasto-indireto.factory';
import { makeInsumosDoSeed } from '@/test/factories/insumo.factory';
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
  gastos = [],
}: { receitaId?: number; gastos?: GastoIndireto[] } = {}) {
  server.use(
    mockApi('GET catalog /insumos', INSUMOS),
    mockApi('GET catalog /gastos-indiretos', gastos),
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

function previa() {
  return within(screen.getByRole('region', { name: 'Prévia dos custos' }));
}

function valorDa(regiao: ReturnType<typeof previa>, rotulo: string) {
  return regiao.getByText(rotulo).nextElementSibling?.textContent;
}

beforeEach(() => {
  setTestUrl('/receitas/nova');
});

describe('nova receita', OPCOES, () => {
  it('adiciona, edita e remove insumos, com a prévia na unidade do insumo', async () => {
    renderPagina();

    expect(
      await screen.findByText('Nenhum insumo adicionado.'),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Rendimento' }),
      '10',
    );

    await adicionarInsumo('Farinha de Trigo', '0,5');
    const quantidade = screen.getByRole('textbox', {
      name: 'Quantidade de Farinha de Trigo',
    });
    expect(quantidade).toHaveValue('0,5');
    expect(screen.getByText('Custo: R$ 1,50')).toBeInTheDocument();
    expect(valorDa(previa(), 'Custo produção')).toBe('R$ 1,50');
    expect(valorDa(previa(), 'Custo unitário')).toBe('R$ 0,15');

    await userEvent.clear(quantidade);
    await userEvent.type(quantidade, '2');
    expect(screen.getByText('Custo: R$ 6,00')).toBeInTheDocument();
    expect(valorDa(previa(), 'Custo produção')).toBe('R$ 6,00');

    await userEvent.click(
      screen.getByRole('button', { name: 'Remover Farinha de Trigo' }),
    );
    expect(screen.getByText('Nenhum insumo adicionado.')).toBeInTheDocument();
    expect(valorDa(previa(), 'Custo produção')).toBe('R$ 0,00');
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

  it('salva com o corpo do contrato e volta para a lista', async () => {
    const corpos: unknown[] = [];
    server.use(
      mockApi('POST recipe /receitas', async ({ request }) => {
        corpos.push(await request.json());
        return makeReceita({ id: 9, nome: 'Bolo' });
      }),
    );
    renderPagina({ gastos: [makeGastoIndireto({ valor: 10 })] });

    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Nome' }),
      'Bolo',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Rendimento' }),
      '12',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Margem de lucro (%)' }),
      '50',
    );
    await adicionarInsumo('Manteiga sem Sal', '100');

    // 2,40 de manteiga + 10,00 de gasto proporcional (1 lote).
    expect(valorDa(previa(), 'Gastos indiretos (1 lote)')).toBe('R$ 10,00');
    expect(valorDa(previa(), 'Custo produção')).toBe('R$ 12,40');
    expect(valorDa(previa(), 'Custo unitário')).toBe('R$ 1,03');
    // 1,03 × 1,5 = 1,545, que o `toFixed(2)` do backend arredonda para 1,54.
    expect(valorDa(previa(), 'Preço sugerido')).toBe('R$ 1,54');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Receita criada com sucesso.'),
    ).toBeInTheDocument();
    expect(corpos).toEqual([
      {
        nome: 'Bolo',
        rendimento: 12,
        unidadeRendimento: 'UN',
        margem_lucro: 0.5,
        insumos: [{ insumo_id: 3, quantidade: 100 }],
      },
    ]);
    expect(window.location.pathname).toBe('/receitas');
  });

  it('mostra as mensagens de validação e o erro do backend', async () => {
    server.use(
      mockApiErro('POST recipe /receitas', 404, 'Insumo não encontrado'),
    );
    renderPagina();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Salvar' }),
    );
    expect(await screen.findByText('Informe o nome')).toBeVisible();
    expect(screen.getByText('Obrigatório')).toBeVisible();

    await userEvent.type(screen.getByRole('textbox', { name: 'Nome' }), 'Bolo');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Rendimento' }),
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

  it('preenche o formulário, mostra os valores salvos e atualiza', async () => {
    const receita = makeReceita({
      itens: [
        { insumoId: 1, quantidade: 1, custoCalculado: 3 },
        { insumoId: 99, quantidade: 2, custoCalculado: 1 },
      ],
    });
    const corpos: unknown[] = [];
    server.use(
      mockApi('GET recipe /receitas/:id', receita),
      mockApi('PUT recipe /receitas/:id', async ({ request }) => {
        corpos.push(await request.json());
        return receita;
      }),
    );
    renderPagina({ receitaId: 1 });

    expect(await screen.findByRole('textbox', { name: 'Nome' })).toHaveValue(
      'Pão Francês',
    );
    expect(
      screen.getByRole('textbox', { name: 'Margem de lucro (%)' }),
    ).toHaveValue('60');
    // Insumo que saiu do catálogo.
    expect(screen.getByText('Insumo #99')).toBeInTheDocument();

    const salvos = within(
      screen.getByRole('region', { name: 'Valores salvos' }),
    );
    expect(valorDa(salvos, 'Custo produção')).toBe('R$ 3,31');
    expect(valorDa(salvos, 'Custo unitário')).toBe('R$ 0,07');
    expect(valorDa(salvos, 'Preço sugerido')).toBe('R$ 0,11');

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
        margem_lucro: 0.6,
        insumos: [{ insumo_id: 1, quantidade: 1 }],
      },
    ]);
    expect(window.location.pathname).toBe('/receitas');
  });
});
