import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateVendaBody } from '@/shared/api/contracts/sales';
import { ToastProvider } from '@/shared/ui/toast';
import { mockApi, mockApiErro } from '@/test/api';
import { makeCanaisDoSeed } from '@/test/factories/pricing.factory';
import {
  makePrecoCanal,
  makeReceitasDoSeed,
} from '@/test/factories/receita.factory';
import { makeVenda } from '@/test/factories/venda.factory';
import { setTestUrl } from '@/test/next-navigation';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { VendasTela } from './vendas-tela';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

// Os testes digitam bastante: com a suíte inteira, passam dos 5 s padrão.
const OPCOES = { timeout: 20_000 };

/** O Quindim com preço no Balcão (1,40) e no iFood (1,65). */
function receitas() {
  return makeReceitasDoSeed().map((receita) =>
    receita.nome === 'Quindim'
      ? {
          ...receita,
          precos: [
            makePrecoCanal({ preco: 1.4 }),
            makePrecoCanal({
              canalId: 2,
              canal: 'iFood',
              balcao: false,
              preco: 1.65,
            }),
          ],
        }
      : receita,
  );
}

function renderTela() {
  server.use(
    mockApi('GET /receitas', receitas()),
    mockApi('GET /canais', makeCanaisDoSeed()),
  );
  return renderWithQuery(
    <ToastProvider>
      <VendasTela busca={{ aba: 'registrar' }} />
    </ToastProvider>,
  );
}

function formulario() {
  return within(screen.getByRole('form', { name: 'Adicionar produto' }));
}

function carrinho() {
  return within(screen.getByRole('region', { name: 'Carrinho' }));
}

async function escolherReceita(nome: string) {
  const select = await screen.findByRole('combobox', {
    name: 'Produto/Receita',
  });
  await waitFor(() => expect(select).toBeEnabled());
  await userEvent.selectOptions(select, nome);
}

async function adicionar(nome: string, quantidade: string, preco?: string) {
  await escolherReceita(nome);
  await userEvent.type(
    formulario().getByRole('textbox', { name: 'Quantidade' }),
    quantidade,
  );
  if (preco !== undefined) {
    const campo = formulario().getByRole('textbox', {
      name: 'Preço unitário real',
    });
    await userEvent.clear(campo);
    await userEvent.type(campo, preco);
  }
  await userEvent.click(
    screen.getByRole('button', { name: 'Adicionar ao carrinho' }),
  );
}

beforeEach(() => {
  setTestUrl('/vendas');
});

