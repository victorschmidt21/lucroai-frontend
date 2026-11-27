import { z } from 'zod';
import { baseRateioSchema } from './enums';

// Configuração de custos e canais de venda (épico E7 do backend, BE-24 e BE-25).
// Origem: `lucroai-backend` (monolito), `src/modules/configuracao-custos/` e
// `src/modules/canais/`. Os percentuais são frações do preço de venda (0 a 1),
// sem arredondamento.

/** `configuracao-custos/application/dto/configuracao-custos.dto.ts` */
export const configuracaoCustosSchema = z.object({
  empresaId: z.number().int(),
  baseRateio: baseRateioSchema,
  /** Fornadas (ou minutos de forno) por mês, > 0. */
  capacidadeMensal: z.number(),
  lucroPadrao: z.number(),
  impostoPercentual: z.number(),
  taxaMaquininha: z.number(),
  /** Reais por hora do trabalho da dona, ≥ 0 (BE-45); 0 em backend anterior. */
  valorHora: z.number().default(0),
});

export type ConfiguracaoCustos = z.infer<typeof configuracaoCustosSchema>;

/** `update-configuracao-custos.dto.ts` (`PUT`, campos omitidos mantêm o salvo). */
export type UpdateConfiguracaoCustosBody = Partial<
  Omit<ConfiguracaoCustos, 'empresaId'>
>;

/** `canais/application/dto/canal-venda.dto.ts` */
export const canalVendaSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  nome: z.string(),
  comissaoPercentual: z.number(),
  ativo: z.boolean(),
  /** Canal padrão da empresa, que não pode ser excluído. */
  balcao: z.boolean(),
});

export type CanalVenda = z.infer<typeof canalVendaSchema>;

/** `create-canal-venda.dto.ts`: camelCase; `ativo` omitido nasce `true`. */
export type CreateCanalVendaBody = {
  nome: string;
  comissaoPercentual: number;
  ativo?: boolean;
};

/** `update-canal-venda.dto.ts` (`PUT`, todos opcionais). */
export type UpdateCanalVendaBody = Partial<CreateCanalVendaBody>;
