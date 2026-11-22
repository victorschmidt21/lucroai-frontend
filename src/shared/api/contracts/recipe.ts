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

/** `receita.dto.ts` (`CustoReceitaDetalheDto`): de onde vem o custo de 1 unidade (BE-28). */
export const custoReceitaDetalheSchema = z.object({
  /** Ingredientes de 1 lote, com 2 casas. */
  ingredientesLote: z.number(),
  /** Gastos `MENSAL` de 1 lote, com 2 casas. */
  gastosMensaisLote: z.number(),
  /** Por unidade, com 4 casas (como os campos abaixo). */
  ingredientes: z.number(),
  gastosMensais: z.number(),
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
  /** `custoUnitario × rendimento` (1 lote), calculado na leitura. */
  custoProducao: z.number().optional(),
  /** Custo de 1 unidade (com embalagem e perda), calculado na leitura. */
  custoUnitario: z.number().optional(),
  /**
   * Legado (markup equivalente ao lucro, `lucro ÷ (1 − lucro)`): só a
   * simulação ainda usa; sai quando ela usar os `precos` (FE-45).
   */
  margemLucro: z.number().optional(),
  /** Preço do Balcão; omitido sem preço possível. */
  precoSugerido: z.number().optional(),
  dataCriacao: z.iso.datetime(),
  itens: z.array(itemReceitaSchema),
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
  insumos: { insumo_id: number; quantidade: number }[];
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

/** `simulacao-cenario-resultado.dto.ts` */
export const simulacaoCenarioSchema = z.object({
  custoUnitario: z.number(),
  precoVenda: z.number(),
  volume: z.number(),
  lucroEstimado: z.number(),
  /** Fração com 2 casas (pode ser negativa). */
  margemProjetada: z.number(),
  breakEven: z.number(),
});

export type SimulacaoCenario = z.infer<typeof simulacaoCenarioSchema>;

/** `simular-cenario.dto.ts` */
export type SimularCenarioBody = {
  novoCusto?: number;
  novoPreco?: number;
  volume?: number;
};

/** `preco-venda.dto.ts` (`PrecoVendaResponseDto`): sem arredondamento. */
export const precoVendaSchema = z.object({
  custo_total_unitario: z.number(),
  preco_sugerido: z.number(),
  lucro_por_unidade: z.number(),
});

export type PrecoVenda = z.infer<typeof precoVendaSchema>;

/** `preco-venda.dto.ts` (`PrecoVendaDto`) */
export type PrecoVendaBody = {
  /** Fração (`0.6` = 60%). */
  margem_lucro: number;
};
