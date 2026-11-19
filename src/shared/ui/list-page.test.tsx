import { useQuery } from '@tanstack/react-query';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { apiErrorFromResponse } from '@/shared/api/errors';
import { formatMoeda } from '@/shared/format/moeda';
import { expectNoA11yViolations } from '@/test/a11y';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { setTestUrl } from '@/test/next-navigation';
import { renderWithQuery } from '@/test/render';
import { Button } from './button';
import { ListPage } from './list-page';
import { DEBOUNCE_BUSCA_MS } from './use-busca-na-url';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

const INSUMOS = [
  makeInsumo({ id: 1, nome: 'Açúcar Cristal', valorPago: 8.8 }),
  makeInsumo({ id: 2, nome: 'Farinha de Trigo', valorPago: 15 }),
  makeInsumo({ id: 3, nome: 'Sal', valorPago: 2.5, quantidadeDisponivel: 0 }),
];

type Props = {
  carregar?: () => Promise<Insumo[]>;
  filtrarSemEstoque?: boolean;
};

function Lista({
  carregar = () => Promise.resolve(INSUMOS),
  filtrarSemEstoque,
}: Props) {
  const query = useQuery({ queryKey: ['insumos'], queryFn: carregar });

  return (
    <ListPage
      title="Insumos"
      subtitle="Gerencie quantidade, valor pago e custo unitário"
      actions={<Button>Novo insumo</Button>}
      label="Insumos"
      query={query}
      searchField="nome"
      searchPlaceholder="Buscar insumo"
      itemLabel={{ singular: 'insumo', plural: 'insumos' }}
      emptyTitle="Nenhum insumo encontrado."
      emptyAction={<Button>Cadastrar insumo</Button>}
      errorTitle="Não foi possível carregar os insumos."
      getRowKey={(insumo) => insumo.id}
      filter={
        filtrarSemEstoque
          ? (insumo) => insumo.quantidadeDisponivel === 0
          : undefined
      }
      filterEmptyTitle="Nenhum insumo sem estoque."
      columns={[
        { id: 'nome', header: 'Nome', cell: (insumo) => insumo.nome },
        {
          id: 'valorPago',
          header: 'Valor pago',
          align: 'right',
          cell: (insumo) => formatMoeda(insumo.valorPago),
        },
        {
          id: 'acoes',
          header: 'Ações',
          acoes: true,
          cell: (insumo) => <Button>{`Editar ${insumo.nome}`}</Button>,
        },
      ]}
    />
  );
}

function linhas() {
  return within(screen.getByRole('table', { name: 'Insumos' }))
    .getAllByRole('row')
    .slice(1)
    .map((linha) => within(linha).getAllByRole('cell')[0]?.textContent);
}

beforeEach(() => {
  setTestUrl('/insumos');
});

