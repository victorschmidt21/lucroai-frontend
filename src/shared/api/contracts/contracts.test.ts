import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  makeJwtPayload,
  makeLoginResponse,
} from '@/test/factories/auth.factory';
import {
  makeEstoque,
  makeEstoqueProduto,
  makeMovimentacaoEstoque,
} from '@/test/factories/estoque.factory';
import {
  makeGastoIndireto,
  makeGastosDoSeed,
} from '@/test/factories/gasto-indireto.factory';
import { makeInsumo, makeInsumosDoSeed } from '@/test/factories/insumo.factory';
import { makeProducao } from '@/test/factories/producao.factory';
import {
  makePrecoVenda,
  makeReceita,
  makeReceitaCusto,
  makeReceitasDoSeed,
  makeSimulacaoCenario,
} from '@/test/factories/receita.factory';
import { makeVenda } from '@/test/factories/venda.factory';
import jwtPayload from '@/test/fixtures/auth/jwt-payload.json';
import login from '@/test/fixtures/auth/login.json';
import gastosIndiretos from '@/test/fixtures/catalog/gastos-indiretos.json';
import insumo from '@/test/fixtures/catalog/insumo.json';
import insumos from '@/test/fixtures/catalog/insumos.json';
import estoqueInsumos from '@/test/fixtures/operations/estoque-insumos.json';
import estoqueProdutos from '@/test/fixtures/operations/estoque-produtos.json';
import estoque from '@/test/fixtures/operations/estoque.json';
import movimentacoes from '@/test/fixtures/operations/movimentacoes.json';
import producao from '@/test/fixtures/operations/producao.json';
import producoes from '@/test/fixtures/operations/producoes.json';
import precoVenda from '@/test/fixtures/recipe/preco-venda.json';
import receitaCustoSimulada from '@/test/fixtures/recipe/receita-custo-simulada.json';
import receitaCusto from '@/test/fixtures/recipe/receita-custo.json';
import receita from '@/test/fixtures/recipe/receita.json';
import receitas from '@/test/fixtures/recipe/receitas.json';
import simulacaoCenario from '@/test/fixtures/recipe/simulacao-cenario.json';
import venda from '@/test/fixtures/sales/venda.json';
import vendas from '@/test/fixtures/sales/vendas.json';
import { unwrap } from '../request';
import { jwtPayloadSchema, loginResponseSchema } from './auth';
import { gastoIndiretoSchema, insumoSchema } from './catalog';
import {
  estoqueProdutoSchema,
  estoqueSchema,
  movimentacaoEstoqueSchema,
  producaoSchema,
} from './operations';
import {
  precoVendaSchema,
  receitaCustoSchema,
  receitaSchema,
  simulacaoCenarioSchema,
} from './recipe';
import { vendaSchema } from './sales';

type Caso = {
  nome: string;
  schema: z.ZodType;
  /** Resposta real do monolito com o seed (JSON puro). */
  fixture: unknown;
  /** Dados da factory, que precisam seguir o mesmo contrato. */
  factory: unknown;
  /** Resposta inválida: o schema precisa rejeitar. */
  invalida: unknown;
};

