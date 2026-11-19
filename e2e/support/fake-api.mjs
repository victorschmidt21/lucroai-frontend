// API falsa dos e2e. O CI não sobe os cinco microsserviços: o
// playwright.config.ts aponta AUTH_API_URL, CATALOG_API_URL etc. para este
// servidor, que atende todos eles porque as rotas de cada serviço têm raízes
// diferentes (`/auth`, `/insumos`, `/receitas`, `/estoque`, `/vendas`...).
//
// Responde o que o /api/health sonda (`/docs-json`), o login do seed (FE-07) e,
// desde a FE-23, as rotas do spec de fumaça (`e2e/fluxo-principal.spec.ts`):
// insumos, receitas, estoque, produções e vendas, com estado em memória que
// começa vazio e dura enquanto o processo viver. Segue o contrato de
// docs/api-integration.md e `src/shared/api/contracts/`: envelope
// `{ data, links }`, JWT de teste e erros no formato do NestJS. Os cálculos são
// os do backend (docs/business-rules.md), sem gastos indiretos.
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
const EMPRESA_ID = 3;

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
      id: EMPRESA_ID,
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

/** Só chama o handler com um Bearer válido, como o guard JWT. */
function autenticada(handler) {
  return (req, ...resto) =>
    isAutenticado(req) ? handler(req, ...resto) : NAO_AUTENTICADO;
}

const naoEncontrado = (mensagem) => [
  404,
  nestError(404, mensagem, 'Not Found'),
];
const invalido = (mensagem) => [400, nestError(400, mensagem, 'Bad Request')];

// Estado em memória da empresa do seed. Cada coleção começa vazia; não há
// gastos indiretos, então o custo invisível e os rateios são zero.
const db = { insumos: [], receitas: [], producoes: [], vendas: [] };
let ultimoId = 0;
const novoId = () => ++ultimoId;
const round2 = (valor) => Math.round(valor * 100) / 100;
const agora = () => new Date().toISOString();

function buscar(colecao, id, mensagem) {
  const item = db[colecao].find((atual) => atual.id === id);
  return item ? [200, envelope(item)] : naoEncontrado(mensagem);
}

/** `POST /insumos`: `custoUnitario = valorPago / quantidadeBaseCusto`. */
function criarInsumo(body) {
  if (!body?.nome || !(body.quantidadeBaseCusto > 0) || !body.unidade) {
    return invalido(['nome, quantidadeBaseCusto e unidade são obrigatórios']);
  }
  const custoUnitario = body.valorPago / body.quantidadeBaseCusto;
  const insumo = {
    id: novoId(),
    empresaId: EMPRESA_ID,
    nome: body.nome,
    quantidadeBaseCusto: body.quantidadeBaseCusto,
    quantidadeDisponivel: body.quantidadeDisponivelInicial ?? 0,
    unidade: body.unidade,
    valorPago: body.valorPago,
    custoUnitario,
    precoUnitario: custoUnitario,
    dataCriacao: agora(),
  };
  db.insumos.push(insumo);
  return [201, envelope(insumo)];
}

/** `POST /receitas`: custos de docs/business-rules.md, sem custo invisível. */
function criarReceita(body) {
  if (!body?.nome || !(body.rendimento > 0) || !Array.isArray(body.insumos)) {
    return invalido(['nome, rendimento e insumos são obrigatórios']);
  }
  const itens = body.insumos.map(({ insumo_id, quantidade }) => {
    const insumo = db.insumos.find((atual) => atual.id === insumo_id);
    return {
      insumoId: insumo_id,
      quantidade,
      ...(insumo
        ? { custoCalculado: round2(quantidade * insumo.custoUnitario) }
        : {}),
    };
  });
  const custoProducao = round2(
    itens.reduce((soma, item) => soma + (item.custoCalculado ?? 0), 0),
  );
  const custoUnitario = round2(custoProducao / body.rendimento);
  const receita = {
    id: novoId(),
    empresaId: EMPRESA_ID,
    nome: body.nome,
    rendimento: body.rendimento,
    unidadeRendimento: body.unidadeRendimento,
    custoProducao,
    custoUnitario,
    // Sem margem, o backend omite a margem e o preço sugerido.
    ...(body.margem_lucro === undefined
      ? {}
      : {
          margemLucro: body.margem_lucro,
          precoSugerido: round2(custoUnitario * (1 + body.margem_lucro)),
        }),
    dataCriacao: agora(),
    itens,
  };
  db.receitas.push(receita);
  return [201, envelope(receita)];
}

/** `GET /estoque/insumos/:id`, com o saldo espelhado no insumo. */
function estoqueDoInsumo(insumoId) {
  const insumo = db.insumos.find((atual) => atual.id === insumoId);
  if (!insumo) return naoEncontrado('Insumo não encontrado');
  return [
    200,
    envelope({
      id: insumo.id,
      insumoId: insumo.id,
      quantidadeDisponivel: insumo.quantidadeDisponivel,
      quantidadeMinima: 0,
      dataAlteracao: null,
    }),
  ];
}

/** `POST /producoes`: custo com o snapshot da receita; baixa os insumos. */
function criarProducao(body) {
  const receita = db.receitas.find((atual) => atual.id === body?.receita_id);
  if (!receita) return naoEncontrado('Receita não encontrada');
  if (!Number.isInteger(body.quantidade) || body.quantidade < 1) {
    return invalido(['quantidade must not be less than 1']);
  }
  const totalUnidades = body.quantidade * receita.rendimento;
  const custoTotal = round2((receita.custoProducao ?? 0) * body.quantidade);
  const producao = {
    id: novoId(),
    receitaId: receita.id,
    empresaId: EMPRESA_ID,
    quantidade: body.quantidade,
    custoTotal,
    custoUnitario: totalUnidades > 0 ? round2(custoTotal / totalUnidades) : 0,
    dataProducao: agora(),
    rateios: [],
  };
  for (const item of receita.itens) {
    const insumo = db.insumos.find((atual) => atual.id === item.insumoId);
    if (insumo) {
      insumo.quantidadeDisponivel -= item.quantidade * body.quantidade;
    }
  }
  db.producoes.push(producao);
  return [201, envelope(producao)];
}

