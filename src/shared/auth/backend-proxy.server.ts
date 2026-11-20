import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { urlDaApi } from '@/shared/api/client.server';
import {
  erroBff,
  isOrigemPermitida,
  origemInvalida,
  servicoIndisponivel,
} from './bff.server';
import { lerSessao } from './jwt';
import { apagarSessao, lerToken } from './session.server';

// O login devolve o token, que nunca pode chegar ao JavaScript do navegador, e o
// cadastro de empresa não é usado pela web. O login passa por /api/auth/login.
const CAMINHOS_BLOQUEADOS = new Set(['auth/login', 'auth/empresa']);

// Só estes headers do navegador seguem para a API; `Cookie` nunca.
const HEADERS_REPASSADOS = ['accept', 'content-type'];

const STATUS_SEM_CORPO = new Set([101, 204, 205, 304]);

const RECUSAS = {
  400: ['Caminho inválido.', 'DADOS_INVALIDOS'],
  403: ['Rota não permitida.', 'ROTA_NAO_PERMITIDA'],
  404: ['Recurso não encontrado.', 'RECURSO_NAO_ENCONTRADO'],
} as const;

type StatusRecusa = keyof typeof RECUSAS;

type Validacao =
  { ok: true; caminho: string } | { ok: false; status: StatusRecusa };

/**
 * Confere os segmentos já decodificados pelo Next. `internal` continua
 * bloqueado, por segurança, mesmo sem existir no monolito; é comparado sem
 * diferenciar maiúsculas, porque o Express do NestJS também não diferencia.
 */
export function validarSegmentos(segmentos: readonly string[]): Validacao {
  const malformado = segmentos.some(
    (parte) =>
      parte === '' ||
      parte === '.' ||
      parte === '..' ||
      parte.includes('/') ||
      parte.includes('\\'),
  );

  if (segmentos.length === 0 || malformado) {
    return { ok: false, status: 400 };
  }

  if (segmentos.some((parte) => parte.toLowerCase() === 'internal')) {
    return { ok: false, status: 403 };
  }

  const caminho = segmentos.join('/');

  if (CAMINHOS_BLOQUEADOS.has(caminho.toLowerCase())) {
    return { ok: false, status: 404 };
  }

  return { ok: true, caminho };
}

function recusar(status: StatusRecusa) {
  const [message, code] = RECUSAS[status];

  return erroBff(status, message, code);
}

/** Mesmo corpo do 401 da API sem token, e o cookie apagado. */
function semSessao() {
  const response = erroBff(401, 'Autenticação necessária', 'NAO_AUTENTICADO');
  apagarSessao(response);

  return response;
}

function headersDaApi(request: NextRequest, token: string) {
  const headers = new Headers();

  for (const nome of HEADERS_REPASSADOS) {
    const valor = request.headers.get(nome);
    if (valor) headers.set(nome, valor);
  }
  headers.set('Authorization', `Bearer ${token}`);

  return headers;
}

async function lerCorpo(request: NextRequest) {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;

  const corpo = await request.arrayBuffer();

  return corpo.byteLength > 0 ? corpo : undefined;
}

/** A URL vem só da variável de ambiente `API_URL`, nunca da requisição (SSRF). */
function urlDeDestino(caminho: string, search: string) {
  // Cada segmento é codificado de novo, para não escapar do caminho.
  const segmentos = caminho.split('/').map(encodeURIComponent).join('/');

  return new URL(`${urlDaApi()}/${segmentos}${search}`);
}

/**
 * Proxy BFF (docs/security.md#proxy-bff): repassa a chamada do navegador à
 * API, com o token do cookie. Não altera o corpo nem o status da resposta,
 * e em 401 apaga o cookie, para o cliente levar ao login. Não registra nada em
 * log (corpo, headers, query ou token).
 */
export async function proxyParaBackend(
  request: NextRequest,
  segmentos: readonly string[],
) {
  if (!isOrigemPermitida(request)) return origemInvalida();

  const validacao = validarSegmentos(segmentos);

  if (!validacao.ok) return recusar(validacao.status);

  const token = lerToken(request);

  // Sem token, ou com ele vencido, a API responderia 401: nem chama.
  if (!token || !lerSessao(token)) return semSessao();

  let upstream: Response;
  let corpo: ArrayBuffer | null;

  try {
    upstream = await fetch(
      urlDeDestino(validacao.caminho, request.nextUrl.search),
      {
        method: request.method,
        headers: headersDaApi(request, token),
        body: await lerCorpo(request),
        cache: 'no-store',
        redirect: 'manual',
        signal: request.signal,
      },
    );
    corpo = STATUS_SEM_CORPO.has(upstream.status)
      ? null
      : await upstream.arrayBuffer();
  } catch {
    return servicoIndisponivel();
  }

  const headers = new Headers({ 'Cache-Control': 'no-store' });
  const tipo = upstream.headers.get('content-type');
  if (tipo) headers.set('Content-Type', tipo);

  const response = new NextResponse(corpo, {
    status: upstream.status,
    headers,
  });

  if (upstream.status === 401) apagarSessao(response);

  return response;
}
