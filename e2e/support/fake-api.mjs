// API falsa dos e2e. O CI não sobe o monolito: o playwright.config.ts aponta
// API_URL para este servidor.
//
// Responde o que o /api/health sonda (`/health`), o login do seed (FE-07) e,
// desde a FE-23, as rotas do spec de fumaça (`e2e/fluxo-principal.spec.ts`):
// insumos, receitas, estoque, produções e vendas, com estado em memória que
// começa vazio e dura enquanto o processo viver. Segue o contrato de
// docs/api-integration.md e `src/shared/api/contracts/`: JSON puro, JWT de
// teste e erros no formato da API (`{ statusCode, code, message, path,
// timestamp }`). Os cálculos são os do backend (docs/business-rules.md), sem
// gastos indiretos.
import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_API_PORT ?? 3999);

/** Erro no formato da API (`AllExceptionsFilter`). */
function apiError(statusCode, code, message) {
  return {
    statusCode,
    code,
    message,
    path: '/',
    timestamp: new Date().toISOString(),
  };
}

// Usuário do seed do backend.
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

/** JWT de 4 h com o payload da API; a assinatura é falsa. */
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

const NAO_AUTENTICADO = [
  401,
  apiError(401, 'NAO_AUTENTICADO', 'Autenticação necessária'),
];

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

/** Só chama o handler com um Bearer válido, como o guard JWT. */
function autenticada(handler) {
  return (req, ...resto) =>
    isAutenticado(req) ? handler(req, ...resto) : NAO_AUTENTICADO;
}

const naoEncontrado = (code, mensagem) => [404, apiError(404, code, mensagem)];
const invalido = () => [
  400,
  apiError(400, 'DADOS_INVALIDOS', 'Os dados enviados são inválidos'),
];

// Estado em memória da empresa do seed. Cada coleção começa vazia; não há
// gastos indiretos, então o custo invisível e os rateios são zero. `produtos`
// é o saldo de produto acabado por receita (`GET /estoque/produtos`).
const db = { insumos: [], receitas: [], producoes: [], vendas: [] };
const produtos = new Map();
let ultimoId = 0;
const novoId = () => ++ultimoId;
const round2 = (valor) => Math.round(valor * 100) / 100;
const round4 = (valor) => Math.round(valor * 10000) / 10000;
const agora = () => new Date().toISOString();

function buscar(colecao, id, code, mensagem) {
  const item = db[colecao].find((atual) => atual.id === id);
  return item ? [200, item] : naoEncontrado(code, mensagem);
}

/**
 * `POST /insumos`: `custoUnitario = valorPago / quantidadeBaseCusto`, que é
 * também o custo médio, o último custo e o preço de hoje (compra inicial, BE-29).
 */
function criarInsumo(body) {
  if (!body?.nome || !(body.quantidadeBaseCusto > 0) || !body.unidade) {
    return invalido();
  }
  const custoUnitario = body.valorPago / body.quantidadeBaseCusto;
  const insumo = {
    id: novoId(),
    empresaId: EMPRESA_ID,
    nome: body.nome,
    quantidadeBaseCusto: body.quantidadeBaseCusto,
    quantidadeDisponivel: body.quantidadeDisponivelInicial ?? 0,
    quantidadeMinima: 0,
    estoqueNegativo: false,
    unidade: body.unidade,
    valorPago: body.valorPago,
    custoUnitario,
    precoUnitario: custoUnitario,
    custoMedio: custoUnitario,
    ultimoCusto: custoUnitario,
    custoReposicao: custoUnitario,
    precoMercado: null,
    precoMercadoData: null,
    dataCriacao: agora(),
  };
  db.insumos.push(insumo);
  return [201, insumo];
}

/**
 * `POST /receitas`: custo só dos ingredientes (sem gastos, embalagem nem
 * perda) e um preço só no Balcão, sem imposto nem maquininha:
 * `custo ÷ (1 − lucro)`, com o lucro padrão de 15% quando vem `null`.
 */
