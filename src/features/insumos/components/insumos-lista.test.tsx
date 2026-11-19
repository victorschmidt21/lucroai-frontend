import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { ToastProvider } from '@/shared/ui/toast';
import { apiUrl, mockApi, mockApiErro } from '@/test/api';
import { makeInsumo, makeInsumosDoSeed } from '@/test/factories/insumo.factory';
import { setTestUrl } from '@/test/next-navigation';
import { renderWithQuery } from '@/test/render';
import { server } from '@/test/server';
import { InsumosLista } from './insumos-lista';

vi.mock('next/navigation', () => import('@/test/next-navigation'));

// Os testes digitam e abrem diálogos: sob a carga da
// cobertura com a suíte inteira, passam dos 5 s padrão.
const OPCOES = { timeout: 20_000 };

function renderLista(props: { abrirNovo?: boolean } = {}) {
  return renderWithQuery(
    <ToastProvider>
      <InsumosLista {...props} />
    </ToastProvider>,
  );
}

function nomes() {
  return within(screen.getByRole('table', { name: 'Insumos' }))
    .getAllByRole('row')
    .slice(1)
    .map((linha) => within(linha).getAllByRole('cell')[0]?.textContent);
}

/** API em memória: a lista reflete as mutações, como no backend. */
function apiComEstado(inicial: Insumo[]) {
  let insumos = [...inicial];
  server.use(
    mockApi('GET catalog /insumos', () => insumos),
    mockApi('DELETE catalog /insumos/:id', ({ params }) => {
      insumos = insumos.filter(({ id }) => String(id) !== params.id);
      return undefined;
    }),
    mockApi('PATCH catalog /insumos/:id', async ({ request, params }) => {
      const body = (await request.json()) as Partial<Insumo>;
      insumos = insumos.map((insumo) => {
        if (String(insumo.id) !== params.id) return insumo;
        const atualizado = { ...insumo, ...body };
        const custoUnitario =
          atualizado.valorPago / atualizado.quantidadeBaseCusto;
        return { ...atualizado, custoUnitario, precoUnitario: custoUnitario };
      });
      return insumos.find(({ id }) => String(id) === params.id)!;
    }),
  );
}

beforeEach(() => {
  setTestUrl('/insumos');
});

