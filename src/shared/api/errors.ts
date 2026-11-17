import { z } from 'zod';
import { normalizarTexto } from './filtros';
import type { Servico } from './servicos';

/** `statusCode` de falha sem resposta HTTP (rede ou timeout). */
export const STATUS_ERRO_DE_REDE = 0;

// Textos de docs/business-rules.md#login-e-mensagens-de-erro-gerais.
export const MENSAGEM_SESSAO_EXPIRADA =
  'Sessão expirada. Faça login novamente.';
export const MENSAGEM_NAO_ENCONTRADO = 'Registro não encontrado.';
export const MENSAGEM_SEM_CONEXAO = 'Sem conexão com o servidor.';
export const MENSAGEM_ERRO_SERVIDOR = 'Erro no servidor. Tente novamente.';
export const MENSAGEM_CONTRATO_INVALIDO = 'Resposta inesperada do servidor.';
export const MENSAGEM_GENERICA =
  'Não foi possível concluir a ação. Tente novamente.';

type ApiErrorOptions = {
  statusCode: number;
  servico: Servico;
  /** Texto pronto para a tela; sem ele, vem de `mensagemPorStatus`. */
  message?: string;
  mensagens?: readonly string[];
  error?: string;
};

/** Único formato de erro da API que chega às telas. O `message` é sempre exibível. */
export class ApiError extends Error {
  override readonly name: string = 'ApiError';
  readonly statusCode: number;
  /** Mensagens originais do backend, sempre como lista (podem estar em inglês). */
  readonly mensagens: readonly string[];
  /** Nome do status no NestJS ("Bad Request", "Not Found"); falta em 401 e 500. */
  readonly error?: string;
  readonly servico: Servico;

  constructor({
    statusCode,
    servico,
    message,
    mensagens = [],
    error,
  }: ApiErrorOptions) {
    super(message ?? mensagemPorStatus(statusCode, mensagens, error));
    this.statusCode = statusCode;
    this.servico = servico;
    this.mensagens = mensagens;
    this.error = error;
  }
}

/**
 * Falha sem resposta HTTP: servidor fora do ar, sem conexão ou sem resposta em
 * 10 s (o tempo do `Dio` no mobile). É um `ApiError` com `statusCode` 0.
 */
export class ApiNetworkError extends ApiError {
  override readonly name = 'ApiNetworkError';
  readonly isTimeout: boolean;

  constructor({
    servico,
    isTimeout = false,
  }: {
    servico: Servico;
    isTimeout?: boolean;
  }) {
    super({
      statusCode: STATUS_ERRO_DE_REDE,
      servico,
      message: MENSAGEM_SEM_CONEXAO,
    });
    this.isTimeout = isTimeout;
  }
}

/**
 * Resposta de sucesso que não segue o contrato Zod (ou nem é JSON). O `message`
 * é o texto da tela; `detalhes`, `issues` e `cause` (o `ZodError`) dizem ao
 * teste o que mudou.
 */
export class ContratoInvalidoError extends Error {
  override readonly name = 'ContratoInvalidoError';
  readonly issues: readonly z.core.$ZodIssue[];
  readonly detalhes: string;

  constructor(cause: z.ZodError) {
    super(MENSAGEM_CONTRATO_INVALIDO, { cause });
    this.issues = cause.issues;
    this.detalhes = z.prettifyError(cause);
  }

  override toString() {
    return `${this.name}: ${this.message}\n${this.detalhes}`;
  }

  /** Corpo de sucesso que não é JSON (ex.: HTML de um intermediário). */
  static semJson(cause: unknown) {
    return new ContratoInvalidoError(
      new z.ZodError([
        {
          code: 'custom',
          path: [],
          message: `O corpo da resposta não é JSON: ${String(cause)}`,
          input: undefined,
        },
      ]),
    );
  }
}

// Mensagens que o próprio NestJS gera, em inglês, quando o código só lança a
// exceção sem texto ("Not Found"), a rota não existe ("Cannot GET /x") ou há
// erro interno. As mensagens de negócio do backend já vêm em português.
const MENSAGEM_PADRAO_DO_NEST =
  /^(Cannot (GET|POST|PUT|PATCH|DELETE) .*|Internal server error|Forbidden resource|Unauthorized|Bad Request|Not Found|Conflict|Forbidden)$/;

function isMensagemDoBackend(mensagem: string, error?: string) {
  const texto = mensagem.trim();

  return (
    texto.length > 0 && texto !== error && !MENSAGEM_PADRAO_DO_NEST.test(texto)
  );
}

function mensagemPorStatus(
  statusCode: number,
  mensagens: readonly string[],
  error?: string,
) {
  const doBackend = mensagens.filter((mensagem) =>
    isMensagemDoBackend(mensagem, error),
  );

  if (statusCode === STATUS_ERRO_DE_REDE) return MENSAGEM_SEM_CONEXAO;
  if (statusCode === 401) return MENSAGEM_SESSAO_EXPIRADA;
  if (statusCode >= 500) return MENSAGEM_ERRO_SERVIDOR;
  if (doBackend.length > 0) return doBackend.join('; ');
  if (statusCode === 404) return MENSAGEM_NAO_ENCONTRADO;

  return MENSAGEM_GENERICA;
}

const corpoDeErroSchema = z.object({
  statusCode: z.number().optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.string().optional(),
});

/**
 * Converte a resposta de erro do NestJS (`{ statusCode, message, error? }`, com
 * `message` string ou lista) num `ApiError`. Corpo fora desse formato (HTML de
 * um intermediário, vazio) vira o texto genérico do status.
 */
export function apiErrorFromResponse(
  servico: Servico,
  statusCode: number,
  corpo: unknown,
) {
  const resultado = corpoDeErroSchema.safeParse(corpo);

  if (!resultado.success) {
    return new ApiError({ statusCode, servico });
  }

  const { message, error } = resultado.data;
  const mensagens =
    message === undefined ? [] : Array.isArray(message) ? message : [message];

  return new ApiError({ statusCode, servico, mensagens, error });
}

/** Texto seguro para a tela: nunca expõe mensagem de exceção do JavaScript. */
export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof ContratoInvalidoError) {
    return error.message;
  }

  return MENSAGEM_GENERICA;
}

const TERMOS_DE_FALTA = [
  'insuficiente',
  'indisponivel',
  'nao ha',
  'sem estoque',
];

/**
 * Reproduz `_isStockError` de `lib/features/vendas/presentation/pages/vendas_page.dart`:
 * a mensagem fala de "estoque" e de falta, sem diferenciar acentos nem maiúsculas.
 * É o único caso em que a tela decide pelo texto (docs/business-rules.md).
 */
export function isEstoqueInsuficiente(error: unknown) {
  const textos =
    error instanceof ApiError
      ? [error.message, ...error.mensagens]
      : error instanceof Error
        ? [error.message]
        : typeof error === 'string'
          ? [error]
          : [];

  return textos.some((texto) => {
    const normalizado = normalizarTexto(texto);

    return (
      normalizado.includes('estoque') &&
      TERMOS_DE_FALTA.some((termo) => normalizado.includes(termo))
    );
  });
}
