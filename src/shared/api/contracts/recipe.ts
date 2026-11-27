import { z } from 'zod';
import { unidadeMedidaSchema } from './enums';

// Receitas, custo e simulação. Origem: `lucroai-backend` (monolito), `src/modules/receitas/`.

/**
 * `receitas/domain/models/receita.entity.ts`. O repositório converte `null` em
 * `undefined`, então os campos sem valor são omitidos do JSON.
 */
export const itemReceitaSchema = z.object({
  insumoId: z.number().int(),
  quantidade: z.number(),
  custoCalculado: z.number().optional(),
});

export type ItemReceita = z.infer<typeof itemReceitaSchema>;

/**
 * `ItemReceitaReceitaDto` (BE-39/BE-40): receita usada dentro desta. A
 * `quantidade` é por lote, na `unidade` do rendimento da receita usada.
 */
export const itemReceitaReceitaSchema = z.object({
  receitaId: z.number().int(),
  nome: z.string(),
  quantidade: z.number(),
  /** `unidadeRendimento` da receita usada. */
  unidade: unidadeMedidaSchema,
  /**
   * Custo de 1 unidade da receita usada (ingredientes, forno, seu trabalho
   * (BE-46) e perda; sem embalagem nem gastos por unidade), com 4 casas. Opcional: só desde a BE-40.
   */
  custoUnitario: z.number().optional(),
  /** `quantidade × custoUnitario`, com 2 casas (BE-40). */
  custoCalculado: z.number().optional(),
});

export type ItemReceitaReceita = z.infer<typeof itemReceitaReceitaSchema>;

/** `UsadaEmDto` (BE-39): receita que usa esta dentro dela. */
export const usadaEmSchema = z.object({
  receitaId: z.number().int(),
  nome: z.string(),
});

export type UsadaEm = z.infer<typeof usadaEmSchema>;

/** `receita.dto.ts` (`CustoReceitaDetalheDto`): de onde vem o custo de 1 unidade (BE-28). */
export const custoReceitaDetalheSchema = z.object({
  /** Ingredientes de 1 lote, com 2 casas. */
  ingredientesLote: z.number(),
  /** Gastos `MENSAL` de 1 lote, com 2 casas. */
  gastosMensaisLote: z.number(),
  /**
   * Seu trabalho em 1 lote (`minutosTrabalhoPorLote ÷ 60 × valorHora`), com 2
   * casas (BE-46). Padrão 0 para backend anterior à BE-46.
   */
  trabalhoLote: z.number().default(0),
  /** Por unidade, com 4 casas (como os campos abaixo). */
  ingredientes: z.number(),
  gastosMensais: z.number(),
  /** Seu trabalho por unidade, antes da perda (BE-46); padrão 0. */
  trabalho: z.number().default(0),
  gastosPorUnidade: z.number(),
  embalagem: z.number(),
  /** O que a perda acrescenta ao custo. */
  perdas: z.number(),
  /** Soma das partes acima: o `custoUnitario` da receita. */
  unitario: z.number(),
});

export type CustoReceitaDetalhe = z.infer<typeof custoReceitaDetalheSchema>;

/** `ParteDoPrecoDto`: reais por unidade e fração do preço, com 4 casas. */
export const parteDoPrecoSchema = z.object({
  valor: z.number(),
  fracao: z.number(),
});

export type ParteDoPreco = z.infer<typeof parteDoPrecoSchema>;

/** `ComposicaoPrecoDto`: "para onde vai cada R$ 1" do preço; as partes somam o preço (e 1). */
export const composicaoPrecoSchema = z.object({
  ingredientes: parteDoPrecoSchema,
  gastosMensais: parteDoPrecoSchema,
  /** Seu trabalho (BE-46); zerado para backend anterior à BE-46. */
  trabalho: parteDoPrecoSchema.default({ valor: 0, fracao: 0 }),
  gastosPorUnidade: parteDoPrecoSchema,
  embalagem: parteDoPrecoSchema,
  perdas: parteDoPrecoSchema,
  imposto: parteDoPrecoSchema,
  taxaCanal: parteDoPrecoSchema,
  gastosPercentuais: parteDoPrecoSchema,
  lucro: parteDoPrecoSchema,
});

