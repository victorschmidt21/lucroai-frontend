import type { z } from 'zod';
import {
  ApiNetworkError,
  apiErrorFromResponse,
  ContratoInvalidoError,
} from './errors';

/** O mesmo tempo do `Dio` no mobile (`lib/core/network/api_client.dart`). */
export const TIMEOUT_MS = 10_000;

export type ApiFetchOptions = {
  /** Padrão: `GET`. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Serializado como JSON. */
  body?: unknown;
  /** Valores vazios (`undefined` ou `''`) são omitidos. */
  query?: Record<string, string | number | undefined>;
  /** O do TanStack Query: cancelar não vira erro de rede. */
  signal?: AbortSignal;
};

/** Assinatura comum às duas variantes (`client.ts` e `client.server.ts`). */
export type ApiFetch = (
  caminho: string,
  opcoes?: ApiFetchOptions,
) => Promise<unknown>;

/**
 * Confere o caminho antes de montar a URL: precisa começar com `/` e não pode
 * subir de pasta nem chamar as rotas `/internal/*`, que não têm autenticação
 * (docs/security.md#proxy-bff). O proxy (FE-07) repete a verificação.
 */
export function validarCaminho(caminho: string) {
  const segmentos = caminho.split('?')[0].split('/');

  if (
    !caminho.startsWith('/') ||
    segmentos.some((segmento) => segmento === '..' || segmento === 'internal')
  ) {
    throw new Error(`Caminho de API não permitido: ${caminho}`);
  }
}

export function aplicarQuery(url: URL, query: ApiFetchOptions['query'] = {}) {
  for (const [chave, valor] of Object.entries(query)) {
    if (valor !== undefined && valor !== '') {
      url.searchParams.set(chave, String(valor));
    }
  }

  return url;
}

function isAbort(cause: unknown) {
  return cause instanceof Error && cause.name === 'AbortError';
}

type RequisitarOptions = ApiFetchOptions & {
  url: URL;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

/**
 * Faz a requisição e devolve o corpo JSON (ou `undefined`, se vazio). Rejeita
 * com `ApiError` (status de erro), `ApiNetworkError` (rede ou timeout) ou
 * `ContratoInvalidoError` (corpo de sucesso que não é JSON). O cancelamento
 * pelo `signal` de quem chamou continua como `AbortError`.
 */
export async function requisitar({
  url,
  method = 'GET',
  body,
  signal,
  headers = {},
  timeoutMs = TIMEOUT_MS,
}: RequisitarOptions): Promise<unknown> {
  // Um `AbortController` próprio, e não `AbortSignal.any`/`timeout`: funciona
  // igual no Node, no navegador e no jsdom dos testes.
  const controller = new AbortController();
  let isTimeout = false;
  const timer = setTimeout(() => {
    isTimeout = true;
    controller.abort();
  }, timeoutMs);
  const repassarCancelamento = () => controller.abort(signal?.reason);

  if (signal?.aborted) repassarCancelamento();
  signal?.addEventListener('abort', repassarCancelamento, { once: true });

  try {
    let response: Response;
    let texto: string;

    try {
      // Lido a cada chamada, e não guardado no import, para o MSW interceptar.
      response = await globalThis.fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      });
      texto = await response.text();
    } catch (cause) {
      if (!isTimeout && (signal?.aborted || isAbort(cause))) {
        throw cause;
      }
      throw new ApiNetworkError({ isTimeout });
    }

    const corpo = lerJson(texto);

    if (!response.ok) {
      throw apiErrorFromResponse(response.status, corpo.valor);
    }
    if (!corpo.ok) {
      throw corpo.erro;
    }

    return corpo.valor;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', repassarCancelamento);
  }
}

type LeituraJson =
  | { ok: true; valor: unknown }
  | { ok: false; valor: undefined; erro: ContratoInvalidoError };

function lerJson(texto: string): LeituraJson {
  if (!texto.trim()) return { ok: true, valor: undefined };

  try {
    return { ok: true, valor: JSON.parse(texto) as unknown };
  } catch (cause) {
    return {
      ok: false,
      valor: undefined,
      erro: ContratoInvalidoError.semJson(cause),
    };
  }
}

/**
 * Valida o corpo com o schema do contrato. A API responde JSON puro, sem
 * envelope; um corpo vazio chega como `undefined`. Rejeita com
 * `ContratoInvalidoError`.
 */
export function unwrap<S extends z.ZodType>(
  corpo: unknown,
  schema: S,
): z.output<S> {
  const resultado = schema.safeParse(corpo);

  if (!resultado.success) {
    throw new ContratoInvalidoError(resultado.error);
  }

  return resultado.data;
}