describe('ListPage', () => {
  it('mostra o cabeçalho e o esqueleto enquanto carrega', () => {
    renderWithQuery(<Lista carregar={() => new Promise(() => undefined)} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Insumos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Gerencie quantidade, valor pago e custo unitário'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Novo insumo' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Carregando insumos' }),
    ).toBeInTheDocument();
  });

  it('lista os itens com a contagem, os rótulos e as ações', async () => {
    renderWithQuery(<Lista />);

    expect(await screen.findByText('3 insumos')).toBeInTheDocument();
    expect(linhas()).toEqual(['Açúcar Cristal', 'Farinha de Trigo', 'Sal']);
    expect(
      screen.getByRole('columnheader', { name: 'Valor pago' }),
    ).toBeInTheDocument();
    expect(screen.getByText('R$ 8,80')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar Sal' }),
    ).toBeInTheDocument();
  });

  it('mostra o vazio com a ação, sem contagem', async () => {
    renderWithQuery(<Lista carregar={() => Promise.resolve([])} />);

    expect(
      await screen.findByText('Nenhum insumo encontrado.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cadastrar insumo' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('0 insumos')).not.toBeInTheDocument();
  });

  it('mostra o erro com a mensagem e tenta de novo', async () => {
    let tentativas = 0;
    renderWithQuery(
      <Lista
        carregar={() => {
          tentativas += 1;
          return tentativas === 1
            ? Promise.reject(
                apiErrorFromResponse('catalog', 500, {
                  statusCode: 500,
                  message: 'Internal server error',
                }),
              )
            : Promise.resolve(INSUMOS);
        }}
      />,
    );

    expect(
      await screen.findByText('Não foi possível carregar os insumos.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Erro no servidor. Tente novamente.'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByText('3 insumos')).toBeInTheDocument();
  });

  it('lê a busca da URL, sem diferenciar acentos (recarregar mantém o filtro)', async () => {
    setTestUrl('/insumos?q=acucar');

    renderWithQuery(<Lista />);

    expect(await screen.findByText('1 insumo')).toBeInTheDocument();
    expect(linhas()).toEqual(['Açúcar Cristal']);
    expect(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
    ).toHaveValue('acucar');
  });

  it('mostra o vazio por busca e limpa a busca', async () => {
    setTestUrl('/insumos?q=chocolate');
    renderWithQuery(<Lista />);

    expect(
      await screen.findByText('Nenhum resultado para "chocolate"'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 insumos')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));

    expect(await screen.findByText('3 insumos')).toBeInTheDocument();
    expect(window.location.search).toBe('');
    expect(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
    ).toHaveFocus();
  });

  it('busca dentro do filtro extra', async () => {
    renderWithQuery(<Lista filtrarSemEstoque />);

    expect(await screen.findByText('1 insumo')).toBeInTheDocument();
    act(() => setTestUrl('/insumos?q=farinha'));

    expect(
      await screen.findByText('Nenhum resultado para "farinha"'),
    ).toBeInTheDocument();
  });

  it('acompanha a URL quando ela muda por fora (voltar no navegador)', async () => {
    renderWithQuery(<Lista />);
    await screen.findByText('3 insumos');

    act(() => setTestUrl('/insumos?q=sal'));

    expect(await screen.findByText('1 insumo')).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
    ).toHaveValue('sal');
  });

  it('Enter aplica a busca na hora', async () => {
    renderWithQuery(<Lista />);
    await screen.findByText('3 insumos');

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
      'trigo{Enter}',
    );

    expect(window.location.search).toBe('?q=trigo');
    expect(linhas()).toEqual(['Farinha de Trigo']);
  });

  it('não tem violações de acessibilidade', async () => {
    renderWithQuery(<Lista />);
    await screen.findByText('3 insumos');

    await expectNoA11yViolations();
  });
});

describe('ListPage com o filtro extra', () => {
  it('diz que o filtro esvaziou a lista', async () => {
    renderWithQuery(
      <Lista
        filtrarSemEstoque
        carregar={() => Promise.resolve(INSUMOS.slice(0, 2))}
      />,
    );

    expect(
      await screen.findByText('Nenhum insumo sem estoque.'),
    ).toBeInTheDocument();
  });
});

describe('ListPage com debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('grava q na URL 300 ms depois da última tecla', async () => {
    renderWithQuery(<Lista />);
    await vi.waitFor(() => screen.getByText('3 insumos'));
    const busca = screen.getByRole('searchbox', { name: 'Buscar insumo' });

    fireEvent.change(busca, { target: { value: 'far' } });
    act(() => vi.advanceTimersByTime(DEBOUNCE_BUSCA_MS - 1));

    expect(window.location.search).toBe('');
    expect(screen.getByText('3 insumos')).toBeInTheDocument();

    fireEvent.change(busca, { target: { value: 'farinha ' } });
    act(() => vi.advanceTimersByTime(DEBOUNCE_BUSCA_MS));

    expect(window.location.search).toBe('?q=farinha');
    expect(busca).toHaveValue('farinha ');
    expect(screen.getByText('1 insumo')).toBeInTheDocument();
  });

  it('apagar a busca tira q da URL', async () => {
    setTestUrl('/insumos?q=sal&outro=1');
    renderWithQuery(<Lista />);
    await vi.waitFor(() => screen.getByText('1 insumo'));

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar insumo' }), {
      target: { value: '' },
    });
    act(() => vi.advanceTimersByTime(DEBOUNCE_BUSCA_MS));

    expect(window.location.search).toBe('?outro=1');
    expect(screen.getByText('3 insumos')).toBeInTheDocument();
  });
});