export type ComposicaoPreco = z.infer<typeof composicaoPrecoSchema>;

/** `PrecoCanalDto`: preço sugerido da receita num canal ativo (BE-28). */
export const precoCanalSchema = z.object({
  canalId: z.number().int(),
  canal: z.string(),
  balcao: z.boolean(),
  /** `imposto + taxa do canal + gastos % da venda + lucro`, fração com 4 casas. */
  percentuais: z.number(),
  /** Com 4 casas; `null` com percentuais ≥ 100%. */
  preco: z.number().nullable(),
  /** Por que não há preço; `null` quando há. */
  motivo: z.enum(['PERCENTUAIS_ACIMA_DE_100']).nullable(),
  composicao: composicaoPrecoSchema.nullable(),
});

export type PrecoCanal = z.infer<typeof precoCanalSchema>;

export const receitaSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  nome: z.string(),
  /** Unidades **boas** (vendáveis) por lote. */
  rendimento: z.number().int(),
  unidadeRendimento: unidadeMedidaSchema,
  /** Fornadas (ou minutos de forno, conforme a `baseRateio`) de 1 lote (BE-27). */
  usoPorLote: z.number(),
  /** Reais por unidade (BE-27). */
  embalagemPorUnidade: z.number(),
  /** Fração das unidades que não são vendidas (BE-27). */
  perdaPercentual: z.number(),
  /** Fração do **preço**; omitido quando a receita usa o lucro padrão da empresa. */
  lucroPercentual: z.number().optional(),
  /**
   * Minutos em que a dona fica ocupada com 1 lote, sem o tempo sozinha no
   * forno ou na geladeira (BE-45); fracionário permitido. Padrão 0 para
   * backend anterior à BE-45.
   */
  minutosTrabalhoPorLote: z.number().default(0),
  /** `custoUnitario × rendimento` (1 lote), calculado na leitura. */
  custoProducao: z.number().optional(),
  /** Custo de 1 unidade (com embalagem e perda), calculado na leitura. */
  custoUnitario: z.number().optional(),
  /** Preço do Balcão; omitido sem preço possível. */
  precoSugerido: z.number().optional(),
  /**
   * `false`: a receita só vai dentro de outras e não tem preço (BE-39). Os
   * campos da receita dentro de receita têm padrão para aceitar um backend
   * anterior à BE-39, que não os manda.
   */
  vendavel: z.boolean().default(true),
  dataCriacao: z.iso.datetime(),
  itens: z.array(itemReceitaSchema),
  /** Receitas usadas dentro desta (um nível só, BE-39). */
  receitas: z.array(itemReceitaReceitaSchema).default([]),
  /** Receitas que usam esta dentro delas (BE-39). */
  usadaEm: z.array(usadaEmSchema).default([]),
  custo: custoReceitaDetalheSchema,
  /** Um por canal ativo, em ordem de criação do canal (Balcão primeiro). */
  precos: z.array(precoCanalSchema),
});

export type Receita = z.infer<typeof receitaSchema>;

/**
 * `create-receita.dto.ts`: o corpo é snake_case, menos `unidadeRendimento`.
 * O `margem_lucro` legado não é enviado: a web usa o `lucro_percentual`.
 */
