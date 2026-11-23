import { z } from 'zod';
import { tipoGastoSchema, unidadeMedidaSchema } from './enums';

// Insumos e gastos indiretos. Origem: `lucroai-backend` (monolito),
// `src/modules/insumos/` e `src/modules/gastos-indiretos/`.

/** `insumos/application/dto/insumo.dto.ts` */
export const insumoSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  nome: z.string(),
  quantidadeBaseCusto: z.number(),
  /** Saldo do estoque (pode ficar negativo). */
  quantidadeDisponivel: z.number(),
  /** Estoque mínimo (lacuna 5, resolvida). */
  quantidadeMinima: z.number(),
  /** `quantidadeDisponivel < 0` (BE-32). */
  estoqueNegativo: z.boolean(),
  unidade: unidadeMedidaSchema,
  /** Valor do último preço de referência (cadastro, compra ou `PATCH`, BE-29). */
  valorPago: z.number(),
  /** O custo de reposição (`precoMercado ?? ultimoCusto`), com 6 casas (BE-29). */
  custoUnitario: z.number(),
  /** Alias de `custoUnitario`. */
  precoUnitario: z.number(),
  /** Custo médio por unidade do que está guardado, com 6 casas (BE-29). */
  custoMedio: z.number(),
  /** Custo por unidade da última compra, com 6 casas (BE-29). */
  ultimoCusto: z.number(),
  /** "Preço de hoje": `precoMercado ?? ultimoCusto`, com 6 casas (BE-29). */
  custoReposicao: z.number(),
  /** Preço de mercado por unidade, informado sem compra; `null` sem preço. */
  precoMercado: z.number().nullable(),
  precoMercadoData: z.iso.datetime().nullable(),
  dataCriacao: z.iso.datetime(),
});

export type Insumo = z.infer<typeof insumoSchema>;

/** `create-insumo.dto.ts`: o corpo de insumos é camelCase. */
export type CreateInsumoBody = {
  nome: string;
  quantidadeBaseCusto: number;
  unidade: Insumo['unidade'];
  valorPago: number;
  quantidadeDisponivelInicial?: number;
};

/**
 * `update-insumo.dto.ts`: não aceita `quantidadeDisponivelInicial`.
 * `precoMercado` é por unidade do insumo; `null` volta ao último custo (BE-29).
 */
export type UpdateInsumoBody = Partial<
  Omit<CreateInsumoBody, 'quantidadeDisponivelInicial'>
> & { precoMercado?: number | null };

/** `compra-insumo.dto.ts` (BE-29): a compra é imutável; a data é a do registro. */
export const compraInsumoSchema = z.object({
  id: z.number().int(),
  insumoId: z.number().int(),
  /** Na unidade do insumo. */
  quantidade: z.number(),
  valorTotal: z.number(),
  /** `valorTotal / quantidade`, com 6 casas. */
  custoUnitario: z.number(),
  observacao: z.string().nullable(),
  dataCompra: z.iso.datetime(),
});
export type CompraInsumo = z.infer<typeof compraInsumoSchema>;

/** `create-compra-insumo.dto.ts`: `observacao` vazia não é enviada. */
export type CreateCompraInsumoBody = {
  quantidade: number;
  valorTotal: number;
  observacao?: string;
};

/**
 * `gastos-indiretos/application/dto/gasto-indireto.dto.ts`. O `metodoRateio`
 * legado, que a API ainda devolve, é descartado (FE-42).
 */
export const gastoIndiretoSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  descricao: z.string(),
  /** `MENSAL`: reais por mês; `POR_UNIDADE`: reais por unidade; `PERCENTUAL_VENDA`: fração do preço (0 a 1). */
  valor: z.number(),
  tipo: tipoGastoSchema,
});

export type GastoIndireto = z.infer<typeof gastoIndiretoSchema>;

/** `create-gasto-indireto.dto.ts`: só o `tipo`, sem o `metodo_rateio` legado. */
export type CreateGastoIndiretoBody = {
  descricao: string;
  valor: number;
  tipo: GastoIndireto['tipo'];
};

/** `update-gasto-indireto.dto.ts` (`PUT`, com todos os campos opcionais). */
export type UpdateGastoIndiretoBody = Partial<CreateGastoIndiretoBody>;

// Alertas (BE-32). Origem: `src/modules/alertas/application/dto/alertas.dto.ts`.

/** Insumo com saldo abaixo de zero. */
export const alertaEstoqueNegativoSchema = z.object({
  id: z.number().int(),
  nome: z.string(),
  /** Saldo do estoque, abaixo de zero, na unidade do insumo. */
  saldo: z.number(),
  unidade: unidadeMedidaSchema,
});

export type AlertaEstoqueNegativo = z.infer<typeof alertaEstoqueNegativoSchema>;

/** Receita que usa um insumo com preço defasado, com o preço no Balcão (4 casas). */
export const receitaAfetadaSchema = z.object({
  id: z.number().int(),
  nome: z.string(),
  /** Novo preço sugerido, com o custo de reposição; `null` com percentuais ≥ 100%. */
  precoSugerido: z.number().nullable(),
  /** O mesmo preço com o custo médio dos insumos (o preço de antes). */
  precoComCustoMedio: z.number().nullable(),
});

export type ReceitaAfetada = z.infer<typeof receitaAfetadaSchema>;

/** Insumo cuja reposição subiu mais de 10% sobre o custo médio. */
export const alertaPrecoDefasadoSchema = z.object({
  id: z.number().int(),
  nome: z.string(),
  unidade: unidadeMedidaSchema,
  custoMedio: z.number(),
  custoReposicao: z.number(),
  /** `custoReposicao ÷ custoMedio − 1`, fração com 4 casas (0,25 = 25%). */
  aumentoPercentual: z.number(),
  /** Receitas que usam o insumo (vazia se nenhuma usa). */
  receitas: z.array(receitaAfetadaSchema),
});

export type AlertaPrecoDefasado = z.infer<typeof alertaPrecoDefasadoSchema>;

/** `GET /alertas`: sem alerta, as duas listas vêm vazias. */
export const alertasSchema = z.object({
  estoqueNegativo: z.array(alertaEstoqueNegativoSchema),
  precoDefasado: z.array(alertaPrecoDefasadoSchema),
});

export type Alertas = z.infer<typeof alertasSchema>;
