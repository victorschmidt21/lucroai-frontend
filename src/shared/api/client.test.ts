import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { apiUrl, mockApi, mockApiErro, mockApiSemConexao } from '@/test/api';
import { makeInsumo } from '@/test/factories/insumo.factory';
import { makeVenda } from '@/test/factories/venda.factory';
import { server } from '@/test/server';
import { apiFetch } from './client';
import { insumoSchema } from './contracts/catalog';
import { vendaSchema } from './contracts/sales';
import { ApiError, ApiNetworkError, ContratoInvalidoError } from './errors';
import { requisitar, unwrap } from './request';

describe('apiFetch (navegador)', () => {
  it('chama o proxy BFF e devolve o JSON puro da API', async () => {
    const urls: string[] = [];
    server.use(
      mockApi('GET /insumos', ({ request }) => {
        urls.push(request.url);
        return [makeInsumo()];
      }),
    );

    const corpo = await apiFetch('/insumos');

    expect(urls).toEqual([`${window.location.origin}/api/backend/insumos`]);
    expect(unwrap(corpo, z.array(insumoSchema))).toEqual([makeInsumo()]);
  });

  it('envia o método e o corpo em JSON', async () => {
    const recebidos: unknown[] = [];
    server.use(
      mockApi('PATCH /vendas/:id/status', async ({ request, params }) => {
        recebidos.push({
          id: params.id,
          contentType: request.headers.get('content-type'),
          corpo: await request.json(),
        });
        return makeVenda({ id: 7, status: 'CANCELADA' });
      }),
    );

    const corpo = await apiFetch('/vendas/7/status', {
      method: 'PATCH',
      body: { status: 'CANCELADA' },
    });

    expect(recebidos).toEqual([
      {
        id: '7',
        contentType: 'application/json',
        corpo: { status: 'CANCELADA' },
      },
    ]);
    expect(unwrap(corpo, vendaSchema).status).toBe('CANCELADA');
  });

  it('monta a query e omite os filtros vazios', async () => {
    const buscas: string[] = [];
    server.use(
      mockApi('GET /vendas', ({ request }) => {
        buscas.push(new URL(request.url).search);
        return [];
      }),
    );

    await apiFetch('/vendas', {
      query: {
        status: 'CONCLUIDA',
        dataInicio: '2026-11-01T03:00:00.000Z',
        dataFim: undefined,
        receitaId: '',
      },
    });

    expect(buscas).toEqual([
      '?status=CONCLUIDA&dataInicio=2026-11-01T03%3A00%3A00.000Z',
    ]);
  });

  it('resolve com undefined no DELETE sem corpo (204)', async () => {
    server.use(mockApi('DELETE /insumos/:id', undefined));

    await expect(
      apiFetch('/insumos/1', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('rejeita com ApiError no erro do backend', async () => {
    server.use(
      mockApiErro(
        'GET /insumos/:id',
        404,
        'Insumo não encontrado',
        'INSUMO_NAO_ENCONTRADO',
      ),
    );

    const erro = await apiFetch('/insumos/99').catch((cause: unknown) => cause);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({
      statusCode: 404,
      code: 'INSUMO_NAO_ENCONTRADO',
      message: 'Insumo não encontrado',
    });
  });

  it('rejeita com ApiError de sessão expirada no 401', async () => {
    server.use(
      mockApiErro(
        'GET /receitas',
        401,
        'Autenticação necessária',
        'NAO_AUTENTICADO',
      ),
    );

    await expect(apiFetch('/receitas')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Sessão expirada. Faça login novamente.',
    });
  });

  it('rejeita com ApiNetworkError quando não há conexão', async () => {
    server.use(mockApiSemConexao('GET /producoes'));

    const erro = await apiFetch('/producoes').catch((cause: unknown) => cause);

    expect(erro).toBeInstanceOf(ApiNetworkError);
    expect(erro).toMatchObject({
      statusCode: 0,
      isTimeout: false,
      message: 'Sem conexão com o servidor.',
    });
  });

  it('rejeita com ContratoInvalidoError um sucesso que não é JSON', async () => {
    server.use(
      http.get(apiUrl('/insumos'), () => HttpResponse.text('<html>ok</html>')),
    );

    await expect(apiFetch('/insumos')).rejects.toBeInstanceOf(
      ContratoInvalidoError,
    );
  });

  it('nunca chama as rotas /internal', () => {
    expect(() => apiFetch('/insumos/internal/1')).toThrow(
      'Caminho de API não permitido',
    );
  });

  it('mantém o cancelamento de quem chamou como AbortError', async () => {
    server.use(
      http.get(apiUrl('/insumos'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();

    const promessa = apiFetch('/insumos', {
      signal: controller.signal,
    });
    controller.abort();

    await expect(promessa).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('não faz a requisição com um signal já cancelado', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      apiFetch('/insumos', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('requisitar', () => {
  it('converte o timeout em ApiNetworkError', async () => {
    server.use(
      http.get(apiUrl('/insumos'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    const erro = await requisitar({
      url: new URL('/api/backend/insumos', window.location.origin),
      timeoutMs: 20,
    }).catch((cause: unknown) => cause);

    expect(erro).toBeInstanceOf(ApiNetworkError);
    expect(erro).toMatchObject({ isTimeout: true, statusCode: 0 });
  });
});