export type CreateReceitaBody = {
  nome: string;
  rendimento: number;
  unidadeRendimento: Receita['unidadeRendimento'];
  /** > 0; padrão 1. */
  uso_por_lote?: number;
  /** ≥ 0; padrão 0. */
  embalagem_por_unidade?: number;
  /** Fração de 0 até menos de 1; padrão 0. */
  perda_percentual?: number;
  /** Fração do preço de 0 até menos de 1; `null` usa o lucro padrão da empresa. */
  lucro_percentual?: number | null;
  /** Minutos de trabalho em 1 lote, ≥ 0 (fracionário permitido); padrão 0 (BE-45). */
  minutos_trabalho_por_lote?: number;
  /** Padrão `true`; `false` só vai dentro de outras receitas (BE-39). */
  vendavel?: boolean;
  /** Opcional desde a BE-39: a receita precisa de ao menos um insumo ou receita. */
  insumos?: { insumo_id: number; quantidade: number }[];
  /** Receitas usadas dentro desta, na unidade do rendimento de cada uma (BE-39). */
  receitas?: { receita_id: number; quantidade: number }[];
};

/** `update-receita.dto.ts` (`PUT`, com todos os campos opcionais). */
export type UpdateReceitaBody = Partial<CreateReceitaBody>;

/**
 * `custos/application/dto/receita-custo.dto.ts`: em snake_case, ao contrário do
 * OVERVIEW (lacuna 15 de docs/api-integration.md).
 */
export const receitaCustoSchema = z.object({
  quantidade_lotes: z.number().int(),
  total_unidades: z.number(),
  custo_invisivel: z.number(),
  custo_total_producao: z.number(),
  custo_por_unidade: z.number(),
});

export type ReceitaCusto = z.infer<typeof receitaCustoSchema>;

/** `simular-receita-custo.dto.ts` */
export type SimularReceitaCustoBody = {
  quantidadeLotes: number;
};

/** `simular-cenario.dto.ts` (`PontoEquilibrioProdutoDto`, BE-31). */
export const pontoEquilibrioProdutoSchema = z.object({
  /** Unidades por mês para pagar os gastos mensais; `null` com o motivo. */
  unidades: z.number().int().nullable(),
  /** `MARGEM_NEGATIVA`: nenhuma quantidade paga os gastos do mês. */
  motivo: z.enum(['MARGEM_NEGATIVA']).nullable(),
});

export type PontoEquilibrioProduto = z.infer<
  typeof pontoEquilibrioProdutoSchema
>;

/**
 * `simular-cenario.dto.ts` (`SimulacaoCenarioDto`, BE-31). Os legados
 * `lucroEstimado`, `margemProjetada` e `breakEven` não são lidos (FE-45).
 */
export const simulacaoCenarioSchema = z.object({
  canalId: z.number().int(),
  canal: z.string(),
  /** Com 4 casas. */
  custoUnitario: z.number(),
  /** O custo sem os gastos mensais, com 4 casas. */
  custoSemGastosMensais: z.number(),
  /** Imposto, taxa do canal e gastos `PERCENTUAL_VENDA`, fração com 4 casas. */
  percentuaisSemLucro: z.number(),
  /** Com 4 casas. */
  precoVenda: z.number(),
  /** Unidades no mês. */
  volume: z.number().int(),
  /** Margem de contribuição por unidade, com 4 casas. */
  margemContribuicao: z.number(),
  /** Com 4 casas; negativo quando o preço não cobre o custo e as taxas. */
  lucroPorUnidade: z.number(),
  /** `lucroPorUnidade ÷ preço`, fração com 4 casas (pode ser negativa). */
  lucroReal: z.number(),
  /** `lucroPorUnidade × volume`, com 2 casas. */
  lucroMes: z.number(),
  /** Soma dos gastos `MENSAL` da empresa, com 2 casas. */
  gastosMensais: z.number(),
  pontoEquilibrio: pontoEquilibrioProdutoSchema,
});

export type SimulacaoCenario = z.infer<typeof simulacaoCenarioSchema>;

/** `simular-cenario.dto.ts`: campo omitido usa o valor calculado na leitura. */
export type SimularCenarioBody = {
  novoCusto?: number;
  /** Preço praticado; omitido usa o preço sugerido no canal. */
  novoPreco?: number;
  /** Unidades vendidas no mês; omitido usa o rendimento. */
  volume?: number;
  /** Omitido usa o Balcão. */
  canalId?: number;
};
