import { z } from 'zod';
import { normalizarTexto } from './filtros';

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

/** Erro de um campo no 400 `DADOS_INVALIDOS` (mensagens do class-validator, em inglês). */
export type DetalheDeErro = { field: string; messages: string[] };

type ApiErrorOptions = {
  statusCode: number;
  /** Texto pronto para a tela; sem ele, vem de `mensagemPorStatus`. */
  message?: string;
  mensagens?: readonly string[];
  code?: string;
  details?: readonly DetalheDeErro[];
};

/** Único formato de erro da API que chega às telas. O `message` é sempre exibível. */
export class ApiError extends Error {
  override readonly name: string = 'ApiError';
  readonly statusCode: number;
  /** Mensagens originais do backend, sempre como lista (podem estar em inglês). */
  readonly mensagens: readonly string[];
  /**
   * Código estável do erro (`ESTOQUE_INSUFICIENTE`, `INSUMO_EM_USO`...), do
   * `AllExceptionsFilter` da API. Falta em rede, timeout e corpo fora do formato.
   */
  readonly code?: string;
  /** Campos recusados no 400 `DADOS_INVALIDOS`; vazio nos outros erros. */
  readonly details: readonly DetalheDeErro[];

  constructor({
    statusCode,
    message,
    mensagens = [],
    code,
    details = [],
  }: ApiErrorOptions) {
    super(message ?? mensagemPorStatus(statusCode, mensagens));
    this.statusCode = statusCode;
    this.mensagens = mensagens;
    this.code = code;
    this.details = details;
  }
}

/**
 * Falha sem resposta HTTP: servidor fora do ar, sem conexão ou sem resposta em
 * 10 s (o tempo do `Dio` no mobile). É um `ApiError` com `statusCode` 0.
 */
export class ApiNetworkError extends ApiError {
  override readonly name = 'ApiNetworkError';
  readonly isTimeout: boolean;

  constructor({ isTimeout = false }: { isTimeout?: boolean } = {}) {
    super({ statusCode: STATUS_ERRO_DE_REDE, message: MENSAGEM_SEM_CONEXAO });
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

// Mensagens padrão do NestJS, em inglês. A API não as repassa (traduz para o
// `code` e uma mensagem em português), mas um intermediário ainda pode
// devolvê-las; elas nunca chegam à tela.
const MENSAGEM_PADRAO_DO_NEST =
  /^(Cannot (GET|POST|PUT|PATCH|DELETE) .*|Internal server error|Forbidden resource|Unauthorized|Bad Request|Not Found|Conflict|Forbidden)$/;

function isMensagemDoBackend(mensagem: string) {
  const texto = mensagem.trim();

  return texto.length > 0 && !MENSAGEM_PADRAO_DO_NEST.test(texto);
}

function mensagemPorStatus(statusCode: number, mensagens: readonly string[]) {
  const doBackend = mensagens.filter(isMensagemDoBackend);

  if (statusCode === STATUS_ERRO_DE_REDE) return MENSAGEM_SEM_CONEXAO;
  if (statusCode === 401) return MENSAGEM_SESSAO_EXPIRADA;
  if (statusCode >= 500) return MENSAGEM_ERRO_SERVIDOR;
  if (doBackend.length > 0) return doBackend.join('; ');
  if (statusCode === 404) return MENSAGEM_NAO_ENCONTRADO;

  return MENSAGEM_GENERICA;
}

/**
 * Formato de erro da API (`AllExceptionsFilter`): `{ statusCode, code, message,
 * details?, path, timestamp }`. `message` também é aceito como lista, e `code`
 * como ausente, para corpos de outro intermediário.
 */
const corpoDeErroSchema = z.object({
  statusCode: z.number().optional(),
  code: z.string().optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
  // Lista fora do formato é ignorada, sem invalidar o resto do erro.
  details: z
    .array(z.object({ field: z.string(), messages: z.array(z.string()) }))
    .optional()
    .catch(undefined),
});

/**
 * Converte a resposta de erro da API num `ApiError`. Corpo fora desse formato
 * (HTML de um intermediário, vazio) vira o texto genérico do status.
 */
export function apiErrorFromResponse(statusCode: number, corpo: unknown) {
  const resultado = corpoDeErroSchema.safeParse(corpo);

  if (!resultado.success) {
    return new ApiError({ statusCode });
  }

  const { message, code, details } = resultado.data;
  const mensagens =
    message === undefined ? [] : Array.isArray(message) ? message : [message];

  return new ApiError({ statusCode, mensagens, code, details });
}

/** O erro é um `ApiError` com este `code` estável da API. */
export function temCodigo(error: unknown, code: string) {
  return error instanceof ApiError && error.code === code;
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
 * Falta de estoque: pelo `code` `ESTOQUE_INSUFICIENTE` da API e, sem ele, pelo
 * texto, como `_isStockError` de `lib/features/vendas/presentation/pages/vendas_page.dart`
 * (a mensagem fala de "estoque" e de falta, sem diferenciar acentos nem maiúsculas).
 */
export function isEstoqueInsuficiente(error: unknown) {
  if (temCodigo(error, 'ESTOQUE_INSUFICIENTE')) return true;

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
