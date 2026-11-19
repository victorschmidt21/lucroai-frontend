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
  it('chama o proxy BFF do serviço e devolve o corpo com o envelope', async () => {
    const urls: string[] = [];
    server.use(
      mockApi('GET catalog /insumos', ({ request }) => {
        urls.push(request.url);
        return [makeInsumo()];
      }),
    );

    const corpo = await apiFetch('catalog', '/insumos');

    expect(urls).toEqual([
      `${window.location.origin}/api/backend/catalog/insumos`,
    ]);
    expect(unwrap(corpo, z.array(insumoSchema))).toEqual([makeInsumo()]);
  });

  it('envia o método e o corpo em JSON', async () => {
    const recebidos: unknown[] = [];
    server.use(
      mockApi('PATCH sales /vendas/:id/status', async ({ request, params }) => {
        recebidos.push({
          id: params.id,
          contentType: request.headers.get('content-type'),
          corpo: await request.json(),
        });
        return makeVenda({ id: 7, status: 'CANCELADA' });
      }),
    );

    const corpo = await apiFetch('sales', '/vendas/7/status', {
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
      mockApi('GET sales /vendas', ({ request }) => {
        buscas.push(new URL(request.url).search);
        return [];
      }),
    );

    await apiFetch('sales', '/vendas', {
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
    server.use(mockApi('DELETE catalog /insumos/:id', undefined));

    await expect(
      apiFetch('catalog', '/insumos/1', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('rejeita com ApiError no erro do backend', async () => {
    server.use(
      mockApiErro(
        'GET catalog /insumos/:id',
        404,
        'Insumo não encontrado',
        'Not Found',
      ),
    );

    const erro = await apiFetch('catalog', '/insumos/99').catch(
      (cause: unknown) => cause,
    );

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({
      statusCode: 404,
      servico: 'catalog',
      message: 'Insumo não encontrado',
    });
  });

  it('rejeita com ApiError de sessão expirada no 401', async () => {
    server.use(mockApiErro('GET recipe /receitas', 401, 'Unauthorized'));

    await expect(apiFetch('recipe', '/receitas')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Sessão expirada. Faça login novamente.',
    });
  });

  it('rejeita com ApiNetworkError quando não há conexão', async () => {
    server.use(mockApiSemConexao('GET operations /producoes'));

    const erro = await apiFetch('operations', '/producoes').catch(
      (cause: unknown) => cause,
    );

    expect(erro).toBeInstanceOf(ApiNetworkError);
    expect(erro).toMatchObject({
      statusCode: 0,
      isTimeout: false,
      message: 'Sem conexão com o servidor.',
    });
  });

  it('rejeita com ContratoInvalidoError um sucesso que não é JSON', async () => {
    server.use(
      http.get(apiUrl('catalog', '/insumos'), () =>
        HttpResponse.text('<html>ok</html>'),
      ),
    );

    await expect(apiFetch('catalog', '/insumos')).rejects.toBeInstanceOf(
      ContratoInvalidoError,
    );
  });

  it('nunca chama as rotas /internal', () => {
    expect(() => apiFetch('catalog', '/insumos/internal/1')).toThrow(
      'Caminho de API não permitido',
    );
  });

  it('mantém o cancelamento de quem chamou como AbortError', async () => {
    server.use(
      http.get(apiUrl('catalog', '/insumos'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();

    const promessa = apiFetch('catalog', '/insumos', {
      signal: controller.signal,
    });
    controller.abort();

    await expect(promessa).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('não faz a requisição com um signal já cancelado', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      apiFetch('catalog', '/insumos', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('requisitar', () => {
  it('converte o timeout em ApiNetworkError', async () => {
    server.use(
      http.get(apiUrl('catalog', '/insumos'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    const erro = await requisitar({
      servico: 'catalog',
      url: new URL('/api/backend/catalog/insumos', window.location.origin),
      timeoutMs: 20,
    }).catch((cause: unknown) => cause);

    expect(erro).toBeInstanceOf(ApiNetworkError);
    expect(erro).toMatchObject({ isTimeout: true, statusCode: 0 });
  });
});
