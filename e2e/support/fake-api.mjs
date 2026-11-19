// API falsa dos e2e. O CI não sobe os cinco microsserviços: o
// playwright.config.ts aponta AUTH_API_URL, CATALOG_API_URL etc. para este
// servidor, que atende todos eles porque as rotas de cada serviço têm raízes
// diferentes (`/auth`, `/insumos`, `/receitas`, `/estoque`, `/vendas`...).
//
// Por enquanto responde só o que o /api/health sonda (`/docs-json`). As issues
// das telas (a partir da FE-07, e a FE-23) acrescentam aqui as rotas de que os
// e2e precisam, seguindo o contrato de docs/api-integration.md: envelope
// `{ data, links }`, JWT de teste e os dados do seed "Padaria Pão Feliz".
import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_API_PORT ?? 3999);

/** Erro no formato padrão do NestJS. */
function nestError(statusCode, message, error) {
  return { statusCode, message, ...(error ? { error } : {}) };
}

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
