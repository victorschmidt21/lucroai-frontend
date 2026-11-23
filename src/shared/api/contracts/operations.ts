import { z } from 'zod';
import { origemMovimentacaoSchema, tipoMovimentacaoSchema } from './enums';

// Estoque e produções. Origem: `lucroai-backend` (monolito),
// `src/modules/estoque/` e `src/modules/producoes/`.

/** `estoque/application/dto/estoque.dto.ts` */
export const estoqueSchema = z.object({
  id: z.number().int(),
  insumoId: z.number().int(),
  /** Pode ficar negativo: a produção não confere o saldo (lacuna 10). */
  quantidadeDisponivel: z.number(),
  quantidadeMinima: z.number(),
  /** `quantidadeDisponivel < 0` (BE-32): permitido, só para a indicação visual. */
  estoqueNegativo: z.boolean(),
  dataAlteracao: z.iso.datetime().nullable(),
});

export type Estoque = z.infer<typeof estoqueSchema>;

/** `registrar-entrada-estoque.dto.ts` (campos extras dão 400). */
export type RegistrarEntradaEstoqueBody = {
  quantidade: number;
  /** Até 200 caracteres; vazia é gravada como `null` (lacuna 22, resolvida). */
  observacao?: string;
};

/** `atualizar-minimo-estoque.dto.ts` (`PATCH /estoque/insumos/:id/minimo`, lacuna 14). */
export type AtualizarMinimoEstoqueBody = {
  quantidadeMinima: number;
};

/** `estoque/application/dto/estoque-produto.dto.ts`: um por receita que já teve produção. */
export const estoqueProdutoSchema = z.object({
  receitaId: z.number().int(),
  quantidadeDisponivel: z.number(),
  dataAlteracao: z.iso.datetime(),
});

export type EstoqueProduto = z.infer<typeof estoqueProdutoSchema>;

/** `estoque/application/dto/movimentacao-estoque.dto.ts` */
export const movimentacaoEstoqueSchema = z.object({
  id: z.number().int(),
  insumoId: z.number().int(),
  tipo: tipoMovimentacaoSchema,
  origem: origemMovimentacaoSchema,
  quantidade: z.number(),
  /** Id da produção, nas saídas por produção. */
  referenciaId: z.number().int().nullable(),
  observacao: z.string().nullable(),
  dataMovimentacao: z.iso.datetime(),
});

export type MovimentacaoEstoque = z.infer<typeof movimentacaoEstoqueSchema>;

/** `producoes/application/dto/producao.dto.ts` */
export const rateioProducaoSchema = z.object({
  gastoIndiretoId: z.number().int(),
  /** Descrição do gasto na hora da produção. */
  descricao: z.string(),
  valorRateado: z.number(),
});

export const producaoSchema = z.object({
  id: z.number().int(),
  receitaId: z.number().int(),
  empresaId: z.number().int(),
  /** Lotes. */
  quantidade: z.number().int(),
  /** Lotes × rendimento da receita na hora da produção (lacuna 23, resolvida). */
  totalUnidades: z.number(),
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