/** `POST /vendas`: nasce `PENDENTE`, com o snapshot do custo da receita. */
function criarVenda(body) {
  if (!Array.isArray(body?.itens)) return invalido(['itens must be an array']);
  const vendaId = novoId();
  const itens = [];
  for (const item of body.itens) {
    const receita = db.receitas.find((atual) => atual.id === item.receita_id);
    if (!receita) return naoEncontrado('Receita não encontrada');
    const custo = receita.custoUnitario ?? null;
    const preco = item.preco_unitario_real;
    itens.push({
      id: novoId(),
      vendaId,
      receitaId: receita.id,
      quantidade: item.quantidade,
      precoUnitarioReal: preco,
      custoUnitario: custo,
      margemRealizada:
        custo === null || preco === 0
          ? null
          : Math.round(((preco - custo) / preco) * 10_000) / 10_000,
    });
  }
  const venda = {
    id: vendaId,
    empresaId: EMPRESA_ID,
    total: round2(
      itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitarioReal, 0),
    ),
    status: 'PENDENTE',
    dataVenda: agora(),
    itens,
  };
  db.vendas.push(venda);
  return [201, envelope(venda)];
}

/** `GET /vendas?status=&dataInicio=&dataFim=`, da mais recente à mais antiga. */
function listarVendas(url) {
  const status = url.searchParams.get('status');
  const inicio = url.searchParams.get('dataInicio');
  const fim = url.searchParams.get('dataFim');
  const vendas = db.vendas
    .filter((venda) => !status || venda.status === status)
    .filter((venda) => !inicio || new Date(venda.dataVenda) >= new Date(inicio))
    .filter((venda) => !fim || new Date(venda.dataVenda) <= new Date(fim))
    .toReversed();
  return [200, envelope(vendas)];
}

/** `PATCH /vendas/:id/status`: só `PENDENTE` muda de status. */
function mudarStatusDaVenda(id, body) {
  const venda = db.vendas.find((atual) => atual.id === id);
  if (!venda) return naoEncontrado('Venda não encontrada');
  if (venda.status !== 'PENDENTE') {
    return invalido('Venda já finalizada não pode ser alterada');
  }
  venda.status = body?.status;
  return [200, envelope(venda)];
}

/**
 * Rotas atendidas, por "MÉTODO /caminho", com `:id` no lugar de um segmento
 * numérico. Cada handler recebe a requisição, a URL já interpretada, o corpo
 * JSON (ou `undefined`) e o id do caminho.
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
  // catalog-service.
  'GET /insumos': autenticada(() => [200, envelope(db.insumos)]),
  'GET /insumos/:id': autenticada((_req, _url, _body, id) =>
    buscar('insumos', id, 'Insumo não encontrado'),
  ),
  'POST /insumos': autenticada((_req, _url, body) => criarInsumo(body)),
  'GET /gastos-indiretos': autenticada(() => [200, envelope([])]),
  // recipe-service.
  'GET /receitas': autenticada(() => [200, envelope(db.receitas)]),
  'GET /receitas/:id': autenticada((_req, _url, _body, id) =>
    buscar('receitas', id, 'Receita não encontrada'),
  ),
  'POST /receitas': autenticada((_req, _url, body) => criarReceita(body)),
  // operations-service.
  'GET /estoque/insumos/:id': autenticada((_req, _url, _body, id) =>
    estoqueDoInsumo(id),
  ),
  'GET /estoque/insumos/:id/movimentacoes': autenticada(() => [
    200,
    envelope([]),
  ]),
  'GET /producoes': autenticada((_req, url) => {
    const receitaId = Number(url.searchParams.get('receitaId'));
    const producoes = db.producoes.filter(
      (producao) => !receitaId || producao.receitaId === receitaId,
    );
    return [200, envelope(producoes.toReversed())];
  }),
  'GET /producoes/:id': autenticada((_req, _url, _body, id) =>
    buscar('producoes', id, 'Produção não encontrada'),
  ),
  'POST /producoes': autenticada((_req, _url, body) => criarProducao(body)),
  // sales-service.
  'GET /vendas': autenticada((_req, url) => listarVendas(url)),
  'GET /vendas/:id': autenticada((_req, _url, _body, id) =>
    buscar('vendas', id, 'Venda não encontrada'),
  ),
  'POST /vendas': autenticada((_req, _url, body) => criarVenda(body)),
  'PATCH /vendas/:id/status': autenticada((_req, _url, body, id) =>
    mudarStatusDaVenda(id, body),
  ),
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
  const id = Number(url.pathname.match(/\/(\d+)(?=\/|$)/)?.[1]);
  const rota = url.pathname.replace(/\/\d+(?=\/|$)/g, '/:id');
  const handler = routes[`${req.method} ${rota}`];

  if (!handler) {
    sendJson(
      res,
      404,
      nestError(404, `Cannot ${req.method} ${url.pathname}`, 'Not Found'),
    );
    return;
  }

  const [status, body] = await handler(req, url, await readJson(req), id);
  sendJson(res, status, body);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`API falsa dos e2e em http://127.0.0.1:${PORT}`);
});