function criarReceita(body) {
  if (!body?.nome || !(body.rendimento > 0) || !Array.isArray(body.insumos)) {
    return invalido();
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
  const custoLote = itens.reduce(
    (soma, item) => soma + (item.custoCalculado ?? 0),
    0,
  );
  const custoUnitario = round4(custoLote / body.rendimento);
  const lucro = body.lucro_percentual ?? 0.15;
  const preco = round4(custoUnitario / (1 - lucro));
  const parte = (valor) => ({
    valor: round4(valor),
    fracao: round4(preco > 0 ? valor / preco : 0),
  });
  const zero = { valor: 0, fracao: 0 };
  const receita = {
    id: novoId(),
    empresaId: EMPRESA_ID,
    nome: body.nome,
    rendimento: body.rendimento,
    unidadeRendimento: body.unidadeRendimento,
    usoPorLote: body.uso_por_lote ?? 1,
    embalagemPorUnidade: body.embalagem_por_unidade ?? 0,
    perdaPercentual: body.perda_percentual ?? 0,
    ...(body.lucro_percentual == null
      ? {}
      : { lucroPercentual: body.lucro_percentual }),
    custoProducao: round2(custoLote),
    custoUnitario,
    margemLucro: round4(lucro / (1 - lucro)),
    precoSugerido: preco,
    dataCriacao: agora(),
    itens,
    custo: {
      ingredientesLote: round2(custoLote),
      gastosMensaisLote: 0,
      ingredientes: custoUnitario,
      gastosMensais: 0,
      gastosPorUnidade: 0,
      embalagem: 0,
      perdas: 0,
      unitario: custoUnitario,
    },
    precos: [
      {
        canalId: 1,
        canal: 'Balcão',
        balcao: true,
        percentuais: lucro,
        preco,
        motivo: null,
        composicao: {
          ingredientes: parte(custoUnitario),
          gastosMensais: zero,
          gastosPorUnidade: zero,
          embalagem: zero,
          perdas: zero,
          imposto: zero,
          taxaCanal: zero,
          gastosPercentuais: zero,
          lucro: { valor: round4(preco * lucro), fracao: lucro },
        },
      },
    ],
  };
  db.receitas.push(receita);
  return [201, receita];
}

/** Registro de estoque de um insumo, com o saldo e o mínimo guardados no insumo. */
function estoqueDe(insumo) {
  return {
    id: insumo.id,
    insumoId: insumo.id,
    quantidadeDisponivel: insumo.quantidadeDisponivel,
    quantidadeMinima: insumo.quantidadeMinima,
    dataAlteracao: insumo.dataCriacao,
  };
}

/** `POST /producoes`: custo com o snapshot da receita; baixa os insumos. */
function criarProducao(body) {
  const receita = db.receitas.find((atual) => atual.id === body?.receita_id);
  if (!receita) {
    return naoEncontrado('RECEITA_NAO_ENCONTRADA', 'Receita não encontrada');
  }
  if (!Number.isInteger(body.quantidade) || body.quantidade < 1) {
    return invalido();
  }
  const totalUnidades = body.quantidade * receita.rendimento;
  const custoTotal = round2((receita.custoProducao ?? 0) * body.quantidade);
  const producao = {
    id: novoId(),
    receitaId: receita.id,
    empresaId: EMPRESA_ID,
    quantidade: body.quantidade,
    totalUnidades,
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
  produtos.set(receita.id, (produtos.get(receita.id) ?? 0) + totalUnidades);
  db.producoes.push(producao);
  return [201, producao];
}

/** `POST /vendas`: nasce `PENDENTE`, com o snapshot do custo da receita. */
function criarVenda(body) {
  if (!Array.isArray(body?.itens) || body.itens.length === 0) {
    return invalido();
  }
  const vendaId = novoId();
  const itens = [];
  for (const item of body.itens) {
    const receita = db.receitas.find((atual) => atual.id === item.receita_id);
    if (!receita) {
      return naoEncontrado('RECEITA_NAO_ENCONTRADA', 'Receita não encontrada');
    }
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
  return [201, venda];
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
  return [200, vendas];
}

/**
 * `PATCH /vendas/:id/status`: só `PENDENTE` muda de status; concluir baixa o
 * produto acabado na mesma operação, ou responde 422 sem gravar nada.
 */
function mudarStatusDaVenda(id, body) {
  const venda = db.vendas.find((atual) => atual.id === id);
  if (!venda) {
    return naoEncontrado('VENDA_NAO_ENCONTRADA', 'Venda não encontrada');
  }
  if (venda.status !== 'PENDENTE') {
    return [
      422,
      apiError(
        422,
        'VENDA_FINALIZADA',
        'Venda já finalizada não pode ser alterada',
      ),
    ];
  }
  if (body?.status === 'CONCLUIDA') {
    for (const item of venda.itens) {
      const disponivel = produtos.get(item.receitaId) ?? 0;
      if (disponivel < item.quantidade) {
        return [
          422,
          apiError(
            422,
            'ESTOQUE_INSUFICIENTE',
            `Estoque insuficiente para a receita ${item.receitaId}: disponível ${disponivel}, solicitado ${item.quantidade}`,
          ),
        ];
      }
    }
    for (const item of venda.itens) {
      produtos.set(
        item.receitaId,
        produtos.get(item.receitaId) - item.quantidade,
      );
    }
  }
  venda.status = body?.status;
  return [200, venda];
}

/**
 * Rotas atendidas, por "MÉTODO /caminho", com `:id` no lugar de um segmento
 * numérico. Cada handler recebe a requisição, a URL já interpretada, o corpo
 * JSON (ou `undefined`) e o id do caminho.
 */
const routes = {
  // Pública, como a da API: o Playwright e o /api/health do front a sondam.
  'GET /health': () => [200, { status: 'ok', database: 'up' }],
  // `POST /auth/login` (FE-07).
  'POST /auth/login': (_req, _url, body) =>
    body?.email === USUARIO_DO_SEED.email &&
    body?.senha === USUARIO_DO_SEED.senha
      ? [200, { access_token: emitirToken() }]
      : [401, apiError(401, 'CREDENCIAIS_INVALIDAS', 'Credenciais inválidas')],
  // Insumos e gastos indiretos.
  'GET /insumos': autenticada(() => [200, db.insumos]),
  'GET /insumos/:id': autenticada((_req, _url, _body, id) =>
    buscar('insumos', id, 'INSUMO_NAO_ENCONTRADO', 'Insumo não encontrado'),
  ),
  'POST /insumos': autenticada((_req, _url, body) => criarInsumo(body)),
  'GET /gastos-indiretos': autenticada(() => [200, []]),
  // Receitas.
  'GET /receitas': autenticada(() => [200, db.receitas]),
  'GET /receitas/:id': autenticada((_req, _url, _body, id) =>
    buscar('receitas', id, 'RECEITA_NAO_ENCONTRADA', 'Receita não encontrada'),
  ),
  'POST /receitas': autenticada((_req, _url, body) => criarReceita(body)),
  // Estoque e produções.
  'GET /estoque/insumos': autenticada(() => [200, db.insumos.map(estoqueDe)]),
  'GET /estoque/insumos/:id/movimentacoes': autenticada(() => [200, []]),
  'GET /estoque/produtos': autenticada(() => [
    200,
    [...produtos].map(([receitaId, quantidadeDisponivel]) => ({
      receitaId,
      quantidadeDisponivel,
      dataAlteracao: agora(),
    })),
  ]),
  'GET /producoes': autenticada((_req, url) => {
    const receitaId = Number(url.searchParams.get('receitaId'));
    const producoes = db.producoes.filter(
      (producao) => !receitaId || producao.receitaId === receitaId,
    );
    return [200, producoes.toReversed()];
  }),
  'GET /producoes/:id': autenticada((_req, _url, _body, id) =>
    buscar(
      'producoes',
      id,
      'PRODUCAO_NAO_ENCONTRADA',
      'Produção não encontrada',
    ),
  ),
  'POST /producoes': autenticada((_req, _url, body) => criarProducao(body)),
  // Vendas.
  'GET /vendas': autenticada((_req, url) => listarVendas(url)),
  'GET /vendas/:id': autenticada((_req, _url, _body, id) =>
    buscar('vendas', id, 'VENDA_NAO_ENCONTRADA', 'Venda não encontrada'),
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
      apiError(404, 'RECURSO_NAO_ENCONTRADO', 'Recurso não encontrado'),
    );
    return;
  }

  const [status, body] = await handler(req, url, await readJson(req), id);
  sendJson(res, status, body);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`API falsa dos e2e em http://127.0.0.1:${PORT}`);
});
