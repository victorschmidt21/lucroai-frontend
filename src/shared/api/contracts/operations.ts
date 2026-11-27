import { z } from 'zod';
import {
  origemMovimentacaoSchema,
  tipoMovimentacaoSchema,
  unidadeMedidaSchema,
} from './enums';

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

/**
 * `producoes/application/dto/estoque-pronto.dto.ts` (BE-41; antes
 * `estoque-produto.dto.ts`): um por receita que já teve movimentação.
 */
export const estoqueProdutoSchema = z.object({
  receitaId: z.number().int(),
  /** Pode ficar negativo quando a receita é usada dentro de outra sem a produção dela (BE-41). */
  quantidadeDisponivel: z.number(),
  /** Novo (BE-41): `quantidadeDisponivel < 0`; `false` com backend anterior (que não deixava negativo). */
  estoqueNegativo: z.boolean().default(false),
  /** Novo (BE-41): o `vendavel` da receita; `true` com backend anterior. */
  vendavel: z.boolean().default(true),
  dataAlteracao: z.iso.datetime().nullable(),
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

/** `ReceitaUsadaProducaoDto` (BE-41): receita usada dentro da produzida, que saiu do estoque pronto. */
export const receitaUsadaProducaoSchema = z.object({
  /** Continua o mesmo depois de a receita ser excluída (sem FK). */
  receitaId: z.number().int(),
  /** Nome da receita na hora da produção. */
  nome: z.string(),
  /** Quantidade por lote × lotes, com 6 casas, na `unidade`. */
  quantidade: z.number(),
  /** Unidade do rendimento da receita usada. */
  unidade: unidadeMedidaSchema,
});

export type ReceitaUsadaProducao = z.infer<typeof receitaUsadaProducaoSchema>;

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
  /**
   * Seu trabalho na produção (lotes × trabalho de 1 lote, com o valor da hora
   * do momento), com 2 casas, já somado ao `custoTotal` (BE-47). `null` nas
   * produções anteriores à BE-47; ausente em backend anterior.
   */
  custoTrabalho: z.number().nullable().optional(),
  dataProducao: z.iso.datetime(),
  rateios: z.array(rateioProducaoSchema),
  /** Novo (BE-41): `[]` na receita só com insumos e com backend anterior. */
  receitasUsadas: z.array(receitaUsadaProducaoSchema).default([]),
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
