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
import {
  makeCompraInsumo,
  makeInsumo,
  makeInsumosDoSeed,
} from '@/test/factories/insumo.factory';
import { makeProducao } from '@/test/factories/producao.factory';
import {
  makeCanaisDoSeed,
  makeConfiguracaoCustos,
} from '@/test/factories/pricing.factory';
import {
  makePrecoCanal,
  makeReceita,
  makeReceitaCusto,
  makeReceitasDoSeed,
  makeSimulacaoCenario,
} from '@/test/factories/receita.factory';
import {
  makeItemVenda,
  makeResumoVendas,
  makeVenda,
} from '@/test/factories/venda.factory';
import jwtPayload from '@/test/fixtures/auth/jwt-payload.json';
import login from '@/test/fixtures/auth/login.json';
import comprasInsumo from '@/test/fixtures/catalog/compras-insumo.json';
import gastosIndiretos from '@/test/fixtures/catalog/gastos-indiretos.json';
import insumo from '@/test/fixtures/catalog/insumo.json';
import insumos from '@/test/fixtures/catalog/insumos.json';
import estoqueInsumos from '@/test/fixtures/operations/estoque-insumos.json';
import estoqueProdutos from '@/test/fixtures/operations/estoque-produtos.json';
import estoque from '@/test/fixtures/operations/estoque.json';
import movimentacoes from '@/test/fixtures/operations/movimentacoes.json';
import producao from '@/test/fixtures/operations/producao.json';
import producoes from '@/test/fixtures/operations/producoes.json';
import canais from '@/test/fixtures/pricing/canais.json';
import configuracaoCustos from '@/test/fixtures/pricing/configuracao-custos.json';
import receitaCustoSimulada from '@/test/fixtures/recipe/receita-custo-simulada.json';
import receitaCusto from '@/test/fixtures/recipe/receita-custo.json';
import receita from '@/test/fixtures/recipe/receita.json';
import receitas from '@/test/fixtures/recipe/receitas.json';
import simulacaoCenario from '@/test/fixtures/recipe/simulacao-cenario.json';
import resumoVendas from '@/test/fixtures/sales/resumo-vendas.json';
import venda from '@/test/fixtures/sales/venda.json';
import vendas from '@/test/fixtures/sales/vendas.json';
import { unwrap } from '../request';
import { jwtPayloadSchema, loginResponseSchema } from './auth';
import {
  compraInsumoSchema,
  gastoIndiretoSchema,
  insumoSchema,
} from './catalog';
import {
  estoqueProdutoSchema,
  estoqueSchema,
  movimentacaoEstoqueSchema,
  producaoSchema,
} from './operations';
import { canalVendaSchema, configuracaoCustosSchema } from './pricing';
import {
  receitaCustoSchema,
  receitaSchema,
  simulacaoCenarioSchema,
} from './recipe';
import { resumoVendasSchema, vendaSchema } from './sales';

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
    nome: 'compras de insumo',
    schema: z.array(compraInsumoSchema),
    fixture: comprasInsumo,
    factory: [makeCompraInsumo(), makeCompraInsumo({ id: 2 })],
    invalida: [{ ...makeCompraInsumo(), observacao: undefined }],
  },
  {
    nome: 'lista de gastos indiretos',
    schema: z.array(gastoIndiretoSchema),
    fixture: gastosIndiretos,
    factory: makeGastosDoSeed(),
    invalida: [
      {
        ...makeGastoIndireto(),
        metodoRateio: 'FIXO',
        tipo: undefined,
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
    invalida: { ...makeReceita(), precoSugerido: null },
  },
  {
    nome: 'receita sem o detalhamento do custo e os preços (BE-28)',
    schema: receitaSchema,
    fixture: receita,
    factory: makeReceita(),
    invalida: { ...makeReceita(), custo: undefined, precos: undefined },
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
    invalida: { ...makeSimulacaoCenario(), pontoEquilibrio: undefined },
  },
  {
    nome: 'simulação sem ponto de equilíbrio (margem negativa)',
    schema: simulacaoCenarioSchema,
    fixture: simulacaoCenario,
    factory: makeSimulacaoCenario({
      lucroPorUnidade: -0.2,
      lucroReal: -2,
      pontoEquilibrio: { unidades: null, motivo: 'MARGEM_NEGATIVA' },
    }),
    invalida: {
      ...makeSimulacaoCenario(),
      pontoEquilibrio: { unidades: null, motivo: 'SEM_VENDAS' },
    },
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
    nome: 'resumo de vendas (ponto de equilíbrio da empresa)',
    schema: resumoVendasSchema,
    fixture: resumoVendas,
    factory: makeResumoVendas({
      vendas: 0,
      receita: 0,
      margemContribuicao: 0,
      indiceMargemContribuicao: null,
      pontoEquilibrio: { valor: null, motivo: 'SEM_VENDAS' },
    }),
    invalida: {
      ...makeResumoVendas(),
      pontoEquilibrio: { valor: null, motivo: 'SEM_GASTOS' },
    },
  },
  {
    nome: 'venda',
    schema: vendaSchema,
    fixture: venda,
    factory: makeVenda(),
    invalida: { ...makeVenda(), itens: [{ receitaId: 1 }] },
  },
  {
    nome: 'configuração de custos',
    schema: configuracaoCustosSchema,
    fixture: configuracaoCustos,
    factory: makeConfiguracaoCustos(),
    invalida: { ...makeConfiguracaoCustos(), baseRateio: 'HORAS' },
  },
  {
    nome: 'lista de canais de venda',
    schema: z.array(canalVendaSchema),
    fixture: canais,
    factory: makeCanaisDoSeed(),
    invalida: [{ ...makeCanaisDoSeed()[0], ativo: 'sim' }],
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
  it('receita sem preço possível omite o preço sugerido', () => {
    const semPreco = unwrap(
      { ...makeReceita(), precoSugerido: undefined },
      receitaSchema,
    );

    expect(semPreco.precoSugerido).toBeUndefined();
  });

  it('canal sem preço possível vem com preco, composicao e motivo', () => {
    const lida = unwrap(
      {
        ...makeReceita(),
        precoSugerido: undefined,
        precos: [
          makePrecoCanal({
            percentuais: 1.05,
            preco: null,
            motivo: 'PERCENTUAIS_ACIMA_DE_100',
            composicao: null,
          }),
        ],
      },
      receitaSchema,
    );

    expect(lida.precos[0]?.preco).toBeNull();
    expect(lida.precos[0]?.motivo).toBe('PERCENTUAIS_ACIMA_DE_100');
  });

  it('a receita do seed traz um preço por canal ativo e o lucro configurado', () => {
    const lida = unwrap(receita, receitaSchema);

    expect(lida.precos.map((p) => p.canal)).toEqual(['Balcão', 'iFood']);
    expect(lida.precos.every((p) => p.composicao?.lucro.fracao === 0.15)).toBe(
      true,
    );
    expect(lida.lucroPercentual).toBeUndefined();
  });

  it('venda antiga vem sem canal e sem lucro real', () => {
    const lida = unwrap(
      {
        ...makeVenda(),
        canalId: null,
        itens: [makeItemVenda({ lucroReal: null, custoUnitario: null })],
      },
      vendaSchema,
    );

    expect(lida.canalId).toBeNull();
    expect(lida.itens[0]?.lucroReal).toBeNull();
  });

  it('a venda do seed no iFood traz o canal e o lucro real, sem a margem legada', () => {
    const lida = unwrap(venda, vendaSchema);

    expect(lida.canalId).toBe(144);
    expect(lida.itens[0]?.lucroReal).toBe(0.2159);
    expect(lida.itens[0]).not.toHaveProperty('margemRealizada');
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
