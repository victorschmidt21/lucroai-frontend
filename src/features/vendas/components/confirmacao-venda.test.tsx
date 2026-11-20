import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EstoqueProduto } from '@/shared/api/contracts/operations';
import type {
  UpdateVendaStatusBody,
  Venda,
} from '@/shared/api/contracts/sales';
import { ToastProvider } from '@/shared/ui/toast';
import { mockApi, mockApiErro } from '@/test/api';
import { makeEstoqueProduto } from '@/test/factories/estoque.factory';
import { makeReceitasDoSeed } from '@/test/factories/receita.factory';
import { makeVenda } from '@/test/factories/venda.factory';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { ConfirmacaoVenda } from './confirmacao-venda';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

// Venda pendente com 50 Pães Franceses (receita 1) e 20 Brigadeiros (receita 3).
const pendente = makeVenda({ id: 7, status: 'PENDENTE' });

/** Saldo de produto acabado da API: 100 pães e 20 brigadeiros. */
function mockEstoque(
  estoques: EstoqueProduto[] = [
    makeEstoqueProduto({ receitaId: 1, quantidadeDisponivel: 100 }),
    makeEstoqueProduto({ receitaId: 3, quantidadeDisponivel: 20 }),
  ],
) {
  server.use(
    mockApi('GET /receitas', makeReceitasDoSeed()),
    mockApi('GET /estoque/produtos', estoques),
  );
}

function mockPatch(corpos: UpdateVendaStatusBody[]) {
  server.use(
    mockApi('PATCH /vendas/:id/status', async ({ request, params }) => {
      expect(params.id).toBe('7');
      const corpo = (await request.json()) as UpdateVendaStatusBody;
      corpos.push(corpo);
      return { ...pendente, status: corpo.status };
    }),
  );
}

function renderConfirmacao(venda: Venda = pendente) {
  const onFechar = vi.fn<() => void>();
  renderWithQuery(
    <ToastProvider>
      <ConfirmacaoVenda venda={venda} onFechar={onFechar} />
    </ToastProvider>,
  );
  const dialogo = screen.getByRole('dialog', { name: 'Confirmar venda' });
  return { onFechar, dialogo };
}

describe('ConfirmacaoVenda', { timeout: 20_000 }, () => {
  it('mostra os itens, a margem realizada e o total', async () => {
    server.use(mockApi('GET /receitas', makeReceitasDoSeed()));
    const { dialogo } = renderConfirmacao();

    const itens = within(dialogo).getByRole('list', {
      name: 'Itens da venda',
    });
    expect(await within(itens).findByText('Pão Francês')).toBeInTheDocument();
    expect(within(itens).getByText('50 × R$ 0,50')).toBeInTheDocument();
    expect(within(itens).getByText('86,0% margem')).toBeInTheDocument();
    expect(within(itens).getByText('R$ 25,00')).toBeInTheDocument();
    expect(within(dialogo).getByText('R$ 45,00')).toBeInTheDocument();
  });

  it('conclui com estoque e mostra o status devolvido pela API', async () => {
    const corpos: UpdateVendaStatusBody[] = [];
    mockEstoque();
    mockPatch(corpos);
    const { dialogo } = renderConfirmacao();

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Concluir venda' }),
    );

    expect(
      await screen.findByText('Venda concluída com sucesso.'),
    ).toBeInTheDocument();
    expect(corpos).toEqual([{ status: 'CONCLUIDA' }]);
    expect(await within(dialogo).findByText('Concluída')).toBeInTheDocument();
    expect(
      within(dialogo).queryByRole('button', { name: 'Concluir venda' }),
    ).not.toBeInTheDocument();
  });

  it('bloqueia a conclusão quando falta produto acabado', async () => {
    const corpos: UpdateVendaStatusBody[] = [];
    // Brigadeiro nunca produzido: fora da lista, vale 0.
    mockEstoque([
      makeEstoqueProduto({ receitaId: 1, quantidadeDisponivel: 100 }),
    ]);
    mockPatch(corpos);
    const { dialogo } = renderConfirmacao();

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Concluir venda' }),
    );

    const aviso = await screen.findByRole('dialog', {
      name: 'Estoque insuficiente',
    });
    expect(aviso).toHaveTextContent(
      'Estoque insuficiente para "Brigadeiro Gourmet": disponível 0, solicitado 20. Registre uma produção antes de concluir.',
    );
    expect(
      within(aviso).getByRole('link', { name: 'Ir para Produções' }),
    ).toHaveAttribute('href', '/producoes');

    await userEvent.click(
      within(aviso).getByRole('button', { name: 'Entendido' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Estoque insuficiente' }),
      ).not.toBeInTheDocument(),
    );
    expect(corpos).toEqual([]);
    expect(within(dialogo).getByText('Pendente')).toBeInTheDocument();
  });

  it('se a consulta de estoque falhar, conclui e deixa o backend validar', async () => {
    const corpos: UpdateVendaStatusBody[] = [];
    mockEstoque();
    server.use(
      mockApiErro('GET /estoque/produtos', 500, 'Erro interno do servidor'),
    );
    mockPatch(corpos);
    const { dialogo } = renderConfirmacao();

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Concluir venda' }),
    );

    expect(
      await screen.findByText('Venda concluída com sucesso.'),
    ).toBeInTheDocument();
    expect(corpos).toEqual([{ status: 'CONCLUIDA' }]);
  });

  it('mostra o diálogo de estoque quando a API recusa com ESTOQUE_INSUFICIENTE', async () => {
    mockEstoque();
    server.use(
      mockApiErro(
        'PATCH /vendas/:id/status',
        422,
        'Estoque insuficiente para a receita 3: disponível 5, solicitado 20',
        'ESTOQUE_INSUFICIENTE',
      ),
    );
    const { dialogo } = renderConfirmacao();

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Concluir venda' }),
    );

    const aviso = await screen.findByRole('dialog', {
      name: 'Estoque insuficiente',
    });
    expect(aviso).toHaveTextContent(
      'Estoque insuficiente para a receita 3: disponível 5, solicitado 20. Registre uma produção antes de concluir.',
    );
    expect(within(dialogo).getByText('Pendente')).toBeInTheDocument();
  });

  it('cancela sem verificar o estoque', async () => {
    // Sem handler de estoque: qualquer consulta falharia o teste.
    const corpos: UpdateVendaStatusBody[] = [];
    server.use(mockApi('GET /receitas', makeReceitasDoSeed()));
    mockPatch(corpos);
    const { dialogo } = renderConfirmacao();

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Cancelar venda' }),
    );

    expect(await screen.findByText('Venda cancelada.')).toBeInTheDocument();
    expect(corpos).toEqual([{ status: 'CANCELADA' }]);
    expect(within(dialogo).getByText('Cancelada')).toBeInTheDocument();
  });

  it('"Fechar" mantém a venda pendente', async () => {
    server.use(mockApi('GET /receitas', makeReceitasDoSeed()));
    const { dialogo, onFechar } = renderConfirmacao();

    // O ícone "Fechar" do cabeçalho e o botão do rodapé fazem o mesmo.
    const [, rodape] = within(dialogo).getAllByRole('button', {
      name: 'Fechar',
    });
    await userEvent.click(rodape);

    expect(onFechar).toHaveBeenCalled();
  });
});
