import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError, ContratoInvalidoError } from '@/shared/api/errors';
import { apiUrl, envelope, mockApi, mockApiErro } from '@/test/api';
import { makeInsumo } from '@/test/factories/insumo.factory';
import insumoReal from '@/test/fixtures/catalog/insumo.json';
import insumosReais from '@/test/fixtures/catalog/insumos.json';
import { server } from '@/test/server';
import {
  createInsumo,
  deleteInsumo,
  getInsumo,
  listInsumos,
  updateInsumo,
} from './insumos.api';
import {
  insumoDetailOptions,
  insumosKeys,
  insumosListOptions,
  ordenarPorNome,
} from './insumos.queries';

describe('listInsumos', () => {
  it('desembrulha a resposta real do backend', async () => {
    server.use(
      http.get(apiUrl('catalog', '/insumos'), () =>
        HttpResponse.json(insumosReais),
      ),
    );

    await expect(listInsumos()).resolves.toEqual(insumosReais.data);
  });

  it('rejeita uma resposta fora do contrato', async () => {
    server.use(
      http.get(apiUrl('catalog', '/insumos'), () =>
        HttpResponse.json(envelope([{ ...makeInsumo(), custoUnitario: '3' }])),
      ),
    );

    await expect(listInsumos()).rejects.toBeInstanceOf(ContratoInvalidoError);
  });
});

describe('getInsumo', () => {
  it('busca o insumo pelo id', async () => {
    server.use(
      http.get(apiUrl('catalog', '/insumos/19'), () =>
        HttpResponse.json(insumoReal),
      ),
    );

    await expect(getInsumo(19)).resolves.toEqual(insumoReal.data);
  });

  it('rejeita com o 404 do backend', async () => {
    server.use(
      mockApiErro(
        'GET catalog /insumos/:id',
        404,
        'Insumo não encontrado',
        'Not Found',
      ),
    );

    await expect(getInsumo(99)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Insumo não encontrado',
    });
  });
});

describe('mutações', () => {
  it('cria com POST e o corpo em camelCase', async () => {
    const corpos: unknown[] = [];
    server.use(
      mockApi('POST catalog /insumos', async ({ request }) => {
        corpos.push(await request.json());
        return makeInsumo({ id: 30 });
      }),
    );
    const body = {
      nome: 'Farinha de Trigo',
      quantidadeBaseCusto: 5,
      unidade: 'KG' as const,
      valorPago: 15,
      quantidadeDisponivelInicial: 10,
    };

    await expect(createInsumo(body)).resolves.toEqual(makeInsumo({ id: 30 }));
    expect(corpos).toEqual([body]);
  });

  it('edita com PATCH no id', async () => {
    const chamadas: unknown[] = [];
    server.use(
      mockApi('PATCH catalog /insumos/:id', async ({ request, params }) => {
        chamadas.push([params.id, await request.json()]);
        return makeInsumo({ valorPago: 18, custoUnitario: 3.6 });
      }),
    );

    const insumo = await updateInsumo({ id: 1, body: { valorPago: 18 } });

    expect(insumo.custoUnitario).toBe(3.6);
    expect(chamadas).toEqual([['1', { valorPago: 18 }]]);
  });

  it('exclui com DELETE e aceita o 204 sem corpo', async () => {
    const ids: unknown[] = [];
    server.use(
      mockApi('DELETE catalog /insumos/:id', ({ params }) => {
        ids.push(params.id);
        return undefined;
      }),
    );

    await expect(deleteInsumo(7)).resolves.toBeUndefined();
    expect(ids).toEqual(['7']);
  });

  it('rejeita a exclusão com a mensagem do backend', async () => {
    server.use(
      mockApiErro(
        'DELETE catalog /insumos/:id',
        400,
        'Insumo usado em receita',
        'Bad Request',
      ),
    );

    const erro = await deleteInsumo(7).catch((error: unknown) => error);

    expect(erro).toBeInstanceOf(ApiError);
    expect((erro as ApiError).message).toBe('Insumo usado em receita');
  });
});

describe('queries', () => {
  it('monta as chaves a partir da raiz', () => {
    expect(insumosKeys.list()).toEqual(['insumos', 'list']);
    expect(insumosKeys.detail(3)).toEqual(['insumos', 'detail', 3]);
  });

  it('ordena por nome em português', () => {
    expect(
      ordenarPorNome([
        makeInsumo({ id: 1, nome: 'Sal' }),
        makeInsumo({ id: 2, nome: 'Ovos' }),
        makeInsumo({ id: 3, nome: 'Açúcar Cristal' }),
      ]).map(({ nome }) => nome),
    ).toEqual(['Açúcar Cristal', 'Ovos', 'Sal']);
  });

  it('busca a lista e o detalhe pelas opções', async () => {
    server.use(
      mockApi('GET catalog /insumos', [makeInsumo()]),
      mockApi('GET catalog /insumos/:id', makeInsumo({ id: 2 })),
    );
    const queryClient = new QueryClient();

    await expect(queryClient.fetchQuery(insumosListOptions())).resolves.toEqual(
      [makeInsumo()],
    );
    await expect(
      queryClient.fetchQuery(insumoDetailOptions(2)),
    ).resolves.toEqual(makeInsumo({ id: 2 }));
  });
});
