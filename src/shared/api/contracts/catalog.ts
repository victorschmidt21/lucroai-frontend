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
  unidade: unidadeMedidaSchema,
  valorPago: z.number(),
  /** `valorPago / quantidadeBaseCusto`, sem arredondamento. */
  custoUnitario: z.number(),
  /** Alias de `custoUnitario`. */
  precoUnitario: z.number(),
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

/** `update-insumo.dto.ts`: não aceita `quantidadeDisponivelInicial`. */
export type UpdateInsumoBody = Partial<
  Omit<CreateInsumoBody, 'quantidadeDisponivelInicial'>
>;

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
