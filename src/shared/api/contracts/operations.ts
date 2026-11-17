import { z } from 'zod';
import { origemMovimentacaoSchema, tipoMovimentacaoSchema } from './enums';

// operations-service. Origem: `services/operations-service/src/modules/`.

/** `estoque/application/dto/estoque.dto.ts` */
export const estoqueSchema = z.object({
  /** 0 quando o insumo ainda não tem registro de estoque. */
  id: z.number().int(),
  insumoId: z.number().int(),
  /** Pode ficar negativo: a produção não confere o saldo (lacuna 10). */
  quantidadeDisponivel: z.number(),
  quantidadeMinima: z.number(),
  dataAlteracao: z.iso.datetime().nullable(),
});

export type Estoque = z.infer<typeof estoqueSchema>;

/** `registrar-entrada-estoque.dto.ts`: só `quantidade` (campos extras dão 400). */
export type RegistrarEntradaEstoqueBody = {
  quantidade: number;
};

/** `estoque/application/dto/movimentacao-estoque.dto.ts` */
export const movimentacaoEstoqueSchema = z.object({
  id: z.number().int(),
  insumoId: z.number().int(),
  tipo: tipoMovimentacaoSchema,
  origem: origemMovimentacaoSchema,
  quantidade: z.number(),
  /** Id da produção, nas saídas por produção. */
  referenciaId: z.number().int().nullable(),
  dataMovimentacao: z.iso.datetime(),
});

export type MovimentacaoEstoque = z.infer<typeof movimentacaoEstoqueSchema>;

/** `producoes/domain/models/producao.entity.ts` */
export const rateioProducaoSchema = z.object({
  gastoIndiretoId: z.number().int(),
  valorRateado: z.number(),
});

export const producaoSchema = z.object({
  id: z.number().int(),
  receitaId: z.number().int(),
  empresaId: z.number().int(),
  /** Lotes. */
  quantidade: z.number().int(),
  custoTotal: z.number().nullable(),
  custoUnitario: z.number().nullable(),
  dataProducao: z.iso.datetime(),
  rateios: z.array(rateioProducaoSchema),
});

export type Producao = z.infer<typeof producaoSchema>;

/** `create-producao.dto.ts`: o corpo é snake_case. */
export type CreateProducaoBody = {
  receita_id: number;
  quantidade: number;
  gasto_indireto_ids?: number[];
};

/** Query de `GET /producoes` (`producoes.controller.ts`). */
export type ListProducoesQuery = {
  receitaId?: number;
};
