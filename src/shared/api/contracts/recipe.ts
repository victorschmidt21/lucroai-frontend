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

export const receitaSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  nome: z.string(),
  rendimento: z.number().int(),
  unidadeRendimento: unidadeMedidaSchema,
  /** Fornadas (ou minutos de forno) de 1 lote (BE-27). Opcional até a FE-44 trazer o campo ao formulário; a prévia da produção usa 1 sem ele. */
  usoPorLote: z.number().optional(),
  custoProducao: z.number().optional(),
  custoUnitario: z.number().optional(),
  /** Fração (`0.6` = 60%). */
  margemLucro: z.number().optional(),
  precoSugerido: z.number().optional(),
  dataCriacao: z.iso.datetime(),
  itens: z.array(itemReceitaSchema),
});

export type Receita = z.infer<typeof receitaSchema>;

/** `create-receita.dto.ts`: o corpo é snake_case, menos `unidadeRendimento`. */
export type CreateReceitaBody = {
  nome: string;
  rendimento: number;
  unidadeRendimento: Receita['unidadeRendimento'];
  /** Fração (`0.6` = 60%). */
  margem_lucro?: number;
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