describe('registrar venda', OPCOES, () => {
  it('preenche o preço sugerido ao escolher a receita, e ele pode ser alterado', async () => {
    renderTela();

    await escolherReceita('Quindim');
    const preco = formulario().getByRole('textbox', {
      name: 'Preço unitário real',
    });
    expect(preco).toHaveValue('1,40');

    await userEvent.clear(preco);
    await userEvent.type(preco, '2');
    expect(preco).toHaveValue('2');
  });

  it('no iFood, sugere o preço do iFood, envia o canal e trava a troca com itens', async () => {
    let corpo: CreateVendaBody | undefined;
    server.use(
      mockApi('POST /vendas', async ({ request }) => {
        corpo = (await request.json()) as CreateVendaBody;
        return makeVenda({ id: 8, status: 'PENDENTE', canalId: 2 });
      }),
    );
    renderTela();

    const canal = await screen.findByRole('combobox', { name: 'Onde vendeu?' });
    await waitFor(() => expect(canal).toHaveValue('1'));
    // Só os canais ativos: "iFood com entrega" está desativado.
    expect(
      within(canal)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Balcão', 'iFood']);

    await userEvent.selectOptions(canal, 'iFood');
    await escolherReceita('Quindim');
    expect(
      formulario().getByRole('textbox', { name: 'Preço unitário real' }),
    ).toHaveValue('1,65');

    await adicionar('Quindim', '2');
    expect(canal).toBeDisabled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar Venda' }),
    );
    await screen.findByRole('dialog', { name: 'Confirmar venda' });
    expect(corpo).toEqual({
      canal_id: 2,
      itens: [{ receita_id: 4, quantidade: 2, preco_unitario_real: 1.65 }],
    });
  });

  it('valida os campos antes de adicionar', async () => {
    renderTela();
    await screen.findByRole('option', { name: 'Quindim' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar ao carrinho' }),
    );

    expect(await screen.findByText('Selecione um produto')).toBeInTheDocument();
    expect(screen.getByText('Informe a quantidade')).toBeInTheDocument();
    expect(screen.getByText('Informe o preço')).toBeInTheDocument();
    expect(carrinho().getByText('0 itens')).toBeInTheDocument();
  });

  it('adiciona e remove itens, com subtotal e total', async () => {
    renderTela();

    expect(
      await screen.findByRole('button', { name: 'Registrar Venda' }),
    ).toBeDisabled();

    await adicionar('Pão Francês', '50', '0,50');
    expect(carrinho().getByText('1 item')).toBeInTheDocument();
    expect(carrinho().getByText('50 × R$ 0,50')).toBeInTheDocument();
    // O formulário volta vazio para o próximo item.
    expect(
      formulario().getByRole('combobox', { name: 'Produto/Receita' }),
    ).toHaveValue('');

    await adicionar('Brigadeiro Gourmet', '20', '1');
    expect(carrinho().getByText('2 itens')).toBeInTheDocument();
    expect(carrinho().getByText('20 × R$ 1,00')).toBeInTheDocument();
    expect(carrinho().getByText('R$ 45,00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Registrar Venda' }),
    ).toBeEnabled();

    await userEvent.click(
      carrinho().getByRole('button', { name: 'Remover Pão Francês' }),
    );
    expect(carrinho().getByText('1 item')).toBeInTheDocument();
    expect(carrinho().queryByText('Pão Francês')).not.toBeInTheDocument();
    expect(carrinho().getAllByText('R$ 20,00')).toHaveLength(2);

    await userEvent.click(
      carrinho().getByRole('button', { name: 'Remover Brigadeiro Gourmet' }),
    );
    expect(carrinho().getByText('0 itens')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Registrar Venda' }),
    ).toBeDisabled();
  });

  it('registra a venda, limpa o carrinho e abre a confirmação', async () => {
    let corpo: CreateVendaBody | undefined;
    const venda = makeVenda({ id: 7, status: 'PENDENTE' });
    server.use(
      mockApi('POST /vendas', async ({ request }) => {
        corpo = (await request.json()) as CreateVendaBody;
        return venda;
      }),
    );
    renderTela();

    await adicionar('Pão Francês', '50', '0,50');
    await adicionar('Brigadeiro Gourmet', '20', '1');
    expect(carrinho().getByText('R$ 45,00')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar Venda' }),
    );

    // A venda nasce pendente e abre a confirmação (FE-17).
    const confirmacao = await screen.findByRole('dialog', {
      name: 'Confirmar venda',
    });
    expect(within(confirmacao).getByText('Venda #7')).toBeInTheDocument();
    expect(within(confirmacao).getByText('Pendente')).toBeInTheDocument();
    expect(corpo).toEqual({
      canal_id: 1,
      itens: [
        { receita_id: 1, quantidade: 50, preco_unitario_real: 0.5 },
        { receita_id: 3, quantidade: 20, preco_unitario_real: 1 },
      ],
    });
    // O total do carrinho era o `total` devolvido pelo backend.
    expect(venda.total).toBe(45);

    // "Fechar" mantém a venda pendente e volta ao carrinho, já vazio.
    const [, fechar] = within(confirmacao).getAllByRole('button', {
      name: 'Fechar',
    });
    await userEvent.click(fechar);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(carrinho().getByText('0 itens')).toBeInTheDocument();
  });

  it('com estoque insuficiente, mantém o carrinho e leva a Fornadas', async () => {
    server.use(
      mockApiErro(
        'POST /vendas',
        400,
        'Estoque insuficiente para a receita 1',
        'Bad Request',
      ),
    );
    renderTela();

    await adicionar('Pão Francês', '50');
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar Venda' }),
    );

    const alerta = await carrinho().findByRole('alert');
    expect(alerta).toHaveTextContent(
      'Estoque insuficiente para registrar a venda. Anote a fornada do produto em Fornadas.',
    );
    expect(
      within(alerta).getByRole('link', { name: 'Ir para Fornadas' }),
    ).toHaveAttribute('href', '/producoes');
    expect(carrinho().getByText('1 item')).toBeInTheDocument();
    expect(carrinho().getByText('50 × R$ 0,46')).toBeInTheDocument();
  });

  it('mostra a mensagem do backend nos outros erros', async () => {
    server.use(mockApiErro('POST /vendas', 400, 'Receita não encontrada'));
    renderTela();

    await adicionar('Quindim', '2');
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar Venda' }),
    );

    expect(await carrinho().findByRole('alert')).toHaveTextContent(
      'Receita não encontrada',
    );
    expect(carrinho().getByText('1 item')).toBeInTheDocument();
  });
});
