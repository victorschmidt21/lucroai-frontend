import { z } from 'zod';
import { statusVendaSchema } from './enums';

// Vendas. Origem: `lucroai-backend` (monolito), `src/modules/vendas/`.

/** `domain/models/venda.entity.ts` (`ItemVendaProps`) */
export const itemVendaSchema = z.object({
  id: z.number().int(),
  vendaId: z.number().int(),
  receitaId: z.number().int(),
  quantidade: z.number().int(),
  precoUnitarioReal: z.number(),
  /** Snapshot do custo unitário da receita na criação da venda. */
  custoUnitario: z.number().nullable(),
  /** Fração com 4 casas (pode ser negativa). */
  margemRealizada: z.number().nullable(),
});

export type ItemVenda = z.infer<typeof itemVendaSchema>;

/** `domain/models/venda.entity.ts` */
export const vendaSchema = z.object({
  id: z.number().int(),
  empresaId: z.number().int(),
  total: z.number().nullable(),
  status: statusVendaSchema,
  dataVenda: z.iso.datetime(),
  itens: z.array(itemVendaSchema),
});

export type Venda = z.infer<typeof vendaSchema>;

/** `create-venda.dto.ts`: o corpo é snake_case; o preço tem no máximo 2 casas. */
export type CreateVendaBody = {
  itens: {
    receita_id: number;
    quantidade: number;
    preco_unitario_real: number;
  }[];
};

/** `update-venda-status.dto.ts`: só `PENDENTE` muda de status. */
export type UpdateVendaStatusBody = {
  status: Venda['status'];
};

/**
 * Query de `GET /vendas` (`vendas.controller.ts`). Valores inválidos derrubam o
 * serviço com 500 (lacuna 8), e as datas são lidas com `new Date()` (lacuna 7):
 * envie o início e o fim do dia local em ISO 8601.
 */
export type ListVendasQuery = {
  status?: Venda['status'];
  dataInicio?: string;
  dataFim?: string;
};
