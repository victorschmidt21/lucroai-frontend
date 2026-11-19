import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Producao } from '@/shared/api/contracts/operations';
import type {
  UpdateVendaStatusBody,
  Venda,
} from '@/shared/api/contracts/sales';
import { ToastProvider } from '@/shared/ui/toast';
import { mockApi, mockApiErro } from '@/test/api';
import { makeProducao } from '@/test/factories/producao.factory';
import { makeReceitasDoSeed } from '@/test/factories/receita.factory';
import { makeVenda } from '@/test/factories/venda.factory';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { ConfirmacaoVenda } from './confirmacao-venda';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

// Venda pendente com 50 Pães Franceses (receita 1) e 20 Brigadeiros (receita 3).
const pendente = makeVenda({ id: 7, status: 'PENDENTE' });

/**
 * Seed: 3 lotes de pão (× 50 = 150) e 1 de brigadeiro (× 40 = 40), com a primeira
 * venda concluída (50 pães e 20 brigadeiros): disponível 100 pães e 20 brigadeiros.
 */
function mockEstoque(
  producoesBrigadeiro: Producao[] = [
    makeProducao({ id: 2, receitaId: 3, quantidade: 1 }),
  ],
) {
  server.use(
    mockApi('GET recipe /receitas', makeReceitasDoSeed()),
    mockApi('GET sales /vendas', ({ request }) => {
      expect(new URL(request.url).searchParams.get('status')).toBe('CONCLUIDA');
      return [makeVenda({ id: 1 })];
    }),
    mockApi('GET operations /producoes', ({ request }) =>
      new URL(request.url).searchParams.get('receitaId') === '1'
        ? [makeProducao()]
        : producoesBrigadeiro,
    ),
  );
}

function mockPatch(corpos: UpdateVendaStatusBody[]) {
  server.use(
    mockApi('PATCH sales /vendas/:id/status', async ({ request, params }) => {
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
    server.use(mockApi('GET recipe /receitas', makeReceitasDoSeed()));
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

  it('conclui com estoque e mostra o status consultado de novo', async () => {
    const corpos: UpdateVendaStatusBody[] = [];
    let consultas = 0;
    mockEstoque();
    mockPatch(corpos);
    server.use(
      mockApi('GET sales /vendas/:id', () => {
        consultas += 1;
        return { ...pendente, status: 'CONCLUIDA' };
      }),
    );
    const { dialogo } = renderConfirmacao();

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Concluir venda' }),
    );

    expect(
      await screen.findByText('Venda concluída com sucesso.'),
    ).toBeInTheDocument();
    expect(corpos).toEqual([{ status: 'CONCLUIDA' }]);
    await waitFor(() => expect(consultas).toBe(1));
    expect(await within(dialogo).findByText('Concluída')).toBeInTheDocument();
    expect(
      within(dialogo).queryByRole('button', { name: 'Concluir venda' }),
    ).not.toBeInTheDocument();
  });

  it('bloqueia a conclusão quando falta produto acabado', async () => {
    const corpos: UpdateVendaStatusBody[] = [];
    mockEstoque([]);
    mockPatch(corpos);
    const { dialogo } = renderConfirmacao();

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Concluir venda' }),
    );

    const aviso = await screen.findByRole('dialog', {
      name: 'Estoque insuficiente',
    });
    // Sem produção de brigadeiro e 20 já vendidos: disponível −20.
    expect(aviso).toHaveTextContent(
      'Estoque insuficiente para "Brigadeiro Gourmet": disponível -20, solicitado 20. Registre uma produção antes de concluir.',
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
      mockApiErro('GET operations /producoes', 500, 'Internal server error'),
      mockApi('GET sales /vendas/:id', { ...pendente, status: 'CONCLUIDA' }),
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

  it('cancela sem verificar o estoque', async () => {
    // Sem handler de produções nem de vendas: qualquer consulta falharia o teste.
    const corpos: UpdateVendaStatusBody[] = [];
    server.use(mockApi('GET recipe /receitas', makeReceitasDoSeed()));
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
    server.use(mockApi('GET recipe /receitas', makeReceitasDoSeed()));
    const { dialogo, onFechar } = renderConfirmacao();

    // O ícone "Fechar" do cabeçalho e o botão do rodapé fazem o mesmo.
    const [, rodape] = within(dialogo).getAllByRole('button', {
      name: 'Fechar',
    });
    await userEvent.click(rodape);

    expect(onFechar).toHaveBeenCalled();
  });
});
