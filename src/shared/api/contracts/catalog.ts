import { z } from 'zod';
import { metodoRateioSchema, unidadeMedidaSchema } from './enums';

// catalog-service. Origem: `services/catalog-service/src/modules/`.

/** `insumos/application/dto/insumo.dto.ts` */
export const insumoSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  nome: z.string(),
  quantidadeBaseCusto: z.number(),
  /** Espelho do estoque, atualizado por evento (pode ficar negativo). */
  quantidadeDisponivel: z.number(),
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

/** `gastos-indiretos/domain/models/gasto-indireto.entity.ts` */
export const gastoIndiretoSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  descricao: z.string(),
  valor: z.number(),
  metodoRateio: metodoRateioSchema,
});

export type GastoIndireto = z.infer<typeof gastoIndiretoSchema>;

/** `create-gasto-indireto.dto.ts`: o corpo é snake_case. */
export type CreateGastoIndiretoBody = {
  descricao: string;
  valor: number;
  metodo_rateio: GastoIndireto['metodoRateio'];
};

/** `update-gasto-indireto.dto.ts` (`PUT`, com todos os campos opcionais). */
export type UpdateGastoIndiretoBody = Partial<CreateGastoIndiretoBody>;