describe('estados', OPCOES, () => {
  it('mostra o esqueleto enquanto carrega', async () => {
    server.use(
      http.get(apiUrl('catalog', '/insumos'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    renderLista();

    expect(
      screen.getByRole('status', { name: 'Carregando insumos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Insumos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Gerencie quantidade, valor pago e custo unitário'),
    ).toBeInTheDocument();
  });

  it('mostra o vazio com a ação de cadastrar', async () => {
    server.use(mockApi('GET catalog /insumos', []));

    renderLista();

    expect(
      await screen.findByText('Nenhum insumo encontrado.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Novo insumo' })).toHaveLength(
      2,
    );
  });

  it('mostra o erro e tenta de novo', async () => {
    let tentativas = 0;
    server.use(
      http.get(apiUrl('catalog', '/insumos'), () => {
        tentativas += 1;
        return tentativas === 1
          ? HttpResponse.json(
              { statusCode: 500, message: 'Internal server error' },
              { status: 500 },
            )
          : HttpResponse.json({ data: [makeInsumo()], links: {} });
      }),
    );

    renderLista();

    expect(
      await screen.findByText('Não foi possível carregar os insumos.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Erro no servidor. Tente novamente.'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(await screen.findByText('Farinha de Trigo')).toBeInTheDocument();
  });
});

describe('lista', OPCOES, () => {
  it('ordena por nome e mostra quantidade, valor e custo de 4 casas', async () => {
    server.use(mockApi('GET catalog /insumos', makeInsumosDoSeed()));

    renderLista();

    expect(await screen.findByText('12 insumos')).toBeInTheDocument();
    expect(nomes().slice(0, 3)).toEqual([
      'Açúcar Cristal',
      'Cacau em Pó 100%',
      'Chocolate ao Leite Gotas',
    ]);
    const manteiga = screen.getByRole('row', { name: /Manteiga sem Sal/ });
    expect(within(manteiga).getByText('500 g')).toBeInTheDocument();
    expect(within(manteiga).getByText('R$ 12,00')).toBeInTheDocument();
    expect(within(manteiga).getByText('R$ 0,0240/g')).toBeInTheDocument();
    const farinha = screen.getByRole('row', { name: /Farinha de Trigo/ });
    expect(within(farinha).getByText('R$ 3,0000/kg')).toBeInTheDocument();
  });
});

describe('busca', OPCOES, () => {
  it('busca sem diferenciar acentos nem maiúsculas a partir da URL', async () => {
    setTestUrl('/insumos?q=ACUCAR');
    server.use(mockApi('GET catalog /insumos', makeInsumosDoSeed()));

    renderLista();

    expect(await screen.findByText('1 insumo')).toBeInTheDocument();
    expect(nomes()).toEqual(['Açúcar Cristal']);
  });

  it('grava q na URL ao digitar e mostra o vazio da busca', async () => {
    server.use(mockApi('GET catalog /insumos', makeInsumosDoSeed()));
    renderLista();
    await screen.findByText('12 insumos');

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
      'chocolate',
    );

    await waitFor(() => expect(window.location.search).toBe('?q=chocolate'));
    expect(nomes()).toEqual([
      'Chocolate ao Leite Gotas',
      'Granulado de Chocolate',
    ]);

    await userEvent.clear(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
    );
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar insumo' }),
      'polvilho{Enter}',
    );
    expect(
      await screen.findByText('Nenhum resultado para "polvilho"'),
    ).toBeInTheDocument();
  });
});

describe('mutações', OPCOES, () => {
  it('edita o valor pago e a lista mostra o custo devolvido pelo backend', async () => {
    apiComEstado([makeInsumo()]);
    renderLista();
    await screen.findByText('R$ 3,0000/kg');

    await userEvent.click(
      screen.getByRole('button', { name: 'Editar Farinha de Trigo' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Editar insumo' });
    const valorPago = within(dialog).getByRole('textbox', {
      name: 'Valor pago',
    });
    expect(valorPago).toHaveValue('15,00');
    await userEvent.clear(valorPago);
    await userEvent.type(valorPago, '18');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Atualizar' }),
    );

    expect(
      await screen.findByText('Insumo atualizado com sucesso.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('R$ 3,6000/kg')).toBeInTheDocument();
    expect(screen.getByText('R$ 18,00')).toBeInTheDocument();
  });

  it('exclui depois de confirmar e a lista atualiza', async () => {
    apiComEstado([
      makeInsumo(),
      makeInsumo({ id: 2, nome: 'Ovos', unidade: 'UN' }),
    ]);
    renderLista();
    await screen.findByText('2 insumos');

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Ovos' }));
    const dialog = screen.getByRole('dialog', { name: 'Excluir insumo' });
    expect(dialog).toHaveAccessibleDescription('Deseja excluir "Ovos"?');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Excluir' }),
    );

    expect(
      await screen.findByText('Insumo excluído com sucesso.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('1 insumo')).toBeInTheDocument();
    expect(nomes()).toEqual(['Farinha de Trigo']);
  });

  it('mostra a mensagem do backend quando a exclusão é recusada', async () => {
    server.use(
      mockApi('GET catalog /insumos', [makeInsumo()]),
      mockApiErro(
        'DELETE catalog /insumos/:id',
        400,
        'Insumo usado em receita',
        'Bad Request',
      ),
    );
    renderLista();
    await screen.findByText('1 insumo');

    await userEvent.click(
      screen.getByRole('button', { name: 'Excluir Farinha de Trigo' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Excluir insumo' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Excluir' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Insumo usado em receita',
    );
    expect(screen.getByRole('dialog', { name: 'Excluir insumo' })).toBe(dialog);
  });

  it('cancela a exclusão sem chamar a API', async () => {
    server.use(mockApi('GET catalog /insumos', [makeInsumo()]));
    renderLista();
    await screen.findByText('1 insumo');

    await userEvent.click(
      screen.getByRole('button', { name: 'Excluir Farinha de Trigo' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Excluir insumo' }),
      ).not.toBeInTheDocument(),
    );
    expect(nomes()).toEqual(['Farinha de Trigo']);
  });
});

describe('novo=1', OPCOES, () => {
  it('abre o cadastro e tira o parâmetro da URL ao fechar', async () => {
    setTestUrl('/insumos?q=sal&novo=1');
    server.use(mockApi('GET catalog /insumos', []));

    renderLista({ abrirNovo: true });

    const dialog = await screen.findByRole('dialog', { name: 'Novo insumo' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    );

    await waitFor(() => expect(window.location.search).toBe('?q=sal'));
  });

  it('abre o cadastro pelo botão do cabeçalho', async () => {
    server.use(mockApi('GET catalog /insumos', [makeInsumo()]));
    renderLista();
    await screen.findByText('1 insumo');

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Novo insumo' })[0]!,
    );
    const dialog = screen.getByRole('dialog', { name: 'Novo insumo' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    );

    expect(window.location.search).toBe('');
  });
});
