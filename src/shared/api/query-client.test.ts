import { environmentManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  ApiNetworkError,
  apiErrorFromResponse,
  ContratoInvalidoError,
} from './errors';
import {
  getQueryClient,
  isSessaoExpirada,
  makeQueryClient,
  shouldRetryQuery,
  STALE_TIME_MS,
} from './query-client';

function erroHttp(status: number) {
  return apiErrorFromResponse(status, {
    statusCode: status,
    message: 'x',
  });
}

describe('shouldRetryQuery', () => {
  it('tenta de novo em erro de rede e timeout', () => {
    expect(shouldRetryQuery(0, new ApiNetworkError())).toBe(true);
    expect(shouldRetryQuery(0, new ApiNetworkError({ isTimeout: true }))).toBe(
      true,
    );
  });

  it.each([500, 502, 503])('tenta de novo em %i', (status) => {
    expect(shouldRetryQuery(0, erroHttp(status))).toBe(true);
  });

  it.each([400, 401, 403, 404, 409])('não tenta de novo em %i', (status) => {
    expect(shouldRetryQuery(0, erroHttp(status))).toBe(false);
  });

  it('para depois de três tentativas', () => {
    expect(shouldRetryQuery(2, erroHttp(500))).toBe(true);
    expect(shouldRetryQuery(3, erroHttp(500))).toBe(false);
  });

  it('não tenta de novo em contrato inválido nem em erro de programação', () => {
    const contrato = new ContratoInvalidoError(
      z.string().safeParse(1).error as z.ZodError,
    );

    expect(shouldRetryQuery(0, contrato)).toBe(false);
    expect(shouldRetryQuery(0, new TypeError('x'))).toBe(false);
  });
});

describe('makeQueryClient', () => {
  it('aplica os padrões às queries e às mutações', () => {
    const { queries, mutations } = makeQueryClient().getDefaultOptions();

    expect(queries?.retry).toBe(shouldRetryQuery);
    expect(queries?.staleTime).toBe(STALE_TIME_MS);
    expect(queries?.refetchOnWindowFocus).toBe(true);
    expect(mutations?.retry).toBe(false);
  });

  it('avisa a sessão expirada em queries e mutações', async () => {
    const onSessaoExpirada = vi.fn<(error: unknown) => void>();
    const queryClient = makeQueryClient({ onSessaoExpirada });
    const erro401 = erroHttp(401);

    await queryClient
      .fetchQuery({
        queryKey: ['teste'],
        queryFn: () => Promise.reject(erro401),
        retry: false,
      })
      .catch(() => undefined);
    await queryClient
      .getMutationCache()
      .build(queryClient, {
        mutationFn: () => Promise.reject(erroHttp(404)),
      })
      .execute(undefined)
      .catch(() => undefined);

    expect(onSessaoExpirada).toHaveBeenCalledTimes(1);
    expect(onSessaoExpirada).toHaveBeenCalledWith(erro401);
  });
});

describe('isSessaoExpirada', () => {
  it('só reconhece o 401', () => {
    expect(isSessaoExpirada(erroHttp(401))).toBe(true);
    expect(isSessaoExpirada(erroHttp(403))).toBe(false);
    expect(isSessaoExpirada(new Error('401'))).toBe(false);
  });
});

describe('getQueryClient', () => {
  afterEach(() => {
    environmentManager.setIsServer(() => typeof window === 'undefined');
  });

  it('reaproveita o cliente no navegador', () => {
    expect(getQueryClient()).toBe(getQueryClient());
  });

  it('cria um cliente por chamada no servidor', () => {
    environmentManager.setIsServer(() => true);

    expect(getQueryClient()).not.toBe(getQueryClient());
  });
});
