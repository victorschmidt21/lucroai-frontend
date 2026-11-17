import {
  environmentManager,
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import { ApiError, STATUS_ERRO_DE_REDE } from './errors';

const MAX_TENTATIVAS = 3;
/** Ao voltar a uma tela, os dados antigos aparecem na hora e são revalidados. */
export const STALE_TIME_MS = 30 * 1000;

function isTransitorio(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.statusCode === STATUS_ERRO_DE_REDE || error.statusCode >= 500)
  );
}

/** Repete só erro de rede e 5xx, até 3 vezes. Nunca 4xx nem contrato inválido. */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  return failureCount < MAX_TENTATIVAS && isTransitorio(error);
}

export function isSessaoExpirada(error: unknown): error is ApiError {
  return error instanceof ApiError && error.statusCode === 401;
}

export type QueryClientOptions = {
  /**
   * Chamado quando qualquer query ou mutação recebe 401. A FE-07 passa a função
   * que leva a `/login?redirect=<rota>`; as telas não tratam 401.
   */
  onSessaoExpirada?: (error: ApiError) => void;
};

export function makeQueryClient({ onSessaoExpirada }: QueryClientOptions = {}) {
  const onError = (error: unknown) => {
    if (isSessaoExpirada(error)) onSessaoExpirada?.(error);
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        staleTime: STALE_TIME_MS,
        // Equivale ao "recarrega os dados ao trocar de aba" do mobile.
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * No servidor, um cliente por requisição, para não vazar dados entre usuários.
 * No navegador, um só, para o React não perder o cache se suspender na
 * renderização inicial (por isso não usa `useState`).
 */
export function getQueryClient(options?: QueryClientOptions) {
  if (environmentManager.isServer()) {
    return makeQueryClient(options);
  }

  browserQueryClient ??= makeQueryClient(options);
  return browserQueryClient;
}
