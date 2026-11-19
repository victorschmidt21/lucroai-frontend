// API falsa dos e2e. O CI não sobe os cinco microsserviços: o
// playwright.config.ts aponta AUTH_API_URL, CATALOG_API_URL etc. para este
// servidor, que atende todos eles porque as rotas de cada serviço têm raízes
// diferentes (`/auth`, `/insumos`, `/receitas`, `/estoque`, `/vendas`...).
//
// Responde o que o /api/health sonda (`/docs-json`) e, desde a FE-07, o login
// do seed e uma rota autenticada. As issues das telas (e a FE-23) acrescentam
// aqui as rotas de que os e2e precisam, seguindo o contrato de
// docs/api-integration.md: envelope `{ data, links }`, JWT de teste e os dados
// do seed "Padaria Pão Feliz".
import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_API_PORT ?? 3999);

/** Erro no formato padrão do NestJS. */
function nestError(statusCode, message, error) {
  return { statusCode, message, ...(error ? { error } : {}) };
}

/** Envelope do `HateoasInterceptor` (os `links` são ignorados pela web). */
function envelope(data) {
  return { data, links: {} };
}

// Usuário do seed (services/auth-service/prisma/seed.ts).
const USUARIO_DO_SEED = {
  email: 'joao@padariapaofeliz.com.br',
  senha: '123456',
};

/** Assinatura dos tokens emitidos aqui; um token com outra é recusado (401). */
const ASSINATURA = 'assinatura-da-api-falsa';
const QUATRO_HORAS_S = 4 * 60 * 60;

function base64Url(valor) {
  return Buffer.from(JSON.stringify(valor)).toString('base64url');
}

/** JWT de 4 h com o payload do auth-service; a assinatura é falsa. */
function emitirToken() {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 3,
    email: USUARIO_DO_SEED.email,
    nome: 'João da Silva',
    empresa: {
      id: 3,
      nome: 'Padaria Pão Feliz Ltda',
      cnpj: '45.678.901/0001-23',
      segmento: 'Panificação e Confeitaria',
    },
    iat,
    exp: iat + QUATRO_HORAS_S,
  };

  return [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url(payload),
    ASSINATURA,
  ].join('.');
}

/** O guard JWT do backend: Bearer com a assinatura daqui e dentro do `exp`. */
function isAutenticado(req) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  const [, payload, assinatura] = (token ?? '').split('.');

  if (tipo !== 'Bearer' || assinatura !== ASSINATURA) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const NAO_AUTENTICADO = [401, nestError(401, 'Unauthorized')];

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

/**
 * Rotas atendidas, por "MÉTODO /caminho". Cada handler recebe a requisição, a
 * URL já interpretada e o corpo JSON (ou `undefined`).
 */
const routes = {
  // Usado pelo Playwright para saber que o servidor subiu.
  'GET /health': () => [200, { status: 'ok' }],
  // O /api/health do front sonda o JSON do Swagger de cada serviço.
  'GET /docs-json': () => [200, { openapi: '3.0.0', paths: {} }],
  // auth-service: `POST /auth/login` (FE-07).
  'POST /auth/login': (_req, _url, body) =>
    body?.email === USUARIO_DO_SEED.email &&
    body?.senha === USUARIO_DO_SEED.senha
      ? [200, envelope({ access_token: emitirToken() })]
      : [401, nestError(401, 'Credenciais inválidas', 'Unauthorized')],
  // catalog-service: rota autenticada usada pelo e2e do proxy (FE-07); a FE-09
  // troca a lista vazia pelos insumos do seed.
  'GET /insumos': (req) =>
    isAutenticado(req) ? [200, envelope([])] : NAO_AUTENTICADO,
  // recipe-service e sales-service: listas vazias para o painel da Home (FE-22).
  'GET /receitas': (req) =>
    isAutenticado(req) ? [200, envelope([])] : NAO_AUTENTICADO,
  'GET /vendas': (req) =>
    isAutenticado(req) ? [200, envelope([])] : NAO_AUTENTICADO,
};

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const handler = routes[`${req.method} ${url.pathname}`];

  if (!handler) {
    sendJson(
      res,
      404,
      nestError(404, `Cannot ${req.method} ${url.pathname}`, 'Not Found'),
    );
    return;
  }

  const [status, body] = await handler(req, url, await readJson(req));
  sendJson(res, status, body);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`API falsa dos e2e em http://127.0.0.1:${PORT}`);
});
