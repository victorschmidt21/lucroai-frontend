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

/** `shared/src/domain/enums/metodo-rateio.enum.ts` */
export const METODOS_RATEIO = ['PROPORCIONAL', 'POR_UNIDADE', 'FIXO'] as const;
export const metodoRateioSchema = z.enum(METODOS_RATEIO);
export type MetodoRateio = z.infer<typeof metodoRateioSchema>;

export const METODO_RATEIO_ROTULOS: Record<MetodoRateio, string> = {
  PROPORCIONAL: 'Proporcional à qtd. de lotes',
  POR_UNIDADE: 'Proporcional ao total de unidades',
  FIXO: 'Valor fixo por produção',
};

export const METODO_RATEIO_DESCRICOES: Record<MetodoRateio, string> = {
  PROPORCIONAL: 'Gastos que crescem com o volume, como energia e gás.',
  POR_UNIDADE: 'Gastos por peça, como embalagem individual.',
  FIXO: 'Valor integral, independente do volume, como aluguel e mensalidades.',
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
  PRODUCAO: 'Produção',
};
