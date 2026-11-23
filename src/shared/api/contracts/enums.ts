import { z } from 'zod';

// Valores de `shared/src/domain/enums/` e do `schema.prisma` de cada serviço no
// backend. Os rótulos vêm de docs/business-rules.md#enumerações-e-rótulos: nunca
// mostre o valor cru do enum.

/** `shared/src/domain/enums/unidade-medida.enum.ts` */
export const UNIDADES_MEDIDA = ['G', 'KG', 'ML', 'L', 'UN'] as const;
export const unidadeMedidaSchema = z.enum(UNIDADES_MEDIDA);
export type UnidadeMedida = z.infer<typeof unidadeMedidaSchema>;

export const UNIDADE_MEDIDA_ROTULOS: Record<UnidadeMedida, string> = {
  G: 'g',
  KG: 'kg',
  ML: 'ml',
  L: 'L',
  UN: 'un',
};

/**
 * `TipoGasto` do `schema.prisma` do monolito (BE-26), que substituiu o
 * `MetodoRateio`. O `valor` muda de unidade conforme o tipo: reais por mês,
 * reais por unidade vendida ou fração do preço de venda (0 a 1).
 */
export const TIPOS_GASTO = [
  'MENSAL',
  'POR_UNIDADE',
  'PERCENTUAL_VENDA',
] as const;
export const tipoGastoSchema = z.enum(TIPOS_GASTO);
export type TipoGasto = z.infer<typeof tipoGastoSchema>;

/** Rótulos sem jargão (FE-42). */
export const TIPO_GASTO_ROTULOS: Record<TipoGasto, string> = {
  MENSAL: 'Conta do mês',
  POR_UNIDADE: 'Por unidade vendida',
  PERCENTUAL_VENDA: '% da venda',
};

/** Explicação do tipo, com exemplos (texto de apoio no formulário). */
export const TIPO_GASTO_DESCRICOES: Record<TipoGasto, string> = {
  MENSAL:
    'Dividida pelas fornadas do mês. Ex.: aluguel, luz, gás, água, DAS do MEI.',
  POR_UNIDADE: 'Valor de cada unidade. Ex.: saquinho, etiqueta.',
  PERCENTUAL_VENDA: 'Percentual de cada venda. Ex.: comissão de revendedora.',
};

/** `shared/src/domain/enums/status-venda.enum.ts` */
export const STATUS_VENDA = ['PENDENTE', 'CONCLUIDA', 'CANCELADA'] as const;
export const statusVendaSchema = z.enum(STATUS_VENDA);
export type StatusVenda = z.infer<typeof statusVendaSchema>;

export const STATUS_VENDA_ROTULOS: Record<StatusVenda, string> = {
  PENDENTE: 'Pendente',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

/** `TipoMovimentacaoEstoque` do `schema.prisma` do operations-service. */
export const tipoMovimentacaoSchema = z.enum(['ENTRADA', 'SAIDA']);
export type TipoMovimentacao = z.infer<typeof tipoMovimentacaoSchema>;

export const TIPO_MOVIMENTACAO_ROTULOS: Record<TipoMovimentacao, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
};

/** `OrigemMovimentacaoEstoque` do `schema.prisma` do operations-service. */
export const origemMovimentacaoSchema = z.enum(['COMPRA', 'PRODUCAO']);
export type OrigemMovimentacao = z.infer<typeof origemMovimentacaoSchema>;

export const ORIGEM_MOVIMENTACAO_ROTULOS: Record<OrigemMovimentacao, string> = {
  COMPRA: 'Compra',
  PRODUCAO: 'Fornada',
};

/** `BaseRateio` do `schema.prisma` do monolito (BE-24): o que a capacidade mensal conta. */
export const BASES_RATEIO = ['FORNADAS', 'MINUTOS'] as const;
export const baseRateioSchema = z.enum(BASES_RATEIO);
export type BaseRateio = z.infer<typeof baseRateioSchema>;

/** Rótulos sem jargão, da tela de configurações de custo (FE-41). */
export const BASE_RATEIO_ROTULOS: Record<BaseRateio, string> = {
  FORNADAS: 'Por fornadas',
  MINUTOS: 'Por minutos de forno',
};
