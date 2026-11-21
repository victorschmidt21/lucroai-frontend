import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mockApi, mockApiErro } from '@/test/api';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { server } from '@/test/server';
import { useCreateInsumo } from './use-create-insumo';
import { useDeleteInsumo } from './use-delete-insumo';
import { useUpdateInsumo } from './use-update-insumo';

function preparar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidar = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return {
    invalidar,
    wrapper,
    raizes: () => invalidar.mock.calls.map(([filtro]) => filtro?.queryKey),
  };
}

const INSUMOS_ESTOQUE_RECEITAS = [['insumos'], ['estoque'], ['receitas']];

describe('invalidação após as mutações de insumo', () => {
  it('criar invalida insumos, estoque e receitas', async () => {
    server.use(mockApi('POST /insumos', makeInsumo()));
    const { wrapper, raizes } = preparar();
    const { result } = renderHook(() => useCreateInsumo(), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        nome: 'Farinha de Trigo',
        quantidadeBaseCusto: 5,
        unidade: 'KG',
        valorPago: 15,
      }),
    );

    expect(raizes()).toEqual(INSUMOS_ESTOQUE_RECEITAS);
  });

  it('editar invalida insumos, estoque e receitas', async () => {
    server.use(mockApi('PATCH /insumos/:id', makeInsumo()));
    const { wrapper, raizes } = preparar();
    const { result } = renderHook(() => useUpdateInsumo(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ id: 1, body: { valorPago: 15 } }),
    );

    expect(raizes()).toEqual(INSUMOS_ESTOQUE_RECEITAS);
  });

  it('excluir invalida insumos, estoque e receitas', async () => {
    server.use(mockApi('DELETE /insumos/:id', undefined));
    const { wrapper, raizes } = preparar();
    const { result } = renderHook(() => useDeleteInsumo(), { wrapper });

    await act(() => result.current.mutateAsync(1));

    expect(raizes()).toEqual(INSUMOS_ESTOQUE_RECEITAS);
  });
});

describe('erros', () => {
  it('recarrega a lista quando o insumo já não existe (404)', async () => {
    server.use(
      mockApiErro(
        'DELETE /insumos/:id',
        404,
        'Insumo não encontrado',
        'Not Found',
      ),
    );
    const { wrapper, raizes } = preparar();
    const { result } = renderHook(() => useDeleteInsumo(), { wrapper });

    await act(() => result.current.mutateAsync(1).catch(() => undefined));

    expect(raizes()).toEqual([['insumos']]);
  });

  it('não invalida nada em outros erros', async () => {
    server.use(
      mockApiErro('PATCH /insumos/:id', 400, 'Regra de negócio', 'Bad Request'),
    );
    const { wrapper, raizes } = preparar();
    const { result } = renderHook(() => useUpdateInsumo(), { wrapper });

    await act(() =>
      result.current
        .mutateAsync({ id: 1, body: { valorPago: 1 } })
        .catch(() => undefined),
    );

    expect(raizes()).toEqual([]);
  });
});