const CASOS: Caso[] = [
  {
    nome: 'login',
    schema: loginResponseSchema,
    fixture: login,
    factory: makeLoginResponse(),
    invalida: { token: 'abc' },
  },
  {
    nome: 'payload do JWT',
    schema: jwtPayloadSchema,
    fixture: jwtPayload,
    factory: makeJwtPayload(),
    invalida: { ...makeJwtPayload(), empresa: undefined },
  },
  {
    nome: 'lista de insumos',
    schema: z.array(insumoSchema),
    fixture: insumos,
    factory: makeInsumosDoSeed(),
    invalida: [{ ...makeInsumo(), unidade: 'kg' }],
  },
  {
    nome: 'insumo',
    schema: insumoSchema,
    fixture: insumo,
    factory: makeInsumo(),
    invalida: { ...makeInsumo(), custoUnitario: '3' },
  },
  {
    nome: 'lista de gastos indiretos',
    schema: z.array(gastoIndiretoSchema),
    fixture: gastosIndiretos,
    factory: makeGastosDoSeed(),
    invalida: [
      {
        ...makeGastoIndireto(),
        metodo_rateio: 'FIXO',
        metodoRateio: undefined,
      },
    ],
  },
  {
    nome: 'lista de receitas',
    schema: z.array(receitaSchema),
    fixture: receitas,
    factory: makeReceitasDoSeed(),
    invalida: [{ ...makeReceita(), rendimento: 1.5 }],
  },
  {
    nome: 'receita',
    schema: receitaSchema,
    fixture: receita,
    factory: makeReceita(),
    invalida: { ...makeReceita(), margemLucro: null },
  },
  {
    nome: 'custo da receita',
    schema: receitaCustoSchema,
    fixture: receitaCusto,
    factory: makeReceitaCusto(),
    invalida: { quantidadeLotes: 1, custoProducao: 3.31 },
  },
  {
    nome: 'custo de N lotes',
    schema: receitaCustoSchema,
    fixture: receitaCustoSimulada,
    factory: makeReceitaCusto({ quantidade_lotes: 3, total_unidades: 150 }),
    invalida: { ...makeReceitaCusto(), quantidade_lotes: '3' },
  },
  {
    nome: 'simulação de cenário',
    schema: simulacaoCenarioSchema,
    fixture: simulacaoCenario,
    factory: makeSimulacaoCenario(),
    invalida: { ...makeSimulacaoCenario(), breakEven: undefined },
  },
  {
    nome: 'preço de venda',
    schema: precoVendaSchema,
    fixture: precoVenda,
    factory: makePrecoVenda(),
    invalida: { precoSugerido: 0.11 },
  },
  {
    nome: 'estoque',
    schema: estoqueSchema,
    fixture: estoque,
    factory: makeEstoque({ id: 0, dataAlteracao: null }),
    invalida: { ...makeEstoque(), dataAlteracao: 'ontem' },
  },
  {
    nome: 'lista de estoque dos insumos',
    schema: z.array(estoqueSchema),
    fixture: estoqueInsumos,
    factory: [makeEstoque(), makeEstoque({ id: 2, insumoId: 2 })],
    invalida: [{ ...makeEstoque(), quantidadeMinima: undefined }],
  },
  {
    nome: 'estoque de produto acabado',
    schema: z.array(estoqueProdutoSchema),
    fixture: estoqueProdutos,
    factory: [makeEstoqueProduto()],
    invalida: [{ ...makeEstoqueProduto(), receitaId: '1' }],
  },
  {
    nome: 'movimentações de estoque',
    schema: z.array(movimentacaoEstoqueSchema),
    fixture: movimentacoes,
    factory: [makeMovimentacaoEstoque()],
    invalida: [{ ...makeMovimentacaoEstoque(), tipo: 'AJUSTE' }],
  },
  {
    nome: 'lista de produções',
    schema: z.array(producaoSchema),
    fixture: producoes,
    factory: [
      makeProducao(),
      makeProducao({ custoTotal: null, custoUnitario: null }),
    ],
    invalida: [{ ...makeProducao(), totalUnidades: undefined }],
  },
  {
    nome: 'produção',
    schema: producaoSchema,
    fixture: producao,
    factory: makeProducao(),
    invalida: { ...makeProducao(), quantidade: 1.5 },
  },
  {
    nome: 'lista de vendas',
    schema: z.array(vendaSchema),
    fixture: vendas,
    factory: [
      makeVenda(),
      makeVenda({ id: 2, total: null, status: 'PENDENTE' }),
    ],
    invalida: [{ ...makeVenda(), status: 'concluida' }],
  },
  {
    nome: 'venda',
    schema: vendaSchema,
    fixture: venda,
    factory: makeVenda(),
    invalida: { ...makeVenda(), itens: [{ receitaId: 1 }] },
  },
];

describe.each(CASOS)(
  'contrato: $nome',
  ({ schema, fixture, factory, invalida }) => {
    it('aceita a resposta real do backend', () => {
      expect(() => unwrap(fixture, schema)).not.toThrow();
    });

    it('aceita os dados da factory', () => {
      expect(schema.safeParse(factory).success).toBe(true);
    });

    it('rejeita uma resposta inválida', () => {
      expect(schema.safeParse(invalida).success).toBe(false);
    });
  },
);

describe('campos sem valor', () => {
  it('receita sem margem omite margem e preço sugerido', () => {
    const semMargem = unwrap(
      { ...makeReceita(), margemLucro: undefined, precoSugerido: undefined },
      receitaSchema,
    );

    expect(semMargem.margemLucro).toBeUndefined();
    expect(semMargem.precoSugerido).toBeUndefined();
  });

  it('movimentação de produção vem com observacao null', () => {
    const lista = unwrap(movimentacoes, z.array(movimentacaoEstoqueSchema));

    expect(lista.find((m) => m.origem === 'PRODUCAO')?.observacao).toBeNull();
  });

  it('movimentação de compra vem com referenciaId null', () => {
    const lista = unwrap(movimentacoes, z.array(movimentacaoEstoqueSchema));

    expect(lista.find((m) => m.origem === 'COMPRA')?.referenciaId).toBeNull();
  });
});
